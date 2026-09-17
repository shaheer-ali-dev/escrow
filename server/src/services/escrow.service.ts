import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Profile } from "../models/profile.model.js";
import { Escrow } from "../models/escrow.model.js";
import { Milestone } from "../models/milestone.model.js";
import { ChainEvent } from "../models/chain-event.model.js";
import { buildCancelEscrow, buildCreateEscrow, buildCreateMilestone, buildReleaseMilestone, connection, escrowPda, getProgram } from "../blockchain/program.js";

const createSchema = z.object({ freelancer: z.string(), totalLamports: z.coerce.bigint().positive(), milestoneCount: z.number().int().min(1).max(255), deadline: z.coerce.number().int().positive() });
const milestoneSchema = z.object({ index: z.number().int().min(0).max(255), amountLamports: z.coerce.bigint().positive(), dueAt: z.coerce.number().int().positive() });
const signatureSchema = z.object({ signature: z.string().min(32) });
const key = (value: string) => new PublicKey(value);

export async function createEscrowTransaction(userId: string, input: unknown) {
  const data = createSchema.parse(input); const profile = await Profile.findOne({ userId }).lean();
  if (!profile?.walletAddress) throw new Error("Verify a client wallet before creating an escrow");
  const client = key(profile.walletAddress); const freelancer = key(data.freelancer);
  return buildCreateEscrow(client, freelancer, new anchor.BN(data.totalLamports.toString()), data.milestoneCount, new anchor.BN(data.deadline));
}

export async function createMilestoneTransaction(userId: string, address: string, input: unknown) {
  const data = milestoneSchema.parse(input); const profile = await Profile.findOne({ userId }).lean();
  if (!profile?.walletAddress) throw new Error("Verify a client wallet first");
  const escrow = await Escrow.findOne({ address, client: profile.walletAddress }).lean(); if (!escrow) throw new Error("Escrow not found or not owned by client");
  return buildCreateMilestone(key(profile.walletAddress), key(address), data.index, new anchor.BN(data.amountLamports.toString()), new anchor.BN(data.dueAt));
}

export async function releaseMilestoneTransaction(userId: string, address: string, input: unknown) {
  const data = z.object({ freelancer: z.string(), index: z.number().int().min(0).max(255) }).parse(input); const profile = await Profile.findOne({ userId }).lean();
  if (!profile?.walletAddress) throw new Error("Verify a client wallet first");
  const escrow = await Escrow.findOne({ address, client: profile.walletAddress }).lean(); if (!escrow) throw new Error("Escrow not found or not owned by client");
  return buildReleaseMilestone(key(profile.walletAddress), key(data.freelancer), key(address), data.index);
}

export async function cancelEscrowTransaction(userId: string, address: string) {
  const profile = await Profile.findOne({ userId }).lean(); if (!profile?.walletAddress) throw new Error("Verify a client wallet first");
  const escrow = await Escrow.findOne({ address, client: profile.walletAddress }).lean(); if (!escrow) throw new Error("Escrow not found or not owned by client");
  return buildCancelEscrow(key(profile.walletAddress), key(escrow.freelancer));
}

export async function syncEscrow(userId: string, address: string, signature: string) {
  const profile = await Profile.findOne({ userId }).lean(); if (!profile?.walletAddress) throw new Error("Verify a wallet first");
  const parsed = key(address); const account = await getProgram().account.escrow.fetch(parsed) as any;
  const record = await Escrow.findOneAndUpdate({ address }, { address, vaultAddress: (await import("../blockchain/program.js")).vaultPda(parsed).toBase58(), client: account.client.toBase58(), freelancer: account.freelancer.toBase58(), totalLamports: account.totalAmount.toString(), allocatedLamports: account.allocatedAmount?.toString() ?? "0", releasedLamports: account.releasedAmount.toString(), milestoneCount: account.milestoneCount, completedMilestones: account.completedMilestones, deadline: new Date(Number(account.deadline.toString()) * 1000), status: ["active", "completed", "cancelled"][account.status] ?? "active", createdSignature: signature }, { upsert: true, new: true });
  await ChainEvent.updateOne({ signature }, { signature, type: "escrow_created", escrowAddress: address, walletAddresses: [account.client.toBase58(), account.freelancer.toBase58()] }, { upsert: true });
  return record;
}
