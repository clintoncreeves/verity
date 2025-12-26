import { VerityLogo } from "./VerityLogo"

export function VerityHeader() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-6">
        <VerityLogo variant="full" size="large" />
      </div>
      <p className="text-lg text-muted-foreground font-medium">
        Separate fact from framing.
      </p>
    </div>
  )
}
