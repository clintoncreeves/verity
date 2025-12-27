"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { TrendingUp, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { ClaimComponent, DecompositionSummary } from "@/types/verity"

interface CachedResult {
  id: string
  category: string
  confidence: number
  summary: string
  components?: ClaimComponent[]
  decompositionSummary?: DecompositionSummary
}

interface TrendingHeadline {
  title: string
  source: string
  url: string
  publishedAt: string
  cached?: CachedResult
}

interface SuggestionBannerProps {
  onTryClaim: (claim: string, cached?: CachedResult) => void
  className?: string
}

function getDecompositionLabel(cached: CachedResult): { label: string; color: string; borderColor: string; icon: typeof CheckCircle2 } {
  const summary = cached.decompositionSummary
  const components = cached.components

  if (summary && components) {
    const verifiableComponents = components.filter(
      c => c.type === "verifiable_fact" || c.type === "presupposition"
    )

    let falseCount = 0
    let verifiedCount = 0
    let mixedCount = 0

    for (const c of verifiableComponents) {
      if (c.verdict) {
        const cat = c.verdict.category
        if (cat === "confirmed_false" || cat === "likely_false") {
          falseCount++
        } else if (cat === "verified_fact" || cat === "expert_consensus") {
          verifiedCount++
        } else {
          mixedCount++
        }
      }
    }

    if (falseCount > 0) {
      const falseLabel = falseCount === 1 ? "1 likely false" : `${falseCount} likely false`
      return {
        label: `${verifiableComponents.length} claims, ${falseLabel}`,
        color: "text-rose-600 dark:text-rose-400",
        borderColor: "border-rose-300 dark:border-rose-600",
        icon: XCircle
      }
    }

    if (mixedCount > 0 || summary.valueJudgments > 0 || summary.predictions > 0) {
      const parts: string[] = []
      if (summary.verifiableFacts > 0) parts.push(`${summary.verifiableFacts} fact${summary.verifiableFacts > 1 ? "s" : ""}`)
      if (summary.valueJudgments > 0) parts.push(`${summary.valueJudgments} opinion${summary.valueJudgments > 1 ? "s" : ""}`)
      return {
        label: parts.join(", ") || `${summary.totalComponents} parts`,
        color: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-300 dark:border-amber-600",
        icon: AlertCircle
      }
    }

    if (verifiedCount > 0) {
      return {
        label: `${verifiedCount} verified`,
        color: "text-teal-600 dark:text-teal-400",
        borderColor: "border-teal-300 dark:border-teal-600",
        icon: CheckCircle2
      }
    }

    return {
      label: `${summary.totalComponents} parts`,
      color: "text-slate-500",
      borderColor: "border-slate-300",
      icon: FileText
    }
  }

  return categoryDisplayFallback[cached.category] || {
    label: "Analyzed",
    color: "text-slate-500",
    borderColor: "border-slate-300",
    icon: FileText
  }
}

const categoryDisplayFallback: Record<string, { label: string; color: string; borderColor: string; icon: typeof CheckCircle2 }> = {
  verified_fact: { label: "Verified", color: "text-teal-600 dark:text-teal-400", borderColor: "border-teal-300 dark:border-teal-600", icon: CheckCircle2 },
  expert_consensus: { label: "Likely True", color: "text-teal-600 dark:text-teal-400", borderColor: "border-teal-300 dark:border-teal-600", icon: CheckCircle2 },
  partially_verified: { label: "Inconclusive", color: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-300 dark:border-amber-600", icon: AlertCircle },
  disputed: { label: "Disputed", color: "text-amber-600 dark:text-amber-400", borderColor: "border-amber-300 dark:border-amber-600", icon: AlertCircle },
  likely_false: { label: "Likely False", color: "text-rose-600 dark:text-rose-400", borderColor: "border-rose-300 dark:border-rose-600", icon: XCircle },
  confirmed_false: { label: "False", color: "text-rose-600 dark:text-rose-400", borderColor: "border-rose-300 dark:border-rose-600", icon: XCircle },
  opinion: { label: "Opinion", color: "text-slate-500", borderColor: "border-slate-300", icon: AlertCircle },
  speculation: { label: "Speculation", color: "text-slate-500", borderColor: "border-slate-300", icon: AlertCircle },
}

// Card dimensions
const CARD_WIDTH = 300
const GAP = 12

export function SuggestionBanner({ onTryClaim, className }: SuggestionBannerProps) {
  const [headlines, setHeadlines] = useState<TrendingHeadline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function fetchTrending() {
      try {
        const response = await fetch("/api/trending")
        const data = await response.json()

        if (data.success && Array.isArray(data.data)) {
          setHeadlines(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch trending:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrending()
  }, [])

  const handlePause = useCallback(() => {
    setIsPaused(true)
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, 3000)
  }, [])

  const handleResume = useCallback(() => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    setIsPaused(false)
  }, [])

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className={cn("w-full overflow-hidden", className)}>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <TrendingUp className="w-3 h-3" />
          <span>Loading trending news...</span>
        </div>
        <div className="flex gap-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shrink-0 h-[140px] w-[300px] bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (headlines.length === 0) {
    return null
  }

  // Double the headlines for seamless loop
  const doubleHeadlines = [...headlines, ...headlines]

  // Calculate animation duration: 3.5 seconds per card
  const singleSetWidth = headlines.length * (CARD_WIDTH + GAP)
  const animationDuration = headlines.length * 3.5

  return (
    <div
      className={cn("w-full overflow-hidden", className)}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
      onTouchStart={handlePause}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <TrendingUp className="w-3 h-3" />
        <span>Trending News</span>
      </div>

      {/* CSS-animated carousel track */}
      <div
        className="flex gap-3"
        style={{
          animation: `carousel-scroll ${animationDuration}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
          width: 'fit-content',
        }}
      >
        {doubleHeadlines.map((headline, index) => {
          const categoryInfo = headline.cached
            ? getDecompositionLabel(headline.cached)
            : null

          return (
            <button
              key={`${headline.title}-${index}`}
              onClick={() => onTryClaim(headline.title, headline.cached)}
              className={cn(
                "shrink-0 text-left px-5 py-4 rounded-lg border transition-all duration-200",
                "hover:shadow-md hover:border-primary/30 hover:scale-[1.02]",
                "bg-background/80 backdrop-blur-sm",
                "w-[300px] min-h-[140px] flex flex-col"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] text-muted-foreground truncate">
                  {headline.source}
                </span>
                {categoryInfo && (
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] px-2 py-0.5 h-5 gap-1", categoryInfo.color, categoryInfo.borderColor)}
                  >
                    <categoryInfo.icon className="w-3 h-3" />
                    {categoryInfo.label}
                  </Badge>
                )}
              </div>
              <p className="text-sm lg:text-base font-medium leading-relaxed line-clamp-3 flex-1">
                {headline.title}
              </p>
            </button>
          )
        })}
      </div>

      {/* Keyframe animation injected via style tag */}
      <style jsx>{`
        @keyframes carousel-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${singleSetWidth}px);
          }
        }
      `}</style>
    </div>
  )
}
