/**
 * Trending headlines endpoint
 * GET /api/trending
 * Returns curated trending headlines with cached verification results
 */

import { NextResponse } from 'next/server';
import { getBestHeadlines, selectDiverseHeadlines, type TrendingHeadline } from '@/lib/services/trending-news';
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
    const headlinesWithCache: TrendingHeadlineWithCache[] = await Promise.all(
      headlines.map(async (headline) => {
        const cached = await getCachedVerification(headline.title);
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
      })
    );

    // Reorder to prioritize verdict diversity (show mix of verified/mixed/false)
    const diverseHeadlines = selectDiverseHeadlines(headlinesWithCache, 6);

    return NextResponse.json({
      success: true,
      data: diverseHeadlines,
    });
  } catch (error) {
    console.error('[Verity] Trending API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending headlines' },
      { status: 500 }
    );
  }
}
