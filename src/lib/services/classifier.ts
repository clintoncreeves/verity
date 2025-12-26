/**
 * Claim Classifier for Verity
 * Uses Claude Haiku 4.5 to classify claims into 8 verification categories
 */

import { anthropicClient } from './anthropic-client';
import type { VerificationCategory, Source, ExistingFactCheck } from '@/types/verity';

export interface ClassificationResult {
  category: VerificationCategory;
  confidence: number;
  reasoning: string;
}

const CLASSIFICATION_SYSTEM_PROMPT = `You are an expert fact-checker committed to epistemic humility and nuanced analysis. Your task is to classify claims into verification categories based on available evidence.

THE 8 VERIFICATION CATEGORIES:

1. verified_fact
   - Multiple authoritative sources independently confirm the claim
   - Evidence is direct, unambiguous, and from primary sources
   - No credible contradicting evidence exists
   - Use sparingly - requires very strong evidence

2. expert_consensus
   - Domain experts broadly agree on this claim
   - Supported by peer-reviewed research or official positions
   - Some minority disagreement may exist but is not mainstream
   - Distinguished from verified_fact by relying on expert judgment

3. partially_verified
   - Some elements of the claim are verified, others are not
   - Core claim may be true but with important caveats
   - Evidence supports the general direction but not all specifics
   - Common for complex, multi-part claims

4. opinion
   - Subjective value judgment or preference
   - Cannot be verified as true or false with evidence
   - May be based on facts but expresses interpretation
   - Not a failure of verification - just a different type of statement

5. speculation
   - Prediction about the future or hypothesis
   - Cannot be verified with current evidence
   - May be reasonable or unreasonable speculation
   - Distinguished from opinion by being future-oriented

6. disputed
   - Credible sources genuinely disagree
   - Active debate among experts or authorities
   - Evidence exists on multiple sides
   - Not the same as "we couldn't find info" - requires active disagreement

7. likely_false
   - Available evidence substantially contradicts the claim
   - Reputable sources dispute it
   - May contain elements of truth but is fundamentally misleading
   - Some uncertainty remains - not definitively disproven

8. confirmed_false
   - Has been definitively debunked by fact-checking organizations
   - Overwhelming evidence contradicts the claim
   - No credible supporting evidence exists
   - Use only when multiple fact-checkers have rated as false

PRINCIPLES:
- Default to humility: "partially_verified" or "disputed" are often more honest than extremes
- Consider source quality, not just quantity
- Existing fact-checks from reputable organizations carry significant weight
- Acknowledge limitations in your reasoning
- If evidence is insufficient, lean toward "partially_verified" rather than guessing

CRITICAL - HANDLING MIXED CLAIMS:
- Many claims combine verifiable facts with value judgments or interpretations
- Example: "The air strikes happened to protect Christians" - the strikes may be verifiable, but the PURPOSE/NECESSITY is an interpretation
- Words like "necessary", "needed", "justified", "because", "in order to" often signal value judgments embedded in factual claims
- For such mixed claims, use "partially_verified" or "opinion" - NEVER "verified_fact"
- "verified_fact" is ONLY for purely factual claims where every element can be independently verified
- When in doubt about intent, motivation, or necessity, classify as "opinion" or "partially_verified"

OUTPUT: Return JSON with:
- category: one of the 8 categories above
- confidence: 0.0-1.0 (your confidence in this classification)
- reasoning: 2-4 sentences explaining your classification, citing specific evidence`;

const CLASSIFICATION_USER_PROMPT = `Classify this claim based on the available evidence.

CLAIM:
"{CLAIM}"

{SOURCES_SECTION}

{FACTCHECKS_SECTION}

Respond with only valid JSON, no explanation outside the JSON.`;

/**
 * Classify a claim into one of 8 verification categories
 */
