/**
 * Claim Classifier for Verity
 * Uses Claude to classify claims into 8 verification categories
 * Can perform web search when sources are insufficient
 */

import { anthropicClient } from './anthropic-client';
import Anthropic from '@anthropic-ai/sdk';
import type { VerificationCategory, Source, ExistingFactCheck } from '@/types/verity';
import { containsValueJudgmentKeywords, containsIntentClaim, isFalseVerdict, isAncientHistoricalClaim, isDenialOfEstablishedFact } from '@/lib/utils/verdict-utils';
import { CLAUDE_CONFIG } from '@/lib/config/constants';

// Direct Anthropic client for web search-enabled classification
const anthropic = new Anthropic();

/**
 * Clean up reasoning text by removing forbidden phrases that expose internal process limitations
 * This is a post-processing fallback in case the LLM ignores prompt instructions
 */
function cleanReasoningText(text: string): string {
  // Patterns to remove - match entire sentences containing forbidden phrases
  const forbiddenPatterns = [
    // Source/evidence limitation phrases
    /[^.]*\bthe\s+sources?\s+provide[d]?\b[^.]*\./gi,
    /[^.]*\bsources?\s+provide[d]?\s+(are\s+)?limited\b[^.]*\./gi,
    /[^.]*\bexcerpts?\s+provide[d]?\b[^.]*\./gi,
    /[^.]*\bexcerpts?\s+(are\s+)?limited\b[^.]*\./gi,
    /[^.]*\blimited\s+(detail|evidence|information)\b[^.]*\./gi,
    /[^.]*\bminimal\s+details?\b[^.]*\./gi,
    /[^.]*\black\s+of\s+(specific\s+)?details?\b[^.]*\./gi,
    /[^.]*\bdon'?t\s+contain\s+detailed\b[^.]*\./gi,
    // Excerpt references
    /[^.]*\bin\s+the(se)?\s+excerpts?\b[^.]*\./gi,
    /[^.]*\bfrom\s+(the(se)?\s+)?excerpts?\b[^.]*\./gi,
    /[^.]*\bavailable\s+excerpts?\b[^.]*\./gi,
    // Confidence/verification limitation phrases
    /[^.]*\blimits?\s+confidence\b[^.]*\./gi,
    /[^.]*\bprevents?\s+(full\s+)?verification\b[^.]*\./gi,
    /[^.]*\bprevents?\s+(higher\s+)?confidence\b[^.]*\./gi,
    /[^.]*\bconstrains?\s+verification\b[^.]*\./gi,
    /[^.]*\bremain\s+unclear\b[^.]*\./gi,
    /[^.]*\bunclear\s+from\b[^.]*\./gi,
    // "However" sentences about evidence limitations
    /\s*However,?\s+[^.]*\b(limited|excerpts?|evidence|sources?\s+provided)\b[^.]*\./gi,
  ];

  let cleaned = text;
  for (const pattern of forbiddenPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Clean up any double spaces or leading/trailing whitespace
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  // If we removed too much, return a simplified version
  if (cleaned.length < 50 && text.length > 100) {
    // Extract just the first substantive sentence
    const firstSentence = text.match(/^[^.]+\./);
    if (firstSentence) {
      return firstSentence[0];
    }
  }

  return cleaned;
}

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

CRITICAL - ABSENCE OF EVIDENCE IS NOT EVIDENCE OF FALSITY:
- "likely_false" and "confirmed_false" require CONTRADICTING evidence, not just missing evidence
- If sources are irrelevant or don't mention the claim, that is INSUFFICIENT EVIDENCE, not contradiction
- Use "partially_verified" with low confidence when you cannot find relevant sources
- Only use "likely_false" when sources ACTIVELY CONTRADICT or debunk the claim
- Recent news events (government announcements, executive orders, breaking news) may not yet appear in search results
- Do NOT mark recent policy claims or official announcements as "likely_false" just because search results are sparse or irrelevant
- "The sources don't mention X" → Use "partially_verified" (low confidence)
- "The sources say X did NOT happen" → Use "likely_false"

CRITICAL - NEGATION CLAIMS (denial claims):
- When a claim DENIES something that is well-established, classify the CLAIM not the opposite
- "The Holocaust never happened" → This CLAIM is confirmed_false (Holocaust denial is debunked)
- "The moon landing was faked" → This CLAIM is confirmed_false (moon landing conspiracy is debunked)
- "Vaccines don't work" → This CLAIM is confirmed_false (vaccine efficacy is well-established)
- Do NOT classify what the evidence shows - classify WHETHER THE CLAIM MATCHES the evidence
- If the claim says "X never happened" and X definitely happened, the claim is FALSE
- If the claim says "X is false" and X is true, the claim is FALSE

CRITICAL - HANDLING MIXED CLAIMS AND VALUE JUDGMENTS:
- Many claims combine verifiable facts with value judgments or interpretations
- Example: "The air strikes happened to protect Christians" - the strikes may be verifiable, but the PURPOSE/NECESSITY is an interpretation
- Words like "necessary", "needed", "justified", "because", "in order to" often signal value judgments embedded in factual claims
- For such mixed claims, use "partially_verified" or "opinion" - NEVER "verified_fact"
- "verified_fact" is ONLY for purely factual claims where every element can be independently verified
- When in doubt about intent, motivation, or necessity, classify as "opinion" or "partially_verified"

CRITICAL - QUESTIONS ASKING FOR VALUE JUDGMENTS:
- Questions like "was that necessary?", "was it justified?", "should they have done X?", "was it right to...?" are asking for OPINIONS
- Even if the underlying event is verifiable, the JUDGMENT being requested cannot be verified
- These MUST be classified as "opinion" - NEVER as "verified_fact" or "expert_consensus"
- The answer to "was X necessary?" is inherently subjective and depends on values, priorities, and interpretations
- Look for question words (was, is, should, could, would) combined with value-laden terms (necessary, justified, right, wrong, good, bad, appropriate, needed)
- Example: "The US did an air strike. Was that necessary?" - The air strike may be factual, but whether it was NECESSARY is an opinion
- When a question asks for a judgment, evaluation, or assessment of rightness/necessity, classify as "opinion"

CRITICAL - CLAIMS ABOUT INTENT, MOTIVATION, OR INSPIRATION:
- Claims about WHY someone did something, what INSPIRED them, or what they INTENDED are NOT verifiable
- Unless the person has explicitly and publicly stated their intent, we cannot know their motivation
- Patterns like "X was based on Y", "X was inspired by Y", "X was designed to Y", "X was meant to Y" are intent claims
- The existence of similarities, parallels, or interpretations does NOT prove intent
- These MUST be classified as "opinion" or "disputed" - NEVER as "verified_fact" or "expert_consensus"
- Example: "JK Rowling based the goblins on Jewish stereotypes" - this is an INTENT claim that cannot be verified
- Example: "The goblin design shares characteristics with antisemitic caricatures" - this IS verifiable (observable similarities)
- When the claim is about someone's creative intent, motivation, or inspiration, classify as "opinion"
- Confidence for intent claims should NEVER exceed 50% unless the person explicitly stated their intent

EXPLAINING VERIFIABLE VS OPINION:
- When a claim mixes facts with opinions, your reasoning MUST clearly separate them
- Example reasoning: "The air strike on [date] is a verifiable event. However, whether it was 'necessary' is a value judgment that cannot be objectively verified - different people with different values would reach different conclusions."
- Help users understand WHAT can be fact-checked vs WHAT is inherently subjective
- This distinction is the core value Verity provides

WRITING STYLE FOR REASONING:
- Write for end users, not analysts. Focus ONLY on what we found.
- ABSOLUTELY FORBIDDEN - Using any of these phrases will cause the system to fail:
  * "sources provided" / "provided sources" / "the sources"
  * "limited detail" / "limited evidence" / "minimal details" / "lack of details"
  * "excerpts" / "snippets" / "available excerpts"
  * "prevents" / "constrains" / "limits confidence"
  * "couldn't find" / "unable to find" / "not provided"
  * "insufficient" / "unclear from" / "remain unclear"
  * ANY meta-commentary about the search or evidence quality
- Write ONLY about the claim and what is confirmed
- Good: "Multiple sources confirm X happened. The timing varies across reports."
- Bad: "The sources provided contain limited detail..." (FORBIDDEN)
- Good: "Reuters, AP, and BBC report this event occurred."
- Bad: "...which is not provided in these excerpts" (FORBIDDEN)

CRITICAL - INFORMATIVE REASONING FOR FALSE/DEBUNKED CLAIMS:
- When classifying something as "confirmed_false" or "likely_false", your reasoning MUST explain WHY it's false
- Don't just say "evidence contradicts this" - explain WHAT the evidence actually shows
- For well-known false claims, state the correct facts:
  * Flat earth: Explain that the Earth is an oblate spheroid, confirmed by satellite imagery, physics, navigation, etc.
  * Vaccine-autism: Explain the Wakefield study was fraudulent and retracted, and numerous studies found no link
  * Moon landing hoax: Explain we have physical evidence (reflectors on moon), photos, independent verification
- The reasoning should help users understand the TRUTH, not just that something is false
- Example good reasoning: "The Earth is an oblate spheroid, confirmed by satellite imagery, circumnavigation, physics of gravity, and observations from space. The flat earth claim contradicts overwhelming scientific evidence and direct observation."
- Example bad reasoning: "Strong evidence contradicts this claim." (too vague - FORBIDDEN!)

OUTPUT: Return JSON with:
- category: one of the 8 categories above
- confidence: 0.0-1.0 (your confidence in this classification)
- reasoning: 2-3 informative sentences explaining your classification. For false claims, explain what the truth actually is. For mixed claims, note which parts are facts vs opinions.`;

const CLASSIFICATION_USER_PROMPT = `Classify this claim based on the available evidence.

CLAIM:
"{CLAIM}"

{SOURCES_SECTION}

{FACTCHECKS_SECTION}

Respond with only valid JSON, no explanation outside the JSON.`;

const WEB_SEARCH_CLASSIFICATION_PROMPT = `You are an expert fact-checker. Your task is to verify this claim by searching for evidence and then classifying it.

CLAIM TO VERIFY:
"{CLAIM}"

SEARCH STRATEGY:
1. Search for the specific claim, especially if it mentions dates, names, or official actions
2. For government policy claims, search official sources (whitehouse.gov, congress.gov)
3. For news events, search major news outlets
4. Look for both supporting AND contradicting evidence

After searching, classify into one of these categories:
- verified_fact: Multiple authoritative sources confirm it
- expert_consensus: Domain experts broadly agree
- partially_verified: Some elements verified, others not
- opinion: Subjective value judgment
- speculation: Future prediction or hypothesis
- disputed: Credible sources disagree
- likely_false: Evidence contradicts the claim
- confirmed_false: Definitively debunked

CRITICAL: Absence of evidence is NOT evidence of falsity. If you can't find sources, use "partially_verified" with low confidence, NOT "likely_false".

CRITICAL - INFORMATIVE REASONING:
- For false/debunked claims, explain WHY it's false and what the truth is
- Don't just say "evidence contradicts this" - explain the actual facts
- Example: "The Earth is an oblate spheroid confirmed by satellite imagery, physics, and direct observation. This claim contradicts overwhelming scientific evidence."

Return ONLY valid JSON with:
- category: one of the 8 categories
- confidence: 0.0-1.0
- reasoning: 2-3 informative sentences explaining your classification. For false claims, explain what the truth actually is.`;

/**
 * Classify a claim with web search capability
 * Used when initial sources are insufficient
 */
async function classifyWithWebSearch(claim: string): Promise<ClassificationResult> {
  console.log('[Verity] Classifying with web search:', claim.slice(0, 50) + '...');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        },
      ],
      messages: [
        {
          role: 'user',
          content: WEB_SEARCH_CLASSIFICATION_PROMPT.replace('{CLAIM}', claim),
        },
      ],
    });

    // Extract text content from response
    let responseText = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        responseText += block.text;
      }
    }

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.warn('[Verity] No JSON found in web search classification response');
      return {
        category: 'partially_verified',
        confidence: 0.3,
        reasoning: 'Unable to complete web search classification.',
      };
    }

    const result = JSON.parse(jsonMatch[0]) as ClassificationResult;

    // Validate category
    const validCategories: VerificationCategory[] = [
      'verified_fact', 'expert_consensus', 'partially_verified', 'opinion',
      'speculation', 'disputed', 'likely_false', 'confirmed_false'
    ];

    if (!validCategories.includes(result.category)) {
      result.category = 'partially_verified';
    }

    result.confidence = Math.max(0, Math.min(1, result.confidence || 0.5));
    result.reasoning = cleanReasoningText(result.reasoning || '');

    console.log(`[Verity] Web search classification: ${result.category} (${Math.round(result.confidence * 100)}%)`);
    return result;

  } catch (error) {
    console.error('[Verity] Web search classification failed:', error);
    return {
      category: 'partially_verified',
      confidence: 0.3,
      reasoning: 'Unable to complete web search classification.',
    };
  }
}

/**
 * Classify a claim into one of 8 verification categories
 * If sources are insufficient, will perform web search for additional evidence
 */
export async function classifyClaim(
  claim: string,
  sources: Source[] = [],
  existingFactChecks: ExistingFactCheck[] = [],
  options: { allowWebSearch?: boolean } = {}
): Promise<ClassificationResult> {
  const { allowWebSearch = true } = options;

  try {
    // If no sources and no fact-checks, use web search directly
    if (sources.length === 0 && existingFactChecks.length === 0 && allowWebSearch) {
      console.log('[Verity] No sources available, using web search classification');
      return classifyWithWebSearch(claim);
    }

    // Build sources section with full context (title, snippet, etc.)
    let sourcesSection = 'SOURCES: None available';
    if (sources.length > 0) {
      const sourcesList = sources.map((s, i) => {
        let entry = `${i + 1}. ${s.name} (${s.type}, reliability: ${s.reliability}/100)`;
        if (s.title) entry += `\n   Title: "${s.title}"`;
        if (s.snippet) entry += `\n   Excerpt: "${s.snippet}"`;
        entry += `\n   URL: ${s.url}`;
        return entry;
      }).join('\n\n');
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

    // Use lower temperature for claims with value judgment keywords (more consistent classification)
    const config = containsValueJudgmentKeywords(claim)
      ? CLAUDE_CONFIG.CLASSIFICATION_SENSITIVE
      : CLAUDE_CONFIG.CLASSIFICATION;

    let result = await anthropicClient.sendMessageJSON<ClassificationResult>(
      CLASSIFICATION_SYSTEM_PROMPT,
      userMessage,
      config
    );

    // If initial classification shows low confidence or likely_false with no contradicting sources,
    // try web search for better evidence
    const sourcesLackRelevance = sources.length > 0 &&
      !sources.some(s => s.snippet?.toLowerCase().includes(claim.toLowerCase().slice(0, 30)));
    const shouldRetryWithWebSearch = allowWebSearch &&
      ((result.category === 'likely_false' && result.confidence < 0.7) ||
       (result.category === 'partially_verified' && result.confidence < 0.4) ||
       sourcesLackRelevance);

    if (shouldRetryWithWebSearch) {
      console.log('[Verity] Initial classification uncertain, trying web search for better evidence');
      const webSearchResult = await classifyWithWebSearch(claim);

      // Use web search result if it has higher confidence or found actual evidence
      if (webSearchResult.confidence > result.confidence ||
          (result.category === 'likely_false' && webSearchResult.category !== 'likely_false')) {
        console.log(`[Verity] Using web search result: ${webSearchResult.category} vs initial ${result.category}`);
        result = webSearchResult;
      }
    }

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

    // GUARD: Denial of established facts should be confirmed_false, not verified_fact
    // The LLM often gets confused and "verifies" that the opposite is true, rather than classifying the denial claim
    const denialCheck = isDenialOfEstablishedFact(claim);
    if (denialCheck.isDenial) {
      // The claim is a denial of established fact - it should be confirmed_false
      if (result.category === 'verified_fact' || result.category === 'expert_consensus' || result.category === 'partially_verified') {
        console.warn(`[Verity] Denial claim about ${denialCheck.topic} incorrectly classified as ${result.category}, correcting to confirmed_false`);
        result.category = 'confirmed_false';
        result.reasoning = denialCheck.reasoning || result.reasoning;
        result.confidence = 0.99; // Very high confidence for well-established denials
      }
    }

    // GUARD: Intent claims should never be verified_fact or expert_consensus
    // Intent/motivation cannot be definitively proven without explicit statement from the subject
    if (containsIntentClaim(claim)) {
      const wasIncorrectlyClassified = result.category === 'verified_fact' || result.category === 'expert_consensus';

      if (wasIncorrectlyClassified) {
        console.warn(`[Verity] Intent claim incorrectly classified as ${result.category}, correcting to opinion`);
        result.category = 'opinion';
      }

      // Replace reasoning entirely for intent claims - don't mix in suggestions about "verifiable" aspects
      result.reasoning = `This claim is about someone's intent, motivation, or creative inspiration. Without an explicit statement from the person involved, their true intentions cannot be verified. Observable similarities or patterns may exist, but they do not prove intent - only the person can confirm what they intended.`;

      // Cap confidence for intent claims - we can never be highly confident about intent
      if (result.confidence > 0.6) {
        result.confidence = 0.5;
      }
    }

    // GUARD: Value judgment claims should be opinion, not verified categories
    if (containsValueJudgmentKeywords(claim)) {
      if (result.category === 'verified_fact' || result.category === 'expert_consensus') {
        console.warn(`[Verity] Value judgment claim incorrectly classified as ${result.category}, correcting to opinion`);
        result.category = 'opinion';
        result.reasoning = `This claim contains subjective value judgments that cannot be objectively verified. ${result.reasoning}`;
      }
    }

    // GUARD: Ancient historical claims should have capped confidence
    // These rely on indirect evidence and historical methodology, not direct verification
    if (isAncientHistoricalClaim(claim)) {
      const maxConfidence = 0.75; // Cap at 75% for ancient history
      if (result.confidence > maxConfidence) {
        console.log(`[Verity] Ancient historical claim confidence capped from ${result.confidence} to ${maxConfidence}`);
        result.confidence = maxConfidence;
      }
      // Add context about historical evidence limitations if not already present
      if (!result.reasoning.toLowerCase().includes('historical') && !result.reasoning.toLowerCase().includes('ancient')) {
        result.reasoning = `${result.reasoning} Note: Claims about ancient history rely on indirect evidence and scholarly interpretation rather than direct verification.`;
      }
    }

    // POST-PROCESS: Remove any remaining forbidden phrases the LLM might have generated
    result.reasoning = cleanReasoningText(result.reasoning);

    return result;

  } catch (error) {
    console.error('[Verity] Classification failed:', error);

    // Check if we have existing fact-checks to inform fallback
    if (existingFactChecks.length > 0) {
      const falseVerdicts = existingFactChecks.filter(fc => isFalseVerdict(fc.verdict));

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
    opinion: 'This asks for or expresses a value judgment. The underlying events may be factual, but the assessment (necessary, justified, right, etc.) is subjective.',
    speculation: 'This is a prediction or hypothesis that cannot yet be verified.',
    disputed: 'Credible sources disagree on this. The evidence is mixed.',
    likely_false: 'Available evidence substantially contradicts this claim.',
    confirmed_false: 'This has been debunked. Here\'s the evidence.',
  };
  return descriptions[category] || '';
}
