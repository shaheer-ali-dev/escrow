import { PublicKey, type ParsedTransactionWithMeta } from "@solana/web3.js";
import { connection } from "../blockchain/program.js";
import { WalletActivity } from "../models/wallet-activity.model.js";
import { WalletAnalytics } from "../models/wallet-analytics.model.js";
import { withRetry, mapWithConcurrency, envInt } from "../utils/rpc-retry.js";

const LIMIT = 100;
const TX_FETCH_CONCURRENCY = envInt("WALLET_SCAN_TX_CONCURRENCY", 5);

export async function scanWalletActivity(address: string) {
  const wallet = new PublicKey(address);
  const normalized = wallet.toBase58();

  const signatures = await withRetry(
    () => connection.getSignaturesForAddress(wallet, { limit: LIMIT }, "confirmed"),
    "getSignaturesForAddress"
  );

  // Fetch one transaction at a time, a handful in flight at once, each with its own retry.
  // Replaces getParsedConfirmedTransactions (deprecated, and fires everything at once —
  // that's what was tripping the devnet RPC's rate limiter).
  const transactions: (ParsedTransactionWithMeta | null)[] = await mapWithConcurrency(
    signatures,
    TX_FETCH_CONCURRENCY,
    (sig) =>
      withRetry(
        () =>
          connection.getParsedTransaction(sig.signature, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 0,
          }),
        `getParsedTransaction(${sig.signature})`
      )
  );

  let incoming = 0n;
  let outgoing = 0n;
  let successful = 0;
  let failed = 0;
  const protocols = new Set<string>();
  const counterpartyCounts = new Map<string, number>();
  const times: Date[] = [];

  for (const [i, tx] of transactions.entries()) {
    if (!tx) continue;
    const signature = signatures[i];
    if (signature.err) failed++; else successful++;
    if (tx.blockTime) times.push(new Date(tx.blockTime * 1000));
    for (const account of tx.transaction.message.accountKeys) protocols.add(account.pubkey.toBase58());
    if (!tx.meta) continue;
    const index = tx.transaction.message.accountKeys.findIndex((a) => a.pubkey.equals(wallet));
    if (index >= 0) {
      const delta = BigInt(tx.meta.postBalances[index] ?? 0) - BigInt(tx.meta.preBalances[index] ?? 0);
      if (delta > 0n) incoming += delta; else outgoing += -delta;
    }
    for (const account of tx.transaction.message.accountKeys) {
      const other = account.pubkey.toBase58();
      if (other !== normalized) counterpartyCounts.set(other, (counterpartyCounts.get(other) ?? 0) + 1);
    }
  }

  const tokenAccounts = await withRetry(
    () =>
      connection.getParsedTokenAccountsByOwner(
        wallet,
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") },
        "confirmed"
      ),
    "getParsedTokenAccountsByOwner"
  );
  const tokenBalances = tokenAccounts.value
    .map(({ account }) => {
      const info = account.data.parsed.info;
      return { mint: info.mint as string, amount: info.tokenAmount.amount as string, decimals: info.tokenAmount.decimals as number };
    })
    .filter((token) => token.amount !== "0");

  const sortedCounterparties = [...counterpartyCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([address, transactionCount]) => ({ address, transactionCount }));
  const observed = transactions.filter(Boolean).length;
  const timesSorted = times.sort((a, b) => a.getTime() - b.getTime());
  const failedRate = signatures.length ? failed / signatures.length : 0;
  const balance = await withRetry(() => connection.getBalance(wallet, "confirmed"), "getBalance");

  const activity = {
    walletAddress: normalized,
    transactionCount: signatures.length,
    successfulTransactionCount: successful,
    failedTransactionCount: failed,
    firstObservedAt: timesSorted[0],
    lastObservedAt: timesSorted.at(-1),
    solBalanceLamports: String(balance),
    incomingLamports: incoming.toString(),
    outgoingLamports: outgoing.toString(),
    protocolCount: protocols.size,
    splTokenCount: tokenBalances.length,
    tokenBalances,
    counterparties: sortedCounterparties,
    coveragePercent: observed ? 25 : 0,
    calculatedAt: new Date(),
  };

  const signals = failedRate >= 0.2
    ? [{
        code: "HIGH_FAILED_TRANSACTION_RATE",
        description: `Failed transactions represent ${(failedRate * 100).toFixed(1)}% of the scanned sample.`,
        source: "Solana RPC",
        evidenceSignatures: signatures.filter((s) => s.err).slice(0, 10).map((s) => s.signature),
        observedAt: new Date(),
      }]
    : [];

  await WalletActivity.findOneAndUpdate({ walletAddress: normalized }, activity, { upsert: true, new: true });
  await WalletAnalytics.findOneAndUpdate(
    { walletAddress: normalized },
    {
      walletAddress: normalized,
      transactionCount: signatures.length,
      firstObservedAt: timesSorted[0],
      lastObservedAt: timesSorted.at(-1),
      coveragePercent: activity.coveragePercent,
      riskSignals: signals,
      calculatedAt: new Date(),
    },
    { upsert: true }
  );

  return { activity, signals };
}