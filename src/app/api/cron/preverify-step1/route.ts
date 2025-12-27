/**
 * Step 1: Fetch trending headlines from Google News
 * Stores headlines in Redis pipeline for subsequent steps
 *
 * POST /api/cron/preverify-step1
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBestHeadlines } from '@/lib/services/trending-news';
import {
  storePipelineHeadlines,
  clearPipeline,
  cleanupOldCache,
  clearAllCache
} from '@/lib/services/trending-cache';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if force clear is requested via query param
    const url = new URL(request.url);
    const forceClear = url.searchParams.get('clear') === 'true';

    // Clean up old cache entries
    let cleanupResult: { deleted: number; kept?: number };
    if (forceClear) {
      console.log('[Verity] Step 1: Force clearing all cache entries');
      cleanupResult = await clearAllCache();
    } else {
      cleanupResult = await cleanupOldCache();
    }

    // Clear any existing pipeline data
    await clearPipeline();

    // Fetch headlines from Google News
    console.log('[Verity] Step 1: Fetching headlines from Google News...');
    const headlines = await getBestHeadlines(6);

    if (headlines.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No headlines found',
        durationMs: Date.now() - startTime,
      });
    }

    // Store in Redis pipeline
    await storePipelineHeadlines(headlines);

    const durationMs = Date.now() - startTime;
    console.log(`[Verity] Step 1: Complete - ${headlines.length} headlines stored (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      step: 1,
      headlines: headlines.map(h => ({
        title: h.title,
        source: h.source,
      })),
      count: headlines.length,
      cleanup: cleanupResult,
      durationMs,
    });
  } catch (error) {
    console.error('[Verity] Step 1 failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
