import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(process.env.BLOCKSUB_PROGRAM_ID!);
export const connection = new Connection(process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com", "confirmed");

export function escrowPda(client: PublicKey, freelancer: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("escrow"), client.toBuffer(), freelancer.toBuffer()], PROGRAM_ID)[0];
}
export function vaultPda(escrow: PublicKey) {
  return PublicKey.findProgramAddressSync([Buffer.from("vault"), escrow.toBuffer()], PROGRAM_ID)[0];
}
export function milestonePda(escrow: PublicKey, index: number) {
  if (!Number.isInteger(index) || index < 0 || index > 255) throw new Error("index must be 0..255");
  return PublicKey.findProgramAddressSync([Buffer.from("milestone"), escrow.toBuffer(), Buffer.from([index])], PROGRAM_ID)[0];
}

export async function prepareTransaction(transaction: Transaction, feePayer: PublicKey) {
  const bh = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = bh.blockhash;
  transaction.lastValidBlockHeight = bh.lastValidBlockHeight;
  transaction.feePayer = feePayer;
  return transaction;
}

// The server only builds unsigned transactions. The client wallet must sign them.
export async function buildCreateEscrow(client: PublicKey, freelancer: PublicKey, totalLamports: anchor.BN, milestoneCount: number, deadline: anchor.BN, program: anchor.Program) {
  const escrow = escrowPda(client, freelancer);
  const vault = vaultPda(escrow);
  const tx = await program.methods.createEscrow(totalLamports, milestoneCount, deadline).accounts({ escrow, vault, client, freelancer, systemProgram: SystemProgram.programId }).transaction();
  return { transaction: await prepareTransaction(tx, client), escrow, vault };
}

export async function buildCreateMilestone(client: PublicKey, escrow: PublicKey, index: number, amount: anchor.BN, dueAt: anchor.BN, program: anchor.Program) {
  const milestone = milestonePda(escrow, index);
  const tx = await program.methods.createMilestone(index, amount, dueAt).accounts({ escrow, milestone, client, systemProgram: SystemProgram.programId }).transaction();
  return { transaction: await prepareTransaction(tx, client), milestone };
}

export async function buildReleaseMilestone(client: PublicKey, freelancer: PublicKey, escrow: PublicKey, index: number, program: anchor.Program) {
  const milestone = milestonePda(escrow, index);
  const vault = vaultPda(escrow);
  const tx = await program.methods.releaseMilestone().accounts({ escrow, milestone, vault, client, freelancer }).transaction();
  return { transaction: await prepareTransaction(tx, client), milestone, vault };
}

export async function buildCancelEscrow(client: PublicKey, freelancer: PublicKey, program: anchor.Program) {
  const escrow = escrowPda(client, freelancer);
  const vault = vaultPda(escrow);
  const tx = await program.methods.cancelEscrow().accounts({ escrow, vault, client }).transaction();
  return { transaction: await prepareTransaction(tx, client), escrow, vault };
}
