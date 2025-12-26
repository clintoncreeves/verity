# Verity UI Components

Core UI components for the Verity fact-checking application, designed following the brand guidelines in `verity-brand-identity.md`.

## Brand Philosophy

These components embody Verity's personality: **The Wise Librarian** - curious, calm, rigorous, and warm. The visual design follows the principle of "archival sophistication meets warm intelligence."

## Design Principles

1. **Spectrum, Not Binary** - Uses gradients and ranges instead of hard color blocks
2. **Evidence Over Assertion** - Shows sources and reasoning, doesn't just tell
3. **Calm Authority** - Library-like aesthetic with warm, approachable touches
4. **Unexpected Sophistication** - Draws from archival, cartographic, and scientific notation aesthetics

## Color Palette

- **Deep Ink** (#0F1419): Primary text, dark mode base
- **Warm Paper** (#FAFAF8): Light mode base
- **Soft Slate** (#64748B): Secondary text
- **Clarity Blue** (#4A90D9): Interactive elements
- **Verification Green** (#14B8A6): Verified claims
- **Caution Amber** (#F59E0B): Partially verified
- **Uncertainty Gray** (#64748B): Unverifiable
- **Alert Crimson** (#BE123C): False claims

## Components

### VerityHeader
Main header with logo and tagline "See what's solid."

```tsx
import { VerityHeader } from "@/components/verity"

<VerityHeader />
```

### InputSection
Multi-tab input component for text, image, and URL verification.

```tsx
import { InputSection } from "@/components/verity"

<InputSection
  onVerify={(input) => handleVerification(input)}
  isLoading={false}
/>
```

Features:
- Text tab: 2000 character limit with counter
- Image tab: Drag-and-drop zone for PNG, JPG, WebP, GIF up to 10MB
- URL tab: URL input with validation
- Loading state with "Consulting sources..." microcopy

### ResultCard
Main verification result display with category, confidence, and analysis.

```tsx
import { ResultCard, type VerificationResult } from "@/components/verity"

const result: VerificationResult = {
  category: "verified",
  confidence: 92,
  summary: "This checks out. Here's what we found.",
  reasoning: "Multiple credible sources confirm...",
  sources: [...],
  evidence: [...],
  factChecks: [...]
}

<ResultCard result={result} />
```

### CategoryBadge
Visual indicator for verification categories with gradient backgrounds.

```tsx
import { CategoryBadge } from "@/components/verity"

<CategoryBadge category="verified" showIcon={true} />
```

Supports 8 categories:
- verified
- likely-verified
- partially-verified
- mixed-evidence
- unverifiable
- likely-false
- false
- satire-parody

### ConfidenceBar
Animated confidence score visualization with gradient fill.

```tsx
import { ConfidenceBar } from "@/components/verity"

<ConfidenceBar
  confidence={72}
  label="Confidence"
  animate={true}
/>
```

### SourceCard
Individual source display with reliability score and metadata.

```tsx
import { SourceCard, type Source } from "@/components/verity"

const source: Source = {
  name: "The New York Times",
  url: "https://...",
  type: "article",
  reliability: 92,
  domain: "nytimes.com",
  publishDate: "2024-03-15"
}

<SourceCard source={source} />
```

### EvidenceList
Collapsible list of evidence points with support/contradict indicators.

```tsx
import { EvidenceList, type Evidence } from "@/components/verity"

const evidence: Evidence[] = [
  {
    id: "1",
    text: "Multiple studies confirm...",
    type: "supporting"
  }
]

<EvidenceList
  evidence={evidence}
  defaultExpanded={false}
/>
```

### FactCheckPanel
Display of existing fact-checks from external organizations.

```tsx
import { FactCheckPanel, type FactCheck } from "@/components/verity"

const factChecks: FactCheck[] = [
  {
    id: "1",
    organization: "Snopes",
    verdict: "Mostly True",
    verdictCategory: "mostly-true",
    date: "2024-03-10",
    url: "https://...",
    summary: "The claim is accurate..."
  }
]

<FactCheckPanel factChecks={factChecks} />
```

### DisclaimerBanner
Epistemic transparency banner.

```tsx
import { DisclaimerBanner } from "@/components/verity"

<DisclaimerBanner />
```

Displays: "This analysis is probabilistic, not definitive. Use as a starting point, not the final word."

## Category Configuration

The category system is defined in `/src/lib/category-config.ts` and maps each verification category to:
- Label and description
- Color scheme with gradients
- Icon (from lucide-react)
- Brand-appropriate microcopy

```tsx
import { getCategoryConfig, getConfidenceColor } from "@/lib/category-config"

const config = getCategoryConfig("verified")
// Returns: { label, description, color, gradient, textColor, icon, microcopy }
```

## Installation

The components require these dependencies:

```bash
npm install @radix-ui/react-tabs @radix-ui/react-progress lucide-react
```

## Styling

All components use Tailwind CSS and are designed to work with both light and dark modes. The color system is defined in `globals.css` with CSS variables that adapt to the current theme.
