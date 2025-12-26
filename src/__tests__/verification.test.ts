/**
 * Verity Verification System Test Suite
 * Tests edge cases for claim classification and verification
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = process.env.TEST_API_URL || 'http://localhost:3000';

interface VerificationResponse {
  success: boolean;
  data?: {
    overallCategory: string;
    overallConfidence: number;
    summary: string;
    claims: Array<{
      text: string;
      category: string;
      confidence: number;
    }>;
    sources: Array<{
      name: string;
      url: string;
      reliability: number;
    }>;
  };
  error?: {
    message: string;
    code: string;
  };
}

async function verify(content: string): Promise<VerificationResponse> {
  const response = await fetch(`${API_URL}/api/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'text', content }),
  });
  return response.json();
}

describe('Verity Verification System', () => {
  // ============================================
  // INPUT VALIDATION TESTS
  // ============================================
  describe('Input Validation', () => {
    it('should reject empty input', async () => {
      const result = await verify('');
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should reject whitespace-only input', async () => {
      const result = await verify('   \n\t   ');
      expect(result.success).toBe(false);
    });

    it('should accept minimal valid input', async () => {
      const result = await verify('Earth is round');
      expect(result.success).toBe(true);
    });

    it('should handle input at character limit (2000 chars)', async () => {
      const longInput = 'A'.repeat(2000);
      const result = await verify(longInput);
      // Should not reject based on length alone
      expect(result.error?.code).not.toBe('VALIDATION_ERROR');
    });

    it('should handle special characters and emojis', async () => {
      const result = await verify('The 🌍 Earth is approximately 4.5 billion years old');
      expect(result.success).toBe(true);
    });

    it('should handle non-English text', async () => {
      const result = await verify('La Terre est ronde');
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // MIXED FACT/OPINION CLAIMS
  // ============================================
  describe('Mixed Fact/Opinion Claims', () => {
    it('should NOT classify necessity claims as verified_fact', async () => {
      const result = await verify(
        'The air strikes were necessary to protect civilians'
      );
      expect(result.success).toBe(true);
      expect(result.data?.overallCategory).not.toBe('verified_fact');
      // Should be opinion, partially_verified, or disputed
      expect(['opinion', 'partially_verified', 'disputed']).toContain(
        result.data?.overallCategory
      );
    });

    it('should NOT classify causality claims as verified_fact', async () => {
      const result = await verify(
        'The economy crashed because of government policy'
      );
      expect(result.success).toBe(true);
      expect(result.data?.overallCategory).not.toBe('verified_fact');
    });

    it('should NOT classify "justified" claims as verified_fact', async () => {
      const result = await verify('The war was justified to stop terrorism');
      expect(result.success).toBe(true);
      expect(result.data?.overallCategory).not.toBe('verified_fact');
    });

    it('should handle comparative claims as opinion', async () => {
      const result = await verify(
        'Electric cars are better for the environment than gas cars'
      );
      expect(result.success).toBe(true);
      // Comparative "better" claims often involve value judgments
      expect(['opinion', 'partially_verified', 'expert_consensus']).toContain(
        result.data?.overallCategory
      );
    });

    it('should handle prescriptive claims as opinion', async () => {
      const result = await verify('Everyone should get vaccinated');
      expect(result.success).toBe(true);
      expect(result.data?.overallCategory).not.toBe('verified_fact');
    });
  });

  // ============================================
  // PURE FACTUAL CLAIMS
  // ============================================
  describe('Pure Factual Claims', () => {
    it('should verify well-established facts', async () => {
      const result = await verify('Paris is the capital of France');
      expect(result.success).toBe(true);
      expect(['verified_fact', 'expert_consensus']).toContain(
        result.data?.overallCategory
      );
    });

    it('should verify scientific consensus', async () => {
      const result = await verify(
        'The Earth orbits around the Sun'
      );
      expect(result.success).toBe(true);
      expect(['verified_fact', 'expert_consensus']).toContain(
        result.data?.overallCategory
      );
    });

    it('should handle verifiable recent events', async () => {
      const result = await verify(
        'Joe Biden is the President of the United States as of 2024'
      );
      expect(result.success).toBe(true);
      // Should find sources confirming this
      expect(result.data?.sources?.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // NON-VERIFIABLE INPUTS
  // ============================================
  describe('Non-Verifiable Inputs', () => {
    it('should classify pure opinions appropriately', async () => {
      const result = await verify('Chocolate ice cream is the best flavor');
      expect(result.success).toBe(true);
      expect(result.data?.overallCategory).toBe('opinion');
    });

    it('should handle questions (not claims)', async () => {
      const result = await verify('What is the meaning of life?');
      expect(result.success).toBe(true);
      // Questions are not verifiable claims
      expect(['opinion', 'partially_verified', 'speculation']).toContain(
        result.data?.overallCategory
      );
    });

    it('should handle greetings/non-claims', async () => {
      const result = await verify('Hello, how are you today?');
      expect(result.success).toBe(true);
      // Should recognize no verifiable claim
    });

    it('should handle self-evident statements', async () => {
      const result = await verify('A triangle has three sides');
      expect(result.success).toBe(true);
      // Tautologies are technically true but trivial
    });

    it('should handle gibberish input', async () => {
      const result = await verify('asdfghjkl qwerty zxcvbn');
      expect(result.success).toBe(true);
      // Should not crash, might classify as unverifiable
    });
  });

  // ============================================
  // TEMPORAL EDGE CASES
  // ============================================
  describe('Temporal Edge Cases', () => {
    it('should classify future predictions as speculation', async () => {
      const result = await verify(
        'The stock market will crash in 2026'
      );
      expect(result.success).toBe(true);
      expect(result.data?.overallCategory).toBe('speculation');
    });

    it('should handle claims about very recent events', async () => {
      // Recent events may not have sources yet
      const result = await verify(
        'Something happened yesterday that changed everything'
      );
      expect(result.success).toBe(true);
      // Should handle gracefully even with limited sources
    });

    it('should handle historical claims with disputed interpretations', async () => {
      const result = await verify(
        'The Roman Empire fell primarily due to economic factors'
      );
      expect(result.success).toBe(true);
      // Historical interpretations are often disputed
      expect(['disputed', 'partially_verified', 'opinion']).toContain(
        result.data?.overallCategory
      );
    });
  });

  // ============================================
  // KNOWN FALSE CLAIMS
  // ============================================
  describe('Known False Claims', () => {
    it('should identify debunked health misinformation', async () => {
      const result = await verify('Vaccines cause autism');
      expect(result.success).toBe(true);
      expect(['confirmed_false', 'likely_false']).toContain(
        result.data?.overallCategory
      );
    });

    it('should identify obvious misinformation', async () => {
      const result = await verify('The Earth is flat');
      expect(result.success).toBe(true);
      expect(['confirmed_false', 'likely_false']).toContain(
        result.data?.overallCategory
      );
    });

    it('should handle conspiracy theories', async () => {
      const result = await verify(
        'The moon landing was faked by NASA'
      );
      expect(result.success).toBe(true);
      expect(['confirmed_false', 'likely_false']).toContain(
        result.data?.overallCategory
      );
    });
  });

  // ============================================
  // QUESTION-AS-CLAIM (LEADING QUESTIONS)
  // ============================================
  describe('Leading Questions', () => {
    it('should handle questions that presuppose claims', async () => {
      const result = await verify(
        'Why did the government lie about the pandemic?'
      );
      expect(result.success).toBe(true);
      // Should not verify the presupposition
      expect(result.data?.overallCategory).not.toBe('verified_fact');
    });

    it('should handle "Is it true that" questions', async () => {
      const result = await verify(
        'Is it true that 5G towers spread COVID-19?'
      );
      expect(result.success).toBe(true);
      // Should evaluate the embedded claim as false
      expect(['confirmed_false', 'likely_false']).toContain(
        result.data?.overallCategory
      );
    });
  });

  // ============================================
  // SOURCE QUALITY TESTS
  // ============================================
  describe('Source Quality', () => {
    it('should weight reliable sources higher', async () => {
      const result = await verify(
        'Climate change is primarily caused by human activities'
      );
      expect(result.success).toBe(true);
      // Should find scientific sources
      const hasReliableSource = result.data?.sources?.some(
        (s) => s.reliability >= 70
      );
      expect(hasReliableSource).toBe(true);
    });

    it('should handle claims with only low-quality sources', async () => {
      // Obscure claim that might only have social media sources
      const result = await verify(
        'A random person on the internet said something controversial'
      );
      expect(result.success).toBe(true);
      // Should not verify based on low-quality sources alone
      expect(result.data?.overallCategory).not.toBe('verified_fact');
    });
  });

  // ============================================
  // DISPUTED CLAIMS
  // ============================================
  describe('Disputed Claims', () => {
    it('should identify actively disputed topics', async () => {
      const result = await verify(
        'Genetically modified foods are completely safe for consumption'
      );
      expect(result.success).toBe(true);
      // This is a topic with ongoing scientific debate
      expect(['disputed', 'partially_verified', 'expert_consensus']).toContain(
        result.data?.overallCategory
      );
    });

    it('should handle politically divisive claims', async () => {
      const result = await verify(
        'Tax cuts always stimulate economic growth'
      );
      expect(result.success).toBe(true);
      // Economic claims are often disputed
      expect(['disputed', 'partially_verified', 'opinion']).toContain(
        result.data?.overallCategory
      );
    });
  });

  // ============================================
  // SATIRE AND PARODY
  // ============================================
  describe('Satire Detection', () => {
    it('should handle obviously satirical content', async () => {
      const result = await verify(
        'According to The Onion, scientists discover that water is actually dry'
      );
      expect(result.success).toBe(true);
      // Should recognize satirical source
    });
  });

  // ============================================
  // CONFIDENCE SCORING
  // ============================================
  describe('Confidence Scoring', () => {
    it('should have higher confidence for well-sourced claims', async () => {
      const result = await verify('Water boils at 100 degrees Celsius at sea level');
      expect(result.success).toBe(true);
      expect(result.data?.overallConfidence).toBeGreaterThan(70);
    });

    it('should have lower confidence for ambiguous claims', async () => {
      const result = await verify('Something might happen somewhere sometime');
      expect(result.success).toBe(true);
      expect(result.data?.overallConfidence).toBeLessThan(70);
    });

    it('should return confidence between 0 and 100', async () => {
      const result = await verify('The sky appears blue during daytime');
      expect(result.success).toBe(true);
      expect(result.data?.overallConfidence).toBeGreaterThanOrEqual(0);
      expect(result.data?.overallConfidence).toBeLessThanOrEqual(100);
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not valid json',
      });
      const result = await response.json();
      expect(response.status).toBe(400);
      expect(result.error?.code).toBe('INVALID_JSON');
    });

    it('should handle missing content field', async () => {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text' }),
      });
      const result = await response.json();
      expect(response.status).toBe(400);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should handle invalid type field', async () => {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'invalid', content: 'test' }),
      });
      const result = await response.json();
      expect(response.status).toBe(400);
    });
  });
});

// ============================================
// MANUAL TEST CASES (for human verification)
// ============================================
export const manualTestCases = [
  {
    name: 'Mixed fact/opinion - Nigeria air strikes',
    input: 'were the 12/25/2025 US air strikes in Nigeria necessary to protect Christians from Muslims?',
    expectedCategory: ['opinion', 'partially_verified'],
    reason: 'Event may be verifiable but "necessary" is a value judgment',
  },
  {
    name: 'Pure fact - capital city',
    input: 'Tokyo is the capital of Japan',
    expectedCategory: ['verified_fact', 'expert_consensus'],
    reason: 'Easily verifiable geographic fact',
  },
  {
    name: 'Known misinformation - vaccines',
    input: 'Vaccines cause autism in children',
    expectedCategory: ['confirmed_false', 'likely_false'],
    reason: 'Thoroughly debunked by scientific consensus',
  },
  {
    name: 'Future prediction',
    input: 'Bitcoin will reach $1 million by 2030',
    expectedCategory: ['speculation'],
    reason: 'Future prediction cannot be verified',
  },
  {
    name: 'Opinion stated as fact',
    input: 'Pizza is the best food in the world',
    expectedCategory: ['opinion'],
    reason: 'Subjective preference, not verifiable',
  },
  {
    name: 'Disputed scientific topic',
    input: 'Nuclear energy is the safest form of power generation',
    expectedCategory: ['disputed', 'partially_verified'],
    reason: 'Experts disagree on metrics and methodology',
  },
  {
    name: 'Historical interpretation',
    input: 'World War I was caused by the assassination of Archduke Franz Ferdinand',
    expectedCategory: ['partially_verified'],
    reason: 'Trigger event is factual but "caused" implies sole causation',
  },
  {
    name: 'Leading question with false presupposition',
    input: 'Why does the government hide evidence of aliens?',
    expectedCategory: ['opinion', 'likely_false'],
    reason: 'Presupposes unverified claims',
  },
  {
    name: 'Comparative claim',
    input: 'Python is a better programming language than JavaScript',
    expectedCategory: ['opinion'],
    reason: 'Better is subjective without defined criteria',
  },
  {
    name: 'Quantitative claim',
    input: 'The population of China is over 1 billion people',
    expectedCategory: ['verified_fact'],
    reason: 'Verifiable demographic data',
  },
];
