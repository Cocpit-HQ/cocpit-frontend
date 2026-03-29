"use client"

import React, { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"

interface SkillTagInputProps {
  initialTags?: string[]
  onTagsChange: (tags: string[]) => void
  onInputChange?: (value: string) => void
  isDark?: boolean // Optional
}

export function SkillTagInput({ initialTags = [], onTagsChange, onInputChange }: SkillTagInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (onInputChange) onInputChange(e.target.value)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const newTag = inputValue.trim()
      if (newTag && !tags.includes(newTag)) {
        const newTags = [...tags, newTag]
        setTags(newTags)
        onTagsChange(newTags)
        setInputValue("")
        if (onInputChange) onInputChange("")
      } else {
        setInputValue("")
        if (onInputChange) onInputChange("")
      }
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      const newTags = tags.slice(0, -1)
      setTags(newTags)
      onTagsChange(newTags)
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove)
    setTags(newTags)
    onTagsChange(newTags)
  }

  const inputStyles = "bg-input border-border text-foreground placeholder-muted-foreground"

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border border-border ${inputStyles}`}
    >
      {tags.map((tag) => (
        <div
          key={tag}
          className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded-md text-sm"
        >
          <span>{tag}</span>
          <button onClick={() => removeTag(tag)} className="p-0.5 rounded-full hover:bg-black/20">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? "Add skills..." : ""}
        className="bg-transparent outline-none flex-grow text-foreground placeholder-muted-foreground"
      />
    </div>
  )
}
