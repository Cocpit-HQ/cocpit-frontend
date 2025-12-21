"use client"

import React, { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkillTagInput } from "@/components/ui/skill-tag-input"

interface SkillModalProps {
  isOpen: boolean
  onClose: () => void
  initialSkills?: string[]
  onSave: (skills: string[]) => void
  isDark?: boolean
}

export function SkillModal({ isOpen, onClose, initialSkills = [], onSave, isDark }: SkillModalProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills)

  useEffect(() => {
    if (isOpen) {
      setSkills(initialSkills)
    }
  }, [isOpen, initialSkills])

  if (!isOpen) return null

  const handleTagsChange = (newTags: string[]) => {
    setSkills(newTags)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-xl border shadow-lg ${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Edit Skills</h2>
          <button onClick={onClose} className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <SkillTagInput initialTags={skills} onTagsChange={handleTagsChange} isDark={!!isDark} />
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            onClick={onClose}
            className={isDark ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28] bg-transparent" : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"}
          >
            Cancel
          </Button>
          <Button onClick={() => onSave(skills)} className="bg-[#5B7CFF] hover:bg-[#4A6BEF] text-white border-0">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}