import { PublicKey, type ParsedConfirmedTransaction, type SignaturesForAddressOptions } from "@solana/web3.js";
import { connection } from "../blockchain/program.js";
import { WalletAnalytics } from "../models/wallet-analytics.model.js";
import { ChainEvent } from "../models/chain-event.model.js";

const MAX_TRANSACTIONS = 100;

export type WalletScan = {
  walletAddress: string;
  transactionCount: number;
  firstObservedAt: Date | null;
  lastObservedAt: Date | null;
  solBalanceLamports: string;
  observedNetSolFlowLamports: string;
  coveragePercent: number;
  realizedPnlLamports: null;
  reliability: {
    level: "limited" | "moderate";
    score: number;
    explanation: string;
  };
  riskSignals: Array<{
    code: string;
    description: string;
    source: string;
    evidenceSignatures: string[];
    observedAt: Date;
  }>;
  limitations: string[];
};

function validateAddress(address: string) {
  return new PublicKey(address);
}

function transactionTime(transaction: ParsedConfirmedTransaction) {
  return transaction.blockTime ? new Date(transaction.blockTime * 1000) : null;
}

export async function scanWallet(address: string): Promise<WalletScan> {
  const publicKey = validateAddress(address);
  const normalized = publicKey.toBase58();
  const options: SignaturesForAddressOptions = { limit: MAX_TRANSACTIONS };
  const signatures = await connection.getSignaturesForAddress(publicKey, options);
  const confirmed = signatures.filter((item) => !item.err);
  const transactions = await connection.getParsedConfirmedTransactions(
    confirmed.map((item) => item.signature),
    { commitment: "confirmed", maxSupportedTransactionVersion: 0 }
  );

  let incoming = 0n;
  let outgoing = 0n;
  const evidenceSignatures: string[] = [];

  for (const transaction of transactions) {
    if (!transaction?.meta) continue;
    const accountKeys = transaction.transaction.message.accountKeys;
    const accountIndex = accountKeys.findIndex((key) => key.pubkey.equals(publicKey));
    if (accountIndex < 0) continue;

    const before = BigInt(transaction.meta.preBalances[accountIndex] ?? 0);
    const after = BigInt(transaction.meta.postBalances[accountIndex] ?? 0);
    const delta = after - before;
    if (delta > 0n) incoming += delta;
    if (delta < 0n) outgoing += -delta;
    evidenceSignatures.push(transaction.transaction.signatures[0]);
  }

  const times = transactions.map(transactionTime).filter((value): value is Date => value !== null);
  const firstObservedAt = times.length ? new Date(Math.min(...times.map((value) => value.getTime()))) : null;
  const lastObservedAt = times.length ? new Date(Math.max(...times.map((value) => value.getTime()))) : null;
  const balance = await connection.getBalance(publicKey, "confirmed");
  const netFlow = incoming - outgoing;
  const coveragePercent = transactions.length ? 25 : 0;
  const riskSignals = [];

  if (signatures.some((item) => item.err)) {
    riskSignals.push({
      code: "FAILED_TRANSACTIONS",
      description: "The wallet has failed transactions in the scanned sample.",
      source: "Solana RPC getSignaturesForAddress",
      evidenceSignatures: signatures.filter((item) => item.err).slice(0, 10).map((item) => item.signature),
      observedAt: new Date(),
    });
  }

  const scan: WalletScan = {
    walletAddress: normalized,
    transactionCount: signatures.length,
    firstObservedAt,
    lastObservedAt,
    solBalanceLamports: String(balance),
    observedNetSolFlowLamports: netFlow.toString(),
    coveragePercent,
    realizedPnlLamports: null,
    reliability: {
      level: "limited",
      score: signatures.length >= MAX_TRANSACTIONS ? 35 : 20,
      explanation: "This is an evidence summary from public Solana RPC data, not a safety judgment.",
    },
    riskSignals,
    limitations: [
      "Only the latest 100 address signatures are scanned.",
      "SOL balance changes are not profit and loss.",
      "SPL tokens, swaps, transfers between owned wallets, LP positions, staking, lending, bridges, and historical prices are not calculated.",
      "No reliable scammer/safe classification is produced.",
    ],
  };

  await WalletAnalytics.findOneAndUpdate(
    { walletAddress: normalized },
    {
      walletAddress: normalized,
      transactionCount: scan.transactionCount,
      firstObservedAt,
      lastObservedAt,
      coveragePercent,
      riskSignals: scan.riskSignals,
      calculatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return scan;
}

export async function getWalletAnalytics(address: string) {
  const normalized = validateAddress(address).toBase58();
  return WalletAnalytics.findOne({ walletAddress: normalized }).lean();
}

export async function getWalletEvents(address: string) {
  const normalized = validateAddress(address).toBase58();
  return ChainEvent.find({ walletAddresses: normalized }).sort({ createdAt: -1 }).limit(100).lean();
}
