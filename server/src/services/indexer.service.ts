import { type ConfirmedSignatureInfo, type PublicKey } from "@solana/web3.js";
import { connection, PROGRAM_ID } from "../blockchain/program.js";
import { ChainEvent } from "../models/chain-event.model.js";
import { IndexerState } from "../models/indexer-state.model.js";
import { rebuildReputation } from "./reputation-aggregation.service.js";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`[indexer] invalid ${name}="${raw}", falling back to ${fallback}`);
    return fallback;
  }
  return parsed;
}

const SIGNATURE_PAGE_LIMIT = envInt("INDEXER_SIGNATURE_PAGE_LIMIT", 100);
const MAX_PAGES_PER_CYCLE = envInt("INDEXER_MAX_PAGES_PER_CYCLE", 10);
const RPC_RETRY_ATTEMPTS = envInt("INDEXER_RPC_RETRY_ATTEMPTS", 3);
const RPC_RETRY_BASE_DELAY_MS = envInt("INDEXER_RPC_RETRY_BASE_DELAY_MS", 500);

function isRetryableRpcError(error: unknown): boolean {
  const code = (error as { code?: number })?.code;
  return code === -32019 || code === -32005;
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RPC_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRetryableRpcError(error) || attempt === RPC_RETRY_ATTEMPTS) {
        throw error;
      }
      const delay = RPC_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
      console.warn(
        `[indexer] ${label} failed (attempt ${attempt}/${RPC_RETRY_ATTEMPTS}), retrying in ${delay}ms:`,
        (error as Error)?.message ?? error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function indexProgramAccounts() {
  if (!PROGRAM_ID) return 0;
  const programId: PublicKey = PROGRAM_ID;

  const accounts = await withRetry(
    () => connection.getProgramAccounts(programId, "confirmed"),
    "getProgramAccounts"
  );
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
  const parsed = await withRetry(
    () =>
      connection.getParsedTransaction(signature, {
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0,
      }),
    `getParsedTransaction(${signature})`
  );
  if (!parsed || parsed.meta?.err) return false;
  const logs = parsed.meta?.logMessages ?? [];
  const types = ["EscrowCreated", "MilestoneCreated", "MilestoneReleased", "EscrowCancelled"];
  const eventType = types.find((type) => logs.some((line) => line.includes(type)));
  if (!eventType) return false;
  await ChainEvent.updateOne(
    { signature },
    {
      signature,
      type:
        eventType === "EscrowCreated"
          ? "escrow_created"
          : eventType === "MilestoneCreated"
          ? "milestone_created"
          : eventType === "MilestoneReleased"
          ? "milestone_released"
          : "escrow_cancelled",
      walletAddresses: parsed.transaction.message.accountKeys.map((account) => account.pubkey.toBase58()),
      slot: parsed.slot,
      blockTime: parsed.blockTime ? new Date(parsed.blockTime * 1000) : undefined,
      raw: logs,
    },
    { upsert: true }
  );
  return true;
}

async function fetchNewSignatures(
  programId: PublicKey,
  checkpoint: string | undefined
): Promise<ConfirmedSignatureInfo[]> {
  const collected: ConfirmedSignatureInfo[] = [];
  let before: string | undefined;

  for (let page = 0; page < MAX_PAGES_PER_CYCLE; page++) {
    const batch = await withRetry(
      () =>
        connection.getSignaturesForAddress(
          programId,
          { limit: SIGNATURE_PAGE_LIMIT, before, until: checkpoint },
          "confirmed"
        ),
      `getSignaturesForAddress(page ${page})`
    );

    collected.push(...batch);

    if (batch.length < SIGNATURE_PAGE_LIMIT) break;
    before = batch[batch.length - 1]?.signature;
  }

  return collected;
}

export async function runIndexerCycle() {
  if (!PROGRAM_ID) return;
  const programId: PublicKey = PROGRAM_ID;
  const programKey = programId.toBase58();

  let signatures: ConfirmedSignatureInfo[];
  try {
    const state = await IndexerState.findOne({ key: programKey });
    signatures = await fetchNewSignatures(programId, state?.lastSignature);
  } catch (error) {
    console.error("[indexer] failed to fetch signatures, skipping this cycle:", (error as Error)?.message ?? error);
    return;
  }

  if (signatures.length === 0) return;

  const ordered = [...signatures].reverse();
  let newestProcessed: string | undefined;

  for (const item of ordered) {
    if (item.err) {
      newestProcessed = item.signature;
      continue;
    }
    try {
      await indexTransaction(item.signature);
      newestProcessed = item.signature;
    } catch (error) {
      console.error(
        `[indexer] failed to index transaction ${item.signature}, stopping cycle early:`,
        (error as Error)?.message ?? error
      );
      break;
    }
  }

  if (newestProcessed) {
    await IndexerState.updateOne(
      { key: programKey },
      { key: programKey, lastSignature: newestProcessed, updatedAt: new Date() },
      { upsert: true }
    );
  }

  try {
    const wallets = await ChainEvent.distinct("walletAddresses");
    for (const wallet of wallets) {
      await rebuildReputation(wallet);
    }
  } catch (error) {
    console.error("[indexer] reputation rebuild failed:", (error as Error)?.message ?? error);
  }
}