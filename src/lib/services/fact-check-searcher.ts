/**
 * Fact Check Searcher for Verity
 * Queries the Google Fact Check Tools API for existing fact-checks
 */

import { fetchWithTimeout } from '@/lib/utils/api-helpers';
import type { ExistingFactCheck } from '@/types/verity';

const FACT_CHECK_API_ENDPOINT = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

interface ClaimReviewResponse {
  claims?: Array<{
    text?: string;
    claimant?: string;
    claimDate?: string;
    claimReview?: Array<{
      publisher?: { name?: string; site?: string };
      url?: string;
      title?: string;
      reviewDate?: string;
      textualRating?: string;
      languageCode?: string;
    }>;
  }>;
}

/**
 * Search for existing fact-checks of a claim
 */
export async function searchFactChecks(claim: string): Promise<ExistingFactCheck[]> {
  const apiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;

  if (!apiKey) {
    throw new Error('Google Fact Check API is not configured. Please add GOOGLE_FACT_CHECK_API_KEY to your environment variables.');
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      query: claim,
      languageCode: 'en',
    });

    const response = await fetchWithTimeout(
      `${FACT_CHECK_API_ENDPOINT}?${params}`,
      { method: 'GET' },
      10000
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fact Check API error: ${response.status} - ${error}`);
    }

    const data: ClaimReviewResponse = await response.json();

    if (!data.claims || data.claims.length === 0) {
      return [];
    }

    // Flatten all claim reviews from all claims
    const factChecks: ExistingFactCheck[] = [];

    for (const claim of data.claims) {
      if (!claim.claimReview) continue;

      for (const review of claim.claimReview) {
        factChecks.push({
          org: review.publisher?.name || 'Unknown',
          verdict: review.textualRating || 'Unrated',
          date: review.reviewDate?.split('T')[0] || 'Unknown',
          url: review.url,
        });
      }
    }

    // Deduplicate by organization
    const seen = new Set<string>();
    return factChecks.filter(fc => {
      const key = `${fc.org}-${fc.verdict}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  } catch (error) {
    console.error('[Verity] Fact Check search failed:', error);
    return [];
  }
}

/**
 * Check if a specific claim has been fact-checked by major organizations
 */
export async function hasBeenFactChecked(claim: string): Promise<boolean> {
  const factChecks = await searchFactChecks(claim);
  return factChecks.length > 0;
}

/**
 * Get fact-check summary for a claim
 */
export async function getFactCheckSummary(claim: string): Promise<{
  checked: boolean;
  consensus?: string;
  organizations: string[];
}> {
  const factChecks = await searchFactChecks(claim);

  if (factChecks.length === 0) {
    return { checked: false, organizations: [] };
  }

  // Analyze verdicts to find consensus
  const verdicts = factChecks.map(fc => fc.verdict.toLowerCase());
  const falseCount = verdicts.filter(v =>
    v.includes('false') || v.includes('pants on fire') || v.includes('incorrect')
  ).length;
  const trueCount = verdicts.filter(v =>
    v.includes('true') || v.includes('correct') || v.includes('accurate')
  ).length;
  const mixedCount = verdicts.filter(v =>
    v.includes('mixed') || v.includes('partial') || v.includes('mostly')
  ).length;

  let consensus: string | undefined;
  if (falseCount > trueCount && falseCount > mixedCount) {
    consensus = 'false';
  } else if (trueCount > falseCount && trueCount > mixedCount) {
    consensus = 'true';
  } else if (mixedCount > 0) {
    consensus = 'mixed';
  }

  return {
    checked: true,
    consensus,
    organizations: factChecks.map(fc => fc.org),
  };
}

