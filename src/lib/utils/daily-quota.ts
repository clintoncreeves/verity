/**
 * Daily Quota Tracker for API Limits
 * Tracks usage per day and resets at midnight UTC
 */

interface QuotaEntry {
  count: number;
  date: string; // YYYY-MM-DD in UTC
}

// In-memory store for daily quotas
const quotaStore = new Map<string, QuotaEntry>();

/**
 * Get current UTC date as YYYY-MM-DD
 */
function getUTCDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get milliseconds until midnight UTC
 */
export function getMillisUntilReset(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));
  return tomorrow.getTime() - now.getTime();
}

/**
 * Check if daily quota is available and increment if so
 * @param key - Unique identifier for the quota (e.g., 'google-search')
 * @param limit - Maximum allowed per day
 * @returns Object with success status and remaining count
 */
export function checkDailyQuota(
  key: string,
  limit: number
): { success: boolean; remaining: number; resetsAt: Date } {
  const today = getUTCDate();
  const entry = quotaStore.get(key);

  // Calculate reset time (midnight UTC tomorrow)
  const now = new Date();
  const resetsAt = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  // No entry or entry from previous day - create new
  if (!entry || entry.date !== today) {
    quotaStore.set(key, { count: 1, date: today });
    return {
      success: true,
      remaining: limit - 1,
      resetsAt,
    };
  }

  // Entry exists for today
  if (entry.count < limit) {
    entry.count++;
    return {
      success: true,
      remaining: limit - entry.count,
      resetsAt,
    };
  }

  // Quota exceeded
  return {
    success: false,
    remaining: 0,
    resetsAt,
  };
}

/**
 * Get current quota status without incrementing
 */
export function getQuotaStatus(
  key: string,
  limit: number
): { count: number; remaining: number; resetsAt: Date } {
  const today = getUTCDate();
  const entry = quotaStore.get(key);

  const now = new Date();
  const resetsAt = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  if (!entry || entry.date !== today) {
    return { count: 0, remaining: limit, resetsAt };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, limit - entry.count),
    resetsAt,
  };
}

/**
 * Reset quota for testing purposes
 */
export function resetQuota(key: string): void {
  quotaStore.delete(key);
}

/**
 * Custom error for quota exceeded
 */
export class DailyQuotaExceededError extends Error {
  public resetsAt: Date;

  constructor(message: string, resetsAt: Date) {
    super(message);
    this.name = 'DailyQuotaExceededError';
    this.resetsAt = resetsAt;
  }
}
