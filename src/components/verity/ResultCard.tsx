import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SourceCard, type Source } from "./SourceCard"
import { FactCheckPanel, type FactCheck } from "./FactCheckPanel"
import { DecomposedClaimDisplay } from "./DecomposedClaimDisplay"
import { DecompositionSummaryCard } from "./DecompositionSummaryCard"
import { VerificationSummary } from "./VerificationSummary"
import type { VerificationCategory } from "@/lib/category-config"
import { cn } from "@/lib/utils"
import type { ClaimComponent, DecompositionSummary } from "@/types/verity"

// Keep these imports for backward compatibility, but they're no longer used in the main flow
export type { Source } from "./SourceCard"
export type { Evidence } from "./EvidenceList"

// Verdict info for showing on decomposed claim components
export interface ClaimVerdict {
  category: VerificationCategory
  confidence: number
}

export interface VerificationResult {
  // Legacy fields (kept for backward compatibility but no longer displayed as "overall")
  category: VerificationCategory
  confidence: number
  summary: string
  reasoning?: string
  sources: Source[]
  evidence: { id: string; text: string; type: string }[]
  factChecks?: FactCheck[]
  verificationId?: string
  verifiedAt?: string
  originalClaim?: string // For warning detection
  // Decomposition data - this is now the primary display
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

  // If no decomposition, we can't show the breakdown - this shouldn't happen in normal flow
  if (!hasDecomposition) {
    return (
      <div className={cn("space-y-6 w-full max-w-3xl mx-auto", className)}>
        <Card className="border-2">
          <CardHeader>
            <p className="text-muted-foreground">
              Unable to analyze this statement. Please try rephrasing.
            </p>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6 w-full max-w-3xl mx-auto", className)}>
      {/* Statement Breakdown - The primary verification display */}
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

      {/* Verification Summary - Qualitative summary + warnings */}
      <VerificationSummary
        components={result.decomposition!.components}
        decompositionSummary={result.decomposition!.summary}
        originalClaim={result.originalClaim}
      />

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
