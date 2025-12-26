/**
 * API Helper Utilities for Verity
 */

/**
 * Fetch with configurable timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check if an API key is configured in environment
 */
export function isApiKeyConfigured(keyName: string): boolean {
  const value = process.env[keyName];
  return typeof value === 'string' && value.length > 0;
}

/**
 * Delay utility for rate limiting
 */
export function rateLimitDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a simple unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse and validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await rateLimitDelay(delay);
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Get allowed origins for CORS
 * In production, only allow requests from the Vercel deployment domain
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  // Always allow the Vercel deployment URL
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Allow custom production domain if configured
  if (process.env.NEXT_PUBLIC_APP_URL) {
    origins.push(process.env.NEXT_PUBLIC_APP_URL);
  }

  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }

  return origins;
}

/**
 * Check if an origin is allowed for CORS
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  const allowedOrigins = getAllowedOrigins();

  // If no origins configured (shouldn't happen), deny by default
  if (allowedOrigins.length === 0) {
    return process.env.NODE_ENV === 'development';
  }

  return allowedOrigins.some(allowed => origin.startsWith(allowed));
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

/**
 * Audit log entry interface
 */
interface AuditLogEntry {
  timestamp: string;
  event: string;
  ip: string;
  userAgent?: string;
  endpoint: string;
  inputType?: string;
  inputLength?: number;
  resultCategory?: string;
  resultConfidence?: number;
  durationMs?: number;
  error?: string;
  verificationId?: string;
}

/**
 * Log an audit event
 * In production, this could be extended to write to a logging service
 */
export function auditLog(entry: Omit<AuditLogEntry, 'timestamp'>): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Structured JSON logging for easy parsing by log aggregators
  console.log(JSON.stringify({
    level: entry.error ? 'error' : 'info',
    type: 'audit',
    ...logEntry,
  }));
}

/**
 * Extract client info from request for audit logging
 */
export function getClientInfo(request: Request): { ip: string; userAgent: string } {
  const headers = request.headers;
  const ip =
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown';
  const userAgent = headers.get('user-agent') || 'unknown';

  return { ip, userAgent };
}
