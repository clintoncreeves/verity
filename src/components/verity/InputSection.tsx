"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface InputSectionProps {
  onVerify?: (input: { type: "text" | "image" | "url"; content: string }) => void
  isLoading?: boolean
  initialValue?: string
  onValueChange?: (value: string) => void
}

export function InputSection({ onVerify, isLoading = false, initialValue, onValueChange }: InputSectionProps) {
  const [textInput, setTextInput] = useState(initialValue || "")

  // Sync with external value changes
  useEffect(() => {
    if (initialValue !== undefined) {
      setTextInput(initialValue)
    }
  }, [initialValue])

  const handleChange = (value: string) => {
    setTextInput(value)
    onValueChange?.(value)
  }

  const charCount = textInput.length
  const charLimit = 2000
  const isOverLimit = charCount > charLimit

  const handleTextSubmit = () => {
    if (textInput.trim() && onVerify && !isLoading && !isOverLimit) {
      onVerify({ type: "text", content: textInput })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto p-4">
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Textarea
            placeholder="Enter a claim, statement, or piece of information to verify..."
            value={textInput}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none font-sans"
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
