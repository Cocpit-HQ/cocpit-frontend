"use client"

import React, { useState, KeyboardEvent } from "react"
import { X } from "lucide-react"

interface SkillTagInputProps {
  initialTags?: string[]
  onTagsChange: (tags: string[]) => void
  isDark: boolean
}

export function SkillTagInput({ initialTags = [], onTagsChange, isDark }: SkillTagInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags)
  const [inputValue, setInputValue] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
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
      } else {
        setInputValue("")
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

  const inputStyles = isDark
    ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-500"
    : "bg-[#0b1020]/5 border-gray-300 text-gray-900 placeholder-gray-500"

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-2 rounded-lg border ${
        isDark ? "border-[#2d3548]" : "border-gray-300"
      } ${inputStyles}`}
    >
      {tags.map((tag) => (
        <div
          key={tag}
          className="flex items-center gap-1 bg-[#5B7CFF]/20 text-[#5B7CFF] px-2 py-1 rounded-md text-sm"
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
        className="bg-transparent outline-none flex-grow"
      />
    </div>
  )
}
