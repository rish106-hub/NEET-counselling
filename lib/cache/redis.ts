import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

const OUTPUT_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days

export async function cacheOutput(uuid: string, payload: object): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.setex(`output:${uuid}`, OUTPUT_TTL_SECONDS, JSON.stringify(payload));
  } catch {
    return;
  }
}

export async function getCachedOutput(uuid: string): Promise<object | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(`output:${uuid}`);
    if (!raw) return null;
    if (typeof raw === "string") return JSON.parse(raw);
    return raw as object;
  } catch {
    return null;
  }
}

// Sliding window rate limiter: returns true if request is allowed
export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return true; // Fail open if Redis unavailable

  const now = Date.now();
  const windowKey = `rl:${key}:${Math.floor(now / (windowSeconds * 1000))}`;

  try {
    const count = await redis.incr(windowKey);
    if (count === 1) {
      await redis.expire(windowKey, windowSeconds);
    }
    return count <= maxRequests;
  } catch {
    return true;
  }
}
