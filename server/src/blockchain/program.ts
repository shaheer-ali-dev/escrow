import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";

export const PROGRAM_ID = env.BLOCKSUB_PROGRAM_ID ? new PublicKey(env.BLOCKSUB_PROGRAM_ID) : undefined;
export const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
let cachedProgram: anchor.Program | undefined;

function resolveIdlPath() {
  const configured = path.resolve(process.cwd(), env.BLOCKSUB_IDL_PATH);
  if (path.isAbsolute(env.BLOCKSUB_IDL_PATH) && fs.existsSync(configured)) return configured;
  const candidates = [configured, path.resolve(import.meta.dirname, "../../../", env.BLOCKSUB_IDL_PATH), path.resolve(import.meta.dirname, "../../", env.BLOCKSUB_IDL_PATH)];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function readIdl(): anchor.Idl {
  const idlPath = resolveIdlPath();
  if (!idlPath) throw new Error(`Anchor IDL not found. Run anchor build or set BLOCKSUB_IDL_PATH. Searched from ${process.cwd()}.`);
  return JSON.parse(fs.readFileSync(idlPath, "utf8")) as anchor.Idl;
}

export function getProgram(): anchor.Program {
  if (!PROGRAM_ID) throw new Error("BLOCKSUB_PROGRAM_ID is not configured");
  if (cachedProgram) return cachedProgram;
  const wallet: anchor.Wallet = {
    publicKey: SystemProgram.programId,
    signTransaction: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(transaction: T) => transaction,
    signAllTransactions: async <T extends anchor.web3.Transaction | anchor.web3.VersionedTransaction>(transactions: T[]) => transactions,
  };
  const provider = new anchor.AnchorProvider(connection, wallet, { commitment: "confirmed" });
  cachedProgram = new anchor.Program(readIdl(), PROGRAM_ID, provider);
  return cachedProgram;
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
  const latest = await connection.getLatestBlockhash("confirmed");
  transaction.recentBlockhash = latest.blockhash;
  transaction.lastValidBlockHeight = latest.lastValidBlockHeight;
  transaction.feePayer = feePayer;
  return transaction;
}
export async function unsignedTransaction(transaction: Transaction, feePayer: PublicKey) {
  return (await prepareTransaction(transaction, feePayer)).serialize({ requireAllSignatures: false, verifySignatures: false }).toString("base64");
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
