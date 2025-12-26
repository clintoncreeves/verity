/**
 * Verification Orchestrator for Verity
 * Coordinates the full verification pipeline
 */

import { extractClaims, type ExtractedClaim } from './claim-extractor';
import { classifyClaim, getCategoryLabel, getCategoryDescription } from './classifier';
import { decomposeClaim, type DecompositionResult } from './claim-decomposer';
import { evaluateSource, type SourceEvaluation } from './source-evaluator';
import { searchFactChecks } from './fact-check-searcher';
import { searchWeb, searchNews, searchAcademic } from './web-searcher';
import { generateId, extractDomain } from '@/lib/utils/api-helpers';
import type {
  VerificationCategory,
  Source,
  ExistingFactCheck,
  VerificationResult,
  ClaimComponent,
  DecompositionSummary,
} from '@/types/verity';

export interface VerificationRequest {
  type: 'text' | 'image' | 'url';
  content: string;
  options?: {
    maxSources?: number;
    includeFactChecks?: boolean;
    includeWebSearch?: boolean;
  };
}

export interface VerifiedClaim {
  id: string;
  text: string;
  type: 'factual' | 'opinion' | 'prediction';
  category: VerificationCategory;
  confidence: number;
  reasoning: string;
  sources: Source[];
  evidence: string[];
  // Decomposition data
  components?: ClaimComponent[];
  decompositionSummary?: DecompositionSummary;
}

export interface FullVerificationResult {
  id: string;
  timestamp: string;
  input: {
    type: string;
    content: string;
  };
  claims: VerifiedClaim[];
  existingFactChecks: ExistingFactCheck[];
  overallCategory: VerificationCategory;
  overallConfidence: number;
  summary: string;
  sources: Source[];
  evidence: string[];
  // Overall decomposition summary
  overallDecomposition?: DecompositionSummary;
}

/**
 * Main verification function - orchestrates the full pipeline
 */
export async function verify(request: VerificationRequest): Promise<FullVerificationResult> {
  const startTime = Date.now();
  const { type, content, options = {} } = request;
  const {
    maxSources = 5,
    includeFactChecks = true,
    includeWebSearch = true,
  } = options;

  console.log(`[Verity] Starting verification for ${type} input`);

  // Step 1: Decompose the ORIGINAL input into components (facts vs opinions)
  // This must happen BEFORE claim extraction, which filters out opinions
  console.log('[Verity] Step 1: Decomposing input into components...');
  const inputDecomposition = await decomposeClaim(content);
  console.log(`[Verity] Found ${inputDecomposition.components.length} components`);

  // Step 2: Extract verifiable claims from the input
  console.log('[Verity] Step 2: Extracting claims...');
  const extractedClaims = await extractClaims(content);
  console.log(`[Verity] Extracted ${extractedClaims.length} claims`);

  // Step 3: Search for existing fact-checks
  let existingFactChecks: ExistingFactCheck[] = [];
  if (includeFactChecks) {
    console.log('[Verity] Step 3: Searching existing fact-checks...');
    existingFactChecks = await searchFactChecks(content);
    console.log(`[Verity] Found ${existingFactChecks.length} existing fact-checks`);
  }

  // Step 4: Gather sources from web search
  let allSources: Source[] = [];
  if (includeWebSearch) {
    console.log('[Verity] Step 4: Searching for sources...');
    const [webResults, newsResults] = await Promise.all([
      searchWeb(content, Math.ceil(maxSources / 2)),
      searchNews(content, Math.ceil(maxSources / 2)),
    ]);

    // Convert search results to evaluated sources
    const allSearchResults = [...webResults.results, ...newsResults.results];
    for (const result of allSearchResults.slice(0, maxSources)) {
      const evaluation = evaluateSource(result.url);
      allSources.push({
        name: extractDomain(result.url),
        type: evaluation.type,
        url: result.url,
        reliability: evaluation.reliabilityScore,
      });
    }
    console.log(`[Verity] Gathered ${allSources.length} sources`);
  }

  // Step 5: Verify each claim
  console.log('[Verity] Step 5: Verifying claims...');
  const verifiedClaims: VerifiedClaim[] = [];

  for (let i = 0; i < extractedClaims.length; i++) {
    const claim = extractedClaims[i];
    const classification = await classifyClaim(claim.text, allSources, existingFactChecks);

    verifiedClaims.push({
      id: claim.id,
      text: claim.text,
      type: claim.type,
      category: classification.category,
      confidence: Math.round(classification.confidence * 100),
      reasoning: classification.reasoning,
      sources: allSources,
      evidence: [classification.reasoning],
      // Include decomposition from original input (attached to first claim)
      components: i === 0 ? inputDecomposition.components : undefined,
      decompositionSummary: i === 0 ? inputDecomposition.summary : undefined,
    });
  }

  // Step 6: Determine overall classification
  console.log('[Verity] Step 6: Computing overall assessment...');
  const { overallCategory, overallConfidence } = computeOverallClassification(
    verifiedClaims,
    existingFactChecks
  );

  // Step 6: Generate summary
  const summary = generateSummary(verifiedClaims, existingFactChecks, overallCategory);

  // Compile all evidence
  const allEvidence = verifiedClaims.flatMap(c => c.evidence);

  // Use the input decomposition as the overall decomposition
  const overallDecomposition = inputDecomposition.summary;

  const duration = Date.now() - startTime;
  console.log(`[Verity] Verification complete in ${duration}ms`);

  return {
    id: generateId(),
    timestamp: new Date().toISOString(),
    input: { type, content: content.substring(0, 500) },
    claims: verifiedClaims,
    existingFactChecks,
    overallCategory,
    overallConfidence,
    summary,
    sources: allSources,
    evidence: allEvidence,
    overallDecomposition,
  };
}

