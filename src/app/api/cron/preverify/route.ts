/**
 * Cron job to pre-verify trending headlines
 * Run daily to cache verification results for trending topics
 *
 * Architecture: This endpoint chains calls to /api/cron/preverify-one
 * Each headline is processed in a separate request to stay within
 * Vercel's 10s timeout limit on the free tier.
 *
 * Trigger: Vercel Cron or manual call with auth
 * POST /api/cron/preverify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBestHeadlines, type TrendingHeadline } from '@/lib/services/trending-news';
import { getCachedVerification, cleanupOldCache, clearAllCache } from '@/lib/services/trending-cache';

// Simple auth check - require a secret token for cron jobs
const CRON_SECRET = process.env.CRON_SECRET;

// Get the base URL for internal API calls
function getBaseUrl(request: NextRequest): string {
  // Use the request's origin for internal calls
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

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

    // Fetch headlines - reduced to 6 to avoid timeout
    // Article search + verification takes ~15-20s per headline
    const headlines = await getBestHeadlines(6);
    console.log(`[Verity] Found ${headlines.length} headlines to verify`);

    // Filter out already cached headlines before fetching articles
    const headlinesToProcess: TrendingHeadline[] = [];
    const cachedResults: Array<{
      headline: string;
      status: 'cached';
      category: string;
    }> = [];

    for (const headline of headlines) {
      const cached = await getCachedVerification(headline.title);
      if (cached) {
        console.log(`[Verity] Skipping (cached): ${headline.title.slice(0, 50)}...`);
        cachedResults.push({
          headline: headline.title,
          status: 'cached',
          category: cached.verificationResult.overallCategory,
        });
      } else {
        headlinesToProcess.push(headline);
      }
    }

    const results: Array<{
      headline: string;
      status: 'verified' | 'cached' | 'dispatched' | 'failed';
      category?: string;
      error?: string;
      hasArticleContent?: boolean;
    }> = [...cachedResults];

    // Dispatch each headline to preverify-one endpoint (fire-and-forget)
    // We can't wait for responses on free tier due to 10s timeout
    // Each preverify-one call will cache its own result
    const baseUrl = getBaseUrl(request);

    for (const headline of headlinesToProcess) {
      try {
        console.log(`[Verity] Dispatching: ${headline.title.slice(0, 50)}...`);

        // Fire-and-forget: dispatch without awaiting the response
        // The preverify-one endpoint will cache the result when done
        fetch(`${baseUrl}/api/cron/preverify-one`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : {}),
          },
          body: JSON.stringify({ headline }),
        }).catch(err => {
          // Log but don't throw - this is fire-and-forget
          console.error(`[Verity] Background dispatch failed for: ${headline.title.slice(0, 30)}...`, err);
        });

        results.push({
          headline: headline.title,
          status: 'dispatched',
        });
      } catch (error) {
        console.error(`[Verity] Failed to dispatch: ${headline.title}`, error);
        results.push({
          headline: headline.title,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const dispatched = results.filter(r => r.status === 'dispatched').length;
    const cached = results.filter(r => r.status === 'cached').length;
    const failed = results.filter(r => r.status === 'failed').length;

    console.log(`[Verity] Pre-verification dispatched: ${dispatched} dispatched, ${cached} cached, ${failed} failed (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      summary: {
        total: headlines.length,
        dispatched,
        cached,
        failed,
        durationMs,
        cleanup: cleanupResult,
      },
      results,
      note: dispatched > 0
        ? 'Headlines dispatched for background processing. Results will be cached when complete.'
        : undefined,
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
