"use client"

import { useState } from "react"
import { VerityHeader } from "@/components/verity/VerityHeader"
import { InputSection } from "@/components/verity/InputSection"
import { ResultCard, type VerificationResult } from "@/components/verity/ResultCard"
import { DisclaimerBanner } from "@/components/verity/DisclaimerBanner"

export default function Home() {
  const [isVerifying, setIsVerifying] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const handleVerify = async (input: { type: "text" | "image" | "url"; content: string }) => {
    setIsVerifying(true)

    // Simulate API call with mock data
    setTimeout(() => {
      // Mock verification result
      const mockResult: VerificationResult = {
        category: "partially-verified",
        confidence: 72,
        summary: "The core claim has been verified by multiple credible sources, though some contextual details remain unclear. The primary assertion is supported by evidence, but additional nuance is needed for a complete understanding.",
        reasoning: "We found strong corroboration from reputable news organizations and academic sources. However, the specific numbers cited couldn't be independently verified, and the timeline mentioned differs slightly across sources.",
        sources: [
          {
            name: "The New York Times - Analysis of Climate Data",
            url: "https://example.com/nyt-article",
            type: "article",
            reliability: 92,
            domain: "nytimes.com",
            publishDate: "2024-03-15"
          },
          {
            name: "Nature Climate Change Journal",
            url: "https://example.com/nature-study",
            type: "academic",
            reliability: 95,
            domain: "nature.com",
            publishDate: "2024-02-28"
          },
          {
            name: "NOAA Climate Report",
            url: "https://example.com/noaa-report",
            type: "organization",
            reliability: 98,
            domain: "noaa.gov",
            publishDate: "2024-03-01"
          }
        ],
        evidence: [
          {
            id: "1",
            text: "Multiple peer-reviewed studies confirm the primary assertion about temperature trends over the past decade.",
            type: "supporting"
          },
          {
            id: "2",
            text: "Government climate data from NOAA and NASA corroborate the main findings.",
            type: "supporting"
          },
          {
            id: "3",
            text: "The specific percentage cited (47%) could not be found in original source material.",
            type: "contradicting"
          },
          {
            id: "4",
            text: "Timeline discrepancies exist between different reporting sources, with dates varying by 2-3 weeks.",
            type: "neutral"
          },
          {
            id: "5",
            text: "Independent fact-checkers at Snopes and PolitiFact rated similar claims as 'Mostly True'.",
            type: "supporting"
          }
        ],
        factChecks: [
          {
            id: "1",
            organization: "Snopes",
            verdict: "Mostly True",
            verdictCategory: "mostly-true",
            date: "2024-03-10",
            url: "https://example.com/snopes",
            summary: "The core claim is accurate, though some supporting details are imprecise."
          },
          {
            id: "2",
            organization: "PolitiFact",
            verdict: "Half True",
            verdictCategory: "mixed",
            date: "2024-03-12",
            url: "https://example.com/politifact",
            summary: "While the main assertion holds up, context is missing and some statistics are questionable."
          }
        ]
      }

      setResult(mockResult)
      setIsVerifying(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <VerityHeader />

        <div className="space-y-8 mt-8">
          <InputSection onVerify={handleVerify} isLoading={isVerifying} />

          {result && (
            <>
              <ResultCard result={result} />
              <DisclaimerBanner />
            </>
          )}

          {!result && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Enter a claim, upload an image, or paste a URL to begin verification
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
