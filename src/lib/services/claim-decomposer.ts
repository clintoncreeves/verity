/**
 * Claim Decomposer for Verity
 * Breaks claims into their constituent parts (facts, opinions, predictions, presuppositions)
 * Helps users understand what CAN be verified vs what is inherently subjective
 */

import { anthropicClient } from './anthropic-client';
import type {
  ClaimComponent,
  ClaimComponentType,
  DecompositionSummary,
} from '@/types/verity';

export interface DecompositionResult {
  components: ClaimComponent[];
  summary: DecompositionSummary;
}

const DECOMPOSITION_SYSTEM_PROMPT = `You are an expert analyst specializing in epistemic clarity. Your role is to break down claims into their constituent parts, helping users understand what CAN be verified vs what is inherently subjective.

COMPONENT TYPES:

1. verifiable_fact
   - Statements about past/present events, measurements, or states
   - Can be checked against evidence, records, or observation
   - Examples: "GDP grew 3%", "The speech happened on Tuesday", "The building is 50 stories tall"
   - Keywords: dates, numbers, names, locations, events, "is", "was", "has"

2. value_judgment
   - Subjective assessments, moral claims, quality evaluations
   - Cannot be objectively verified - depends on values/perspective
   - Examples: "necessary", "good", "unfair", "the best", "appropriate", "justified"
   - Keywords: "should", "must", "need", "right", "wrong", "better", "worse", "necessary"

3. prediction
   - Future-oriented statements that cannot yet be verified
   - May become verifiable when the future arrives
   - Examples: "will increase", "is going to happen", "expected to"
   - Keywords: "will", "going to", "forecast", "predict", "expect", "might"

4. presupposition
   - Implicit assumptions embedded in the claim
   - Often verifiable but stated as assumed background
   - Examples: In "The CEO resigned after the scandal" - the scandal existing is a presupposition
   - Look for: assumed context, implied prior events, unstated premises

ANALYSIS RULES:
- Break the claim into meaningful semantic components (phrases/clauses, not individual words)
- Focus on what users need to understand: "This part we can check, this part is opinion"
- Assign verifiabilityScore: 1.0 for pure facts, 0.0 for pure opinions, 0.3-0.7 for mixed
- Keep explanations very brief (under 15 words)
- A claim may have 1-6 components typically

OUTPUT FORMAT:
Return a JSON object with:
{
  "components": [
    {
      "id": "c1",
      "text": "exact phrase from the claim",
      "type": "verifiable_fact" | "value_judgment" | "prediction" | "presupposition",
      "verifiabilityScore": 0.0-1.0,
      "explanation": "Brief explanation why this is this type"
    }
  ]
}`;

const DECOMPOSITION_USER_PROMPT = `Decompose this claim into its component parts:

CLAIM:
"{CLAIM}"

Identify each distinct component and classify it. Return JSON only.`;

/**
 * Decompose a single claim into typed components
 */
export async function decomposeClaim(claimText: string): Promise<DecompositionResult> {
  // Skip decomposition for very short claims
  if (claimText.length < 10) {
    return createSimpleDecomposition(claimText);
  }

  try {
    const userMessage = DECOMPOSITION_USER_PROMPT.replace('{CLAIM}', claimText);

    const response = await anthropicClient.sendMessageJSON<{
      components: Array<{
        id: string;
        text: string;
        type: string;
        verifiabilityScore: number;
        explanation: string;
      }>;
    }>(DECOMPOSITION_SYSTEM_PROMPT, userMessage, {
      temperature: 0.2,
      maxTokens: 1024,
    });

    // Validate and normalize components
    const validTypes: ClaimComponentType[] = [
      'verifiable_fact',
      'value_judgment',
      'prediction',
      'presupposition',
    ];

    const components: ClaimComponent[] = response.components.map((c, index) => ({
      id: c.id || `c${index + 1}`,
      text: c.text,
      type: validTypes.includes(c.type as ClaimComponentType)
        ? (c.type as ClaimComponentType)
        : 'verifiable_fact',
      verifiabilityScore: Math.max(0, Math.min(1, c.verifiabilityScore || 0.5)),
      explanation: c.explanation || '',
    }));

    // Calculate summary
    const summary = calculateSummary(components);

    return { components, summary };
  } catch (error) {
    console.error('[Verity] Claim decomposition failed:', error);
    // Return a fallback decomposition
    return createSimpleDecomposition(claimText);
  }
}

/**
 * Create a simple single-component decomposition (fallback)
 */
function createSimpleDecomposition(claimText: string): DecompositionResult {
  const component: ClaimComponent = {
    id: 'c1',
    text: claimText,
    type: 'verifiable_fact',
    verifiabilityScore: 0.5,
    explanation: 'Could not decompose into parts',
  };

  return {
    components: [component],
    summary: {
      totalComponents: 1,
      verifiableFacts: 1,
      valueJudgments: 0,
      predictions: 0,
      presuppositions: 0,
      overallVerifiability: 0.5,
    },
  };
}

/**
 * Calculate summary statistics from components
 */
function calculateSummary(components: ClaimComponent[]): DecompositionSummary {
  const counts = {
    verifiable_fact: 0,
    value_judgment: 0,
    prediction: 0,
    presupposition: 0,
  };

  let totalVerifiability = 0;

  for (const component of components) {
    counts[component.type]++;
    totalVerifiability += component.verifiabilityScore;
  }

  return {
    totalComponents: components.length,
    verifiableFacts: counts.verifiable_fact,
    valueJudgments: counts.value_judgment,
    predictions: counts.prediction,
    presuppositions: counts.presupposition,
    overallVerifiability:
      components.length > 0 ? totalVerifiability / components.length : 0,
  };
}

/**
 * Generate a human-readable summary sentence
 */
export function getDecompositionSummaryText(summary: DecompositionSummary): string {
  const parts: string[] = [];

  if (summary.verifiableFacts > 0) {
    parts.push(
      `${summary.verifiableFacts} verifiable fact${summary.verifiableFacts > 1 ? 's' : ''}`
    );
  }
  if (summary.valueJudgments > 0) {
    parts.push(
      `${summary.valueJudgments} value judgment${summary.valueJudgments > 1 ? 's' : ''}`
    );
  }
  if (summary.predictions > 0) {
    parts.push(
      `${summary.predictions} prediction${summary.predictions > 1 ? 's' : ''}`
    );
  }
  if (summary.presuppositions > 0) {
    parts.push(
      `${summary.presuppositions} assumption${summary.presuppositions > 1 ? 's' : ''}`
    );
  }

  if (parts.length === 0) {
    return 'No distinct components identified.';
  }
  if (parts.length === 1) {
    return `This statement contains ${parts[0]}.`;
  }

  const last = parts.pop();
  return `This statement contains ${parts.join(', ')} and ${last}.`;
}
