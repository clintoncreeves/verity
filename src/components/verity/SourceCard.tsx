import { ExternalLink, Globe, FileText, Building2, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { RELIABILITY_CONFIG } from "@/lib/config/constants"
import type { Source } from "@/types/verity"

// Re-export Source type for backward compatibility
export type { Source }

interface SourceCardProps {
  source: Source
  className?: string
}

const RELIABILITY_EXPLANATION = `Reliability is based on:
• Source type (government, academic, news wire, etc.)
• Known track record for accuracy
• Use of secure connections (HTTPS)
• Recognition by fact-checkers

Higher scores indicate more established, accountable sources.`

export function SourceCard({ source, className }: SourceCardProps) {
  const getTypeIcon = () => {
    switch (source.type) {
      case "article":
      case "Major News Outlet":
      case "Local News":
        return FileText
      case "academic":
      case "Academic/Research":
      case "Scientific Publication":
        return Building2
      case "organization":
      case "Government Source":
      case "Nonprofit Organization":
        return Building2
      default:
        return Globe
    }
  }

  const getTypeLabel = () => {
    // Handle both old format and new format from source-evaluator
    if (source.type.includes(" ")) {
      // Already a label like "Major News Outlet"
      return source.type
    }
    switch (source.type) {
      case "article":
        return "Article"
      case "academic":
        return "Academic"
      case "organization":
        return "Organization"
      default:
        return "Source"
    }
  }

  const getReliabilityColor = (score: number) => {
    if (score >= RELIABILITY_CONFIG.HIGH) return "text-teal-600 dark:text-teal-400"
    if (score >= RELIABILITY_CONFIG.MEDIUM) return "text-blue-600 dark:text-blue-400"
    if (score >= RELIABILITY_CONFIG.LOW) return "text-amber-600 dark:text-amber-400"
    return "text-slate-600 dark:text-slate-400"
  }

  const getReliabilityBg = (score: number) => {
    if (score >= RELIABILITY_CONFIG.HIGH) return "bg-teal-600/20"
    if (score >= RELIABILITY_CONFIG.MEDIUM) return "bg-blue-600/20"
    if (score >= RELIABILITY_CONFIG.LOW) return "bg-amber-600/20"
    return "bg-slate-600/20"
  }

  const TypeIcon = getTypeIcon()

  return (
    <TooltipProvider delayDuration={200}>
      <Card className={cn("hover:shadow-md transition-shadow", className)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                getReliabilityBg(source.reliability)
              )}>
                <TypeIcon className={cn("w-5 h-5", getReliabilityColor(source.reliability))} />
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* Show title as headline if available, otherwise domain name */}
                  <h4 className="font-medium text-sm leading-tight line-clamp-2">
                    {source.title || source.name}
                  </h4>
                  {/* Show domain underneath the title */}
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {source.name}
                  </p>
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors shrink-0"
                    aria-label="Open source"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Show snippet if available */}
              {source.snippet && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {source.snippet}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {getTypeLabel()}
                </Badge>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-mono cursor-help flex items-center gap-1",
                        getReliabilityColor(source.reliability)
                      )}
                    >
                      Reliability {source.reliability}%
                      <Info className="w-3 h-3 opacity-60" />
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
                    <p className="text-xs">{RELIABILITY_EXPLANATION}</p>
                  </TooltipContent>
                </Tooltip>

                {source.publishDate && (
                  <span className="text-xs text-muted-foreground font-mono ml-auto">
                    {source.publishDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
