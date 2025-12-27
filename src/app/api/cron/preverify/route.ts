/**
 * Cron job to pre-verify trending headlines
 * Run daily to cache verification results for trending topics
 *
 * Trigger: Vercel Cron or manual call with auth
 * POST /api/cron/preverify
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBestHeadlines, type TrendingHeadline } from '@/lib/services/trending-news';
import { cacheVerification, getCachedVerification } from '@/lib/services/trending-cache';
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
    // Fetch best headlines (5-8 based on scoring)
    const headlines = await getBestHeadlines(8);
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
      const cached = getCachedVerification(headline.title);
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

        // Cache the result
        cacheVerification(headline, {
          id: result.id,
          overallCategory: result.overallCategory,
          overallConfidence: result.overallConfidence,
          summary: result.summary,
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
