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
import type { ClaimComponent, DecompositionSummary, ClaimComponentType } from "@/types/verity"

interface DecomposedClaimDisplayProps {
  components: ClaimComponent[]
  summary: DecompositionSummary
  className?: string
}

// Priority order: opinions/predictions first (not verifiable), then facts
const TYPE_ORDER: ClaimComponentType[] = [
  'value_judgment',
  'prediction',
  'presupposition',
  'verifiable_fact',
]

export function DecomposedClaimDisplay({
  components,
  summary,
  className,
}: DecomposedClaimDisplayProps) {
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null)

  if (components.length === 0) {
    return null
  }

  // Separate components into non-verifiable and verifiable
  const opinions = components.filter(c => c.type === 'value_judgment' || c.type === 'prediction')
  const facts = components.filter(c => c.type === 'verifiable_fact' || c.type === 'presupposition')

  const renderComponent = (component: ClaimComponent) => {
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
              {opinions.map(renderComponent)}
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
                    {summary.verifiableFacts} Fact{summary.verifiableFacts > 1 ? "s" : ""}
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
              {facts.map(renderComponent)}
            </div>
          </div>
        )}
      </TooltipProvider>
    </div>
  )
}
