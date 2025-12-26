"use client"

import { useState } from "react"
import { VerityHeader } from "@/components/verity/VerityHeader"
import { InputSection } from "@/components/verity/InputSection"
import { ResultCard, type VerificationResult } from "@/components/verity/ResultCard"
import { DisclaimerBanner } from "@/components/verity/DisclaimerBanner"
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

  const handleVerify = async (input: { type: "text" | "image" | "url"; content: string }) => {
    setIsVerifying(true)
    setResult(null)

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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <VerityHeader />

        <div className="space-y-8 mt-8">
          <InputSection onVerify={handleVerify} isLoading={isVerifying} />

          {result && (
            <>
              <DisclaimerBanner variant="warning" className="max-w-3xl mx-auto" />
              <ResultCard result={result} />
              <DisclaimerBanner className="max-w-3xl mx-auto" />
            </>
          )}

          {!result && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Enter a claim or statement to begin verification
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
