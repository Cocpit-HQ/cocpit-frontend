"use client"

import React, { useState, useEffect } from "react"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SkillModalProps {
  isOpen: boolean
  onClose: () => void
  initialSkills?: string[]
  onSave: (skills: string[]) => void
  isDark?: boolean
}

export function SkillModal({ isOpen, onClose, initialSkills = [], onSave, isDark }: SkillModalProps) {
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [newSkill, setNewSkill] = useState("")

  useEffect(() => {
    if (isOpen) {
      setSkills(initialSkills)
    }
  }, [isOpen, initialSkills])

  if (!isOpen) return null

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddSkill()
    }
  }

  const inputStyles = isDark
    ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-500"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"

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
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a skill..."
              className={inputStyles}
            />
            <Button onClick={handleAddSkill} type="button" size="icon" className="shrink-0 bg-[#5B7CFF] hover:bg-[#4A6BEF] text-white">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[100px] content-start">
            {skills.map((skill) => (
              <div
                key={skill}
                className={`flex items-center px-3 py-1.5 rounded-full text-sm cursor-default transition-all ${
                  isDark ? "bg-[#171c28] text-gray-200 border border-[#2d3548]" : "bg-gray-100 text-gray-800"
                }`}
              >
                <span>{skill}</span>
              </div>
            ))}
            {skills.length === 0 && (
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"} w-full text-center py-4`}>
                No skills added yet.
              </p>
            )}
          </div>
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