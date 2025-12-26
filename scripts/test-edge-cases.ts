#!/usr/bin/env npx tsx
/**
 * Manual Edge Case Tester for Verity
 *
 * Usage: npx tsx scripts/test-edge-cases.ts
 *
 * Make sure the dev server is running: npm run dev
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

interface TestCase {
  name: string;
  input: string;
  expectedCategories: string[];
  shouldNotBe?: string[];
  reason: string;
}

const testCases: TestCase[] = [
  // Mixed Fact/Opinion
  {
    name: 'Mixed: Necessity claim',
    input: 'The air strikes were necessary to protect civilians',
    expectedCategories: ['opinion', 'partially_verified', 'disputed'],
    shouldNotBe: ['verified_fact'],
    reason: '"Necessary" is a value judgment',
  },
  {
    name: 'Mixed: Causality claim',
    input: 'The economy crashed because of government policy',
    expectedCategories: ['opinion', 'partially_verified', 'disputed'],
    shouldNotBe: ['verified_fact'],
    reason: 'Causality claims are interpretations',
  },
  {
    name: 'Mixed: "Justified" claim',
    input: 'The war was justified to stop terrorism',
    expectedCategories: ['opinion', 'partially_verified'],
    shouldNotBe: ['verified_fact'],
    reason: '"Justified" is a moral judgment',
  },

  // Pure Facts
  {
    name: 'Fact: Capital city',
    input: 'Paris is the capital of France',
    expectedCategories: ['verified_fact', 'expert_consensus'],
    reason: 'Basic geographic fact',
  },
  {
    name: 'Fact: Scientific consensus',
    input: 'The Earth orbits around the Sun',
    expectedCategories: ['verified_fact', 'expert_consensus'],
    reason: 'Established scientific fact',
  },

  // Known Misinformation
  {
    name: 'Misinfo: Vaccines and autism',
    input: 'Vaccines cause autism in children',
    expectedCategories: ['confirmed_false', 'likely_false'],
    reason: 'Thoroughly debunked',
  },
  {
    name: 'Misinfo: Flat Earth',
    input: 'The Earth is flat',
    expectedCategories: ['confirmed_false', 'likely_false'],
    reason: 'Contradicted by all evidence',
  },
  {
    name: 'Misinfo: 5G COVID',
    input: '5G towers spread COVID-19',
    expectedCategories: ['confirmed_false', 'likely_false'],
    reason: 'Debunked conspiracy theory',
  },

  // Opinions
  {
    name: 'Opinion: Food preference',
    input: 'Pizza is the best food in the world',
    expectedCategories: ['opinion'],
    reason: 'Subjective preference',
  },
  {
    name: 'Opinion: Comparative',
    input: 'Python is better than JavaScript',
    expectedCategories: ['opinion'],
    reason: '"Better" without criteria is subjective',
  },

  // Future Predictions
  {
    name: 'Speculation: Stock market',
    input: 'The stock market will crash in 2026',
    expectedCategories: ['speculation'],
    reason: 'Future prediction',
  },
  {
    name: 'Speculation: Bitcoin price',
    input: 'Bitcoin will reach $1 million by 2030',
    expectedCategories: ['speculation'],
    reason: 'Future prediction',
  },

  // Leading Questions
  {
    name: 'Leading: Government conspiracy',
    input: 'Why does the government hide evidence of aliens?',
    expectedCategories: ['opinion', 'likely_false', 'partially_verified'],
    shouldNotBe: ['verified_fact'],
    reason: 'Presupposes unverified claim',
  },

  // Disputed Topics
  {
    name: 'Disputed: GMO safety',
    input: 'Genetically modified foods are completely safe',
    expectedCategories: ['disputed', 'partially_verified', 'expert_consensus'],
    reason: 'Ongoing scientific debate',
  },

  // Non-Claims
  {
    name: 'Non-claim: Greeting',
    input: 'Hello, how are you today?',
    expectedCategories: ['opinion', 'partially_verified'],
    reason: 'Not a verifiable claim',
  },
  {
    name: 'Non-claim: Gibberish',
    input: 'asdfghjkl qwerty zxcvbn',
    expectedCategories: ['opinion', 'partially_verified', 'speculation'],
    reason: 'Meaningless input',
  },

  // The original problematic case
  {
    name: 'Original Issue: Nigeria air strikes',
    input: 'were the 12/25/2025 US air strikes in Nigeria necessary to protect Christians from Muslims?',
    expectedCategories: ['opinion', 'partially_verified', 'disputed'],
    shouldNotBe: ['verified_fact'],
    reason: 'Event may be real but "necessary" is a value judgment',
  },
];

async function runTest(testCase: TestCase): Promise<{
  passed: boolean;
  category: string;
  confidence: number;
  reason?: string;
}> {
  try {
    const response = await fetch(`${API_URL}/api/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text', content: testCase.input }),
    });

    if (!response.ok) {
      return { passed: false, category: 'ERROR', confidence: 0, reason: `HTTP ${response.status}` };
    }

    const data = await response.json();

    if (!data.success) {
      return { passed: false, category: 'ERROR', confidence: 0, reason: data.error?.message };
    }

    const category = data.data.overallCategory;
    const confidence = data.data.overallConfidence;

    // Check if category is in expected list
    const inExpected = testCase.expectedCategories.includes(category);

    // Check if category is in "should not be" list
    const inForbidden = testCase.shouldNotBe?.includes(category) || false;

    const passed = inExpected && !inForbidden;

    return {
      passed,
      category,
      confidence,
      reason: !passed
        ? inForbidden
          ? `Should NOT be "${category}"`
          : `Expected one of [${testCase.expectedCategories.join(', ')}]`
        : undefined,
    };
  } catch (error) {
    return {
      passed: false,
      category: 'ERROR',
      confidence: 0,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.log('🔬 Verity Edge Case Tester\n');
  console.log(`Testing against: ${API_URL}\n`);
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    process.stdout.write(`Testing: ${testCase.name}... `);

    const result = await runTest(testCase);

    if (result.passed) {
      console.log(`✅ PASS (${result.category}, ${result.confidence}%)`);
      passed++;
    } else {
      console.log(`❌ FAIL`);
      console.log(`   Got: ${result.category} (${result.confidence}%)`);
      console.log(`   Expected: [${testCase.expectedCategories.join(', ')}]`);
      if (result.reason) {
        console.log(`   Reason: ${result.reason}`);
      }
      failed++;
    }
  }

  console.log('='.repeat(80));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review the classifier prompt or test expectations.');
    process.exit(1);
  } else {
    console.log('\n✨ All tests passed!');
  }
}

main();
