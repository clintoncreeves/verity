"use client"

import { useState } from "react"
import { VerityHeader } from "@/components/verity/VerityHeader"
import { InputSection } from "@/components/verity/InputSection"
import { ResultCard, type VerificationResult } from "@/components/verity/ResultCard"
import type { VerificationCategory } from "@/lib/category-config"

// Map backend categories to frontend categories
const categoryMap: Record<string, VerificationCategory> = {
  verified_fact: "verified",
  expert_consensus: "likely-verified",
  partially_verified: "partially-verified",
  opinion: "unverifiable",
  speculation: "unverifiable",
  disputed: "mixed-evidence",
  likely_false: "likely-false",
  confirmed_false: "false",
}

function mapCategory(backendCategory: string): VerificationCategory {
  return categoryMap[backendCategory] || "unverifiable"
}

export default function Home() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [quotaExceeded, setQuotaExceeded] = useState(false)

  const handleVerify = async (input: { type: "text" | "image" | "url"; content: string }) => {
    setIsVerifying(true)
    setResult(null)
    setQuotaExceeded(false)

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: input.type,
          content: input.content,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check for daily quota exceeded
        if (data.error?.code === "DAILY_QUOTA_EXCEEDED") {
          setQuotaExceeded(true)
          return
        }
        throw new Error(data.error?.message || "Verification failed")
      }

      // Transform API response to component format
      const apiResult = data.data

      // Extract decomposition from first claim (primary claim)
      const primaryClaim = apiResult.claims?.[0]
      const decomposition = primaryClaim?.components && primaryClaim?.decompositionSummary
        ? {
            components: primaryClaim.components,
            summary: primaryClaim.decompositionSummary,
            // Include verification verdict - use claim-level if available, otherwise overall
            claimVerdict: {
              category: mapCategory(primaryClaim.category || apiResult.overallCategory),
              confidence: primaryClaim.confidence || apiResult.overallConfidence || 0,
            },
          }
        : undefined

      const transformedResult: VerificationResult = {
        category: mapCategory(apiResult.overallCategory),
        confidence: apiResult.overallConfidence,
        summary: apiResult.summary,
        reasoning: primaryClaim?.reasoning || "",
        sources: apiResult.sources?.map((s: { name: string; url: string; type: string; reliability: number }) => ({
          name: s.name,
          url: s.url,
          type: s.type,
          reliability: s.reliability,
          domain: new URL(s.url).hostname,
        })) || [],
        evidence: apiResult.evidence?.map((e: string, i: number) => ({
          id: String(i + 1),
          text: e,
          type: "contextual" as const,
        })) || [],
        factChecks: apiResult.existingFactChecks?.map((fc: { org: string; verdict: string; date: string; url: string }, i: number) => ({
          id: String(i + 1),
          organization: fc.org,
          verdict: fc.verdict,
          verdictCategory: "mixed",
          date: fc.date,
          url: fc.url,
          summary: "",
        })) || [],
        verificationId: apiResult.id,
        verifiedAt: apiResult.verifiedAt,
        decomposition,
      }

      setResult(transformedResult)
    } catch (error) {
      console.error("Verification error:", error)
      // Could add error state handling here
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 max-w-3xl">
        <VerityHeader />

        <div className="space-y-6 mt-4">
          <InputSection onVerify={handleVerify} isLoading={isVerifying} />

          {quotaExceeded && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-6 text-center">
              <div className="text-4xl mb-3">🌙</div>
              <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Verity will be back tomorrow!
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                We&apos;ve reached our daily search limit. The quota resets at midnight UTC.
              </p>
            </div>
          )}

          {result && !quotaExceeded && (
            <ResultCard result={result} />
          )}

          {!result && !quotaExceeded && (
            <p className="text-center text-sm text-muted-foreground py-4">
              Enter a claim or statement to begin verification
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
