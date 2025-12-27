import { VerityLogo } from "./VerityLogo"

interface VerityHeaderProps {
  onReset?: () => void
}

export function VerityHeader({ onReset }: VerityHeaderProps) {
  return (
    <button
      onClick={onReset}
      className="flex flex-col items-center justify-center py-4 px-4 w-full cursor-pointer hover:opacity-80 transition-opacity"
      aria-label="Return to home"
    >
      <div className="mb-2">
        <VerityLogo variant="full" size="medium" />
      </div>
      <p className="text-sm text-muted-foreground">
        Separate fact from framing.
      </p>
    </button>
  )
}
