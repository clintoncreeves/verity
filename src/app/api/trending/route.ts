/**
 * Trending headlines endpoint
 * GET /api/trending
 * Returns curated trending headlines with cached verification results
 */

import { NextResponse } from 'next/server';
import { getBestHeadlines, type TrendingHeadline } from '@/lib/services/trending-news';
import { getCachedVerification } from '@/lib/services/trending-cache';

export interface TrendingHeadlineWithCache extends TrendingHeadline {
  cached?: {
    id: string;
    category: string;
    confidence: number;
    summary: string;
  };
}

export async function GET() {
  try {
    const headlines = await getBestHeadlines(6);

    if (headlines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No trending headlines available' },
        { status: 404 }
      );
    }

    // Attach cached verification results if available
    const headlinesWithCache: TrendingHeadlineWithCache[] = headlines.map(headline => {
      const cached = getCachedVerification(headline.title);
      if (cached) {
        return {
          ...headline,
          cached: {
            id: cached.verificationResult.id,
            category: cached.verificationResult.overallCategory,
            confidence: cached.verificationResult.overallConfidence,
            summary: cached.verificationResult.summary,
          },
        };
      }
      return headline;
    });

    return NextResponse.json({
      success: true,
      data: headlinesWithCache,
    });
  } catch (error) {
    console.error('[Verity] Trending API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending headlines' },
      { status: 500 }
    );
  }
}
