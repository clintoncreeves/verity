/**
 * Trending headlines endpoint
 * GET /api/trending
 * Returns curated trending headlines for the suggestion banner
 */

import { NextResponse } from 'next/server';
import { getBestHeadlines } from '@/lib/services/trending-news';

export async function GET() {
  try {
    const headlines = await getBestHeadlines(6);

    if (headlines.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No trending headlines available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: headlines,
    });
  } catch (error) {
    console.error('[Verity] Trending API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending headlines' },
      { status: 500 }
    );
  }
}
