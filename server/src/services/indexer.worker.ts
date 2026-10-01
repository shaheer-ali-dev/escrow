import { runIndexerCycle } from "./indexer.service.js";

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

const INTERVAL_MS = envInt("INDEXER_INTERVAL_MS", 30000);

let isRunning = false;

async function tick() {
  if (isRunning) {
    console.warn("[indexer] previous cycle still running, skipping this tick");
    return;
  }
  isRunning = true;
  try {
    await runIndexerCycle();
  } finally {
    isRunning = false;
  }
}

export function startIndexer() {
  const indexerEnabled = process.env.ENABLE_INDEXER === "true";

  if (!indexerEnabled) {
    console.log("[indexer] disabled via ENABLE_INDEXER=false, skipping worker startup");
    return;
  }

  console.log(`[indexer] enabled, polling every ${INTERVAL_MS}ms`);
  setInterval(tick, INTERVAL_MS);
}