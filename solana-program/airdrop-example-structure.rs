use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use anchor_spl::associated_token::AssociatedToken;

use sha2::{Digest, Sha256};

declare_id!("Airdrop1111111111111111111111111111111111");

// =============================
// Config & Constantes
// =============================

/// Máximo largo de un Merkle proof razonable (depende de N; ~log2(N))
pub const MAX_PROOF_LEN: usize = 64;

/// Tamaño (en bytes) de cada página del bitmap. 4096 bytes = 32768 índices por página.
/// Aumentá/ajustá si necesitás más denso o menos.
pub const BITMAP_PAGE_SIZE: usize = 4096;

/// Mini metadata reservada para amplificar storage si hace falta
pub const EPOCH_SPACE_PAD: usize = 128;

// =============================
// Programa
// =============================

#[program]
pub mod merkle_airdrop {
    use super::*;

    /// Inicializa un Epoch de Airdrop:
    /// - Define root Merkle, mint, total_amount, autoridad, pausado=false
    /// - Valida que el vault sea TokenAccount del mint y con owner=epoch PDA
    /// - Emite evento
    pub fn initialize_epoch(
        ctx: Context<InitializeEpoch>,
        epoch_id: u64,
        merkle_root: [u8; 32],
        total_amount: u64,
    ) -> Result<()> {
        require!(total_amount > 0, AirdropError::InvalidAmount);

        // Epoch
        let epoch = &mut ctx.accounts.epoch;
        epoch.authority = ctx.accounts.authority.key();
        epoch.mint = ctx.accounts.mint.key();
        epoch.merkle_root = merkle_root;
        epoch.total_amount = total_amount;
        epoch.bump = *ctx.bumps.get("epoch").ok_or(AirdropError::BumpMissing)?;
        epoch.paused = false;
        epoch.total_claimed = 0u64;

        // Vault checks
        require_keys_eq!(ctx.accounts.vault.mint, ctx.accounts.mint.key(), AirdropError::WrongMint);
        require_keys_eq!(ctx.accounts.vault.owner, epoch.key(), AirdropError::InvalidVaultOwner);

        emit!(EpochInitialized {
            epoch: epoch.key(),
            authority: epoch.authority,
            mint: epoch.mint,
            total_amount,
            merkle_root,
            epoch_id,
        });
        Ok(())
    }

    /// Crea (o asegura) una **página** del bitmap de reclamos.
    /// Permite sharding de claims en páginas de 4096 bytes cada una.
    pub fn ensure_bitmap_page(ctx: Context<EnsureBitmapPage>, _epoch_id: u64, page_index: u32) -> Result<()> {
        let page = &mut ctx.accounts.claimed_bitmap_page;
        // Si es recién creada, se inicializa en cero (Anchor ya zerea data)
        page.epoch = ctx.accounts.epoch.key();
        page.page_index = page_index;
        page.bump = *ctx.bumps.get("claimed_bitmap_page").ok_or(AirdropError::BumpMissing)?;
        Ok(())
    }

