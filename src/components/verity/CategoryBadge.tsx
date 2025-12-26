import { getCategoryConfig, type VerificationCategory } from "@/lib/category-config"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CategoryBadgeProps {
  category: VerificationCategory
  className?: string
  showIcon?: boolean
}

export function CategoryBadge({ category, className, showIcon = true }: CategoryBadgeProps) {
  const config = getCategoryConfig(category)
  const Icon = config.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-none bg-gradient-to-r font-medium",
        config.gradient,
        config.textColor,
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
      {config.label}
    </Badge>
  )
}
