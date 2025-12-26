/**
 * Fact-check search endpoint
 * GET /api/factchecks?claim=...
 * Queries Google Fact Check API for existing fact-checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FactCheckQuerySchema, createErrorResponse } from '@/lib/schemas';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      claim: searchParams.get('claim'),
      languageCode: searchParams.get('languageCode') || 'en',
      pageSize: searchParams.get('pageSize') || '10',
      pageToken: searchParams.get('pageToken') || undefined,
    };

    // Validate query parameters
    const validated = FactCheckQuerySchema.parse(queryParams);

    // Check for API key
    const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
    if (!apiKey) {
      console.warn('Google Fact Check API key not configured');
      return NextResponse.json(
        createErrorResponse(
          'Fact-check service not configured',
          'SERVICE_UNAVAILABLE'
        ),
        { status: 503 }
      );
    }

    // Query Google Fact Check API
    const results = await searchFactChecks(validated, apiKey);

    return NextResponse.json({
      success: true,
      data: results,
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
    console.error('Fact-check search error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        createErrorResponse(
          error.message || 'An unexpected error occurred during fact-check search',
          'INTERNAL_ERROR'
        ),
        { status: 500 }
      );
    }

    return NextResponse.json(
      createErrorResponse('An unexpected error occurred during fact-check search', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * Search Google Fact Check API
 */
async function searchFactChecks(
  query: z.infer<typeof FactCheckQuerySchema>,
  apiKey: string
) {
  const { claim, languageCode, pageSize, pageToken } = query;

  // Build API URL
  const params = new URLSearchParams({
    query: claim,
    languageCode,
    pageSize: pageSize.toString(),
    key: apiKey,
  });

  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  const url = `https://factchecktools.googleapis.com/v1alpha1/claims:search?${params.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    // Transform response to consistent format
    const factChecks = (data.claims || []).map((claim: any) => ({
      id: claim.claimReview?.[0]?.url || crypto.randomUUID(),
      claim: claim.text,
      claimant: claim.claimant,
      claimDate: claim.claimDate,
      reviews: (claim.claimReview || []).map((review: any) => ({
        publisher: {
          name: review.publisher?.name,
          site: review.publisher?.site,
        },
        url: review.url,
        title: review.title,
        reviewDate: review.reviewDate,
        textualRating: review.textualRating,
        languageCode: review.languageCode,
      })),
    }));

    return {
      factChecks,
      nextPageToken: data.nextPageToken,
      totalResults: factChecks.length,
    };
  } catch (error) {
    console.error('Google Fact Check API error:', error);
    throw error;
  }
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
