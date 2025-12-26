import { VerityLogo } from "./VerityLogo"

export function VerityHeader() {
  return (
    <div className="flex flex-col items-center justify-center py-4 px-4">
      <div className="mb-2">
        <VerityLogo variant="full" size="medium" />
      </div>
      <p className="text-sm text-muted-foreground">
        Separate fact from framing.
      </p>
    </div>
  )
}
