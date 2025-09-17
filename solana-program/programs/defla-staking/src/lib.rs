use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{self, Mint, Token, TokenAccount, Transfer},
};

declare_id!("BeZPosPTPhULop1xSSRQua29vBbiu1qdiZeDWniVFiKW");

const DAILY_APR: u64 = 75; // 0.75% = 75 basis points
const BASIS_POINTS: u64 = 10000;
const SECONDS_PER_DAY: i64 = 86400;
const MIN_STAKE_AMOUNT: u64 = 10_000_000_000; // 10,000 HELL (assuming 6 decimals)
const MIN_LOCK_PERIOD: i64 = 7 * SECONDS_PER_DAY; // 7 days
const MAX_LOCK_PERIOD: i64 = 120 * SECONDS_PER_DAY; // 120 days

#[program]
pub mod defla_staking {
    use super::*;

    /// Initialize the staking program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let staking_pool = &mut ctx.accounts.staking_pool;
        staking_pool.authority = ctx.accounts.authority.key();
        staking_pool.defla_mint = ctx.accounts.defla_mint.key();
        staking_pool.total_staked = 0;
        staking_pool.total_stakers = 0;
        staking_pool.bump = ctx.bumps.staking_pool;
        
        Ok(())
    }

    /// Stake HELL tokens
    pub fn stake(
        ctx: Context<Stake>,
        amount: u64,
        lock_period_days: u32,
    ) -> Result<()> {
        require!(amount >= MIN_STAKE_AMOUNT, StakingError::InsufficientAmount);
        require!(
            (lock_period_days as i64 * SECONDS_PER_DAY) >= MIN_LOCK_PERIOD,
            StakingError::LockPeriodTooShort
        );
        require!(
            (lock_period_days as i64 * SECONDS_PER_DAY) <= MAX_LOCK_PERIOD,
            StakingError::LockPeriodTooLong
        );

        let clock = Clock::get()?;
        let stake_account = &mut ctx.accounts.stake_account;
        let staking_pool = &mut ctx.accounts.staking_pool;

        // Initialize stake account
        stake_account.owner = ctx.accounts.user.key();
        stake_account.amount = amount;
        stake_account.start_time = clock.unix_timestamp;
        stake_account.lock_period = lock_period_days as i64 * SECONDS_PER_DAY;
        stake_account.last_claim_time = clock.unix_timestamp;
        stake_account.total_claimed = 0;
        stake_account.is_active = true;
        stake_account.bump = ctx.bumps.stake_account;

        // Update staking pool
        staking_pool.total_staked = staking_pool.total_staked.checked_add(amount).unwrap();
        staking_pool.total_stakers = staking_pool.total_stakers.checked_add(1).unwrap();

        // Transfer tokens from user to staking pool
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.staking_pool_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, amount)?;

        emit!(StakeEvent {
            user: ctx.accounts.user.key(),
            amount,
            lock_period: stake_account.lock_period,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Claim staking rewards
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let clock = Clock::get()?;

        require!(stake_account.is_active, StakingError::StakeNotActive);

        let rewards = calculate_pending_rewards(stake_account, clock.unix_timestamp)?;
        require!(rewards > 0, StakingError::NoRewardsToClaim);

        // Update stake account
        stake_account.last_claim_time = clock.unix_timestamp;
        stake_account.total_claimed = stake_account.total_claimed.checked_add(rewards).unwrap();

        // Transfer rewards from staking pool to user
        let seeds = &[
            b"staking_pool",
            ctx.accounts.defla_mint.to_account_info().key.as_ref(),
            &[ctx.accounts.staking_pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staking_pool_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.staking_pool.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, rewards)?;

        emit!(ClaimEvent {
            user: ctx.accounts.user.key(),
            amount: rewards,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    /// Unstake tokens (can be done before or after lock period)
    pub fn unstake(ctx: Context<Unstake>) -> Result<()> {
        let stake_account = &mut ctx.accounts.stake_account;
        let staking_pool = &mut ctx.accounts.staking_pool;
        let clock = Clock::get()?;

        require!(stake_account.is_active, StakingError::StakeNotActive);

        let is_early_withdrawal = clock.unix_timestamp < (stake_account.start_time + stake_account.lock_period);
        
        // Claim any pending rewards first
        let pending_rewards = calculate_pending_rewards(stake_account, clock.unix_timestamp)?;
        let total_to_transfer = stake_account.amount.checked_add(pending_rewards).unwrap();

        // Update stake account
        stake_account.is_active = false;
        stake_account.total_claimed = stake_account.total_claimed.checked_add(pending_rewards).unwrap();

        // Update staking pool
        staking_pool.total_staked = staking_pool.total_staked.checked_sub(stake_account.amount).unwrap();
        staking_pool.total_stakers = staking_pool.total_stakers.checked_sub(1).unwrap();

        // Transfer tokens back to user
        let seeds = &[
            b"staking_pool",
            ctx.accounts.defla_mint.to_account_info().key.as_ref(),
            &[staking_pool.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.staking_pool_token_account.to_account_info(),
                to: ctx.accounts.user_token_account.to_account_info(),
                authority: staking_pool.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(transfer_ctx, total_to_transfer)?;

        emit!(UnstakeEvent {
            user: ctx.accounts.user.key(),
            amount: stake_account.amount,
            rewards: pending_rewards,
            early_withdrawal: is_early_withdrawal,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }
}

// Helper function to calculate pending rewards
fn calculate_pending_rewards(stake_account: &Account<StakeAccount>, current_time: i64) -> Result<u64> {
    let time_elapsed = current_time - stake_account.last_claim_time;
    let days_elapsed = time_elapsed as f64 / SECONDS_PER_DAY as f64;
    
    // Calculate compound interest: A = P(1 + r)^t
    // Where r = daily rate, t = days elapsed
    let daily_rate = DAILY_APR as f64 / BASIS_POINTS as f64;
    let compound_factor = (1.0 + daily_rate).powf(days_elapsed);
    let new_amount = stake_account.amount as f64 * compound_factor;
    let rewards = (new_amount - stake_account.amount as f64) as u64;
    
    Ok(rewards)
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + StakingPool::INIT_SPACE,
        seeds = [b"staking_pool", defla_mint.key().as_ref()],
        bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    pub defla_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = authority,
        associated_token::mint = defla_mint,
        associated_token::authority = staking_pool,
    )]
    pub staking_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"staking_pool", defla_mint.key().as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    #[account(
        init,
        payer = user,
        space = 8 + StakeAccount::INIT_SPACE,
        seeds = [b"stake_account", user.key().as_ref(), staking_pool.key().as_ref()],
        bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    pub defla_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = defla_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = defla_mint,
        associated_token::authority = staking_pool,
    )]
    pub staking_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"stake_account", user.key().as_ref(), staking_pool.key().as_ref()],
        bump = stake_account.bump,
        has_one = owner @ StakingError::InvalidOwner
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(
        seeds = [b"staking_pool", defla_mint.key().as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    pub defla_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = defla_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = defla_mint,
        associated_token::authority = staking_pool,
    )]
    pub staking_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"stake_account", user.key().as_ref(), staking_pool.key().as_ref()],
        bump = stake_account.bump,
        has_one = owner @ StakingError::InvalidOwner,
        close = user
    )]
    pub stake_account: Account<'info, StakeAccount>,
    
    #[account(
        mut,
        seeds = [b"staking_pool", defla_mint.key().as_ref()],
        bump = staking_pool.bump
    )]
    pub staking_pool: Account<'info, StakingPool>,
    
    pub defla_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        associated_token::mint = defla_mint,
        associated_token::authority = user,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        associated_token::mint = defla_mint,
        associated_token::authority = staking_pool,
    )]
    pub staking_pool_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct StakingPool {
    pub authority: Pubkey,
    pub defla_mint: Pubkey,
    pub total_staked: u64,
    pub total_stakers: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct StakeAccount {
    pub owner: Pubkey,
    pub amount: u64,
    pub start_time: i64,
    pub lock_period: i64,
    pub last_claim_time: i64,
    pub total_claimed: u64,
    pub is_active: bool,
    pub bump: u8,
}

#[event]
pub struct StakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub lock_period: i64,
    pub timestamp: i64,
}

#[event]
pub struct ClaimEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct UnstakeEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub rewards: u64,
    pub early_withdrawal: bool,
    pub timestamp: i64,
}

#[error_code]
pub enum StakingError {
    #[msg("Insufficient stake amount. Minimum is 10,000 HELL")]
    InsufficientAmount,
    #[msg("Lock period too short. Minimum is 7 days")]
    LockPeriodTooShort,
    #[msg("Lock period too long. Maximum is 120 days")]
    LockPeriodTooLong,
    #[msg("Stake account is not active")]
    StakeNotActive,
    #[msg("No rewards to claim")]
    NoRewardsToClaim,
    #[msg("Invalid owner")]
    InvalidOwner,
}
