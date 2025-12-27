export type VerificationCategory =
  | 'verified_fact'
  | 'expert_consensus'
  | 'partially_verified'
  | 'opinion'
  | 'speculation'
  | 'disputed'
  | 'likely_false'
  | 'confirmed_false';

export interface VerificationRequest {
  type: 'text' | 'image' | 'url';
  content: string;
  metadata?: {
    language?: string;
    context?: string;
  };
}

export interface ExtractedClaim {
  id: string;
  text: string;
  type: 'factual' | 'opinion' | 'prediction';
  confidence: number;
}

// ============================================
// CLAIM DECOMPOSITION TYPES
// ============================================

/**
 * Types of components within a claim
 * - verifiable_fact: Can be checked against evidence
 * - value_judgment: Subjective opinion/interpretation
 * - prediction: Future-oriented, cannot be verified yet
 * - presupposition: Assumed context, often verifiable
 */
export type ClaimComponentType =
  | 'verifiable_fact'
  | 'value_judgment'
  | 'prediction'
  | 'presupposition';

/**
 * A single component within a decomposed claim
 */
export interface ClaimComponent {
  id: string;
  text: string;
  type: ClaimComponentType;
  verifiabilityScore: number; // 0-1, how verifiable this component is
  explanation: string; // Brief explanation of why this type
  // Optional verification result for this specific component
  // Category uses backend VerificationCategory type (e.g., 'confirmed_false')
  // Frontend components should map to their display categories as needed
  verdict?: {
    category: string; // Backend category string - frontend maps to display format
    confidence: number; // 0-100
  };
}

/**
 * Summary statistics for a decomposed claim
 */
export interface DecompositionSummary {
  totalComponents: number;
  verifiableFacts: number;
  valueJudgments: number;
  predictions: number;
  presuppositions: number;
  overallVerifiability: number; // 0-1, weighted average
}

/**
 * Extended claim with decomposition data
 */
export interface DecomposedClaim extends ExtractedClaim {
  components: ClaimComponent[];
  decompositionSummary: DecompositionSummary;
}

export interface VerifiedSource {
  name: string;
  type: 'government' | 'academic' | 'news_wire' | 'fact_checker' | 'official' | 'secondary';
  url: string;
  reliabilityScore: number;
  excerpt?: string;
  accessDate: string;
}

export interface ExistingFactCheck {
  org: string;
  verdict: string;
  date: string;
  url?: string;
}

// Simplified source for display
export interface Source {
  name: string;
  title?: string;
  snippet?: string;
  type: string;
  url: string;
  reliability: number;
  publishDate?: string;
}

export interface EvidencePoint {
  type: 'supporting' | 'contradicting' | 'contextual';
  description: string;
  sourceIndex: number;
}

export interface ImageAnalysisResult {
  isAiGenerated: boolean;
  aiGenerationConfidence: number;
  isDeepfake: boolean;
  deepfakeConfidence: number;
  reverseSearchResults: Array<{
    url: string;
    title: string;
    thumbnail?: string;
  }>;
  metadata: Record<string, string>;
}

export interface VerificationResult {
  id: string;
  originalInput: VerificationRequest;
  claims: ExtractedClaim[];
  overallCategory: VerificationCategory;
  overallConfidence: number;
  summary: string;
  sources: VerifiedSource[];
  existingFactChecks: ExistingFactCheck[];
  evidence: EvidencePoint[];
  imageAnalysis?: ImageAnalysisResult;
  timestamp: string;
}
