import { getDecompositionSummaryText } from "@/lib/services/claim-decomposer"
import type { DecompositionSummary } from "@/types/verity"
import { cn } from "@/lib/utils"

interface DecompositionSummaryCardProps {
  summary: DecompositionSummary
  className?: string
}

export function DecompositionSummaryCard({
  summary,
  className,
}: DecompositionSummaryCardProps) {
  const summaryText = getDecompositionSummaryText(summary)

  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {summaryText}
    </p>
  )
}
