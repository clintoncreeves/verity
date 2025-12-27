/**
 * Application Constants for Verity
 * Centralized configuration to avoid magic numbers
 */

// Verification pipeline settings
export const VERIFICATION_CONFIG = {
  MAX_SOURCES: 10,
  INPUT_TRUNCATE_LENGTH: 500,
  MIN_FACT_CHECKS_FOR_CONFIRMED: 2,
  DEFAULT_CONFIDENCE: 50,
} as const;

// Rate limiting
export const RATE_LIMIT_CONFIG = {
  VERIFY_LIMIT: 10,
  VERIFY_WINDOW_MS: 60000, // 1 minute
  IMAGE_LIMIT: 5,
  IMAGE_WINDOW_MS: 60000,
} as const;

// Claude API settings
export const CLAUDE_CONFIG = {
  EXTRACTION: { temperature: 0.2, maxTokens: 2048 },
  CLASSIFICATION: { temperature: 0.3, maxTokens: 1024 },
  DECOMPOSITION: { temperature: 0.2, maxTokens: 1024 },
  // Lower temperature for value judgment detection (more consistent)
  CLASSIFICATION_SENSITIVE: { temperature: 0.15, maxTokens: 1024 },
} as const;

// Source reliability thresholds
export const RELIABILITY_CONFIG = {
  HIGH: 80,    // Green - highly reliable
  MEDIUM: 60,  // Blue - moderately reliable
  LOW: 40,     // Amber - questionable
  // Below LOW is slate/gray - unreliable
} as const;

// API timeouts
export const TIMEOUT_CONFIG = {
  WEB_SEARCH_MS: 10000,
  FACT_CHECK_MS: 10000,
  OVERALL_VERIFICATION_MS: 30000,
} as const;

// Daily quota limits (free tier)
export const DAILY_QUOTA_CONFIG = {
  GOOGLE_SEARCH_LIMIT: 100, // Free tier limit
} as const;

// Short text handling
export const TEXT_CONFIG = {
  MIN_LENGTH_FOR_EXTRACTION: 20,  // Below this, treat as single claim
  MAX_CHAR_LIMIT: 2000,
} as const;
