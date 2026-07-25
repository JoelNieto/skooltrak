/**
 * Lightweight, process-local sliding-window rate limiter.
 *
 * Suitable for a single instance. For a horizontally scaled deployment this
 * should be swapped for a shared store (e.g. Redis). It is intentionally
 * dependency-free so it can be dropped into any Nest service.
 */
export interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the oldest sample ages out and the request can retry. */
  retryAfterMs: number;
}

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  /**
   * Record an attempt for `key`. Returns whether the request is allowed and,
   * if not, how long to wait.
   */
  hit(key: string, max: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const samples = (this.hits.get(key) ?? []).filter((t) => now - t < windowMs);

    if (samples.length >= max) {
      const oldest = samples[0];
      const retryAfterMs = oldest + windowMs - now;
      this.hits.set(key, samples);
      return { allowed: false, retryAfterMs };
    }

    samples.push(now);
    this.hits.set(key, samples);
    return { allowed: true, retryAfterMs: 0 };
  }

  /** Optional: clear buckets for a key (e.g. after a successful sensitive op). */
  reset(key: string): void {
    this.hits.delete(key);
  }
}
