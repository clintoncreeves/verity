/**
 * Step 2: Fetch article content for one headline using Claude web search
 * Processes one headline per call to stay under 10s timeout
 *
 * POST /api/cron/preverify-step2
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchArticleContent } from '@/lib/services/article-fetcher';
import {
  getPipelineHeadlines,
  updatePipelineHeadlineWithArticle,
  type PipelineHeadline,
} from '@/lib/services/trending-cache';

export const runtime = 'nodejs';
export const maxDuration = 60; // 60s timeout for Pro plan

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get pipeline headlines
    const headlines = await getPipelineHeadlines();

    if (headlines.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No headlines in pipeline. Run step 1 first.',
        durationMs: Date.now() - startTime,
      });
    }

    // Find next headline that needs article fetching
    const pending = headlines.find(h => h.pipelineStage === 'fetched');

    if (!pending) {
      // All headlines have articles
      const ready = headlines.filter(h => h.pipelineStage === 'article_ready').length;
      const verified = headlines.filter(h => h.pipelineStage === 'verified').length;

      return NextResponse.json({
        success: true,
        step: 2,
        status: 'complete',
        message: 'All headlines have article content',
        summary: {
          total: headlines.length,
          withArticles: ready,
          verified,
        },
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`[Verity] Step 2: Fetching article for "${pending.title.slice(0, 50)}..."`);

    // Fetch article content using Claude web search
    const articleResult = await fetchArticleContent(
      pending.url,
      pending.title,
      pending.source,
      pending.publishedAt
    );

    const articleExcerpt = articleResult?.excerpt || '';

    // Update pipeline with article content (even if empty)
    await updatePipelineHeadlineWithArticle(pending.title, articleExcerpt);

    const durationMs = Date.now() - startTime;

    // Count remaining
    const remaining = headlines.filter(h => h.pipelineStage === 'fetched').length - 1;

    console.log(`[Verity] Step 2: Article fetched (${articleExcerpt.length} chars) - ${remaining} remaining (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      step: 2,
      headline: pending.title,
      hasArticle: articleExcerpt.length > 0,
      articleLength: articleExcerpt.length,
      remaining,
      durationMs,
    });
  } catch (error) {
    console.error('[Verity] Step 2 failed:', error);
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
