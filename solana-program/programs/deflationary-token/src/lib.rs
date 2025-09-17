use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::{Creator, DataV2},
        CreateMetadataAccountsV3, Metadata,
    },
    token::{self, Mint, Token, TokenAccount, Transfer, Burn, MintTo},
};

declare_id!("4hFLbSpLEWEvtw1Q6qPubs2QLAMfdiMafzUhyiifDY8T");

const MAX_BURN_RATE: u16 = 1000; // 10% máximo
const BASIS_POINTS: u16 = 10000;

#[program]
pub mod deflationary_token {
    use super::*;

    /// Crear un nuevo token deflacionario
    pub fn create_deflationary_token(
        ctx: Context<CreateDeflationaryToken>,
        token_name: String,
        token_symbol: String,
        token_uri: String,
        decimals: u8,
        initial_supply: u64,
        burn_rate: u16, // En basis points (100 = 1%)
        max_supply: u64,
    ) -> Result<()> {
        require!(burn_rate <= MAX_BURN_RATE, DeflationaryError::BurnRateTooHigh);
        require!(token_name.len() <= 32, DeflationaryError::NameTooLong);
        require!(token_symbol.len() <= 10, DeflationaryError::SymbolTooLong);
        require!(initial_supply <= max_supply, DeflationaryError::InitialSupplyTooHigh);

        let clock = Clock::get()?;
        let token_config = &mut ctx.accounts.token_config;

        // Configurar el token deflacionario
        token_config.authority = ctx.accounts.authority.key();
        token_config.mint = ctx.accounts.mint.key();
        token_config.name = token_name.clone();
        token_config.symbol = token_symbol.clone();
        token_config.decimals = decimals;
        token_config.burn_rate = burn_rate;
        token_config.initial_supply = initial_supply;
        token_config.max_supply = max_supply;
        token_config.current_supply = initial_supply;
        token_config.total_burned = 0;
        token_config.created_at = clock.unix_timestamp;
        token_config.is_active = true;
        token_config.bump = ctx.bumps.token_config;

        // Crear metadata del token
        let creators = vec![Creator {
            address: ctx.accounts.authority.key(),
            verified: true,
            share: 100,
        }];

        let data_v2 = DataV2 {
            name: token_name,
            symbol: token_symbol,
            uri: token_uri,
            seller_fee_basis_points: 0,
            creators: Some(creators),
            collection: None,
            uses: None,
        };

        create_metadata_accounts_v3(
            CpiContext::new(
                ctx.accounts.metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.authority.to_account_info(),
                    update_authority: ctx.accounts.authority.to_account_info(),
                    payer: ctx.accounts.authority.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
            ),
            data_v2,
            true, // is_mutable
            true, // update_authority_is_signer
            None, // collection_details
        )?;

        // Mintear supply inicial al creador
        if initial_supply > 0 {
            token::mint_to(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: ctx.accounts.mint.to_account_info(),
                        to: ctx.accounts.creator_token_account.to_account_info(),
                        authority: ctx.accounts.authority.to_account_info(),
                    },
                ),
                initial_supply,
            )?;
        }

        emit!(TokenCreatedEvent {
            mint: ctx.accounts.mint.key(),
            creator: ctx.accounts.authority.key(),
            name: token_config.name.clone(),
            symbol: token_config.symbol.clone(),
            initial_supply,
            burn_rate,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Transferir tokens con quema automática
    pub fn transfer_with_burn(
        ctx: Context<TransferWithBurn>,
        amount: u64,
    ) -> Result<()> {
        let token_config = &mut ctx.accounts.token_config;
        require!(token_config.is_active, DeflationaryError::TokenNotActive);

        // Calcular cantidad a quemar
        let burn_amount = (amount as u128 * token_config.burn_rate as u128 / BASIS_POINTS as u128) as u64;
        let transfer_amount = amount.checked_sub(burn_amount).unwrap();

        // Transferir tokens (cantidad - burn)
        if transfer_amount > 0 {
            token::transfer(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.from.to_account_info(),
                        to: ctx.accounts.to.to_account_info(),
                        authority: ctx.accounts.authority.to_account_info(),
                    },
                ),
                transfer_amount,
            )?;
        }

        // Quemar tokens
        if burn_amount > 0 {
            token::burn(
                CpiContext::new(
                    ctx.accounts.token_program.to_account_info(),
                    Burn {
                        mint: ctx.accounts.mint.to_account_info(),
                        from: ctx.accounts.from.to_account_info(),
                        authority: ctx.accounts.authority.to_account_info(),
                    },
                ),
                burn_amount,
            )?;

            // Actualizar estadísticas
            token_config.total_burned = token_config.total_burned.checked_add(burn_amount).unwrap();
            token_config.current_supply = token_config.current_supply.checked_sub(burn_amount).unwrap();
        }

        emit!(TransferWithBurnEvent {
            mint: ctx.accounts.mint.key(),
            from: ctx.accounts.authority.key(),
            to: ctx.accounts.to.owner,
            amount_transferred: transfer_amount,
            amount_burned: burn_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Participar en el lanzamiento del token (comprar con SOL)
    pub fn participate_in_launch(
        ctx: Context<ParticipateInLaunch>,
        sol_amount: u64,
    ) -> Result<()> {
        let launch_config = &mut ctx.accounts.launch_config;
        require!(launch_config.is_active, DeflationaryError::LaunchNotActive);
        
        let clock = Clock::get()?;
        require!(
            clock.unix_timestamp >= launch_config.start_time,
            DeflationaryError::LaunchNotStarted
        );
        require!(
            clock.unix_timestamp <= launch_config.end_time,
            DeflationaryError::LaunchEnded
        );

        // Calcular tokens a recibir basado en el precio
        let tokens_to_receive = sol_amount
            .checked_mul(launch_config.tokens_per_sol)
            .unwrap()
            .checked_div(1_000_000_000) // Ajustar por decimales de SOL
            .unwrap();

        require!(
            launch_config.tokens_sold.checked_add(tokens_to_receive).unwrap() <= launch_config.total_tokens_for_sale,
            DeflationaryError::NotEnoughTokensLeft
        );

        // Transferir SOL del participante al creador
        **ctx.accounts.participant.to_account_info().try_borrow_mut_lamports()? -= sol_amount;
        **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += sol_amount;

        // Transferir tokens al participante
        let seeds = &[
            b"launch_config",
            ctx.accounts.mint.to_account_info().key.as_ref(),
            &[launch_config.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.launch_token_account.to_account_info(),
                    to: ctx.accounts.participant_token_account.to_account_info(),
                    authority: launch_config.to_account_info(),
                },
                signer_seeds,
            ),
            tokens_to_receive,
        )?;

        // Actualizar estadísticas del lanzamiento
        launch_config.tokens_sold = launch_config.tokens_sold.checked_add(tokens_to_receive).unwrap();
        launch_config.sol_raised = launch_config.sol_raised.checked_add(sol_amount).unwrap();
        launch_config.participants = launch_config.participants.checked_add(1).unwrap();

        emit!(LaunchParticipationEvent {
            mint: ctx.accounts.mint.key(),
            participant: ctx.accounts.participant.key(),
            sol_amount,
            tokens_received: tokens_to_receive,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Configurar lanzamiento del token
    pub fn setup_token_launch(
        ctx: Context<SetupTokenLaunch>,
        tokens_for_sale: u64,
        tokens_per_sol: u64,
        start_time: i64,
        end_time: i64,
    ) -> Result<()> {
        let launch_config = &mut ctx.accounts.launch_config;
        
        launch_config.authority = ctx.accounts.authority.key();
        launch_config.mint = ctx.accounts.mint.key();
        launch_config.total_tokens_for_sale = tokens_for_sale;
        launch_config.tokens_per_sol = tokens_per_sol;
        launch_config.start_time = start_time;
        launch_config.end_time = end_time;
        launch_config.tokens_sold = 0;
        launch_config.sol_raised = 0;
        launch_config.participants = 0;
        launch_config.is_active = true;
        launch_config.bump = ctx.bumps.launch_config;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(token_name: String)]
pub struct CreateDeflationaryToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = authority,
        mint::freeze_authority = authority,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + DeflationaryTokenConfig::INIT_SPACE,
        seeds = [b"token_config", mint.key().as_ref()],
        bump
    )]
    pub token_config: Account<'info, DeflationaryTokenConfig>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub creator_token_account: Account<'info, TokenAccount>,

    /// CHECK: Metadata account, verificado por el programa de metadata
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct TransferWithBurn<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"token_config", mint.key().as_ref()],
        bump = token_config.bump
    )]
    pub token_config: Account<'info, DeflationaryTokenConfig>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = authority,
    )]
    pub from: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = mint,
    )]
    pub to: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetupTokenLaunch<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + LaunchConfig::INIT_SPACE,
        seeds = [b"launch_config", mint.key().as_ref()],
        bump
    )]
    pub launch_config: Account<'info, LaunchConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ParticipateInLaunch<'info> {
    #[account(mut)]
    pub participant: Signer<'info>,

    /// CHECK: Creator account to receive SOL
    #[account(mut)]
    pub creator: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"launch_config", mint.key().as_ref()],
        bump = launch_config.bump
    )]
    pub launch_config: Account<'info, LaunchConfig>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = launch_config,
    )]
    pub launch_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = participant,
        associated_token::mint = mint,
        associated_token::authority = participant,
    )]
    pub participant_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct DeflationaryTokenConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(10)]
    pub symbol: String,
    pub decimals: u8,
    pub burn_rate: u16, // basis points
    pub initial_supply: u64,
    pub max_supply: u64,
    pub current_supply: u64,
    pub total_burned: u64,
    pub created_at: i64,
    pub is_active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct LaunchConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_tokens_for_sale: u64,
    pub tokens_per_sol: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub tokens_sold: u64,
    pub sol_raised: u64,
    pub participants: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[event]
