/**
 * Verdict Utilities for Verity
 * Shared functions for parsing and classifying fact-check verdicts
 */

/**
 * Check if a verdict indicates the claim is false
 */
export function isFalseVerdict(verdict: string): boolean {
  const v = verdict.toLowerCase().trim();
  // Check for false verdicts, but exclude "mostly true" which contains "false" substring
  return (
    (v.includes('false') && !v.includes('mostly true') && !v.includes('partly true')) ||
    v.includes('pants on fire') ||
    v.includes('incorrect') ||
    v.includes('debunked') ||
    v.includes('hoax')
  );
}

/**
 * Check if a verdict indicates the claim is true
 */
export function isTrueVerdict(verdict: string): boolean {
  const v = verdict.toLowerCase().trim();
  return (
    (v.includes('true') && !v.includes('false') && !v.includes('mostly false')) ||
    v.includes('accurate') ||
    v.includes('correct') ||
    v.includes('confirmed')
  );
}

/**
 * Check if a verdict indicates mixed or partial truth
 */
export function isMixedVerdict(verdict: string): boolean {
  const v = verdict.toLowerCase().trim();
  return (
    v.includes('mixed') ||
    v.includes('partial') ||
    v.includes('mostly true') ||
    v.includes('mostly false') ||
    v.includes('half true') ||
    v.includes('half-true')
  );
}

/**
 * Classify a verdict into categories
 */
export function classifyVerdict(verdict: string): 'true' | 'false' | 'mixed' | 'unknown' {
  if (isFalseVerdict(verdict)) return 'false';
  if (isTrueVerdict(verdict)) return 'true';
  if (isMixedVerdict(verdict)) return 'mixed';
  return 'unknown';
}

/**
 * Check if a claim text contains value judgment keywords
 * These indicate subjective assessments that can't be objectively verified
 */
export function containsValueJudgmentKeywords(claim: string): boolean {
  const keywords = [
    'necessary',
    'justified',
    'should',
    'must',
    'appropriate',
    'right',
    'wrong',
    'fair',
    'unfair',
    'good',
    'bad',
    'better',
    'worse',
    'needed',
    'important',
    'best',
    'worst',
  ];
  const lowerClaim = claim.toLowerCase();
  return keywords.some(kw => {
    // Match whole words only to avoid false positives
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(lowerClaim);
  });
}

/**
 * Check if text is a question asking for a value judgment
 */
export function isValueJudgmentQuestion(text: string): boolean {
  const lowerText = text.toLowerCase().trim();

  // Check if it's a question
  const isQuestion = lowerText.endsWith('?') ||
    lowerText.startsWith('was ') ||
    lowerText.startsWith('is ') ||
    lowerText.startsWith('should ') ||
    lowerText.startsWith('could ') ||
    lowerText.startsWith('would ');

  if (!isQuestion) return false;

  // Check for value judgment keywords in question context
  return containsValueJudgmentKeywords(text);
}

/**
 * Check if a claim is about someone's intent, motivation, or creative inspiration
 * These claims cannot be definitively verified unless the person has explicitly stated their intent
 */
export function containsIntentClaim(claim: string): boolean {
  const patterns = [
    /\bbased (?:on|upon)\b/i,
    /\binspired by\b/i,
    /\bintended to\b/i,
    /\bdesigned to\b/i,
    /\bin order to\b/i,
    /\bmeant to\b/i,
    /\bpurposely\b/i,
    /\bdeliberately\b/i,
    /\bto achieve\b/i,
    /\bmotivated by\b/i,
    /\bwith the intent\b/i,
    /\bfor the purpose of\b/i,
    /\bto represent\b/i,
    /\bsymbolize[sd]?\b/i,
    /\brepresent(?:s|ed|ing)?\b.*\b(?:stereotype|people|group|race|religion)\b/i,
  ];
  return patterns.some(p => p.test(claim));
}

/**
 * Check if a claim is unverifiable (combines intent check with value judgment check)
 */
export function isUnverifiableClaim(claim: string): boolean {
  return containsValueJudgmentKeywords(claim) || containsIntentClaim(claim);
}
