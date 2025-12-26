"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface InputSectionProps {
  onVerify?: (input: { type: "text" | "image" | "url"; content: string }) => void
  isLoading?: boolean
}

export function InputSection({ onVerify, isLoading = false }: InputSectionProps) {
  const [textInput, setTextInput] = useState("")

  const handleTextSubmit = () => {
    if (textInput.trim() && onVerify) {
      onVerify({ type: "text", content: textInput })
    }
  }

  const charCount = textInput.length
  const charLimit = 2000
  const isOverLimit = charCount > charLimit

  return (
    <Card className="w-full max-w-3xl mx-auto p-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter a claim, statement, or piece of information to verify..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="min-h-[200px] resize-none font-sans"
            maxLength={charLimit + 100}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Maximum 2,000 characters
            </span>
            <span className={cn(
              "font-mono",
              isOverLimit ? "text-destructive" : "text-muted-foreground"
            )}>
              {charCount} / {charLimit}
            </span>
          </div>
        </div>
        <Button
          onClick={handleTextSubmit}
          disabled={!textInput.trim() || isOverLimit || isLoading}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Consulting sources...
            </>
          ) : (
            "Verify"
          )}
        </Button>
      </div>
    </Card>
  )
}
