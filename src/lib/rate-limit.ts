/**
 * Client-side rate limiter to prevent rapid repeated actions.
 * Tracks action timestamps per key and enforces cooldowns.
 */
const actionTimestamps = new Map<string, number[]>();

interface RateLimitOptions {
  /** Maximum number of attempts allowed within the window */
  maxAttempts: number;
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxAttempts: 5,
  windowMs: 60_000,
};

/**
 * Check if an action is rate-limited.
 * @returns `true` if the action is allowed, `false` if rate-limited.
 */
export function checkRateLimit(key: string, options?: Partial<RateLimitOptions>): boolean {
  const { maxAttempts, windowMs } = { ...DEFAULT_OPTIONS, ...options };
  const now = Date.now();
  const timestamps = actionTimestamps.get(key) || [];

  // Remove expired timestamps
  const valid = timestamps.filter(t => now - t < windowMs);

  if (valid.length >= maxAttempts) {
    actionTimestamps.set(key, valid);
    return false;
  }

  valid.push(now);
  actionTimestamps.set(key, valid);
  return true;
}

/**
 * Get remaining seconds until the rate limit resets for a key.
 */
export function getRateLimitReset(key: string, windowMs = 60_000): number {
  const timestamps = actionTimestamps.get(key);
  if (!timestamps || timestamps.length === 0) return 0;
  const oldest = timestamps[0];
  const resetAt = oldest + windowMs;
  return Math.max(0, Math.ceil((resetAt - Date.now()) / 1000));
}
