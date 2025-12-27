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

/**
 * Generate a qualitative summary of verification results
 */
function generateSummary(
  components: ClaimComponent[],
  decompositionSummary: DecompositionSummary
): { main: string; explanation: string | null } {
  const verifiableComponents = components.filter(
    c => c.type === "verifiable_fact" || c.type === "presupposition"
  )

  const nonVerifiableCount = decompositionSummary.valueJudgments + decompositionSummary.predictions

  if (verifiableComponents.length === 0) {
    if (nonVerifiableCount > 0) {
      return {
        main: `This statement contains ${nonVerifiableCount} opinion${nonVerifiableCount > 1 ? "s" : ""} or prediction${nonVerifiableCount > 1 ? "s" : ""} that cannot be objectively verified.`,
        explanation: "Opinions and predictions express subjective views or future expectations that cannot be fact-checked.",
      }
    }
    return {
      main: "No verifiable claims were identified in this statement.",
      explanation: null,
    }
  }

  // Count verdicts by category
  const verdictCounts: Record<string, number> = {}
  let unverifiedCount = 0

  for (const component of verifiableComponents) {
    if (component.verdict) {
      const category = mapBackendCategory(component.verdict.category)
      verdictCounts[category] = (verdictCounts[category] || 0) + 1
    } else {
      unverifiedCount++
    }
  }

  // Build summary parts
  const parts: string[] = []

  // Sort categories by priority (most concerning first)
  const sortedCategories = Object.entries(verdictCounts)
    .sort(([a], [b]) => categoryPriority[a as VerificationCategory] - categoryPriority[b as VerificationCategory])

  for (const [category, count] of sortedCategories) {
    const displayName = categoryDisplayNames[category as VerificationCategory] || category
    parts.push(`${count} ${displayName}`)
  }

  if (unverifiedCount > 0) {
    parts.push(`${unverifiedCount} not yet verified`)
  }

  const claimWord = verifiableComponents.length === 1 ? "claim" : "claims"
  let main = `Of ${verifiableComponents.length} verifiable ${claimWord}: ${parts.join(", ")}.`

  if (nonVerifiableCount > 0) {
    const opinionWord = nonVerifiableCount === 1 ? "opinion/prediction" : "opinions/predictions"
    main += ` This statement also contains ${nonVerifiableCount} ${opinionWord}.`
  }

  // Generate explanation based on the primary verdict
  let explanation: string | null = null
  if (sortedCategories.length > 0) {
    const primaryCategory = sortedCategories[0][0] as VerificationCategory
    explanation = categoryExplanations[primaryCategory] || null
  }

  return { main, explanation }
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
  const { main, explanation } = generateSummary(components, decompositionSummary)
  const warnings = detectWarnings(components, originalClaim)

  // Use the API summary if available and substantive, otherwise fall back to generated explanation
  const displayExplanation = apiSummary && apiSummary.length > 20 ? apiSummary : explanation

  return (
    <div className={cn("space-y-4", className)}>
      {/* Qualitative Summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Summary
        </h4>
        <p className="text-sm leading-relaxed">
          {main}
        </p>
        {displayExplanation && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {displayExplanation}
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
