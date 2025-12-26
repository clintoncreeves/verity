/**
 * In-memory rate limiter for API endpoints
 * Tracks requests by IP address with configurable limits
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  limit: number;
  window: number; // in milliseconds
}

// Store rate limit data in memory
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Periodically clean up expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetAt < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Rate limit checker
 * @param identifier - Unique identifier (typically IP address)
 * @param endpoint - Endpoint name for namespacing
 * @param limit - Maximum requests allowed
 * @param window - Time window in milliseconds (default: 60000ms = 1 minute)
 * @returns Object with success status and remaining requests
 */
export function rateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  window: number = 60000
): { success: boolean; remaining: number; resetAt: number } {
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  const resetAt = now + window;

  const entry = rateLimitStore.get(key);

  // No existing entry or expired entry
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetAt,
    };
  }

  // Entry exists and is still valid
  if (entry.count < limit) {
    entry.count++;
    return {
      success: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // Rate limit exceeded
  return {
    success: false,
    remaining: 0,
    resetAt: entry.resetAt,
  };
}

/**
 * Reset rate limit for a specific identifier and endpoint
 * Useful for testing or manual resets
 */
export function resetRateLimit(identifier: string, endpoint: string): void {
  const key = `${endpoint}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limit data
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  endpoint: string,
  limit: number
): { count: number; remaining: number; resetAt: number | null } {
  const key = `${endpoint}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    return {
      count: 0,
      remaining: limit,
      resetAt: null,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}