    /// Reclamo de airdrop por Merkle:
    /// - Verifica pausado
    /// - Verifica prueba merkle
    /// - Marca bit en página correspondiente
    /// - Transfiere tokens al ATA del usuario
    /// - Emite evento
    pub fn claim(
        ctx: Context<Claim>,
        epoch_id: u64,
        index: u32,
        amount: u64,
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        let epoch = &mut ctx.accounts.epoch;
        require!(!epoch.paused, AirdropError::EpochPaused);
        require!(amount > 0, AirdropError::InvalidAmount);
        require_keys_eq!(epoch.mint, ctx.accounts.mint.key(), AirdropError::WrongMint);

        // Validar proof
        require!(proof.len() <= MAX_PROOF_LEN, AirdropError::ProofTooLarge);
        let leaf = leaf_hash(index, &ctx.accounts.recipient.key(), amount);
        require!(verify_proof(&leaf, &proof, &epoch.merkle_root), AirdropError::InvalidProof);

        // Calcular ubicación en página/byte/bit
        let page_index = (index as usize) / (BITMAP_PAGE_SIZE * 8);
        let within_page = (index as usize) % (BITMAP_PAGE_SIZE * 8);
        let byte_index = within_page / 8;
        let bit_index = (within_page % 8) as u8;

        require!(byte_index < BITMAP_PAGE_SIZE, AirdropError::IndexOutOfRange);

        // Validar que la cuenta de página coincide con la seed y el epoch
        require_keys_eq!(ctx.accounts.claimed_bitmap_page.epoch, epoch.key(), AirdropError::WrongBitmapEpoch);
        require_eq!(ctx.accounts.claimed_bitmap_page.page_index as usize, page_index, AirdropError::WrongBitmapPage);

        // Leer y setear bit (claim)
        let data = &mut ctx.accounts.claimed_bitmap_page.bitmap;
        let mask = 1u8 << bit_index;
        require!((data[byte_index] & mask) == 0, AirdropError::AlreadyClaimed);
        data[byte_index] |= mask;

        // Transferencia desde vault -> ATA del usuario (si no existe, creá fuera de esta ix)
        // Señales PDA del epoch
        let signer_seeds = &[
            b"airdrop_epoch",
            ctx.accounts.mint.key().as_ref(),
            &epoch_id.to_le_bytes(),
            &[epoch.bump],
        ];

        // Validar que recipient_ata pertenezca a recipient y al mint correcto
        require_keys_eq!(ctx.accounts.recipient_ata.owner, ctx.accounts.recipient.key(), AirdropError::AtaWrongOwner);
        require_keys_eq!(ctx.accounts.recipient_ata.mint, ctx.accounts.mint.key(), AirdropError::AtaWrongMint);

        let before = ctx.accounts.vault.amount;
        require!(before >= amount, AirdropError::InsufficientVaultBalance);

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.recipient_ata.to_account_info(),
                authority: ctx.accounts.epoch.to_account_info(),
            },
        ).with_signer(&[signer_seeds]);

        token::transfer(cpi_ctx, amount)?;
        epoch.total_claimed = epoch
            .total_claimed
            .checked_add(amount)
            .ok_or(AirdropError::MathOverflow)?;

        emit!(AirdropClaimed {
            epoch: epoch.key(),
            recipient: ctx.accounts.recipient.key(),
            index,
            amount,
            page_index: page_index as u32,
            byte_index: byte_index as u32,
            bit_index,
        });

        Ok(())
    }

    /// Barre (retira) lo que quede en el vault a la tesorería cuando finaliza un epoch.
    /// Solo authority puede ejecutar. Emite evento.
    pub fn sweep_remaining(
        ctx: Context<SweepRemaining>,
        epoch_id: u64,
    ) -> Result<()> {
        // Authority check
        require_keys_eq!(ctx.accounts.epoch.authority, ctx.accounts.authority.key(), AirdropError::Unauthorized);

        let epoch = &ctx.accounts.epoch;

        let amount = ctx.accounts.vault.amount;
        if amount > 0 {
            let signer_seeds = &[
                b"airdrop_epoch",
                ctx.accounts.mint.key().as_ref(),
                &epoch_id.to_le_bytes(),
                &[epoch.bump],
            ];

            let cpi_ctx = CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.treasury_ata.to_account_info(),
                    authority: ctx.accounts.epoch.to_account_info(),
                },
            ).with_signer(&[signer_seeds]);

            token::transfer(cpi_ctx, amount)?;
        }

        emit!(EpochSwept {
            epoch: epoch.key(),
            to: ctx.accounts.treasury_ata.key(),
            amount,
        });

        Ok(())
    }

    /// Pausar / reanudar un epoch (permite “cortar” claims si hay incidente).
    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        require_keys_eq!(ctx.accounts.epoch.authority, ctx.accounts.authority.key(), AirdropError::Unauthorized);
        ctx.accounts.epoch.paused = paused;
        emit!(EpochPaused {
            epoch: ctx.accounts.epoch.key(),
            paused
        });
        Ok(())
    }

    /// Actualiza la `authority` del epoch (por ej. migrar a DAO).
    pub fn set_authority(ctx: Context<SetAuthority>, new_authority: Pubkey) -> Result<()> {
        require_keys_eq!(ctx.accounts.epoch.authority, ctx.accounts.authority.key(), AirdropError::Unauthorized);
        ctx.accounts.epoch.authority = new_authority;
        emit!(EpochAuthorityChanged {
            epoch: ctx.accounts.epoch.key(),
            new_authority
        });
        Ok(())
    }
}

// =============================
// Accounts
// =============================

#[derive(Accounts)]
#[instruction(epoch_id: u64)]
pub struct InitializeEpoch<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        seeds = [b"airdrop_epoch", mint.key().as_ref(), &epoch_id.to_le_bytes()],
        bump,
        space = 8 + Epoch::SIZE + EPOCH_SPACE_PAD
    )]
    pub epoch: Account<'info, Epoch>,

    #[account(
        mut,
        constraint = vault.mint == mint.key() @ AirdropError::WrongMint,
        constraint = vault.owner == epoch.key() @ AirdropError::InvalidVaultOwner
    )]
    pub vault: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64, page_index: u32)]
pub struct EnsureBitmapPage<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"airdrop_epoch", mint.key().as_ref(), &epoch_id.to_le_bytes()],
        bump = epoch.bump
    )]
    pub epoch: Account<'info, Epoch>,

    #[account(
        init_if_needed,
        payer = authority,
        seeds = [b"airdrop_bitmap_page", epoch.key().as_ref(), &page_index.to_le_bytes()],
        bump,
        space = 8 + ClaimedBitmapPage::SIZE
    )]
    pub claimed_bitmap_page: Account<'info, ClaimedBitmapPage>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64)]
