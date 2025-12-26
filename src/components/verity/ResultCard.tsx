import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CategoryBadge } from "./CategoryBadge"
import { ConfidenceBar } from "./ConfidenceBar"
import { SourceCard, type Source } from "./SourceCard"
import { EvidenceList, type Evidence } from "./EvidenceList"
import { FactCheckPanel, type FactCheck } from "./FactCheckPanel"
import { DecomposedClaimDisplay } from "./DecomposedClaimDisplay"
import { DecompositionSummaryCard } from "./DecompositionSummaryCard"
import type { VerificationCategory } from "@/lib/category-config"
import { cn } from "@/lib/utils"
import type { ClaimComponent, DecompositionSummary } from "@/types/verity"

// Verdict info for showing on decomposed claim components
export interface ClaimVerdict {
  category: VerificationCategory
  confidence: number
}

export interface VerificationResult {
  category: VerificationCategory
  confidence: number
  summary: string
  reasoning?: string
  sources: Source[]
  evidence: Evidence[]
  factChecks?: FactCheck[]
  verificationId?: string
  verifiedAt?: string
  // Decomposition data
  decomposition?: {
    components: ClaimComponent[]
    summary: DecompositionSummary
    claimVerdict?: ClaimVerdict
  }
}

interface ResultCardProps {
  result: VerificationResult
  className?: string
}

export function ResultCard({ result, className }: ResultCardProps) {
  const hasDecomposition = result.decomposition && result.decomposition.components.length > 0

  return (
    <div className={cn("space-y-6 w-full max-w-3xl mx-auto", className)}>
      {/* Decomposition Card - Show first so users understand what's being verified */}
      {hasDecomposition && (
        <Card className="border-2">
          <CardHeader className="pb-2">
            <h3 className="text-lg font-semibold">Statement Breakdown</h3>
            <DecompositionSummaryCard summary={result.decomposition!.summary} />
          </CardHeader>
          <CardContent className="pt-0">
            <DecomposedClaimDisplay
              components={result.decomposition!.components}
              summary={result.decomposition!.summary}
              claimVerdict={result.decomposition!.claimVerdict}
            />
          </CardContent>
        </Card>
      )}

      {/* Verification Result Card - Applies to factual claims only */}
      <Card className="border-2">
        <CardHeader className="space-y-4">
          {hasDecomposition && (
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Verification of factual claims
            </p>
          )}
          <div className="flex items-center justify-between gap-4">
            <CategoryBadge category={result.category} className="text-base px-4 py-2" />
            <ConfidenceBar confidence={result.confidence} className="flex-1 max-w-[200px]" />
          </div>

          {/* Summary / Reasoning */}
          <p className="text-base leading-relaxed">
            {result.summary}
          </p>
        </CardHeader>

        <CardContent className="pt-0 space-y-6">
          {result.evidence.length > 0 && !hasDecomposition && (
            <EvidenceList evidence={result.evidence} />
          )}
        </CardContent>
      </Card>

      {result.sources.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold px-1">
            Sources ({result.sources.length})
          </h3>
          <div className="space-y-2">
            {result.sources.map((source, index) => (
              <SourceCard key={index} source={source} />
            ))}
          </div>
        </div>
      )}

      {result.factChecks && result.factChecks.length > 0 && (
        <FactCheckPanel factChecks={result.factChecks} />
      )}

      {/* Compact disclaimer footer */}
      <p className="text-center text-xs text-muted-foreground/50 py-2">
        AI-assisted analysis. Verify through official fact-checkers before sharing.
      </p>
    </div>
  )
}
