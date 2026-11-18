/**
 * Small in-memory sliding-window limiter. One Railway replica, so a process-
 * local map is enough to stop a single caller hammering an endpoint; it resets
 * on deploy, which is fine for abuse control.
 */
const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

/** Records a hit and returns true if `key` is now over `max` hits in `windowMs`. */
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, hits] of buckets) {
      if (!hits.length || now - hits[hits.length - 1] > 24 * 3_600_000) buckets.delete(k);
    }
  }
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return true;
  }
  hits.push(now);
  buckets.set(key, hits);
  return false;
}