/**
 * Compute overall classification from individual claim classifications
 */
function computeOverallClassification(
  claims: VerifiedClaim[],
  factChecks: ExistingFactCheck[]
): { overallCategory: VerificationCategory; overallConfidence: number } {
  if (claims.length === 0) {
    return {
      overallCategory: 'partially_verified',
      overallConfidence: 50,
    };
  }

  // If we have existing fact-checks that say false, weight heavily
  const falseFactChecks = factChecks.filter(fc =>
    fc.verdict.toLowerCase().includes('false') ||
    fc.verdict.toLowerCase().includes('pants on fire')
  );

  if (falseFactChecks.length >= 2) {
    return {
      overallCategory: 'confirmed_false',
      overallConfidence: 85,
    };
  }

  // Count categories
  const categoryCounts: Record<string, number> = {};
  let totalConfidence = 0;

  for (const claim of claims) {
    categoryCounts[claim.category] = (categoryCounts[claim.category] || 0) + 1;
    totalConfidence += claim.confidence;
  }

  // Find most common category
  let mostCommon: VerificationCategory = 'partially_verified';
  let maxCount = 0;

  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = category as VerificationCategory;
    }
  }

  const avgConfidence = Math.round(totalConfidence / claims.length);

  return {
    overallCategory: mostCommon,
    overallConfidence: avgConfidence,
  };
}

/**
 * Generate human-readable summary in brand voice
 * Uses the classifier's reasoning which explains what's verifiable vs what's opinion
 */
function generateSummary(
  claims: VerifiedClaim[],
  factChecks: ExistingFactCheck[],
  category: VerificationCategory
): string {
  if (claims.length === 0) {
    return "We couldn't identify specific claims to verify in this input.";
  }

  // Use the classifier's reasoning directly - it now explains what's fact vs opinion
  // This is more specific than the generic category description
  const primaryClaim = claims[0];
  let summary = primaryClaim.reasoning;

  // Add context about fact-checks if they exist
  if (factChecks.length > 0) {
    const orgs = factChecks.map(fc => fc.org).slice(0, 3).join(', ');
    summary += ` Previously reviewed by ${orgs}.`;
  }

  return summary;
}

/**
 * Quick verification for simple text claims
 */
export async function quickVerify(text: string): Promise<{
  category: VerificationCategory;
  confidence: number;
  summary: string;
}> {
  // Check for existing fact-checks first
  const factChecks = await searchFactChecks(text);

  if (factChecks.length > 0) {
    const falseCount = factChecks.filter(fc =>
      fc.verdict.toLowerCase().includes('false')
    ).length;

    if (falseCount >= 2) {
      return {
        category: 'confirmed_false',
        confidence: 85,
        summary: `This has been debunked by ${factChecks.map(fc => fc.org).join(', ')}.`,
      };
    }
  }

  // Quick classification without full source search
  const classification = await classifyClaim(text, [], factChecks);

  return {
    category: classification.category,
    confidence: Math.round(classification.confidence * 100),
    summary: getCategoryDescription(classification.category),
  };
}
