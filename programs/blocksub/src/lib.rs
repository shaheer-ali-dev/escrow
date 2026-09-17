use anchor_lang::prelude::*;
use solana_program::{program::invoke, system_instruction};

declare_id!("REPLACE_WITH_PROGRAM_ID");

const ESCROW_SEED: &[u8] = b"escrow";
const VAULT_SEED: &[u8] = b"vault";
const MILESTONE_SEED: &[u8] = b"milestone";

#[program]
pub mod blocksub {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        total_amount: u64,
        milestone_count: u8,
        deadline: i64,
    ) -> Result<()> {
        require!(total_amount > 0, EscrowError::InvalidAmount);
        require!(milestone_count > 0, EscrowError::InvalidMilestoneCount);
        require!(ctx.accounts.client.key() != ctx.accounts.freelancer.key(), EscrowError::InvalidParties);

        let now = Clock::get()?.unix_timestamp;
        require!(deadline > now, EscrowError::InvalidDeadline);

        let escrow_key = ctx.accounts.escrow.key();
        let escrow = &mut ctx.accounts.escrow;
        escrow.client = ctx.accounts.client.key();
        escrow.freelancer = ctx.accounts.freelancer.key();
        escrow.total_amount = total_amount;
        escrow.allocated_amount = 0;
        escrow.released_amount = 0;
        escrow.milestone_count = milestone_count;
        escrow.completed_milestones = 0;
        escrow.created_at = now;
        escrow.deadline = deadline;
        escrow.status = EscrowStatus::Active as u8;
        escrow.bump = ctx.bumps.escrow;

        let vault = &mut ctx.accounts.vault;
        vault.escrow = escrow_key;
        vault.bump = ctx.bumps.vault;

        let transfer = system_instruction::transfer(
            &ctx.accounts.client.key(),
            &ctx.accounts.vault.key(),
            total_amount,
        );
        invoke(
            &transfer,
            &[
                ctx.accounts.client.to_account_info(),
                ctx.accounts.vault.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        emit!(EscrowCreated { escrow: escrow_key, client: escrow.client, freelancer: escrow.freelancer, total_amount, milestone_count, deadline });
        Ok(())
    }

    pub fn create_milestone(
        ctx: Context<CreateMilestone>,
        index: u8,
        amount: u64,
        due_at: i64,
    ) -> Result<()> {
        require!(amount > 0, EscrowError::InvalidAmount);

        let escrow_key = ctx.accounts.escrow.key();
        let (status, count, deadline, allocated, total) = {
            let escrow = &ctx.accounts.escrow;
            (escrow.status, escrow.milestone_count, escrow.deadline, escrow.allocated_amount, escrow.total_amount)
        };
        require!(status == EscrowStatus::Active as u8, EscrowError::EscrowNotActive);
        require!(index < count, EscrowError::InvalidMilestoneIndex);
        require!(due_at <= deadline, EscrowError::InvalidDeadline);
        require!(allocated.checked_add(amount).ok_or(EscrowError::Overflow)? <= total, EscrowError::MilestonesExceedTotal);

        let milestone = &mut ctx.accounts.milestone;
        milestone.escrow = escrow_key;
        milestone.index = index;
        milestone.amount = amount;
        milestone.due_at = due_at;
        milestone.status = MilestoneStatus::Pending as u8;
        milestone.bump = ctx.bumps.milestone;
        ctx.accounts.escrow.allocated_amount = allocated.checked_add(amount).ok_or(EscrowError::Overflow)?;

        emit!(MilestoneCreated { escrow: escrow_key, index, amount, due_at });
        Ok(())
    }

    pub fn release_milestone(ctx: Context<ReleaseMilestone>) -> Result<()> {
        let amount = ctx.accounts.milestone.amount;
        let escrow_key = ctx.accounts.escrow.key();
        require!(ctx.accounts.escrow.status == EscrowStatus::Active as u8, EscrowError::EscrowNotActive);
        require!(ctx.accounts.milestone.status == MilestoneStatus::Pending as u8, EscrowError::MilestoneNotPending);

        let new_released = ctx.accounts.escrow.released_amount.checked_add(amount).ok_or(EscrowError::Overflow)?;
        require!(new_released <= ctx.accounts.escrow.total_amount, EscrowError::ReleaseExceedsTotal);

        let vault_info = ctx.accounts.vault.to_account_info();
        let freelancer_info = ctx.accounts.freelancer.to_account_info();
        let vault_balance = vault_info.lamports();
        require!(vault_balance >= amount, EscrowError::InsufficientVaultBalance);
        let new_vault = vault_balance.checked_sub(amount).ok_or(EscrowError::Overflow)?;
        let new_freelancer = freelancer_info.lamports().checked_add(amount).ok_or(EscrowError::Overflow)?;
        {
            let mut vault_lamports = vault_info.try_borrow_mut_lamports()?;
            let mut freelancer_lamports = freelancer_info.try_borrow_mut_lamports()?;
            **vault_lamports = new_vault;
            **freelancer_lamports = new_freelancer;
        }

        let milestone_index = ctx.accounts.milestone.index;
        ctx.accounts.milestone.status = MilestoneStatus::Released as u8;
        ctx.accounts.escrow.released_amount = new_released;
        ctx.accounts.escrow.completed_milestones = ctx.accounts.escrow.completed_milestones.checked_add(1).ok_or(EscrowError::Overflow)?;
        let completed = ctx.accounts.escrow.completed_milestones == ctx.accounts.escrow.milestone_count;
        if completed {
            require!(ctx.accounts.escrow.allocated_amount == ctx.accounts.escrow.total_amount, EscrowError::MilestonesNotFullyAllocated);
            require!(new_released == ctx.accounts.escrow.total_amount, EscrowError::ReleaseDoesNotCompleteEscrow);
            ctx.accounts.escrow.status = EscrowStatus::Completed as u8;
        }

        emit!(MilestoneReleased { escrow: escrow_key, milestone_index, freelancer: ctx.accounts.freelancer.key(), amount, released_at: Clock::get()?.unix_timestamp, escrow_completed: completed });
        Ok(())
    }

    pub fn cancel_escrow(ctx: Context<CancelEscrow>) -> Result<()> {
        require!(ctx.accounts.escrow.status == EscrowStatus::Active as u8, EscrowError::EscrowNotActive);
        let refund = ctx.accounts.vault.to_account_info().lamports();
        ctx.accounts.escrow.status = EscrowStatus::Cancelled as u8;
        emit!(EscrowCancelled { escrow: ctx.accounts.escrow.key(), client: ctx.accounts.client.key(), refund_amount: refund, cancelled_at: Clock::get()?.unix_timestamp });
        Ok(())
    }

    pub fn close_completed_escrow(_ctx: Context<CloseCompletedEscrow>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(init, payer = client, space = 8 + Escrow::SIZE, seeds = [ESCROW_SEED, client.key().as_ref(), freelancer.key().as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(init, payer = client, space = 8 + Vault::SIZE, seeds = [VAULT_SEED, escrow.key().as_ref()], bump)]
    pub vault: Account<'info, Vault>,
    #[account(mut)] pub client: Signer<'info>,
    /// CHECK: stored and constrained as the payment destination.
    pub freelancer: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(index: u8)]
pub struct CreateMilestone<'info> {
    #[account(mut, seeds = [ESCROW_SEED, escrow.client.as_ref(), escrow.freelancer.as_ref()], bump = escrow.bump, has_one = client)]
    pub escrow: Account<'info, Escrow>,
    #[account(init, payer = client, space = 8 + Milestone::SIZE, seeds = [MILESTONE_SEED, escrow.key().as_ref(), &[index]], bump)]
    pub milestone: Account<'info, Milestone>,
    #[account(mut)] pub client: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseMilestone<'info> {
    #[account(mut, seeds = [ESCROW_SEED, escrow.client.as_ref(), escrow.freelancer.as_ref()], bump = escrow.bump, has_one = client, has_one = freelancer)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, seeds = [MILESTONE_SEED, escrow.key().as_ref(), &[milestone.index]], bump = milestone.bump, has_one = escrow)]
    pub milestone: Account<'info, Milestone>,
    #[account(mut, seeds = [VAULT_SEED, escrow.key().as_ref()], bump = vault.bump, has_one = escrow)]
    pub vault: Account<'info, Vault>,
    pub client: Signer<'info>,
    /// CHECK: has_one = freelancer binds this account to escrow.freelancer.
    #[account(mut)] pub freelancer: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct CancelEscrow<'info> {
    #[account(mut, close = client, seeds = [ESCROW_SEED, escrow.client.as_ref(), escrow.freelancer.as_ref()], bump = escrow.bump, has_one = client)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, close = client, seeds = [VAULT_SEED, escrow.key().as_ref()], bump = vault.bump, has_one = escrow)]
    pub vault: Account<'info, Vault>,
    #[account(mut)] pub client: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseCompletedEscrow<'info> {
    #[account(mut, close = client, seeds = [ESCROW_SEED, escrow.client.as_ref(), escrow.freelancer.as_ref()], bump = escrow.bump, has_one = client, constraint = escrow.status == EscrowStatus::Completed as u8 @ EscrowError::EscrowNotCompleted)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut, close = client, seeds = [VAULT_SEED, escrow.key().as_ref()], bump = vault.bump, has_one = escrow)]
    pub vault: Account<'info, Vault>,
    #[account(mut)] pub client: Signer<'info>,
}

#[account]
pub struct Escrow {
    pub client: Pubkey, pub freelancer: Pubkey, pub total_amount: u64, pub allocated_amount: u64, pub released_amount: u64,
    pub milestone_count: u8, pub completed_milestones: u8, pub created_at: i64, pub deadline: i64, pub status: u8, pub bump: u8,
}
impl Escrow { pub const SIZE: usize = 32 + 32 + 8 + 8 + 8 + 1 + 1 + 8 + 8 + 1 + 1; }

#[account]
pub struct Milestone { pub escrow: Pubkey, pub index: u8, pub amount: u64, pub due_at: i64, pub status: u8, pub bump: u8 }
impl Milestone { pub const SIZE: usize = 32 + 1 + 8 + 8 + 1 + 1; }

#[account]
pub struct Vault { pub escrow: Pubkey, pub bump: u8 }
impl Vault { pub const SIZE: usize = 32 + 1; }

#[repr(u8)] pub enum EscrowStatus { Active = 0, Completed = 1, Cancelled = 2 }
#[repr(u8)] pub enum MilestoneStatus { Pending = 0, Released = 1, Cancelled = 2 }

#[event] pub struct EscrowCreated { pub escrow: Pubkey, pub client: Pubkey, pub freelancer: Pubkey, pub total_amount: u64, pub milestone_count: u8, pub deadline: i64 }
#[event] pub struct MilestoneCreated { pub escrow: Pubkey, pub index: u8, pub amount: u64, pub due_at: i64 }
#[event] pub struct MilestoneReleased { pub escrow: Pubkey, pub milestone_index: u8, pub freelancer: Pubkey, pub amount: u64, pub released_at: i64, pub escrow_completed: bool }
#[event] pub struct EscrowCancelled { pub escrow: Pubkey, pub client: Pubkey, pub refund_amount: u64, pub cancelled_at: i64 }

#[error_code]
pub enum EscrowError {
    #[msg("Amount must be greater than zero")] InvalidAmount,
    #[msg("Milestone count must be greater than zero")] InvalidMilestoneCount,
    #[msg("Client and freelancer must be different")] InvalidParties,
    #[msg("Deadline is invalid")] InvalidDeadline,
    #[msg("Escrow is not active")] EscrowNotActive,
    #[msg("Escrow is not completed")] EscrowNotCompleted,
    #[msg("Milestone index is invalid")] InvalidMilestoneIndex,
    #[msg("Milestone is not pending")] MilestoneNotPending,
    #[msg("Milestone allocations exceed total escrow amount")] MilestonesExceedTotal,
    #[msg("All milestones must be allocated before completion")] MilestonesNotFullyAllocated,
    #[msg("Released amount exceeds total escrow amount")] ReleaseExceedsTotal,
    #[msg("Final release does not complete escrow")] ReleaseDoesNotCompleteEscrow,
    #[msg("Vault has insufficient lamports")] InsufficientVaultBalance,
    #[msg("Arithmetic overflow")] Overflow,
}
