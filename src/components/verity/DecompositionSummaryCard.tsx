"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { componentTypeConfig } from "@/lib/component-type-config"
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
  const verifiabilityPercent = Math.round(summary.overallVerifiability * 100)
  const summaryText = getDecompositionSummaryText(summary)

  // Calculate percentages for the stacked bar
  const total = summary.totalComponents || 1
  const factPercent = (summary.verifiableFacts / total) * 100
  const opinionPercent = (summary.valueJudgments / total) * 100
  const predictionPercent = (summary.predictions / total) * 100
  const assumedPercent = (summary.presuppositions / total) * 100

  return (
    <Card className={cn("border-dashed bg-muted/20", className)}>
      <CardContent className="pt-4 space-y-4">
        {/* Main summary sentence */}
        <p className="text-sm font-medium text-foreground">{summaryText}</p>

        {/* Verifiability meter */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Verifiability</span>
            <span>{verifiabilityPercent}% checkable</span>
          </div>
          <Progress value={verifiabilityPercent} className="h-2" />
        </div>

        {/* Component breakdown bar */}
        {summary.totalComponents > 1 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Breakdown</p>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              {summary.verifiableFacts > 0 && (
                <div
                  className="bg-teal-500 transition-all"
                  style={{ width: `${factPercent}%` }}
                  title={`${summary.verifiableFacts} fact(s)`}
                />
              )}
              {summary.valueJudgments > 0 && (
                <div
                  className="bg-purple-500 transition-all"
                  style={{ width: `${opinionPercent}%` }}
                  title={`${summary.valueJudgments} opinion(s)`}
                />
              )}
              {summary.predictions > 0 && (
                <div
                  className="bg-amber-500 transition-all"
                  style={{ width: `${predictionPercent}%` }}
                  title={`${summary.predictions} prediction(s)`}
                />
              )}
              {summary.presuppositions > 0 && (
                <div
                  className="bg-slate-400 transition-all"
                  style={{ width: `${assumedPercent}%` }}
                  title={`${summary.presuppositions} assumption(s)`}
                />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
