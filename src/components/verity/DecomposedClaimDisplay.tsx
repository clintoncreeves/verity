"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  componentTypeConfig,
  getComponentTypeLetter,
} from "@/lib/component-type-config"
import { categoryConfig, type VerificationCategory } from "@/lib/category-config"
import type { ClaimComponent, DecompositionSummary, ClaimComponentType } from "@/types/verity"

// Map backend categories to frontend categories (same as in page.tsx)
const backendCategoryMap: Record<string, VerificationCategory> = {
  verified_fact: "verified",
  expert_consensus: "likely-verified",
  partially_verified: "partially-verified",
  opinion: "unverifiable",
  speculation: "unverifiable",
  disputed: "mixed-evidence",
  likely_false: "likely-false",
  confirmed_false: "false",
}

function mapBackendCategory(backendCategory: string): VerificationCategory {
  return backendCategoryMap[backendCategory] || "unverifiable"
}

// Verdict info passed from parent
interface ClaimVerdict {
  category: VerificationCategory
  confidence: number
}

interface DecomposedClaimDisplayProps {
  components: ClaimComponent[]
  summary: DecompositionSummary
  claimVerdict?: ClaimVerdict
  className?: string
}

// Priority order: opinions/predictions first (not verifiable), then facts
const TYPE_ORDER: ClaimComponentType[] = [
  'value_judgment',
  'prediction',
  'presupposition',
  'verifiable_fact',
]

// Get a compact verdict badge for verifiable components
function getVerdictBadge(verdict: ClaimVerdict) {
  const config = categoryConfig[verdict.category]
  const VerdictIcon = config.icon

  // Determine badge color based on category
  const isPositive = verdict.category === 'verified' || verdict.category === 'likely-verified'
  const isNegative = verdict.category === 'false' || verdict.category === 'likely-false'
  const isMixed = verdict.category === 'mixed-evidence' || verdict.category === 'partially-verified'

  const badgeClass = cn(
    "text-[10px] shrink-0 flex items-center gap-1",
    isPositive && "text-teal-600 dark:text-teal-400 border-teal-300 dark:border-teal-600",
    isNegative && "text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-600",
    isMixed && "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600",
    !isPositive && !isNegative && !isMixed && "text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600"
  )

  return { config, VerdictIcon, badgeClass, isPositive, isNegative }
}

export function DecomposedClaimDisplay({
  components,
  summary,
  claimVerdict,
  className,
}: DecomposedClaimDisplayProps) {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)

  if (components.length === 0) {
    return null
  }

  // Separate components into non-verifiable and verifiable
  const opinions = components.filter(c => c.type === 'value_judgment' || c.type === 'prediction')
  const facts = components.filter(c => c.type === 'verifiable_fact' || c.type === 'presupposition')

  const renderComponent = (component: ClaimComponent, showVerdict: boolean = false) => {
    const config = componentTypeConfig[component.type]
    const Icon = config.icon
    const isHovered = hoveredComponent === component.id

    // Get verdict styling for verifiable components
    // Prefer component-specific verdict, fall back to claim-level verdict
    // Component verdicts use backend category names, so we need to map them
    const componentVerdict = component.verdict
      ? { category: mapBackendCategory(component.verdict.category), confidence: component.verdict.confidence }
      : claimVerdict
    const verdictInfo = showVerdict && componentVerdict ? getVerdictBadge(componentVerdict) : null

    return (
      <Tooltip key={component.id}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-all cursor-help",
              config.bgColor,
              config.borderColor,
              isHovered && "ring-2 ring-offset-2"
            )}
            onMouseEnter={() => setHoveredComponent(component.id)}
            onMouseLeave={() => setHoveredComponent(null)}
          >
            <div className={cn("mt-0.5", config.color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">
                "{component.text}"
              </p>
              <p className={cn("text-xs mt-1", config.color)}>
                {config.shortLabel}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Show verdict badge for verifiable facts after verification */}
              {verdictInfo && (
                <Badge
                  variant="outline"
                  className={verdictInfo.badgeClass}
                >
                  <verdictInfo.VerdictIcon className="w-3 h-3" />
                  {verdictInfo.config.label}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn("text-[10px]", config.color)}
              >
                {getComponentTypeLetter(component.type)}
              </Badge>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{config.label}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {component.explanation || config.description}
          </p>
          {verdictInfo && componentVerdict && (
            <p className={cn("text-xs mt-2 font-medium", verdictInfo.badgeClass)}>
              Verdict: {verdictInfo.config.label} ({Math.round(componentVerdict.confidence)}% confidence)
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      <TooltipProvider delayDuration={200}>
        {/* Opinions/Predictions section - shown first */}
        {opinions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-muted-foreground">Cannot be verified</h4>
              <div className="flex gap-1">
                {summary.valueJudgments > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      componentTypeConfig.value_judgment.color,
                      componentTypeConfig.value_judgment.borderColor
                    )}
                  >
                    {summary.valueJudgments} Opinion{summary.valueJudgments > 1 ? "s" : ""}
                  </Badge>
                )}
                {summary.predictions > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      componentTypeConfig.prediction.color,
                      componentTypeConfig.prediction.borderColor
                    )}
                  >
                    {summary.predictions} Prediction{summary.predictions > 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {opinions.map(c => renderComponent(c, false))}
            </div>
          </div>
        )}

        {/* Facts section - shown second */}
        {facts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-muted-foreground">Can be verified</h4>
              <div className="flex gap-1">
                {summary.verifiableFacts > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      componentTypeConfig.verifiable_fact.color,
                      componentTypeConfig.verifiable_fact.borderColor
                    )}
                  >
                    {summary.verifiableFacts} Claim{summary.verifiableFacts > 1 ? "s" : ""}
                  </Badge>
                )}
                {summary.presuppositions > 0 && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      componentTypeConfig.presupposition.color,
                      componentTypeConfig.presupposition.borderColor
                    )}
                  >
                    {summary.presuppositions} Assumed
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {/* Show verdict badges only on verifiable_fact components, not presuppositions */}
              {facts.map(c => renderComponent(c, c.type === 'verifiable_fact'))}
            </div>
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}
