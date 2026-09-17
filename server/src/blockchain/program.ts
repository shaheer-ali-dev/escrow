import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

export const PROGRAM_ID = env.BLOCKSUB_PROGRAM_ID
  ? new PublicKey(env.BLOCKSUB_PROGRAM_ID)
  : undefined;

export const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");

let programCache: anchor.Program | undefined;

export function getProgram(): anchor.Program {
  if (!PROGRAM_ID) throw new Error("BLOCKSUB_PROGRAM_ID is not configured");
  if (programCache) return programCache;

  const idlPath = path.resolve(process.cwd(), env.BLOCKSUB_IDL_PATH);
  if (!fs.existsSync(idlPath)) {
    throw new Error(`Anchor IDL not found at ${idlPath}. Run anchor build first.`);
  }

  const idl = JSON.parse(fs.readFileSync(idlPath, "utf8")) as anchor.Idl;
  programCache = new anchor.Program(idl, PROGRAM_ID, { connection });
  return programCache;
}

export function escrowPda(client: PublicKey, freelancer: PublicKey) {
  if (!PROGRAM_ID) throw new Error("BLOCKSUB_PROGRAM_ID is not configured");
  return PublicKey.findProgramAddressSync([Buffer.from("escrow"), client.toBuffer(), freelancer.toBuffer()], PROGRAM_ID)[0];
}

export function vaultPda(escrow: PublicKey) {
  if (!PROGRAM_ID) throw new Error("BLOCKSUB_PROGRAM_ID is not configured");
  return PublicKey.findProgramAddressSync([Buffer.from("vault"), escrow.toBuffer()], PROGRAM_ID)[0];
}

export function milestonePda(escrow: PublicKey, index: number) {
  if (!Number.isInteger(index) || index < 0 || index > 255) throw new Error("Milestone index must be between 0 and 255");
  if (!PROGRAM_ID) throw new Error("BLOCKSUB_PROGRAM_ID is not configured");
  return PublicKey.findProgramAddressSync([Buffer.from("milestone"), escrow.toBuffer(), Buffer.from([index])], PROGRAM_ID)[0];
}

export async function prepareTransaction(transaction: Transaction, feePayer: PublicKey) {
  const blockhash = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = blockhash.blockhash;
  transaction.lastValidBlockHeight = blockhash.lastValidBlockHeight;
  transaction.feePayer = feePayer;
  return transaction;
}

export async function unsignedTransaction(transaction: Transaction, feePayer: PublicKey) {
  const prepared = await prepareTransaction(transaction, feePayer);
  return prepared.serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
}

export async function buildCreateEscrow(client: PublicKey, freelancer: PublicKey, totalLamports: anchor.BN, milestoneCount: number, deadline: anchor.BN) {
  const escrow = escrowPda(client, freelancer); const vault = vaultPda(escrow);
  const tx = await getProgram().methods.createEscrow(totalLamports, milestoneCount, deadline).accounts({ escrow, vault, client, freelancer, systemProgram: SystemProgram.programId }).transaction();
  return { transaction: await unsignedTransaction(tx, client), escrow, vault };
}

export async function buildCreateMilestone(client: PublicKey, escrow: PublicKey, index: number, amount: anchor.BN, dueAt: anchor.BN) {
  const milestone = milestonePda(escrow, index);
  const tx = await getProgram().methods.createMilestone(index, amount, dueAt).accounts({ escrow, milestone, client, systemProgram: SystemProgram.programId }).transaction();
  return { transaction: await unsignedTransaction(tx, client), milestone };
}

export async function buildReleaseMilestone(client: PublicKey, freelancer: PublicKey, escrow: PublicKey, index: number) {
  const milestone = milestonePda(escrow, index); const vault = vaultPda(escrow);
  const tx = await getProgram().methods.releaseMilestone().accounts({ escrow, milestone, vault, client, freelancer }).transaction();
  return { transaction: await unsignedTransaction(tx, client), milestone, vault };
}

export async function buildCancelEscrow(client: PublicKey, freelancer: PublicKey) {
  const escrow = escrowPda(client, freelancer); const vault = vaultPda(escrow);
  const tx = await getProgram().methods.cancelEscrow().accounts({ escrow, vault, client }).transaction();
  return { transaction: await unsignedTransaction(tx, client), escrow, vault };
}
