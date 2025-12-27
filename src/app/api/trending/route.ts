/**
 * Trending headlines endpoint
 * GET /api/trending
 * Returns curated trending headlines with cached verification results
 * Only shows headlines that have been pre-verified by the cron job
 */

import { NextResponse } from 'next/server';
import { selectDiverseHeadlines, type TrendingHeadline } from '@/lib/services/trending-news';
import { getAllCachedHeadlines } from '@/lib/services/trending-cache';
import type { ClaimComponent, DecompositionSummary } from '@/types/verity';

export interface TrendingHeadlineWithCache extends TrendingHeadline {
  cached?: {
    id: string;
    category: string;
    confidence: number;
    summary: string;
    // Decomposition data for the new UI architecture
    components?: ClaimComponent[];
    decompositionSummary?: DecompositionSummary;
  };
}

export async function GET() {
  try {
    // Get all pre-verified headlines from cache (populated by cron job)
    const cachedVerifications = await getAllCachedHeadlines();

    if (cachedVerifications.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No verified headlines available' },
        { status: 404 }
      );
    }

    // Convert cached verifications to the expected format
    const headlinesWithCache: TrendingHeadlineWithCache[] = cachedVerifications.map(cv => ({
      ...cv.headline,
      cached: {
        id: cv.verificationResult.id,
        category: cv.verificationResult.overallCategory,
        confidence: cv.verificationResult.overallConfidence,
        summary: cv.verificationResult.summary,
        components: cv.verificationResult.components,
        decompositionSummary: cv.verificationResult.decompositionSummary,
      },
    }));

    // Select diverse headlines (mix of verified/mixed/false verdicts)
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
