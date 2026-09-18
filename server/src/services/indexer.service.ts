import { PublicKey } from "@solana/web3.js";
import { connection, PROGRAM_ID } from "../blockchain/program.js";
import { ChainEvent } from "../models/chain-event.model.js";
import { Escrow } from "../models/escrow.model.js";
import { Milestone } from "../models/milestone.model.js";
import { rebuildReputation } from "./reputation-aggregation.service.js";

export async function indexProgramAccounts() {
  if (!PROGRAM_ID) return 0;
  const accounts = await connection.getProgramAccounts(PROGRAM_ID, "confirmed");
  for (const item of accounts) {
    const info = await connection.getAccountInfo(item.pubkey, "confirmed");
    if (!info) continue;
    // Account decoding is intentionally delegated to the Anchor IDL in the API path.
    // The indexer persists escrow state when a client calls /sync after a confirmed transaction.
  }
  return accounts.length;
}

export async function indexTransaction(signature: string) {
  if (!PROGRAM_ID) throw new Error("BLOCKSUB_PROGRAM_ID is not configured");
  const parsed = await connection.getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
  if (!parsed || parsed.meta?.err) return false;
  const logs = parsed.meta?.logMessages ?? [];
  const types = ["EscrowCreated", "MilestoneCreated", "MilestoneReleased", "EscrowCancelled"];
  const eventType = types.find((type) => logs.some((line) => line.includes(type)));
  if (!eventType) return false;
  await ChainEvent.updateOne({ signature }, { signature, type: eventType === "EscrowCreated" ? "escrow_created" : eventType === "MilestoneCreated" ? "milestone_created" : eventType === "MilestoneReleased" ? "milestone_released" : "escrow_cancelled", walletAddresses: parsed.transaction.message.accountKeys.map((account) => account.pubkey.toBase58()), slot: parsed.slot, blockTime: parsed.blockTime ? new Date(parsed.blockTime * 1000) : undefined, raw: logs }, { upsert: true });
  return true;
}

export async function runIndexerCycle() {
  if (!PROGRAM_ID) return;
  const signatures = await connection.getSignaturesForAddress(PROGRAM_ID, { limit: 100 }, "confirmed");
  for (const item of signatures.filter((item) => !item.err)) await indexTransaction(item.signature);
  const wallets = await ChainEvent.distinct("walletAddresses");
  for (const wallet of wallets) await rebuildReputation(wallet);
}
