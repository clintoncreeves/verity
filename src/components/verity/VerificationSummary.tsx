import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { ClaimComponent, DecompositionSummary } from "@/types/verity"
import type { VerificationCategory } from "@/lib/category-config"

// Map backend categories to frontend categories
const backendCategoryMap: Record<string, VerificationCategory> = {
  verified_fact: "verified",
  expert_consensus: "likely-verified",
  partially_verified: "inconclusive",
  opinion: "unverifiable",
  speculation: "unverifiable",
  disputed: "mixed-evidence",
  likely_false: "likely-false",
  confirmed_false: "false",
}

function mapBackendCategory(backendCategory: string): VerificationCategory {
  return backendCategoryMap[backendCategory] || "unverifiable"
}

// Category display names for summary
const categoryDisplayNames: Record<VerificationCategory, string> = {
  "verified": "verified",
  "likely-verified": "likely verified",
  "inconclusive": "inconclusive",
  "unverifiable": "unverifiable",
  "mixed-evidence": "disputed",
  "likely-false": "likely false",
  "false": "false",
  "satire-parody": "satire/parody",
}

// Category priority for ordering (most concerning first)
const categoryPriority: Record<VerificationCategory, number> = {
  "false": 0,
  "likely-false": 1,
  "mixed-evidence": 2,
  "inconclusive": 3,
  "likely-verified": 4,
  "verified": 5,
  "unverifiable": 6,
  "satire-parody": 7,
}

interface Warning {
  type: "holocaust-denial" | "vaccine-misinfo" | "conspiracy" | "general"
  title: string
  message: string
}

/**
 * Detect problematic patterns in the claim components
 */
function detectWarnings(components: ClaimComponent[], originalClaim?: string): Warning[] {
  const warnings: Warning[] = []
  const claimText = originalClaim?.toLowerCase() || ""
  const componentTexts = components.map(c => c.text.toLowerCase()).join(" ")
  const allText = `${claimText} ${componentTexts}`

  // Holocaust denial patterns (soft denial)
  const holocaustPatterns = [
    /6\s*million/i,
    /holocaust.*(?:death|toll|figure|number|statistic)/i,
    /nuremberg.*(?:trial|procedure|issue)/i,
    /(?:death|toll).*(?:exaggerat|inflat|overstat)/i,
    /(?:historian|scholar).*(?:question|debate|dispute).*(?:holocaust|6 million)/i,
  ]

  const hasHolocaustContent = holocaustPatterns.some(p => p.test(allText))
  const hasQuestioningFraming = /(?:question|scholarly caution|debate|dispute|evolv)/i.test(allText)

  if (hasHolocaustContent && hasQuestioningFraming) {
    warnings.push({
      type: "holocaust-denial",
      title: "Content echoes Holocaust denial narratives",
      message: "The established death toll of approximately 6 million Jewish victims is supported by extensive Nazi documentation, survivor testimony, perpetrator confessions, physical evidence, and decades of rigorous historical scholarship. Claims questioning these figures echo well-documented denial tactics.",
    })
  }

  // Vaccine-autism misinformation
  const vaccineAutismPatterns = [
    /vaccine.*autism/i,
    /autism.*vaccine/i,
    /vaccine.*(?:cause|trigger|link)/i,
  ]

  if (vaccineAutismPatterns.some(p => p.test(allText))) {
    // Check if any component was marked false or likely-false
    const hasFalseVaccineComponent = components.some(c => {
      const category = c.verdict ? mapBackendCategory(c.verdict.category) : null
      return (category === "false" || category === "likely-false") &&
             /vaccine|autism/i.test(c.text)
    })

    if (!hasFalseVaccineComponent) {
      warnings.push({
        type: "vaccine-misinfo",
        title: "Contains vaccine misinformation claims",
        message: "The claimed link between vaccines and autism has been thoroughly debunked by numerous large-scale studies involving millions of children. The original study was retracted and its author lost his medical license for fraud.",
      })
    }
  }

  return warnings
}

// Explanations for each verdict category
const categoryExplanations: Record<VerificationCategory, string> = {
  "verified": "Strong evidence from multiple reliable sources supports this claim.",
  "likely-verified": "Most evidence supports this claim, though some minor gaps exist.",
  "inconclusive": "Available evidence is insufficient to make a clear determination.",
  "unverifiable": "This claim cannot be verified through available sources.",
  "mixed-evidence": "Different sources provide conflicting information about this claim.",
  "likely-false": "Most evidence contradicts this claim.",
  "false": "Strong evidence from reliable sources contradicts this claim.",
  "satire-parody": "This content appears to be intentionally satirical or humorous.",
}

