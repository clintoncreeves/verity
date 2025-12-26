/**
 * Type-safe API client for Verity endpoints
 * Use these functions to call API routes from the frontend
 */

import { VerificationRequest } from './schemas';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * API Error class for better error handling
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(
      data.error || 'An error occurred',
      data.code || 'UNKNOWN_ERROR',
      response.status,
      data.details
    );
  }

  return data.data || data;
}

/**
 * Main verification endpoint
 * POST /api/verify
 */
export async function verifyContent(request: VerificationRequest) {
  const response = await fetch(`${API_BASE_URL}/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return handleResponse(response);
}

/**
 * Image verification endpoint
 * POST /api/verify/image
 */
export async function verifyImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/verify/image`, {
    method: 'POST',
    body: formData,
  });

  return handleResponse(response);
}

/**
 * Fact-check search endpoint
 * GET /api/factchecks
 */
export async function searchFactChecks(params: {
  claim: string;
  languageCode?: string;
  pageSize?: number;
  pageToken?: string;
}) {
  const queryParams = new URLSearchParams();
  queryParams.append('claim', params.claim);

  if (params.languageCode) {
    queryParams.append('languageCode', params.languageCode);
  }
  if (params.pageSize) {
    queryParams.append('pageSize', params.pageSize.toString());
  }
  if (params.pageToken) {
    queryParams.append('pageToken', params.pageToken);
  }

  const response = await fetch(`${API_BASE_URL}/factchecks?${queryParams.toString()}`);

  return handleResponse(response);
}

/**
 * Source evaluation endpoint
 * GET /api/sources/evaluate
 */
export async function evaluateSource(url: string) {
  const queryParams = new URLSearchParams({ url });

  const response = await fetch(`${API_BASE_URL}/sources/evaluate?${queryParams.toString()}`);

  return handleResponse(response);
}

/**
 * Check rate limit status from headers
 */
export function getRateLimitInfo(response: Response) {
  return {
    limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
    remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
    reset: response.headers.get('X-RateLimit-Reset'),
  };
}

/**
 * Example usage:
 *
 * // Verify text
 * try {
 *   const result = await verifyContent({
 *     type: 'text',
 *     content: 'The Earth is flat'
 *   });
 *   console.log(result);
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     if (error.code === 'RATE_LIMITED') {
 *       console.log('Too many requests, try again later');
 *     } else {
 *       console.log('Validation error:', error.details);
 *     }
 *   }
 * }
 *
 * // Verify image
 * const file = document.querySelector('input[type="file"]').files[0];
 * const result = await verifyImage(file);
 *
 * // Search fact-checks
 * const factChecks = await searchFactChecks({
 *   claim: 'vaccines cause autism',
 *   pageSize: 10
 * });
 *
 * // Evaluate source
 * const sourceEval = await evaluateSource('https://reuters.com');
 */
