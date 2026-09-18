import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Profile } from "../models/profile.model.js";
import { Escrow } from "../models/escrow.model.js";
import { ChainEvent } from "../models/chain-event.model.js";
import { buildCancelEscrow, buildCreateEscrow, buildCreateMilestone, buildReleaseMilestone, connection, escrowPda, getProgram, vaultPda } from "../blockchain/program.js";

const addressSchema = z.string().refine((value) => { try { new PublicKey(value); return true; } catch { return false; } }, "Invalid Solana address");
const createSchema = z.object({ freelancer: addressSchema, totalLamports: z.coerce.bigint().positive(), milestoneCount: z.coerce.number().int().min(1).max(255), deadline: z.coerce.number().int().positive() });
const milestoneSchema = z.object({ index: z.coerce.number().int().min(0).max(255), amountLamports: z.coerce.bigint().positive(), dueAt: z.coerce.number().int().positive() });
const releaseSchema = z.object({ freelancer: addressSchema, index: z.coerce.number().int().min(0).max(255) });
const signatureSchema = z.object({ signature: z.string().min(32).max(128) });
const publicKey = (value: string) => new PublicKey(value);

async function clientWallet(userId: string) { const profile = await Profile.findOne({ userId }).lean(); if (!profile?.walletAddress) throw new Error("Verify a client wallet before using escrow transactions"); return publicKey(profile.walletAddress); }

export async function createEscrowTransaction(userId: string, input: unknown) { const data = createSchema.parse(input); const client = await clientWallet(userId); return buildCreateEscrow(client, publicKey(data.freelancer), new anchor.BN(data.totalLamports.toString()), data.milestoneCount, new anchor.BN(data.deadline)); }
export async function createMilestoneTransaction(userId: string, address: string, input: unknown) { const data = milestoneSchema.parse(input); const client = await clientWallet(userId); const escrow = await Escrow.findOne({ address, client: client.toBase58() }).lean(); if (!escrow) throw new Error("Escrow not found or not owned by client"); return buildCreateMilestone(client, publicKey(address), data.index, new anchor.BN(data.amountLamports.toString()), new anchor.BN(data.dueAt)); }
export async function releaseMilestoneTransaction(userId: string, address: string, input: unknown) { const data = releaseSchema.parse(input); const client = await clientWallet(userId); const escrow = await Escrow.findOne({ address, client: client.toBase58() }).lean(); if (!escrow) throw new Error("Escrow not found or not owned by client"); if (data.freelancer !== escrow.freelancer) throw new Error("Freelancer does not match escrow"); return buildReleaseMilestone(client, publicKey(data.freelancer), publicKey(address), data.index); }
export async function cancelEscrowTransaction(userId: string, address: string) { const client = await clientWallet(userId); const escrow = await Escrow.findOne({ address, client: client.toBase58() }).lean(); if (!escrow) throw new Error("Escrow not found or not owned by client"); return buildCancelEscrow(client, publicKey(escrow.freelancer)); }

export async function syncEscrow(userId: string, address: string, signature: string) {
  const client = await clientWallet(userId); const escrowAddress = publicKey(address); const parsedSignature = signatureSchema.parse({ signature }).signature;
  const status = await connection.getSignatureStatuses([parsedSignature]); const confirmation = status.value[0];
  if (!confirmation || confirmation.err) throw new Error("Transaction was not found or failed on Solana");
  const account = await getProgram().account.escrow.fetch(escrowAddress) as any;
  if (account.client.toBase58() !== client.toBase58()) throw new Error("Escrow does not belong to the authenticated wallet");
  const record = await Escrow.findOneAndUpdate({ address }, { address, vaultAddress: vaultPda(escrowAddress).toBase58(), client: account.client.toBase58(), freelancer: account.freelancer.toBase58(), totalLamports: account.totalAmount.toString(), allocatedLamports: account.allocatedAmount?.toString() ?? "0", releasedLamports: account.releasedAmount.toString(), milestoneCount: account.milestoneCount, completedMilestones: account.completedMilestones, deadline: new Date(Number(account.deadline.toString()) * 1000), status: ["active", "completed", "cancelled"][account.status] ?? "active", createdSignature: parsedSignature }, { upsert: true, new: true });
  await ChainEvent.updateOne({ signature: parsedSignature }, { signature: parsedSignature, type: "escrow_created", escrowAddress: address, walletAddresses: [account.client.toBase58(), account.freelancer.toBase58()] }, { upsert: true });
  return record;
}
