import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null;

/**
 * Distributed rate limiter backed by Upstash Redis.
 * Falls back to a permissive in-memory Map when Redis isn't configured
 * (local dev without Upstash, or env vars missing).
 */

// 10 requests per 60s — used for water-quality API
export const apiLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, "60 s") })
  : null;

// 3 requests per 60s — used for subscribe
export const subscribeLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(3, "60 s") })
  : null;

// In-memory fallback for local dev
const memoryMap = new Map<string, { count: number; resetAt: number }>();

export function isMemoryRateLimited(
  ip: string,
  max: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = memoryMap.get(ip);
  if (!entry || now > entry.resetAt) {
    memoryMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  entry.count++;
  return entry.count > max;
}