export async function classifyClaim(
  claim: string,
  sources: Source[] = [],
  existingFactChecks: ExistingFactCheck[] = []
): Promise<ClassificationResult> {
  try {
    // Build sources section
    let sourcesSection = 'SOURCES: None available';
    if (sources.length > 0) {
      const sourcesList = sources.map((s, i) =>
        `${i + 1}. ${s.name} (${s.type}, reliability: ${s.reliability}/100)\n   URL: ${s.url}`
      ).join('\n');
      sourcesSection = `SOURCES:\n${sourcesList}`;
    }

    // Build fact-checks section
    let factChecksSection = 'EXISTING FACT-CHECKS: None found';
    if (existingFactChecks.length > 0) {
      const checksList = existingFactChecks.map((fc, i) =>
        `${i + 1}. ${fc.org}: "${fc.verdict}" (${fc.date})`
      ).join('\n');
      factChecksSection = `EXISTING FACT-CHECKS:\n${checksList}`;
    }

    const userMessage = CLASSIFICATION_USER_PROMPT
      .replace('{CLAIM}', claim)
      .replace('{SOURCES_SECTION}', sourcesSection)
      .replace('{FACTCHECKS_SECTION}', factChecksSection);

    const result = await anthropicClient.sendMessageJSON<ClassificationResult>(
      CLASSIFICATION_SYSTEM_PROMPT,
      userMessage,
      { temperature: 0.3, maxTokens: 1024 }
    );

    // Validate the category
    const validCategories: VerificationCategory[] = [
      'verified_fact', 'expert_consensus', 'partially_verified', 'opinion',
      'speculation', 'disputed', 'likely_false', 'confirmed_false'
    ];

    if (!validCategories.includes(result.category)) {
      console.warn(`[Verity] Invalid category "${result.category}", defaulting to partially_verified`);
      result.category = 'partially_verified';
    }

    // Clamp confidence
    result.confidence = Math.max(0, Math.min(1, result.confidence || 0.5));

    return result;

  } catch (error) {
    console.error('[Verity] Classification failed:', error);

    // Check if we have existing fact-checks to inform fallback
    if (existingFactChecks.length > 0) {
      const falseVerdicts = existingFactChecks.filter(fc =>
        fc.verdict.toLowerCase().includes('false') ||
        fc.verdict.toLowerCase().includes('pants on fire')
      );

      if (falseVerdicts.length >= 2) {
        return {
          category: 'confirmed_false',
          confidence: 0.7,
          reasoning: `Multiple fact-checking organizations (${falseVerdicts.map(f => f.org).join(', ')}) have rated this claim as false. Classification based on existing fact-checks due to analysis error.`,
        };
      }
    }

    return {
      category: 'partially_verified',
      confidence: 0.3,
      reasoning: 'Unable to complete full analysis. This claim requires manual review for accurate classification.',
    };
  }
}

/**
 * Get human-readable label for a category
 */
export function getCategoryLabel(category: VerificationCategory): string {
  const labels: Record<VerificationCategory, string> = {
    verified_fact: 'Verified Fact',
    expert_consensus: 'Expert Consensus',
    partially_verified: 'Partially Verified',
    opinion: 'Opinion / Analysis',
    speculation: 'Speculation',
    disputed: 'Disputed',
    likely_false: 'Likely False',
    confirmed_false: 'Confirmed Misinformation',
  };
  return labels[category] || category;
}

/**
 * Get brand-appropriate description for a category
 */
export function getCategoryDescription(category: VerificationCategory): string {
  const descriptions: Record<VerificationCategory, string> = {
    verified_fact: 'This checks out. Multiple authoritative sources confirm it.',
    expert_consensus: 'Domain experts broadly agree on this.',
    partially_verified: 'Some parts hold up. Others need more context.',
    opinion: 'This is an interpretation or value judgment, not a verifiable fact.',
    speculation: 'This is a prediction or hypothesis that cannot yet be verified.',
    disputed: 'Credible sources disagree on this. The evidence is mixed.',
    likely_false: 'Available evidence substantially contradicts this claim.',
    confirmed_false: 'This has been debunked. Here\'s the evidence.',
  };
  return descriptions[category] || '';
}
