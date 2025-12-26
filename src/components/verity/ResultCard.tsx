import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CategoryBadge } from "./CategoryBadge"
import { ConfidenceBar } from "./ConfidenceBar"
import { SourceCard, type Source } from "./SourceCard"
import { EvidenceList, type Evidence } from "./EvidenceList"
import { FactCheckPanel, type FactCheck } from "./FactCheckPanel"
import { getCategoryConfig, type VerificationCategory } from "@/lib/category-config"
import { cn } from "@/lib/utils"

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
}

interface ResultCardProps {
  result: VerificationResult
  className?: string
}

export function ResultCard({ result, className }: ResultCardProps) {
  const config = getCategoryConfig(result.category)

  return (
    <div className={cn("space-y-6 w-full max-w-3xl mx-auto", className)}>
      <Card className="border-2">
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <CategoryBadge category={result.category} className="text-base px-4 py-2" />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                {config.microcopy}
              </h3>
              <p className="text-base leading-relaxed">
                {result.summary}
              </p>
            </div>

            <ConfidenceBar confidence={result.confidence} />
          </div>
        </CardHeader>

        {result.reasoning && (
          <CardContent className="pt-0">
            <div className="rounded-lg bg-muted/30 p-4 border">
              <h4 className="text-sm font-medium mb-2">Analysis</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {result.reasoning}
              </p>
            </div>
          </CardContent>
        )}

        <CardContent className="pt-0 space-y-4">
          {result.evidence.length > 0 && (
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

      {/* Verification watermark */}
      {result.verificationId && (
        <div className="text-center text-xs text-muted-foreground/60 py-4 border-t border-muted/30">
          <p>
            Verification ID: <code className="font-mono">{result.verificationId}</code>
          </p>
          {result.verifiedAt && (
            <p className="mt-1">
              Generated: {new Date(result.verifiedAt).toLocaleString()}
            </p>
          )}
          <p className="mt-2 text-muted-foreground/40">
            This result cannot be used as authoritative evidence. Verify through official fact-checkers.
          </p>
        </div>
      )}
    </div>
  )
}
