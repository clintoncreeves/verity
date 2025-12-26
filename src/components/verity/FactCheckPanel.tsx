import { ExternalLink, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface FactCheck {
  id: string
  organization: string
  organizationLogo?: string
  verdict: string
  verdictCategory: "true" | "mostly-true" | "mixed" | "mostly-false" | "false"
  date: string
  url: string
  summary?: string
}

interface FactCheckPanelProps {
  factChecks: FactCheck[]
  className?: string
}

export function FactCheckPanel({ factChecks, className }: FactCheckPanelProps) {
  const getVerdictColor = (category: FactCheck["verdictCategory"]) => {
    switch (category) {
      case "true":
        return "bg-teal-600/20 text-teal-700 dark:text-teal-400 border-teal-600/30"
      case "mostly-true":
        return "bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-600/30"
      case "mixed":
        return "bg-amber-600/20 text-amber-700 dark:text-amber-400 border-amber-600/30"
      case "mostly-false":
        return "bg-orange-600/20 text-orange-700 dark:text-orange-400 border-orange-600/30"
      case "false":
        return "bg-rose-600/20 text-rose-700 dark:text-rose-400 border-rose-600/30"
    }
  }

  if (factChecks.length === 0) return null

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Existing Fact-Checks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {factChecks.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="shrink-0">
              {check.organizationLogo ? (
                <img
                  src={check.organizationLogo}
                  alt={check.organization}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{check.organization}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {check.date}
                  </p>
                </div>
                <a
                  href={check.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors shrink-0"
                  aria-label="View fact-check"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <Badge
                variant="outline"
                className={cn(
                  "font-medium text-xs border",
                  getVerdictColor(check.verdictCategory)
                )}
              >
                {check.verdict}
              </Badge>

              {check.summary && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {check.summary}
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
