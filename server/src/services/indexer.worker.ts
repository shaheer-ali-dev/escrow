import { env } from "../config/env.js";
import { runIndexerCycle } from "../services/indexer.service.js";

export function startIndexer() {
  if (!env.ENABLE_INDEXER) return;
  const run = async () => { try { await runIndexerCycle(); } catch (error) { console.error("Indexer cycle failed", error); } };
  void run();
  setInterval(() => void run(), env.INDEXER_INTERVAL_MS).unref();
}
