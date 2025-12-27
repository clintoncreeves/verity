"use client"

import { useState, useEffect } from "react"
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface TrendingHeadline {
  title: string
  source: string
  url: string
  publishedAt: string
}

interface SuggestionBannerProps {
  onTryClaim: (claim: string) => void
  className?: string
}

export function SuggestionBanner({ onTryClaim, className }: SuggestionBannerProps) {
  const [headlines, setHeadlines] = useState<TrendingHeadline[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

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

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === 0 ? headlines.length - 1 : prev - 1))
  }

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentIndex((prev) => (prev === headlines.length - 1 ? 0 : prev + 1))
  }

  if (isLoading) {
    return (
      <div className={cn(
        "w-full rounded-lg border border-muted bg-muted/30 p-3 animate-pulse",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 bg-muted rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted rounded w-24" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      </div>
    )
  }

  if (headlines.length === 0) {
    return null
  }

  const currentHeadline = headlines[currentIndex]

  return (
    <div className={cn(
      "w-full rounded-lg border border-teal-200 dark:border-teal-800",
      "bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50",
      className
    )}>
      <div className="flex items-center">
        {/* Previous button */}
        {headlines.length > 1 && (
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 transition-colors rounded-l-lg"
            aria-label="Previous headline"
          >
            <ChevronLeft className="w-4 h-4 text-teal-500" />
          </button>
        )}

        {/* Main content - clickable */}
        <button
          onClick={() => onTryClaim(currentHeadline.title)}
          className="flex-1 text-left p-3 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-teal-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                  Trending
                </span>
                <span className="text-xs text-muted-foreground">
                  {currentHeadline.source}
                </span>
                {headlines.length > 1 && (
                  <span className="text-xs text-muted-foreground/60">
                    {currentIndex + 1}/{headlines.length}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/90 line-clamp-2">
                &ldquo;{currentHeadline.title}&rdquo;
              </p>
              <p className="text-xs text-teal-500 mt-1">
                Click to verify →
              </p>
            </div>
          </div>
        </button>

        {/* Next button */}
        {headlines.length > 1 && (
          <button
            onClick={goToNext}
            className="p-2 hover:bg-teal-100/50 dark:hover:bg-teal-900/30 transition-colors rounded-r-lg"
            aria-label="Next headline"
          >
            <ChevronRight className="w-4 h-4 text-teal-500" />
          </button>
        )}
      </div>
    </div>
  )
}
