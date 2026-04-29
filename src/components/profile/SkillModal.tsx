"use client"

import React, { useState, useEffect, useMemo } from "react"
import { X, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SkillModalProps {
  isOpen: boolean
  onClose: () => void
  initialSkills?: string[]
  onSave: (skills: string[]) => void
  loading?: boolean
}

const SUGGESTED_SKILLS = [
  "Figma", "React", "Flutter", "Excel", "Photoshop",
  "Illustrator", "Adobe XD", "Adobe effects", "Node.js", "TypeScript",
  "Python", "SQL", "Git", "AWS", "Docker"
]

export function SkillModal({ isOpen, onClose, initialSkills = [], onSave, loading = false }: SkillModalProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialSkills)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const skillsPerPage = 8

  useEffect(() => {
    if (isOpen) {
      setSelectedSkills(initialSkills)
      setSearchQuery("")
      setCurrentPage(1)
    }
  }, [isOpen, initialSkills])

  const allSkills = useMemo(() => {
    const combined = [...SUGGESTED_SKILLS]
    selectedSkills.forEach(skill => {
      if (!combined.includes(skill)) {
        combined.push(skill)
      }
    })
    return combined
  }, [selectedSkills])

  const filteredSkills = useMemo(() => {
    const filtered = allSkills.filter(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    const query = searchQuery.trim()
    const exactMatch = allSkills.some(s => s.toLowerCase() === query.toLowerCase())
    
    if (query && !exactMatch) {
      return [query, ...filtered]
    }
    
    return filtered
  }, [allSkills, searchQuery])

  const paginatedSkills = useMemo(() => {
    const start = (currentPage - 1) * skillsPerPage
    return filteredSkills.slice(start, start + skillsPerPage)
  }, [filteredSkills, currentPage])

  const totalPages = Math.max(1, Math.ceil(filteredSkills.length / skillsPerPage))

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-[460px] h-[454px] rounded-[24px] bg-white shadow-2xl relative flex flex-col p-4">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-[#FF6B6B] hover:scale-110 transition-transform z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex-1 flex flex-col items-center pt-4 w-full">
          {/* Header */}
          <h2 className="text-[18px] font-medium leading-[26px] text-black mb-1 font-[family-name:var(--font-poppins)] text-center">
            Add skills
          </h2>
          <p className="text-[14px] text-[#6B7280] mb-5 font-[family-name:var(--font-poppins)]">
            Help us match you with better opportunities
          </p>

          {/* Search Bar */}
          <div className="w-full h-[40px] flex items-center justify-between px-[16px] py-[8px] rounded-[24px] border border-[#6B7280] mb-5 focus-within:border-[#6366F1] transition-colors bg-white">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  e.preventDefault()
                  const query = searchQuery.trim()
                  const existing = allSkills.find(s => s.toLowerCase() === query.toLowerCase())
                  const skillToAdd = existing || query
                  if (!selectedSkills.includes(skillToAdd)) {
                    setSelectedSkills(prev => [...prev, skillToAdd])
                  }
                  setSearchQuery("")
                }
              }}
              className="flex-1 bg-transparent border-none p-0 focus:ring-0 outline-none text-[#111827] placeholder:text-[#6B7280] text-[14px]"
            />
            <Search className="w-5 h-5 text-[#6B7280] ml-2 flex-shrink-0" />
          </div>

          {/* Skills Grid */}
          <div className="w-full flex-1 flex flex-wrap justify-center content-start items-start gap-3 mb-4">
            {paginatedSkills.map((skill) => {
              const isSelected = selectedSkills.includes(skill)
              const isCustom = !allSkills.includes(skill)
              return (
                <button
                  key={skill}
                  onClick={() => {
                    toggleSkill(skill)
                    if (isCustom) {
                      setSearchQuery("")
                    }
                  }}
                  className={cn(
                    "h-fit px-6 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-200 border",
                    isSelected 
                      ? "bg-[#818CF8] border-[#818CF8] text-white shadow-sm"
                      : "bg-[#F3F7FF] border-[#F3F7FF] text-[#6366F1] hover:bg-[#E0E7FF]"
                  )}
                >
                  {skill}
                </button>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="w-full flex justify-end items-center gap-4 mb-5 pr-2">
            <div className="flex items-center gap-4 text-[#DDE3EA]">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className={cn("transition-colors", currentPage > 1 ? "text-[#818CF8]" : "text-[#DDE3EA]")}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-[#111827] font-medium text-sm">
                {String(currentPage).padStart(2, '0')}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className={cn("transition-colors", currentPage < totalPages ? "text-[#818CF8]" : "text-[#DDE3EA]")}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="w-full flex justify-center gap-4 mt-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-[142px] h-[40px] rounded-[24px] bg-white border border-[#818CF8] text-[#818CF8] hover:bg-[#F9FAFB] font-semibold transition-all flex items-center justify-center gap-[10px] px-[16px] py-[8px]"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const finalSkills = [...selectedSkills]
                const query = searchQuery.trim()
                if (query && !finalSkills.some(s => s.toLowerCase() === query.toLowerCase())) {
                  finalSkills.push(query)
                }
                onSave(finalSkills)
              }}
              disabled={loading}
              className="w-[142px] h-[40px] rounded-[24px] bg-[#6366F1] border border-white hover:bg-[#4F46E5] text-white font-semibold shadow-md transition-all flex items-center justify-center gap-[10px] px-[16px] py-[8px]"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

