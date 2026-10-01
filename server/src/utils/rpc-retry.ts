export function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    console.warn(`[rpc] invalid ${name}="${raw}", falling back to ${fallback}`);
    return fallback;
  }
  return parsed;
}

const RPC_RETRY_ATTEMPTS = envInt("RPC_RETRY_ATTEMPTS", 3);
const RPC_RETRY_BASE_DELAY_MS = envInt("RPC_RETRY_BASE_DELAY_MS", 500);

function isRetryableRpcError(error: unknown): boolean {
  const code = (error as { code?: number })?.code;
  // -32019: long-term storage unavailable, -32005: node behind, 429: rate limited
  return code === -32019 || code === -32005 || code === 429;
}

export async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
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
        `[rpc] ${label} failed (attempt ${attempt}/${RPC_RETRY_ATTEMPTS}), retrying in ${delay}ms:`,
        (error as Error)?.message ?? error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}