import { AppApiError } from "@/types/api";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "anonymous";
}

/**
 * In-memory sliding window rate limit (per serverless instance).
 * Throws AppApiError 429 when exceeded.
 */
export function assertRateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): void {
  const now = Date.now();
  const key = `${scope}:${clientKey(request)}`;
  let bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  if (bucket.count > limit) {
    const retrySec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new AppApiError(
      "RATE_LIMITED",
      `Trop de requêtes. Réessayez dans ${retrySec}s.`,
      429,
    );
  }

  // Opportunistic cleanup of expired buckets
  if (buckets.size > 2000) {
    for (const [k, b] of buckets) {
      if (now >= b.resetAt) buckets.delete(k);
    }
  }
}