pub struct Claim<'info> {
    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"airdrop_epoch", mint.key().as_ref(), &epoch_id.to_le_bytes()],
        bump = epoch.bump
    )]
    pub epoch: Account<'info, Epoch>,

    #[account(
        mut,
        constraint = vault.mint == mint.key() @ AirdropError::WrongMint,
        constraint = vault.owner == epoch.key() @ AirdropError::InvalidVaultOwner
    )]
    pub vault: Account<'info, TokenAccount>,

    /// Wallet que recibe
    #[account(mut)]
    pub recipient: Signer<'info>,

    /// ATA del recipient para el mint
    #[account(mut)]
    pub recipient_ata: Account<'info, TokenAccount>,

    /// Página de bitmap que corresponde al `index`
    #[account(
        mut,
        seeds = [b"airdrop_bitmap_page", epoch.key().as_ref(), &claimed_bitmap_page.page_index.to_le_bytes()],
        bump = claimed_bitmap_page.bump
    )]
    pub claimed_bitmap_page: Account<'info, ClaimedBitmapPage>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(epoch_id: u64)]
pub struct SweepRemaining<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"airdrop_epoch", mint.key().as_ref(), &epoch_id.to_le_bytes()],
        bump = epoch.bump
    )]
    pub epoch: Account<'info, Epoch>,

    #[account(
        mut,
        constraint = vault.mint == mint.key() @ AirdropError::WrongMint,
        constraint = vault.owner == epoch.key() @ AirdropError::InvalidVaultOwner
    )]
    pub vault: Account<'info, TokenAccount>,

    /// ATA de la tesorería (authority o DAO)
    #[account(mut)]
    pub treasury_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub epoch: Account<'info, Epoch>,
}

#[derive(Accounts)]
pub struct SetAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub epoch: Account<'info, Epoch>,
}

// =============================
// State
// =============================

#[account]
pub struct Epoch {
    pub authority: Pubkey,          // 32
    pub mint: Pubkey,               // 32
    pub merkle_root: [u8; 32],      // 32
    pub total_amount: u64,          // 8
    pub total_claimed: u64,         // 8
    pub paused: bool,               // 1
    pub bump: u8,                   // 1
    // padding implícito para alineación
}
impl Epoch {
    pub const SIZE: usize = 32 + 32 + 32 + 8 + 8 + 1 + 1;
}

#[account]
pub struct ClaimedBitmapPage {
    pub epoch: Pubkey,              // 32
    pub page_index: u32,            // 4
    pub bump: u8,                   // 1
    // padding/align…
    pub _pad: [u8; 3],              // 3
    /// Bitmap crudo de tamaño fijo
    pub bitmap: [u8; BITMAP_PAGE_SIZE], // 4096
}
impl ClaimedBitmapPage {
    pub const SIZE: usize = 32 + 4 + 1 + 3 + BITMAP_PAGE_SIZE;
}

// =============================
// Eventos
// =============================

#[event]
pub struct EpochInitialized {
    pub epoch: Pubkey,
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_amount: u64,
    pub merkle_root: [u8; 32],
    pub epoch_id: u64,
}

#[event]
pub struct AirdropClaimed {
    pub epoch: Pubkey,
    pub recipient: Pubkey,
    pub index: u32,
    pub amount: u64,
    pub page_index: u32,
    pub byte_index: u32,
    pub bit_index: u8,
}

#[event]
pub struct EpochSwept {
    pub epoch: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct EpochPaused {
    pub epoch: Pubkey,
    pub paused: bool,
}

#[event]
pub struct EpochAuthorityChanged {
    pub epoch: Pubkey,
    pub new_authority: Pubkey,
}

// =============================
// Errores
// =============================

#[error_code]
pub enum AirdropError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Merkle proof is invalid")]
    InvalidProof,
    #[msg("Merkle proof too large")]
    ProofTooLarge,
    #[msg("Claim already executed for this index")]
    AlreadyClaimed,
    #[msg("Index out of bitmap page range")]
    IndexOutOfRange,
    #[msg("Wrong mint for this epoch")]
    WrongMint,
    #[msg("Invalid vault owner; vault must be owned by the epoch PDA")]
    InvalidVaultOwner,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Missing PDA bump")]
    BumpMissing,
    #[msg("Bitmap page doesn't belong to this epoch")]
    WrongBitmapEpoch,
    #[msg("Wrong bitmap page index")]
    WrongBitmapPage,
    #[msg("Epoch is paused")]
    EpochPaused,
    #[msg("Insufficient vault token balance")]
    InsufficientVaultBalance,
    #[msg("Recipient ATA owner mismatch")]
    AtaWrongOwner,
    #[msg("Recipient ATA mint mismatch")]
    AtaWrongMint,
}

// =============================
// Utils
// =============================

fn leaf_hash(index: u32, user: &Pubkey, amount: u64) -> [u8; 32] {
    let mut h = Sha256::new();
    h.update(index.to_le_bytes());
    h.update(user.to_bytes());
    h.update(amount.to_le_bytes());
    h.finalize().into()
}

/// Verificación de Merkle con concatenación en orden determinístico (min||max).
fn verify_proof(leaf: &[u8; 32], proof: &Vec<[u8; 32]>, root: &[u8; 32]) -> bool {
    let mut computed = *leaf;
    for p in proof {
        let (a, b) = if computed <= *p { (computed, *p) } else { (*p, computed) };
        let mut h = Sha256::new();
        h.update(a);
        h.update(b);
        computed = h.finalize().into();
    }
    &computed == root
}