// Human-readable verdict descriptions for narrative
const verdictNarrative: Record<string, string> = {
  verified_fact: "is verified",
  expert_consensus: "is supported by expert consensus",
  partially_verified: "is partially verified",
  opinion: "is an opinion that cannot be objectively verified",
  speculation: "is speculation about the future",
  disputed: "is disputed by credible sources",
  likely_false: "is likely false based on available evidence",
  confirmed_false: "is false",
}

// Type labels for narrative
const typeNarrative: Record<string, string> = {
  verifiable_fact: "The claim that",
  presupposition: "The underlying assumption that",
  value_judgment: "The opinion that",
  prediction: "The prediction that",
}

/**
 * Truncate text to a maximum length, adding ellipsis if needed
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3).trim() + "..."
}

/**
 * Generate a narrative summary explaining each component's disposition
 */
function generateSummary(
  components: ClaimComponent[],
  decompositionSummary: DecompositionSummary
): { main: string; breakdown: string[] } {
  const breakdown: string[] = []

  if (components.length === 0) {
    return {
      main: "No verifiable claims were identified in this statement.",
      breakdown: [],
    }
  }

  // Generate a sentence for each component
  for (const component of components) {
    const typePrefix = typeNarrative[component.type] || "The statement that"
    const claimText = truncateText(component.text, 80)

    if (component.type === "value_judgment" || component.type === "prediction") {
      // Non-verifiable components
      const label = component.type === "value_judgment" ? "opinion" : "prediction"
      breakdown.push(`${typePrefix} "${claimText}" is a${label === "opinion" ? "n" : ""} ${label} and cannot be objectively verified.`)
    } else if (component.verdict) {
      // Verifiable components with verdicts
      const verdictText = verdictNarrative[component.verdict.category] || "has been analyzed"
      breakdown.push(`${typePrefix} "${claimText}" ${verdictText}.`)
    } else {
      // Verifiable but not yet verified
      breakdown.push(`${typePrefix} "${claimText}" has not yet been verified.`)
    }
  }

  // Build the main summary line
  const verifiableCount = components.filter(
    c => c.type === "verifiable_fact" || c.type === "presupposition"
  ).length
  const opinionCount = decompositionSummary.valueJudgments + decompositionSummary.predictions

  let main = `This statement was broken down into ${components.length} component${components.length > 1 ? "s" : ""}`

  if (verifiableCount > 0 && opinionCount > 0) {
    main += `: ${verifiableCount} verifiable claim${verifiableCount > 1 ? "s" : ""} and ${opinionCount} opinion${opinionCount > 1 ? "s" : ""}/prediction${opinionCount > 1 ? "s" : ""}.`
  } else if (verifiableCount > 0) {
    main += ` for verification.`
  } else {
    main += `, all of which are opinions or predictions that cannot be objectively fact-checked.`
  }

  return { main, breakdown }
}

interface VerificationSummaryProps {
  components: ClaimComponent[]
  decompositionSummary: DecompositionSummary
  originalClaim?: string
  apiSummary?: string // The LLM-generated reasoning from the classifier
  className?: string
}

export function VerificationSummary({
  components,
  decompositionSummary,
  originalClaim,
  apiSummary,
  className,
}: VerificationSummaryProps) {
  const { main, breakdown } = generateSummary(components, decompositionSummary)
  const warnings = detectWarnings(components, originalClaim)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Analysis Summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Analysis
        </h4>
        <p className="text-sm leading-relaxed mb-3">
          {main}
        </p>

        {/* Component-by-component breakdown */}
        {breakdown.length > 0 && (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {breakdown.map((item, index) => (
              <li key={index} className="leading-relaxed pl-3 border-l-2 border-muted-foreground/20">
                {item}
              </li>
            ))}
          </ul>
        )}

        {/* Optional API-generated reasoning as additional context */}
        {apiSummary && apiSummary.length > 20 && (
          <p className="text-sm text-muted-foreground mt-4 pt-3 border-t leading-relaxed">
            {apiSummary}
          </p>
        )}
      </div>

      {/* Warnings */}
      {warnings.map((warning, index) => (
        <Alert key={index} variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            {warning.title}
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
            {warning.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
