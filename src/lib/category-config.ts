import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  ShieldX
} from "lucide-react"

export type VerificationCategory =
  | "verified"
  | "likely-verified"
  | "inconclusive"
  | "mixed-evidence"
  | "unverifiable"
  | "likely-false"
  | "false"
  | "satire-parody"

export interface CategoryConfig {
  label: string
  description: string
  color: string
  gradient: string
  textColor: string
  icon: typeof CheckCircle2
  microcopy: string
}

export const categoryConfig: Record<VerificationCategory, CategoryConfig> = {
  "verified": {
    label: "Verified",
    description: "Strong evidence supports this claim",
    color: "#14B8A6", // Deep Teal-Green
    gradient: "from-teal-600/20 via-emerald-600/20 to-green-600/20",
    textColor: "text-teal-600 dark:text-teal-400",
    icon: ShieldCheck,
    microcopy: "This checks out. Here's what we found."
  },
  "likely-verified": {
    label: "Likely Verified",
    description: "Substantial evidence supports this, with minor gaps",
    color: "#10B981", // Emerald
    gradient: "from-emerald-500/20 via-teal-500/20 to-cyan-500/20",
    textColor: "text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
    microcopy: "This appears solid. Most evidence points this way."
  },
  "inconclusive": {
    label: "Inconclusive",
    description: "Unable to reach a clear determination",
    color: "#F59E0B", // Warm Amber/Gold
    gradient: "from-amber-500/20 via-yellow-500/20 to-orange-400/20",
    textColor: "text-amber-600 dark:text-amber-400",
    icon: ShieldAlert,
    microcopy: "We couldn't reach a clear conclusion on this."
  },
  "mixed-evidence": {
    label: "Mixed Evidence",
    description: "Conflicting evidence across sources",
    color: "#F97316", // Orange
    gradient: "from-orange-500/20 via-amber-500/20 to-yellow-500/20",
    textColor: "text-orange-600 dark:text-orange-400",
    icon: AlertCircle,
    microcopy: "We're seeing conflicting information. Here's what we know."
  },
  "unverifiable": {
    label: "Unverifiable",
    description: "Insufficient evidence to make a determination",
    color: "#64748B", // Warm Slate
    gradient: "from-slate-500/20 via-gray-500/20 to-zinc-500/20",
    textColor: "text-slate-600 dark:text-slate-400",
    icon: ShieldQuestion,
    microcopy: "We couldn't find enough to say for sure."
  },
  "likely-false": {
    label: "Likely False",
    description: "Evidence contradicts key elements of this claim",
    color: "#DC2626", // Red
    gradient: "from-red-500/20 via-rose-500/20 to-pink-500/20",
    textColor: "text-red-600 dark:text-red-400",
    icon: XCircle,
    microcopy: "This doesn't match the evidence. Here's why."
  },
  "false": {
    label: "False",
    description: "Strong evidence contradicts this claim",
    color: "#BE123C", // Deep Red-Rose
    gradient: "from-rose-600/20 via-red-600/20 to-pink-600/20",
    textColor: "text-rose-700 dark:text-rose-400",
    icon: ShieldX,
    microcopy: "This has been debunked. Here's the evidence."
  },
  "satire-parody": {
    label: "Satire/Parody",
    description: "Content is intentionally humorous or satirical",
    color: "#8B5CF6", // Purple
    gradient: "from-purple-500/20 via-violet-500/20 to-indigo-500/20",
    textColor: "text-purple-600 dark:text-purple-400",
    icon: HelpCircle,
    microcopy: "This is satire or parody, not meant as factual."
  }
}

// Helper function to get category config
export function getCategoryConfig(category: VerificationCategory): CategoryConfig {
  return categoryConfig[category]
}

// Helper function to get confidence score color based on value
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "from-teal-500 to-emerald-600"
  if (confidence >= 60) return "from-emerald-500 to-teal-500"
  if (confidence >= 40) return "from-amber-500 to-orange-500"
  if (confidence >= 20) return "from-orange-500 to-red-500"
  return "from-slate-400 to-slate-500"
}
