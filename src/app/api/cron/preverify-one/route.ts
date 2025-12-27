/**
 * Process a single headline with article fetching
 * Called by the main preverify endpoint to stay within 10s timeout
 *
 * POST /api/cron/preverify-one
 * Body: { headline: TrendingHeadline }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TrendingHeadline } from '@/lib/services/trending-news';
import { cacheVerification } from '@/lib/services/trending-cache';
import { verify } from '@/lib/services/verification-orchestrator';
import { fetchArticleContent } from '@/lib/services/article-fetcher';

// Simple auth check
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60; // Request 60s timeout (requires Pro, falls back to 10s on free)

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const headline: TrendingHeadline = body.headline;

    if (!headline || !headline.title) {
      return NextResponse.json({ error: 'Missing headline' }, { status: 400 });
    }

    console.log(`[Verity] Processing: ${headline.title.slice(0, 50)}...`);
    const startTime = Date.now();

    // Step 1: Fetch article content via web search
    let articleExcerpt: string | undefined;
    try {
      const articleResult = await fetchArticleContent(
        headline.url,
        headline.title,
        headline.source,
        headline.publishedAt // Pass publication date for better search context
      );
      if (articleResult) {
        articleExcerpt = articleResult.excerpt;
        console.log(`[Verity] Found article content (${articleExcerpt.length} chars)`);
      }
    } catch (error) {
      console.error('[Verity] Article fetch failed, continuing without:', error);
    }

    // Step 2: Build verification content
    let verificationContent = headline.title;
    if (articleExcerpt) {
      verificationContent = `Headline: ${headline.title}\n\nArticle excerpt:\n${articleExcerpt}`;
    }

    // Step 3: Run verification
    const result = await verify({
      type: 'text',
      content: verificationContent,
      options: {
        includeFactChecks: true,
        includeWebSearch: true,
      },
    });

    // Step 4: Extract decomposition data
    const primaryClaim = result.claims?.[0];
    const components = primaryClaim?.components;
    const decompositionSummary = primaryClaim?.decompositionSummary;

    // Step 5: Cache the result
    await cacheVerification(headline, {
      id: result.id,
      overallCategory: result.overallCategory,
      overallConfidence: result.overallConfidence,
      summary: result.summary,
      components,
      decompositionSummary,
      articleExcerpt,
    });

    const durationMs = Date.now() - startTime;
    console.log(`[Verity] Verified "${headline.title.slice(0, 30)}..." in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      headline: headline.title,
      category: result.overallCategory,
      hasArticleContent: !!articleExcerpt,
      durationMs,
    });
  } catch (error) {
    console.error('[Verity] Single headline verification failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
