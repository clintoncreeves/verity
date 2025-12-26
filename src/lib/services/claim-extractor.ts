/**
 * Claim Extractor for Verity
 * Uses Claude Haiku 4.5 to extract verifiable claims from text
 */

import { anthropicClient } from './anthropic-client';
import { generateId } from '@/lib/utils/api-helpers';

export interface ExtractedClaim {
  id: string;
  text: string;
  type: 'factual' | 'opinion' | 'prediction';
  confidence: number;
  context?: string;
}

const EXTRACTION_SYSTEM_PROMPT = `You are an expert fact-checker with deep expertise in identifying verifiable claims. Your role is to extract distinct, verifiable claims from text.

PRINCIPLES (embody epistemic humility):
- Not all statements are claims - filter out greetings, questions, and pure rhetoric
- A claim is a statement that can potentially be verified against evidence
- Distinguish carefully between facts, opinions, and predictions
- Preserve important context that affects meaning
- Break compound statements into atomic claims when they contain multiple verifiable elements

CLAIM TYPES:
1. FACTUAL: Statements about the world that can be verified with evidence
   Examples: "GDP grew 3% in 2023", "The capital of France is Paris"

2. OPINION: Value judgments, preferences, or interpretations that cannot be objectively verified
   Examples: "This is the best restaurant", "The policy is unfair"

3. PREDICTION: Future-oriented statements that cannot yet be verified
   Examples: "Inflation will decrease next year", "The team will win"

OUTPUT: Return a JSON array. Each claim should have:
- text: The exact claim, minimally edited for clarity
- type: "factual" | "opinion" | "prediction"
- confidence: 0.0-1.0 (how confident you are in your extraction and classification)
- context: Brief context if needed for understanding (optional)

IMPORTANT:
- Only extract substantive claims worth verifying
- Ignore trivial or self-evident statements
- If text contains no verifiable claims, return an empty array []
- Keep claims concise but complete`;

const EXTRACTION_USER_PROMPT = `Extract all distinct, verifiable claims from this text. Return a JSON array.

TEXT:
"""
{TEXT}
"""

Respond with only valid JSON, no explanation.`;

/**
 * Extract verifiable claims from text
 */
export async function extractClaims(text: string): Promise<ExtractedClaim[]> {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // For very short text, treat the whole thing as a single claim
  if (text.trim().length < 50) {
    return [{
      id: generateId(),
      text: text.trim(),
      type: 'factual',
      confidence: 0.8,
    }];
  }

  try {
    const userMessage = EXTRACTION_USER_PROMPT.replace('{TEXT}', text);

    const response = await anthropicClient.sendMessageJSON<
      Array<Omit<ExtractedClaim, 'id'>>
    >(
      EXTRACTION_SYSTEM_PROMPT,
      userMessage,
      { temperature: 0.2, maxTokens: 2048 }
    );

    // Validate and add IDs
    if (!Array.isArray(response)) {
      throw new Error('Response is not an array');
    }

    return response.map(claim => ({
      id: generateId(),
      text: claim.text || '',
      type: claim.type || 'factual',
      confidence: Math.max(0, Math.min(1, claim.confidence || 0.5)),
      context: claim.context,
    })).filter(claim => claim.text.length > 0);

  } catch (error) {
    console.error('[Verity] Claim extraction failed:', error);

    // Fallback: treat entire text as single claim
    return [{
      id: generateId(),
      text: text.trim().substring(0, 500),
      type: 'factual',
      confidence: 0.5,
      context: 'Automatic extraction failed - treating as single claim',
    }];
  }
}

/**
 * Extract claims from a URL's content
 */
export async function extractClaimsFromUrl(content: string, url: string): Promise<ExtractedClaim[]> {
  const claims = await extractClaims(content);

  // Add URL context to each claim
  return claims.map(claim => ({
    ...claim,
    context: claim.context ? `${claim.context} (from ${url})` : `Source: ${url}`,
  }));
}
