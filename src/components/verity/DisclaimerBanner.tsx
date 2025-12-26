import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface DisclaimerBannerProps {
  className?: string
}

export function DisclaimerBanner({ className }: DisclaimerBannerProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-lg border border-muted bg-muted/30 p-4",
      className
    )}>
      <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground leading-relaxed">
        This analysis is probabilistic, not definitive. Use as a starting point, not the final word.
        Verity helps you see what can be verified—the rest is up to your judgment.
      </p>
    </div>
  )
}
