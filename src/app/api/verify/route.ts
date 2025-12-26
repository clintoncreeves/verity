/**
 * Main verification endpoint
 * POST /api/verify
 * Rate limit: 10 requests per minute
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/utils/rate-limiter';
import { VerificationRequestSchema, createErrorResponse } from '@/lib/schemas';
import { verify } from '@/lib/services/verification-orchestrator';
import { getCorsHeaders, getClientInfo, auditLog } from '@/lib/utils/api-helpers';

const RATE_LIMIT = 10;
const RATE_WINDOW = 60000; // 1 minute

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  const { ip, userAgent } = getClientInfo(request);

  // Check rate limit
  const { success, remaining, resetAt } = rateLimit(ip, 'verify', RATE_LIMIT, RATE_WINDOW);

  // Add rate limit and CORS headers
  const headers = new Headers({
    'X-RateLimit-Limit': RATE_LIMIT.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
    ...corsHeaders,
  });

  if (!success) {
    auditLog({
      event: 'rate_limited',
      ip,
      userAgent,
      endpoint: '/api/verify',
    });

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

    auditLog({
      event: 'verification_started',
      ip,
      userAgent,
      endpoint: '/api/verify',
      inputType: validated.type,
      inputLength: validated.content.length,
    });

    const result = await processVerification(validated);

    const durationMs = Date.now() - startTime;

    auditLog({
      event: 'verification_completed',
      ip,
      userAgent,
      endpoint: '/api/verify',
      inputType: validated.type,
      inputLength: validated.content.length,
      resultCategory: result.overallCategory,
      resultConfidence: result.overallConfidence,
      verificationId: result.id,
      durationMs,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { headers }
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      auditLog({
        event: 'validation_error',
        ip,
        userAgent,
        endpoint: '/api/verify',
        error: 'Invalid request data',
        durationMs,
      });

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
      auditLog({
        event: 'parse_error',
        ip,
        userAgent,
        endpoint: '/api/verify',
        error: 'Invalid JSON',
        durationMs,
      });

      return NextResponse.json(
        createErrorResponse('Invalid JSON in request body', 'INVALID_JSON'),
        {
          status: 400,
          headers,
        }
      );
    }

    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Verification error:', error);

    auditLog({
      event: 'verification_error',
      ip,
      userAgent,
      endpoint: '/api/verify',
      error: errorMessage,
      durationMs,
    });

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
 * Process verification request using the verification orchestrator
 */
async function processVerification(request: z.infer<typeof VerificationRequestSchema>) {
  const { type, content } = request;

  // Call the real verification orchestrator
  const result = await verify({
    type,
    content,
    options: {
      maxSources: 5,
      includeFactChecks: true,
      includeWebSearch: true,
    },
  });

  // Transform to API response format
  return {
    id: result.id,
    type: result.input.type,
    content: result.input.content,
    verifiedAt: result.timestamp,
    overallCategory: result.overallCategory,
    overallConfidence: result.overallConfidence,
    summary: result.summary,
    claims: result.claims.map(claim => ({
      id: claim.id,
      text: claim.text,
      type: claim.type,
      category: claim.category,
      confidence: claim.confidence,
      reasoning: claim.reasoning,
      components: claim.components,
      decompositionSummary: claim.decompositionSummary,
    })),
    sources: result.sources.map(source => ({
      name: source.name,
      type: source.type,
      url: source.url,
      reliability: source.reliability,
    })),
    existingFactChecks: result.existingFactChecks.map(fc => ({
      org: fc.org,
      verdict: fc.verdict,
      date: fc.date,
      url: fc.url,
    })),
    evidence: result.evidence,
  };
}

// OPTIONS handler for CORS preflight
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
