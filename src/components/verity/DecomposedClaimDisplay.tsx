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
import type { ClaimComponent, DecompositionSummary } from "@/types/verity"

interface DecomposedClaimDisplayProps {
  components: ClaimComponent[]
  summary: DecompositionSummary
  className?: string
}

export function DecomposedClaimDisplay({
  components,
  summary,
  className,
}: DecomposedClaimDisplayProps) {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)

  if (components.length === 0) {
    return null
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary sentence */}
      <div className="flex flex-wrap gap-2 items-center">
        {summary.verifiableFacts > 0 && (
          <Badge
            className={cn(
              "border",
              componentTypeConfig.verifiable_fact.bgColor,
              componentTypeConfig.verifiable_fact.color,
              componentTypeConfig.verifiable_fact.borderColor
            )}
          >
            {summary.verifiableFacts} Fact{summary.verifiableFacts > 1 ? "s" : ""}
          </Badge>
        )}
        {summary.valueJudgments > 0 && (
          <Badge
            className={cn(
              "border",
              componentTypeConfig.value_judgment.bgColor,
              componentTypeConfig.value_judgment.color,
              componentTypeConfig.value_judgment.borderColor
            )}
          >
            {summary.valueJudgments} Opinion{summary.valueJudgments > 1 ? "s" : ""}
          </Badge>
        )}
        {summary.predictions > 0 && (
          <Badge
            className={cn(
              "border",
              componentTypeConfig.prediction.bgColor,
              componentTypeConfig.prediction.color,
              componentTypeConfig.prediction.borderColor
            )}
          >
            {summary.predictions} Prediction{summary.predictions > 1 ? "s" : ""}
          </Badge>
        )}
        {summary.presuppositions > 0 && (
          <Badge
            className={cn(
              "border",
              componentTypeConfig.presupposition.bgColor,
              componentTypeConfig.presupposition.color,
              componentTypeConfig.presupposition.borderColor
            )}
          >
            {summary.presuppositions} Assumed
          </Badge>
        )}
      </div>

      {/* Component breakdown */}
      <TooltipProvider delayDuration={200}>
        <div className="space-y-2">
          {components.map((component) => {
            const config = componentTypeConfig[component.type]
            const Icon = config.icon
            const isHovered = hoveredComponent === component.id

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
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] shrink-0", config.color)}
                    >
                      {getComponentTypeLetter(component.type)}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {component.explanation || config.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

    </div>
  )
}
