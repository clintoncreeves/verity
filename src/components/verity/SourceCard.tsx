import { ExternalLink, Globe, FileText, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface Source {
  name: string
  url?: string
  type: "article" | "academic" | "organization" | "other"
  reliability: number // 0-100
  domain?: string
  publishDate?: string
}

interface SourceCardProps {
  source: Source
  className?: string
}

export function SourceCard({ source, className }: SourceCardProps) {
  const getTypeIcon = () => {
    switch (source.type) {
      case "article":
        return FileText
      case "academic":
        return Building2
      case "organization":
        return Building2
      default:
        return Globe
    }
  }

  const getTypeLabel = () => {
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
    if (score >= 80) return "text-teal-600 dark:text-teal-400"
    if (score >= 60) return "text-blue-600 dark:text-blue-400"
    if (score >= 40) return "text-amber-600 dark:text-amber-400"
    return "text-slate-600 dark:text-slate-400"
  }

  const getReliabilityBg = (score: number) => {
    if (score >= 80) return "bg-teal-600/20"
    if (score >= 60) return "bg-blue-600/20"
    if (score >= 40) return "bg-amber-600/20"
    return "bg-slate-600/20"
  }

  const TypeIcon = getTypeIcon()

  return (
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
                <h4 className="font-medium text-sm leading-tight line-clamp-2">
                  {source.name}
                </h4>
                {source.domain && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {source.domain}
                  </p>
                )}
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

            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel()}
              </Badge>

              <Badge variant="outline" className={cn("text-xs font-mono", getReliabilityColor(source.reliability))}>
                Reliability {source.reliability}%
              </Badge>

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
  )
}
