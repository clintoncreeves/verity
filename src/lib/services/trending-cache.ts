/**
 * Cache for pre-verified trending headlines
 * Stores verification results to avoid redundant API calls
 */

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

// In-memory cache for verified headlines
const verificationCache = new Map<string, CachedVerification>();

// Cache duration: 6 hours (headlines rotate hourly, results stay valid)
const CACHE_DURATION = 6 * 60 * 60 * 1000;

/**
 * Generate cache key from headline text
 */
function getCacheKey(headline: string): string {
  return headline.toLowerCase().trim().slice(0, 100);
}

/**
 * Get cached verification for a headline
 */
export function getCachedVerification(headline: string): CachedVerification | null {
  const key = getCacheKey(headline);
  const cached = verificationCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid
  if (Date.now() - cached.cachedAt > CACHE_DURATION) {
    verificationCache.delete(key);
    return null;
  }

  return cached;
}

/**
 * Store verification result in cache
 */
export function cacheVerification(
  headline: TrendingHeadline,
  result: CachedVerification['verificationResult']
): void {
  const key = getCacheKey(headline.title);

  verificationCache.set(key, {
    headline,
    verificationResult: result,
    cachedAt: Date.now(),
  });
}

/**
 * Get all cached verifications (for pre-loading)
 */
export function getAllCachedVerifications(): CachedVerification[] {
  const now = Date.now();
  const valid: CachedVerification[] = [];

  for (const [key, cached] of verificationCache.entries()) {
    if (now - cached.cachedAt <= CACHE_DURATION) {
      valid.push(cached);
    } else {
      verificationCache.delete(key);
    }
  }

  return valid;
}

/**
 * Clear expired cache entries
 */
export function cleanupCache(): void {
  const now = Date.now();

  for (const [key, cached] of verificationCache.entries()) {
    if (now - cached.cachedAt > CACHE_DURATION) {
      verificationCache.delete(key);
    }
  }
}
