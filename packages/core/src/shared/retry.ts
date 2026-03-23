/**
 * Retry an async operation with exponential backoff.
 *
 * Delays: attempt 1 → baseDelayMs, attempt 2 → baseDelayMs*2, etc.
 * On final failure, throws the last error wrapped with context.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: { maxRetries?: number; baseDelayMs?: number; label?: string } = {},
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, label = "operation" } = opts;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(
    `${label} failed after ${maxRetries} attempts: ${msg}`,
  );
}
