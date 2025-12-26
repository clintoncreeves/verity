/**
 * Main verification endpoint
 * POST /api/verify
 * Rate limit: 10 requests per minute
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { VerificationRequestSchema, createErrorResponse } from '@/lib/schemas';

const RATE_LIMIT = 10;
const RATE_WINDOW = 60000; // 1 minute

export async function POST(request: NextRequest) {
  // Extract IP address for rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Check rate limit
  const { success, remaining, resetAt } = rateLimit(ip, 'verify', RATE_LIMIT, RATE_WINDOW);

  // Add rate limit headers
  const headers = new Headers({
    'X-RateLimit-Limit': RATE_LIMIT.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
  });

  if (!success) {
    return NextResponse.json(
      createErrorResponse('Rate limit exceeded. Please try again later.', 'RATE_LIMITED'),
      {
        status: 429,
        headers,
      }
    );
  }

  try {
    // Parse and validate request body
    const body = await request.json();
    const validated = VerificationRequestSchema.parse(body);

    // TODO: Implement verification orchestrator
    // For now, return a mock response structure
    const result = await processVerification(validated);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { headers }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Invalid request data', 'VALIDATION_ERROR', error.issues),
        {
          status: 400,
          headers,
        }
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        createErrorResponse('Invalid JSON in request body', 'INVALID_JSON'),
        {
          status: 400,
          headers,
        }
      );
    }

    // Handle unexpected errors
    console.error('Verification error:', error);
    return NextResponse.json(
      createErrorResponse(
        'An unexpected error occurred during verification',
        'INTERNAL_ERROR'
      ),
      {
        status: 500,
        headers,
      }
    );
  }
}

/**
 * Process verification request
 * TODO: Replace with actual verification orchestrator
 */
async function processVerification(request: z.infer<typeof VerificationRequestSchema>) {
  const { type, content } = request;

  // Mock implementation - replace with actual verification logic
  return {
    id: crypto.randomUUID(),
    type,
    content,
    verifiedAt: new Date().toISOString(),
    overallScore: 0.75,
    verdict: 'PARTIALLY_TRUE' as const,
    confidence: 0.8,
    summary: 'This is a placeholder verification result. Integration with verification orchestrator pending.',
    factors: [
      {
        name: 'Source Credibility',
        score: 0.7,
        weight: 0.3,
        description: 'Analysis of source reliability',
      },
      {
        name: 'Fact Check Match',
        score: 0.8,
        weight: 0.4,
        description: 'Comparison with existing fact-checks',
      },
      {
        name: 'Content Analysis',
        score: 0.75,
        weight: 0.3,
        description: 'AI-based content analysis',
      },
    ],
    sources: [],
    relatedFactChecks: [],
  };
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
