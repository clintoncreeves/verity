"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileText, Image, Link2, Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface InputSectionProps {
  onVerify?: (input: { type: "text" | "image" | "url"; content: string }) => void
  isLoading?: boolean
}

export function InputSection({ onVerify, isLoading = false }: InputSectionProps) {
  const [textInput, setTextInput] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeTab, setActiveTab] = useState<"text" | "image" | "url">("text")

  const handleTextSubmit = () => {
    if (textInput.trim() && onVerify) {
      onVerify({ type: "text", content: textInput })
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim() && onVerify) {
      onVerify({ type: "url", content: urlInput })
    }
  }

  const handleImageSubmit = () => {
    if (imageFile && onVerify) {
      onVerify({ type: "image", content: imageFile.name })
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.size <= 10 * 1024 * 1024 && file.type.startsWith("image/")) {
        setImageFile(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      if (file.size <= 10 * 1024 * 1024 && file.type.startsWith("image/")) {
        setImageFile(file)
      }
    }
  }

  const charCount = textInput.length
  const charLimit = 2000
  const isOverLimit = charCount > charLimit

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="text" className="gap-2">
            <FileText className="w-4 h-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="image" className="gap-2">
            <Image className="w-4 h-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link2 className="w-4 h-4" />
            URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4 p-6">
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
        </TabsContent>

        <TabsContent value="image" className="space-y-4 p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
          >
            <input
              type="file"
              id="image-upload"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              {imageFile ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{imageFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Drop an image here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP, or GIF up to 10MB
                  </p>
                </div>
              )}
            </label>
          </div>
          <Button
            onClick={handleImageSubmit}
            disabled={!imageFile || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Consulting sources...
              </>
            ) : (
              "Verify Image"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="url" className="space-y-4 p-6">
          <div className="space-y-2">
            <input
              type="url"
              placeholder="https://example.com/article"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex h-12 w-full rounded-md border border-input bg-transparent px-4 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Enter a URL to an article, social media post, or webpage
            </p>
          </div>
          <Button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Consulting sources...
              </>
            ) : (
              "Verify URL"
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