pub struct TokenCreatedEvent {
    pub mint: Pubkey,
    pub creator: Pubkey,
    pub name: String,
    pub symbol: String,
    pub initial_supply: u64,
    pub burn_rate: u16,
    pub timestamp: i64,
}

#[event]
pub struct TransferWithBurnEvent {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount_transferred: u64,
    pub amount_burned: u64,
    pub timestamp: i64,
}

#[event]
pub struct LaunchParticipationEvent {
    pub mint: Pubkey,
    pub participant: Pubkey,
    pub sol_amount: u64,
    pub tokens_received: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum DeflationaryError {
    #[msg("Burn rate too high. Maximum is 10%")]
    BurnRateTooHigh,
    #[msg("Token name too long. Maximum 32 characters")]
    NameTooLong,
    #[msg("Token symbol too long. Maximum 10 characters")]
    SymbolTooLong,
    #[msg("Initial supply exceeds maximum supply")]
    InitialSupplyTooHigh,
    #[msg("Token is not active")]
    TokenNotActive,
    #[msg("Launch is not active")]
    LaunchNotActive,
    #[msg("Launch has not started yet")]
    LaunchNotStarted,
    #[msg("Launch has ended")]
    LaunchEnded,
    #[msg("Not enough tokens left for sale")]
    NotEnoughTokensLeft,
}
