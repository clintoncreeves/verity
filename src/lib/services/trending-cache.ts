/**
 * Cache for pre-verified trending headlines
 * Uses Upstash Redis for persistent storage across serverless invocations
 */

import { Redis } from '@upstash/redis';
import type { TrendingHeadline } from './trending-news';

export interface CachedVerification {
  headline: TrendingHeadline;
  verificationResult: {
    id: string;
    overallCategory: string;
    overallConfidence: number;
    summary: string;
  };
  cachedAt: number;
}

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

// Cache key prefix
const CACHE_PREFIX = 'verity:trending:';

// Cache duration: 24 hours (daily refresh)
const CACHE_TTL_SECONDS = 24 * 60 * 60;

/**
 * Generate cache key from headline text
 */
function getCacheKey(headline: string): string {
  // Create a simple hash-like key from the headline
  const normalized = headline.toLowerCase().trim().slice(0, 100);
  return `${CACHE_PREFIX}${Buffer.from(normalized).toString('base64').slice(0, 50)}`;
}

/**
 * Get cached verification for a headline
 */
export async function getCachedVerification(headline: string): Promise<CachedVerification | null> {
  try {
    const key = getCacheKey(headline);
    const cached = await redis.get<CachedVerification>(key);
    return cached;
  } catch (error) {
    console.error('[Verity] Redis get error:', error);
    return null;
  }
}

/**
 * Store verification result in cache
 */
export async function cacheVerification(
  headline: TrendingHeadline,
  result: CachedVerification['verificationResult']
): Promise<void> {
  try {
    const key = getCacheKey(headline.title);
    const data: CachedVerification = {
      headline,
      verificationResult: result,
      cachedAt: Date.now(),
    };
    await redis.set(key, data, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error('[Verity] Redis set error:', error);
  }
}

/**
 * Get all cached verifications for current trending headlines
 */
export async function getAllCachedVerifications(headlines: TrendingHeadline[]): Promise<CachedVerification[]> {
  try {
    const results: CachedVerification[] = [];

    for (const headline of headlines) {
      const cached = await getCachedVerification(headline.title);
      if (cached) {
        results.push(cached);
      }
    }

    return results;
  } catch (error) {
    console.error('[Verity] Redis getAllCachedVerifications error:', error);
    return [];
  }
}

/**
 * Check if Redis is configured and available
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Get all cached headlines (scan Redis for cached verifications)
 */
export async function getAllCachedHeadlines(): Promise<CachedVerification[]> {
  try {
    // Scan for all keys with our prefix
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, foundKeys] = await redis.scan(cursor, { match: `${CACHE_PREFIX}*`, count: 100 }) as [string, string[]];
      cursor = nextCursor;
      keys.push(...foundKeys);
    } while (cursor !== '0');

    if (keys.length === 0) {
      return [];
    }

    // Fetch all cached verifications
    const results: CachedVerification[] = [];
    for (const key of keys) {
      const cached = await redis.get<CachedVerification>(key);
      if (cached) {
        results.push(cached);
      }
    }

    // Sort by cachedAt (most recent first)
    results.sort((a, b) => b.cachedAt - a.cachedAt);

    return results;
  } catch (error) {
    console.error('[Verity] Redis getAllCachedHeadlines error:', error);
    return [];
  }
}
