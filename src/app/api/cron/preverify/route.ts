/**
 * Cron job to pre-verify trending headlines
 * Run daily to cache verification results for trending topics
 *
 * Trigger: Vercel Cron or manual call with auth
 * POST /api/cron/preverify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBestHeadlines, type TrendingHeadline } from '@/lib/services/trending-news';
import { cacheVerification, getCachedVerification, cleanupOldCache, clearAllCache } from '@/lib/services/trending-cache';
import { verify } from '@/lib/services/verification-orchestrator';

// Simple auth check - require a secret token for cron jobs
const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[Verity] Starting daily pre-verification batch job');
  const startTime = Date.now();

  try {
    // Check if force clear is requested via query param
    const url = new URL(request.url);
    const forceClear = url.searchParams.get('clear') === 'true';

    let cleanupResult: { deleted: number; kept?: number };
    if (forceClear) {
      console.log('[Verity] Force clearing all cache entries');
      cleanupResult = await clearAllCache();
      console.log(`[Verity] Force cleared ${cleanupResult.deleted} cache entries`);
    } else {
      // Clean up old cache entries (older than 2 days) before adding new ones
      cleanupResult = await cleanupOldCache();
      console.log(`[Verity] Cache cleanup: ${cleanupResult.deleted} old entries deleted, ${(cleanupResult as { kept: number }).kept} entries kept`);
    }

    // Fetch more headlines (12-15) to increase chances of diverse verdicts
    // We'll display 6, but verify more to ensure variety in cached results
    const headlines = await getBestHeadlines(15);
    console.log(`[Verity] Found ${headlines.length} headlines to verify`);

    const results: Array<{
      headline: string;
      status: 'verified' | 'cached' | 'failed';
      category?: string;
      error?: string;
    }> = [];

    // Process each headline
    for (const headline of headlines) {
      // Skip if already cached
      const cached = await getCachedVerification(headline.title);
      if (cached) {
        console.log(`[Verity] Skipping (cached): ${headline.title.slice(0, 50)}...`);
        results.push({
          headline: headline.title,
          status: 'cached',
          category: cached.verificationResult.overallCategory,
        });
        continue;
      }

      try {
        console.log(`[Verity] Verifying: ${headline.title.slice(0, 50)}...`);

        // Run verification
        const result = await verify({
          type: 'text',
          content: headline.title,
          options: {
            includeFactChecks: true,
            includeWebSearch: true,
          },
        });

        // Extract decomposition data from primary claim
        const primaryClaim = result.claims?.[0];
        const components = primaryClaim?.components;
        const decompositionSummary = primaryClaim?.decompositionSummary;

        // Cache the result with decomposition data
        await cacheVerification(headline, {
          id: result.id,
          overallCategory: result.overallCategory,
          overallConfidence: result.overallConfidence,
          summary: result.summary,
          components,
          decompositionSummary,
        });

        results.push({
          headline: headline.title,
          status: 'verified',
          category: result.overallCategory,
        });

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[Verity] Failed to verify: ${headline.title}`, error);
        results.push({
          headline: headline.title,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // If we hit quota, stop processing
        if (error instanceof Error && error.message.includes('quota')) {
          console.log('[Verity] Quota exceeded, stopping batch job');
          break;
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const verified = results.filter(r => r.status === 'verified').length;
    const cached = results.filter(r => r.status === 'cached').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`[Verity] Pre-verification complete: ${verified} verified, ${cached} cached, ${failed} failed (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      summary: {
        total: headlines.length,
        verified,
        cached,
        failed,
        durationMs,
        cleanup: cleanupResult,
      },
      results,
    });
  } catch (error) {
    console.error('[Verity] Pre-verification batch job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support GET for Vercel Cron (which uses GET by default)
export async function GET(request: NextRequest) {
  return POST(request);
}
