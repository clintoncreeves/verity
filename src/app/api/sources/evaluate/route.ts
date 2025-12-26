/**
 * Source reliability evaluation endpoint
 * GET /api/sources/evaluate?url=...
 * Evaluates the reliability of a news source
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SourceEvaluateSchema, createErrorResponse } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      url: searchParams.get('url'),
    };

    // Validate query parameters
    const validated = SourceEvaluateSchema.parse(queryParams);

    // Evaluate source reliability
    const result = await evaluateSource(validated.url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        createErrorResponse('Invalid query parameters', 'VALIDATION_ERROR', error.issues),
        { status: 400 }
      );
    }

    // Handle unexpected errors
    console.error('Source evaluation error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        createErrorResponse(
          error.message || 'An unexpected error occurred during source evaluation',
          'INTERNAL_ERROR'
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createErrorResponse('An unexpected error occurred during source evaluation', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * Evaluate source reliability
 * Requires integration with media bias databases and domain reputation services
 */
async function evaluateSource(url: string) {
  // This endpoint requires external API integration
  // to provide real source reliability data
  throw new Error(
    'Source evaluation API not configured. This feature requires integration with media bias databases and domain reputation services.'
  );
}

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
