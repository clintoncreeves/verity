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

/**
 * Check if a claim is a denial of well-established historical facts or scientific consensus
 * These claims should be classified as confirmed_false, not verified_fact
 *
 * The LLM often gets confused and classifies denial claims as "verified" because
 * it's verifying that the opposite is true, rather than classifying the claim itself
 */
export function isDenialOfEstablishedFact(claim: string): { isDenial: boolean; topic?: string; reasoning?: string } {
  // Holocaust denial patterns
  const holocaustDenialPatterns = [
    /\bholocaust\b.*\b(?:never|didn'?t|did not|wasn'?t|was not)\b.*\bhappen/i,
    /\bholocaust\b.*\b(?:hoax|fake|lie|myth|fabricat)/i,
    /\bholocaust\b.*\b(?:exaggerat|overstat)/i,
    /\b(?:never|didn'?t|did not)\b.*\bholocaust\b/i,
    /\bno\b.*\bholocaust\b/i,
    /\bholocaust\b.*\b(?:didn'?t|did not|never)\b.*\b(?:exist|occur|take place)/i,
  ];

  if (holocaustDenialPatterns.some(p => p.test(claim))) {
    return {
      isDenial: true,
      topic: 'Holocaust',
      reasoning: 'The Holocaust is one of the most thoroughly documented events in history, confirmed by Nazi documentation, survivor testimony, perpetrator confessions, physical evidence, and decades of historical scholarship. Holocaust denial is universally rejected by historians and classified as confirmed misinformation.',
    };
  }

  // Moon landing denial patterns
  const moonLandingDenialPatterns = [
    /\bmoon\s*landing\b.*\b(?:fake|faked|hoax|staged|never)/i,
    /\b(?:never|didn'?t|did not)\b.*\b(?:land|go|went)\b.*\bmoon\b/i,
    /\bmoon\b.*\b(?:never|didn'?t|did not)\b.*\b(?:land|happen)/i,
    /\bno one\b.*\b(?:land|been)\b.*\bmoon\b/i,
  ];

  if (moonLandingDenialPatterns.some(p => p.test(claim))) {
    return {
      isDenial: true,
      topic: 'Moon landing',
      reasoning: 'The Apollo moon landings (1969-1972) are confirmed by extensive physical evidence including lunar samples, retroreflectors still used by scientists today, independent verification by multiple countries including the Soviet Union, and thousands of NASA employees and contractors. Moon landing denial has been thoroughly debunked.',
    };
  }

  // Evolution denial patterns
  const evolutionDenialPatterns = [
    /\bevolution\b.*\b(?:is|was)\b.*\b(?:false|lie|hoax|myth|fake)/i,
    /\bevolution\b.*\b(?:never|didn'?t|did not)\b.*\bhappen/i,
    /\b(?:no|isn'?t|is not)\b.*\bevolution\b/i,
    /\bevolution\b.*\b(?:isn'?t|is not)\b.*\b(?:real|true)/i,
  ];

  if (evolutionDenialPatterns.some(p => p.test(claim))) {
    return {
      isDenial: true,
      topic: 'Evolution',
      reasoning: 'Evolution by natural selection is supported by overwhelming evidence from multiple scientific fields including genetics, paleontology, comparative anatomy, and direct observation. It represents the scientific consensus of biologists worldwide.',
    };
  }

  // Earth shape denial (flat earth)
  const flatEarthPatterns = [
    /\bearth\b.*\b(?:is|was)\b.*\bflat\b/i,
    /\bflat\s*earth\b/i,
    /\bearth\b.*\b(?:isn'?t|is not|not)\b.*\b(?:round|sphere|spherical|globe)/i,
  ];

  if (flatEarthPatterns.some(p => p.test(claim))) {
    return {
      isDenial: true,
      topic: 'Earth\'s shape',
      reasoning: 'Earth\'s spherical shape has been confirmed since ancient times and is supported by satellite imagery, physics, navigation, and direct observation. Flat Earth claims contradict basic physics and observable reality.',
    };
  }

  // Vaccine-autism link (debunked)
  const vaccineAutismPatterns = [
    /\bvaccines?\b.*\bcause\b.*\bautism\b/i,
    /\bautism\b.*\bcaused?\b.*\bvaccines?\b/i,
    /\bvaccines?\b.*\b(?:cause|lead to|result in)\b.*\bautism\b/i,
  ];

  if (vaccineAutismPatterns.some(p => p.test(claim))) {
    return {
      isDenial: true,
      topic: 'Vaccine safety',
      reasoning: 'The claimed link between vaccines and autism has been thoroughly debunked by numerous large-scale studies involving millions of children. The original study claiming this link was retracted and its author lost his medical license for fraud.',
    };
  }

  // Climate change denial
  const climateChangePatterns = [
    /\bclimate\s*change\b.*\b(?:is|was)\b.*\b(?:hoax|fake|lie|myth|scam)/i,
    /\bglobal\s*warming\b.*\b(?:is|was)\b.*\b(?:hoax|fake|lie|myth|scam)/i,
    /\b(?:no|isn'?t|is not)\b.*\bclimate\s*change\b/i,
    /\bclimate\s*change\b.*\b(?:isn'?t|is not)\b.*\b(?:real|happening)/i,
  ];

  if (climateChangePatterns.some(p => p.test(claim))) {
    return {
      isDenial: true,
      topic: 'Climate change',
      reasoning: 'Human-caused climate change is supported by overwhelming scientific evidence and represents the consensus of climate scientists worldwide, as documented by the IPCC and major scientific organizations.',
    };
  }

  return { isDenial: false };
}

/**
 * Check if a claim is about ancient history (pre-500 CE)
 * These claims rely on indirect evidence and historical methodology,
 * so confidence should be capped even when expert consensus exists
 */
export function isAncientHistoricalClaim(claim: string): boolean {
  const lowerClaim = claim.toLowerCase();

  // Ancient figures and entities
  const ancientSubjects = [
    'jesus', 'christ', 'moses', 'abraham', 'muhammad', 'buddha', 'confucius',
    'socrates', 'plato', 'aristotle', 'alexander the great', 'julius caesar',
    'cleopatra', 'nero', 'augustus', 'constantine', 'attila',
    'homer', 'virgil', 'herodotus', 'thucydides',
    'pharaoh', 'ramses', 'tutankhamun', 'king david', 'king solomon',
    'hannibal', 'spartacus', 'pontius pilate',
  ];

  // Ancient civilizations and periods
  const ancientContexts = [
    'ancient rome', 'ancient greece', 'ancient egypt', 'ancient persia',
    'ancient israel', 'ancient mesopotamia', 'ancient china', 'ancient india',
    'roman empire', 'greek empire', 'persian empire', 'egyptian empire',
    'biblical', 'bronze age', 'iron age', 'classical antiquity',
    'b.c.', 'bc', 'bce', 'b.c.e.',
    '1st century', '2nd century', '3rd century', '4th century', '5th century',
    'first century', 'second century', 'third century', 'fourth century', 'fifth century',
  ];

  // Check for ancient subjects
  const hasAncientSubject = ancientSubjects.some(subject =>
    new RegExp(`\\b${subject}\\b`, 'i').test(lowerClaim)
  );

  // Check for ancient contexts
  const hasAncientContext = ancientContexts.some(context =>
    lowerClaim.includes(context)
  );

  // Check for existence/historical claims about these subjects
  const existencePatterns = [
    /\bexist(?:ed|s|ence)?\b/i,
    /\bwas (?:a |real|historical)\b/i,
    /\blived\b/i,
    /\bhistorical figure\b/i,
    /\breally happened\b/i,
  ];

  const isExistenceClaim = existencePatterns.some(p => p.test(claim));

  return (hasAncientSubject && isExistenceClaim) || hasAncientContext;
}
