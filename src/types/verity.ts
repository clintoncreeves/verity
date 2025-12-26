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
  type: string;
  url: string;
  reliability: number;
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
