/**
 * Verification Orchestrator for Verity
 * Coordinates the full verification pipeline
 */

import { extractClaims, type ExtractedClaim } from './claim-extractor';
import { classifyClaim, getCategoryLabel, getCategoryDescription } from './classifier';
import { decomposeClaim, type DecompositionResult } from './claim-decomposer';
import { evaluateSource, type SourceEvaluation } from './source-evaluator';
import { searchFactChecks } from './fact-check-searcher';
import { searchWeb, searchNews } from './web-searcher';
import { generateId, extractDomain } from '@/lib/utils/api-helpers';
import { isFalseVerdict, isTrueVerdict } from '@/lib/utils/verdict-utils';
import { VERIFICATION_CONFIG } from '@/lib/config/constants';
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
 * Deduplicate sources by URL
 */
function deduplicateSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter(source => {
    if (seen.has(source.url)) return false;
    seen.add(source.url);
    return true;
  });
}

/**
 * Deduplicate fact-checks by org+verdict
 */
function deduplicateFactChecks(factChecks: ExistingFactCheck[]): ExistingFactCheck[] {
  const seen = new Set<string>();
  return factChecks.filter(fc => {
    const key = `${fc.org}-${fc.verdict}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Main verification function - orchestrates the full pipeline
 */
export async function verify(request: VerificationRequest): Promise<FullVerificationResult> {
  const startTime = Date.now();
  const { type, content, options = {} } = request;
  const {
    maxSources = VERIFICATION_CONFIG.MAX_SOURCES,
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

  // Step 3: Search for existing fact-checks (per-claim for better accuracy)
  let existingFactChecks: ExistingFactCheck[] = [];
  if (includeFactChecks) {
    console.log('[Verity] Step 3: Searching existing fact-checks...');

    // Search for the original content first
    const contentFactChecks = await searchFactChecks(content);
    existingFactChecks.push(...contentFactChecks);

    // Also search per-claim for multi-claim inputs
    if (extractedClaims.length > 1) {
      for (const claim of extractedClaims.slice(0, 3)) { // Limit to first 3 claims
        const claimFactChecks = await searchFactChecks(claim.text);
        existingFactChecks.push(...claimFactChecks);
      }
    }

    // Deduplicate fact-checks
    existingFactChecks = deduplicateFactChecks(existingFactChecks);
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
    for (const result of allSearchResults) {
      const evaluation = evaluateSource(result.url);
      allSources.push({
        name: extractDomain(result.url),
        title: result.title,
        snippet: result.description || result.snippet,
        type: evaluation.type,
        url: result.url,
        reliability: evaluation.reliabilityScore,
      });
    }

    // Deduplicate and limit sources
    allSources = deduplicateSources(allSources).slice(0, maxSources);
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

  // Step 7: Generate summary
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
    input: { type, content: content.substring(0, VERIFICATION_CONFIG.INPUT_TRUNCATE_LENGTH) },
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
      overallConfidence: VERIFICATION_CONFIG.DEFAULT_CONFIDENCE,
    };
  }

  // Check fact-checks using shared utility
  const falseFactChecks = factChecks.filter(fc => isFalseVerdict(fc.verdict));
  const trueFactChecks = factChecks.filter(fc => isTrueVerdict(fc.verdict));

  // If we have strong fact-check consensus, use it
  if (falseFactChecks.length >= VERIFICATION_CONFIG.MIN_FACT_CHECKS_FOR_CONFIRMED) {
    return {
      overallCategory: 'confirmed_false',
      overallConfidence: 85,
    };
  }

  // Single false fact-check should still influence result
  if (falseFactChecks.length === 1 && trueFactChecks.length === 0) {
    return {
      overallCategory: 'likely_false',
      overallConfidence: 75,
    };
  }

  // Strong true consensus
  if (trueFactChecks.length >= VERIFICATION_CONFIG.MIN_FACT_CHECKS_FOR_CONFIRMED) {
    return {
      overallCategory: 'verified_fact',
      overallConfidence: 85,
    };
  }

  // Count categories from claim classifications
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

  // Add context about fact-checks if they exist (with null safety)
  if (factChecks.length > 0) {
    const orgs = factChecks
      .map(fc => fc.org)
      .filter(org => org && org.length > 0) // Filter empty/null orgs
      .slice(0, 3)
      .join(', ');

    if (orgs) {
      summary += ` Previously reviewed by ${orgs}.`;
    }
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
    const falseCount = factChecks.filter(fc => isFalseVerdict(fc.verdict)).length;

    if (falseCount >= VERIFICATION_CONFIG.MIN_FACT_CHECKS_FOR_CONFIRMED) {
      const orgs = factChecks
        .map(fc => fc.org)
        .filter(org => org && org.length > 0)
        .join(', ');
      return {
        category: 'confirmed_false',
        confidence: 85,
        summary: `This has been debunked by ${orgs}.`,
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
