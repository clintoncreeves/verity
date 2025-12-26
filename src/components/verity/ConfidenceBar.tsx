"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { getConfidenceColor } from "@/lib/category-config"
import { cn } from "@/lib/utils"

interface ConfidenceBarProps {
  confidence: number
  label?: string
  className?: string
  animate?: boolean
}

export function ConfidenceBar({
  confidence,
  label = "Confidence",
  className,
  animate = true
}: ConfidenceBarProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : confidence)

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setDisplayValue(confidence)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [confidence, animate])

  const gradientClass = getConfidenceColor(confidence)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-mono">{label}</span>
        <span className="font-mono font-semibold">{Math.round(displayValue)}%</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30">
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-1000 ease-out",
            gradientClass
          )}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  )
}
