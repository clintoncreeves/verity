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
 * TODO: Implement comprehensive source evaluation logic
 */
async function evaluateSource(url: string) {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname.replace('www.', '');

  // TODO: Replace with actual source evaluation implementation
  // This should integrate with:
  // - Media bias databases
  // - Domain reputation services
  // - Historical fact-check data
  // - HTTPS/security checks
  // - Social media signals

  // Mock implementation
  const mockData = getMockSourceData(domain);

  return {
    url,
    domain,
    evaluatedAt: new Date().toISOString(),
    reliabilityScore: mockData.score,
    confidence: 0.8,
    factors: [
      {
        name: 'Domain Reputation',
        score: mockData.domainScore,
        weight: 0.3,
        description: 'Analysis of domain authority and historical reliability',
        details: {
          domainAge: mockData.domainAge,
          sslCertificate: mockData.hasSSL,
        },
      },
      {
        name: 'Editorial Standards',
        score: mockData.editorialScore,
        weight: 0.25,
        description: 'Adherence to journalistic standards and fact-checking practices',
        details: {
          hasCorrectionsPolicy: mockData.hasCorrections,
          transparentOwnership: mockData.transparent,
        },
      },
      {
        name: 'Bias Assessment',
        score: mockData.biasScore,
        weight: 0.2,
        description: 'Political bias and balance in reporting',
        details: {
          biasRating: mockData.biasRating,
          factualReporting: mockData.factualRating,
        },
      },
      {
        name: 'Fact-Check History',
        score: mockData.factCheckScore,
        weight: 0.25,
        description: 'Track record of accurate reporting and corrections',
        details: {
          accuracyRate: mockData.accuracyRate,
          correctionsPublished: mockData.corrections,
        },
      },
    ],
    metadata: {
      category: mockData.category,
      biasRating: mockData.biasRating,
      factualRating: mockData.factualRating,
      country: mockData.country,
    },
    warnings: mockData.warnings,
    recommendations: mockData.recommendations,
  };
}

/**
 * Get mock source data for demonstration
 * TODO: Replace with actual database/API integration
 */
function getMockSourceData(domain: string) {
  // Known reliable sources
  const reliableSources: Record<string, any> = {
    'reuters.com': {
      score: 0.95,
      domainScore: 0.98,
      editorialScore: 0.95,
      biasScore: 0.92,
      factCheckScore: 0.95,
      domainAge: '30+ years',
      hasSSL: true,
      hasCorrections: true,
      transparent: true,
      biasRating: 'Least Biased',
      factualRating: 'Very High',
      accuracyRate: 0.97,
      corrections: 'few',
      category: 'News Agency',
      country: 'UK',
      warnings: [],
      recommendations: ['Highly reliable source for factual news reporting'],
    },
    'apnews.com': {
      score: 0.94,
      domainScore: 0.96,
      editorialScore: 0.94,
      biasScore: 0.93,
      factCheckScore: 0.93,
      domainAge: '30+ years',
      hasSSL: true,
      hasCorrections: true,
      transparent: true,
      biasRating: 'Least Biased',
      factualRating: 'Very High',
      accuracyRate: 0.96,
      corrections: 'few',
      category: 'News Agency',
      country: 'USA',
      warnings: [],
      recommendations: ['Highly reliable source for factual news reporting'],
    },
    'bbc.com': {
      score: 0.91,
      domainScore: 0.95,
      editorialScore: 0.92,
      biasScore: 0.88,
      factCheckScore: 0.90,
      domainAge: '25+ years',
      hasSSL: true,
      hasCorrections: true,
      transparent: true,
      biasRating: 'Least Biased',
      factualRating: 'High',
      accuracyRate: 0.94,
      corrections: 'occasional',
      category: 'Public Broadcaster',
      country: 'UK',
      warnings: [],
      recommendations: ['Generally reliable with strong editorial standards'],
    },
  };

  // Return known source data or generate generic assessment
  if (reliableSources[domain]) {
    return reliableSources[domain];
  }

  // Generic assessment for unknown sources
  return {
    score: 0.5,
    domainScore: 0.5,
    editorialScore: 0.5,
    biasScore: 0.5,
    factCheckScore: 0.5,
    domainAge: 'Unknown',
    hasSSL: domain.startsWith('https://'),
    hasCorrections: false,
    transparent: false,
    biasRating: 'Unknown',
    factualRating: 'Unknown',
    accuracyRate: 0.5,
    corrections: 'unknown',
    category: 'Unknown',
    country: 'Unknown',
    warnings: [
      'Source not found in reliability database',
      'Limited information available for evaluation',
    ],
    recommendations: [
      'Cross-reference with known reliable sources',
      'Look for additional sources to verify claims',
    ],
  };
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
