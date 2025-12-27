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
  // New decomposition data
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

// Generate a compact summary label for the decomposition
function getDecompositionLabel(cached: CachedResult): { label: string; color: string; borderColor: string; icon: typeof CheckCircle2 } {
  const summary = cached.decompositionSummary
  const components = cached.components

  // If we have decomposition data, use it
  if (summary && components) {
    const verifiableComponents = components.filter(
      c => c.type === "verifiable_fact" || c.type === "presupposition"
    )

    // Count verdicts from verifiable components
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

    // Determine the display based on what we found
    if (falseCount > 0) {
      return {
        label: `${verifiableComponents.length} claims`,
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

    // Default: show component count
    return {
      label: `${summary.totalComponents} parts`,
      color: "text-slate-500",
      borderColor: "border-slate-300",
      icon: FileText
    }
  }

  // Fallback to old category-based display for cached results without decomposition
  return categoryDisplayFallback[cached.category] || {
    label: "Analyzed",
    color: "text-slate-500",
    borderColor: "border-slate-300",
    icon: FileText
  }
}

// Fallback for old cached results without decomposition data
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

// Card width + gap for calculating scroll positions
const CARD_WIDTH = 300
const GAP = 12

export function SuggestionBanner({ onTryClaim, className }: SuggestionBannerProps) {
  const [headlines, setHeadlines] = useState<TrendingHeadline[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
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

  // Smooth auto-scroll using requestAnimationFrame
  useEffect(() => {
    if (isPaused || headlines.length === 0 || !scrollRef.current) return

    const scrollContainer = scrollRef.current
    let animationFrameId: number
    const scrollSpeed = 1.5 // pixels per frame (~90px/sec at 60fps)

    // Calculate the width of one set of headlines
    const oneSetWidth = headlines.length * (CARD_WIDTH + GAP)

    const scroll = () => {
      if (scrollContainer && !isPaused) {
        scrollContainer.scrollLeft += scrollSpeed

        // Seamless loop: when we've scrolled past one full set, jump back
        // This creates an infinite loop effect
        if (scrollContainer.scrollLeft >= oneSetWidth) {
          scrollContainer.scrollLeft = scrollContainer.scrollLeft - oneSetWidth
        }
      }
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isPaused, headlines])

  // Handle pause with auto-resume after inactivity
  const handlePause = useCallback(() => {
    setIsPaused(true)

    // Clear any existing timeout
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }

    // Auto-resume after 3 seconds of inactivity
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false)
    }, 3000)
  }, [])

  const handleResume = useCallback(() => {
    // Clear the auto-resume timeout when user explicitly leaves
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current)
    }
    setIsPaused(false)
  }, [])

  // Cleanup timeout on unmount
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
            <div key={i} className="shrink-0 h-[140px] w-[300px] lg:w-[360px] xl:w-[400px] bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (headlines.length === 0) {
    return null
  }

  // Triple the headlines to ensure smooth infinite scroll
  // This gives us enough buffer so the reset is never visible
  const tripleHeadlines = [...headlines, ...headlines, ...headlines]

  return (
    <div
      className={cn("w-full overflow-hidden", className)}
      onMouseEnter={handlePause}
      onMouseLeave={handleResume}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <TrendingUp className="w-3 h-3" />
        <span>Trending News</span>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide touch-pan-x"
        style={{ scrollBehavior: 'auto' }}
        onTouchStart={handlePause}
        onTouchEnd={() => {
          // Keep paused briefly after touch to allow manual scrolling
          if (pauseTimeoutRef.current) {
            clearTimeout(pauseTimeoutRef.current)
          }
          pauseTimeoutRef.current = setTimeout(() => {
            setIsPaused(false)
          }, 3000)
        }}
        onScroll={handlePause}
      >
        {tripleHeadlines.map((headline, index) => {
          const categoryInfo = headline.cached
            ? getDecompositionLabel(headline.cached)
            : null

          return (
            <button
              key={`${headline.title}-${index}`}
              onClick={() => onTryClaim(headline.title, headline.cached)}
              className={cn(
                "shrink-0 text-left px-5 py-4 rounded-lg border transition-colors",
                "hover:shadow-md hover:border-primary/30",
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
    </div>
  )
}
