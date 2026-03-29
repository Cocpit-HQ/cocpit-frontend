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
  isDark?: boolean // Optional
  loading?: boolean
}

export function SkillModal({ isOpen, onClose, initialSkills = [], onSave, loading = false }: SkillModalProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [currentInput, setCurrentInput] = useState("")

  useEffect(() => {
    if (isOpen) {
      setSkills(initialSkills)
      setCurrentInput("")
    }
  }, [isOpen, initialSkills])

  if (!isOpen) return null

  const handleTagsChange = (newTags: string[]) => {
    setSkills(newTags)
  }

  const handleSave = () => {
    const pending = currentInput.trim();
    const finalSkills = [...skills];
    if (pending && !finalSkills.includes(pending)) {
      finalSkills.push(pending);
    }
    onSave(finalSkills);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl border shadow-lg bg-card border-border">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Edit Skills</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <SkillTagInput
            initialTags={skills}
            onTagsChange={handleTagsChange}
            onInputChange={setCurrentInput}
          />
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-muted bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground border-0"
          >
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
}
