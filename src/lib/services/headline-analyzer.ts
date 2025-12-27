/**
 * Headline Analyzer for Verity
 * Uses Verity's core decomposition logic to pre-classify headlines
 * Predicts likely verdict bucket based on claim structure
 */

import { anthropicClient } from './anthropic-client';
import type { TrendingHeadline } from './trending-news';

export type VerdictPrediction = 'verified' | 'mixed' | 'false' | 'opinion';

export interface AnalyzedHeadline extends TrendingHeadline {
  prediction: VerdictPrediction;
  reasoning: string;
}

const BATCH_ANALYSIS_PROMPT = `You are Verity's headline analyzer. Your job is to predict what verdict bucket each headline will likely fall into based on its claim structure.

VERDICT BUCKETS:

1. "verified" - Headlines about concrete past events with clear facts
   - Deaths, arrests, announcements, signed agreements, election results
   - Specific numbers, dates, locations that can be verified
   - Example: "Japan's Cabinet OKs record defense budget"

2. "mixed" - Headlines with predictions, hedged claims, or partial verifiability
   - Future-oriented claims: "plans to", "expected to", "will"
   - Hedged language: "could", "may", "might", "likely"
   - Claims mixing verifiable facts with interpretation
   - Example: "Marijuana rescheduling would bring some immediate changes"

3. "false" - Headlines making disputed factual claims or known misinformation
   - Contradicted by evidence (election fraud claims, debunked health claims)
   - Exaggerated or misleading framing of real events
   - Example: "The election was stolen" (disputed factual claim)

4. "opinion" - Headlines that are primarily value judgments or editorial
   - "Best", "worst", subjective assessments
   - Questions about necessity, fairness, morality
   - Commentary and analysis pieces
   - Example: "Why X is the best/worst decision"

ANALYSIS APPROACH:
Apply Verity's core principle: separate fact from framing.
- What parts are verifiable facts? → likely "verified"
- What parts are predictions/hedged? → likely "mixed"
- What parts are value judgments? → likely "opinion"
- What claims contradict known evidence? → likely "false"

Return JSON array with your predictions. Be concise in reasoning (under 15 words).`;

/**
 * Batch analyze headlines to predict their verdict buckets
 * Uses a single API call to classify multiple headlines efficiently
 */
export async function analyzeHeadlines(
  headlines: TrendingHeadline[]
): Promise<AnalyzedHeadline[]> {
  if (headlines.length === 0) return [];

  try {
    const headlineList = headlines
      .map((h, i) => `${i + 1}. "${h.title}"`)
      .join('\n');

    const userMessage = `Analyze these headlines and predict their verdict bucket:

${headlineList}

Return a JSON array:
[
  {"index": 1, "prediction": "verified"|"mixed"|"false"|"opinion", "reasoning": "brief reason"},
  ...
]`;

    const response = await anthropicClient.sendMessageJSON<
      Array<{ index: number; prediction: string; reasoning: string }>
    >(BATCH_ANALYSIS_PROMPT, userMessage, {
      temperature: 0.2,
      maxTokens: 1024,
    });

    // Map predictions back to headlines
    const predictionMap = new Map(
      response.map(r => [r.index, { prediction: r.prediction, reasoning: r.reasoning }])
    );

    return headlines.map((headline, i) => {
      const pred = predictionMap.get(i + 1);
      const validPredictions: VerdictPrediction[] = ['verified', 'mixed', 'false', 'opinion'];

      return {
        ...headline,
        prediction: validPredictions.includes(pred?.prediction as VerdictPrediction)
          ? (pred!.prediction as VerdictPrediction)
          : 'mixed', // default to mixed if unknown
        reasoning: pred?.reasoning || '',
      };
    });
  } catch (error) {
    console.error('[Verity] Headline analysis failed:', error);
    // Return headlines with default prediction
    return headlines.map(h => ({
      ...h,
      prediction: 'mixed' as VerdictPrediction,
      reasoning: 'Analysis unavailable',
    }));
  }
}

/**
 * Select headlines with diverse predicted verdicts
 * Prioritizes showing Verity's range of capabilities
 */
export function selectDiverseByPrediction(
  analyzed: AnalyzedHeadline[],
  targetCount: number = 6
): AnalyzedHeadline[] {
  const buckets: Record<VerdictPrediction, AnalyzedHeadline[]> = {
    verified: [],
    mixed: [],
    false: [],
    opinion: [],
  };

  for (const h of analyzed) {
    buckets[h.prediction].push(h);
  }

  const selected: AnalyzedHeadline[] = [];
  const usedSources = new Set<string>();

  // Target distribution: 2 mixed, 1-2 opinion, 1 false (if available), rest verified
  const targetMixed = 2;
  const targetOpinion = 2;
  const targetFalse = 1;

  // First: mixed/nuanced (most interesting for demo)
  for (const h of buckets.mixed) {
    if (selected.length >= targetMixed) break;
    if (usedSources.has(h.source)) continue;
    selected.push(h);
    usedSources.add(h.source);
  }

  // Second: opinion (shows value judgment detection)
  for (const h of buckets.opinion) {
    if (selected.filter(s => s.prediction === 'opinion').length >= targetOpinion) break;
    if (usedSources.has(h.source)) continue;
    selected.push(h);
    usedSources.add(h.source);
  }

  // Third: false (shows debunking capability - rare but valuable)
  for (const h of buckets.false) {
    if (selected.filter(s => s.prediction === 'false').length >= targetFalse) break;
    if (usedSources.has(h.source)) continue;
    selected.push(h);
    usedSources.add(h.source);
  }

  // Fill with verified
  for (const h of buckets.verified) {
    if (selected.length >= targetCount) break;
    if (usedSources.has(h.source)) continue;
    selected.push(h);
    usedSources.add(h.source);
  }

  // Fill any remaining slots
  for (const h of analyzed) {
    if (selected.length >= targetCount) break;
    if (!selected.includes(h)) {
      selected.push(h);
    }
  }

  return selected.slice(0, targetCount);
}
