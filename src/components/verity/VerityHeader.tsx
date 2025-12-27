import { VerityLogo } from "./VerityLogo"

interface VerityHeaderProps {
  onReset?: () => void
}

export function VerityHeader({ onReset }: VerityHeaderProps) {
  return (
    <button
      onClick={onReset}
      className="flex flex-col items-center justify-center py-4 lg:py-6 px-4 w-full cursor-pointer hover:opacity-80 transition-opacity"
      aria-label="Return to home"
    >
      {/* Responsive logo: medium on mobile, large on lg+ screens */}
      <div className="mb-2 lg:mb-3">
        <div className="block lg:hidden">
          <VerityLogo variant="full" size="medium" />
        </div>
        <div className="hidden lg:block">
          <VerityLogo variant="full" size="large" />
        </div>
      </div>
      <p className="text-sm lg:text-base text-muted-foreground">
        Separate fact from framing.
      </p>
    </button>
  )
}
