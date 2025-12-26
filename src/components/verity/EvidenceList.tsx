"use client"

import { useState } from "react"
import { ChevronDown, CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface Evidence {
  id: string
  text: string
  type: "supporting" | "contradicting" | "neutral"
}

interface EvidenceListProps {
  evidence: Evidence[]
  className?: string
  defaultExpanded?: boolean
}

export function EvidenceList({
  evidence,
  className,
  defaultExpanded = false
}: EvidenceListProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const getIcon = (type: Evidence["type"]) => {
    switch (type) {
      case "supporting":
        return CheckCircle2
      case "contradicting":
        return XCircle
      case "neutral":
        return MinusCircle
    }
  }

  const getColorClass = (type: Evidence["type"]) => {
    switch (type) {
      case "supporting":
        return "text-teal-600 dark:text-teal-400"
      case "contradicting":
        return "text-rose-600 dark:text-rose-400"
      case "neutral":
        return "text-slate-600 dark:text-slate-400"
    }
  }

  if (evidence.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <Button
        variant="ghost"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full justify-between hover:bg-muted/50"
      >
        <span className="font-medium text-sm">
          Evidence Points ({evidence.length})
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform",
            isExpanded && "rotate-180"
          )}
        />
      </Button>

      {isExpanded && (
        <ol className="space-y-3 list-none">
          {evidence.map((item, index) => {
            const Icon = getIcon(item.type)
            const colorClass = getColorClass(item.type)

            return (
              <li key={item.id} className="flex items-start gap-3 group">
                <div className="shrink-0 flex items-center gap-2 min-w-[2rem]">
                  <span className="text-xs font-mono text-muted-foreground w-4 text-right">
                    {index + 1}
                  </span>
                  <Icon className={cn("w-4 h-4", colorClass)} />
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 flex-1">
                  {item.text}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
