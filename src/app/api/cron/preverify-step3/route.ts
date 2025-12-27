/**
 * Step 3: Verify one headline using article content from pipeline
 * Processes one headline per call to stay under 10s timeout
 *
 * POST /api/cron/preverify-step3
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPipelineHeadlines,
  markPipelineHeadlineVerified,
  cacheVerification,
} from '@/lib/services/trending-cache';
import { verify } from '@/lib/services/verification-orchestrator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 min timeout for Pro plan

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

    // Find next headline that needs verification (has article but not verified)
    const pending = headlines.find(h => h.pipelineStage === 'article_ready');

    if (!pending) {
      // Check if there are still headlines waiting for articles
      const needsArticle = headlines.filter(h => h.pipelineStage === 'fetched').length;
      if (needsArticle > 0) {
        return NextResponse.json({
          success: true,
          step: 3,
          status: 'waiting',
          message: `${needsArticle} headlines still need article content. Run step 2 first.`,
          durationMs: Date.now() - startTime,
        });
      }

      // All headlines verified
      const verified = headlines.filter(h => h.pipelineStage === 'verified').length;
      return NextResponse.json({
        success: true,
        step: 3,
        status: 'complete',
        message: 'All headlines verified',
        verified,
        durationMs: Date.now() - startTime,
      });
    }

    console.log(`[Verity] Step 3: Verifying "${pending.title.slice(0, 50)}..."`);

    // Build verification content
    let verificationContent = pending.title;
    if (pending.articleExcerpt && pending.articleExcerpt.length > 0) {
      verificationContent = `Headline: ${pending.title}\n\nArticle excerpt:\n${pending.articleExcerpt}`;
    }

    // Run full verification with 60s timeout
    const result = await verify({
      type: 'text',
      content: verificationContent,
      options: {
        includeFactChecks: true,
        includeWebSearch: true,
      },
    });

    // Extract decomposition data
    const primaryClaim = result.claims?.[0];
    const components = primaryClaim?.components;
    const decompositionSummary = primaryClaim?.decompositionSummary;

    // Cache the final verification result
    await cacheVerification(
      {
        title: pending.title,
        url: pending.url,
        source: pending.source,
        publishedAt: pending.publishedAt,
      },
      {
        id: result.id,
        overallCategory: result.overallCategory,
        overallConfidence: result.overallConfidence,
        summary: result.summary,
        components,
        decompositionSummary,
        articleExcerpt: pending.articleExcerpt,
      }
    );

    // Mark as verified in pipeline
    await markPipelineHeadlineVerified(pending.title);

    const durationMs = Date.now() - startTime;

    // Count remaining
    const remaining = headlines.filter(h => h.pipelineStage === 'article_ready').length - 1;

    console.log(`[Verity] Step 3: Verified as ${result.overallCategory} - ${remaining} remaining (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      step: 3,
      headline: pending.title,
      category: result.overallCategory,
      confidence: result.overallConfidence,
      hasArticle: !!pending.articleExcerpt && pending.articleExcerpt.length > 0,
      remaining,
      durationMs,
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('[Verity] Step 3 failed:', {
      error: errorMessage,
      stack: errorStack,
      durationMs,
    });

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        durationMs,
        // Include truncated stack in dev for debugging
        debug: process.env.NODE_ENV !== 'production' ? errorStack?.slice(0, 500) : undefined,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
