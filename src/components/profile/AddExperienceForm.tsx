"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Experience } from "@/types/entities"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, ChevronDown } from "lucide-react"
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import LocationAutocomplete from "@/components/ui/LocationAutocomplete"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddExperienceFormProps {
  onCancel?: () => void
  onSave?: (data: Partial<Experience>) => void
  onDelete?: (id: string) => void
  isDark?: boolean
  initialData?: Experience | null
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 60 }, (_, i) => (currentYear - i).toString())

const workTypes = ["Full time", "Part-time", "Internship", "Freelance", "Contract"]
const workModes = ["Remote", "Hybrid", "On-site"]

export default function AddExperienceForm({ onCancel, onSave, onDelete, initialData }: AddExperienceFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    company_name: "",
    location: "",
    employment_type: "",
    work_mode: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    description: "",
  })
  const [currentlyWorking, setCurrentlyWorking] = useState(false)

  useEffect(() => {
    if (initialData) {
      const start = dayjs(initialData.start_date)
      const end = initialData.end_date ? dayjs(initialData.end_date) : null
      
      setFormData({
        title: initialData.title ?? "",
        company_name: initialData.company_name ?? "",
        location: initialData.location ?? "",
        employment_type: initialData.employment_type ?? "",
        work_mode: initialData.work_mode ?? "",
        startMonth: initialData.start_date ? months[start.month()] : "",
        startYear: initialData.start_date ? start.year().toString() : "",
        endMonth: end ? months[end.month()] : "",
        endYear: end ? end.year().toString() : "",
        description: initialData.description ?? "",
      })
      setCurrentlyWorking(!initialData.end_date)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const startMonthIdx = months.indexOf(formData.startMonth)
    const startDate = formData.startYear && startMonthIdx !== -1 
      ? dayjs(`${formData.startYear}-${startMonthIdx + 1}-01`).format("YYYY-MM-DD")
      : ""
      
    const endMonthIdx = months.indexOf(formData.endMonth)
    const endDate = !currentlyWorking && formData.endYear && endMonthIdx !== -1
      ? dayjs(`${formData.endYear}-${endMonthIdx + 1}-01`).format("YYYY-MM-DD")
      : null

    onSave?.({ 
      ...initialData, 
      title: formData.title,
      company_name: formData.company_name,
      location: formData.location,
      employment_type: formData.employment_type,
      work_mode: formData.work_mode,
      start_date: startDate,
      end_date: endDate,
      description: formData.description 
    })
  }

  const inputStyles = "bg-white border-[#E5E7EB] placeholder-[#6B7280] rounded-[16px] h-[48px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px]"
  const labelStyles = "text-[14px] font-medium text-[#111827] mb-1.5"
  
  const getSelectTextColor = (value: string) => value ? "text-[#111827]" : "text-[#6B7280]";

  const isFormValid = 
    formData.title.trim() !== "" && 
    formData.company_name.trim() !== "" && 
    formData.startMonth !== "" && 
    formData.startYear !== "";

  return (
    <div className="relative bg-white rounded-[24px] p-[16px] w-[800px] h-[918px] mx-auto shadow-sm flex flex-col overflow-hidden outline-none">
      <div className="flex-1 overflow-y-auto px-12 py-4 scrollbar-hide">
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-1 text-[#F87171] hover:bg-red-50 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 relative">
          <h2 className="text-[18px] leading-[26px] font-medium font-[family-name:var(--font-poppins)] text-[#000000] mb-1">Add experience</h2>
          <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">Update your professional information</p>
          
          <button 
            type="button"
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5E7EB] hover:bg-slate-50 transition-all text-[#6366F1] font-[family-name:var(--font-poppins)] text-[14px] font-medium"
          >
            <Plus className="w-4 h-4" />
            Add new role
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-[72px]">
            <div className="flex flex-col">
              <Label className={labelStyles}>Role</Label>
              <div className="relative">
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={cn(inputStyles, "pr-10 w-full")}
                  placeholder="e.g. Designer"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <Label className={labelStyles}>Company</Label>
              <div className="relative">
                <Input 
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  className={cn(inputStyles, "pr-10 w-full")}
                  placeholder="e.g. Google"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col">
            <Label className={labelStyles}>Location</Label>
            <LocationAutocomplete 
              value={formData.location}
              onSelect={(val) => setFormData(prev => ({ ...prev, location: val?.name || val || "" }))}
            />
          </div>

          <div className="space-y-2">
            <Label className={labelStyles}>Work type</Label>
            <div className="flex flex-wrap gap-3">
              {workTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, employment_type: type }))}
                  className={cn(
                    "h-[32px] px-4 rounded-[8px] text-[12px] font-medium transition-all duration-200 border border-transparent",
                    formData.employment_type === type 
                      ? "bg-[#EEF2FF] text-[#6366F1] border-[#6366F1]" 
                      : "bg-[#F3F7FF] text-[#6366F1] hover:bg-[#E0E7FF]"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelStyles}>Work mode</Label>
            <div className="flex flex-wrap gap-3">
              {workModes.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, work_mode: mode }))}
                  className={cn(
                    "h-[32px] px-4 rounded-[8px] text-[12px] font-medium transition-all duration-200 border border-transparent",
                    formData.work_mode === mode 
                      ? "bg-[#EEF2FF] text-[#6366F1] border-[#6366F1]" 
                      : "bg-[#F3F7FF] text-[#6366F1] hover:bg-[#E0E7FF]"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelStyles}>Start date</Label>
            <div className="grid grid-cols-2 gap-6">
              <Select 
                value={formData.startMonth} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, startMonth: val }))}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.startMonth))}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border">
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select 
                value={formData.startYear} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, startYear: val }))}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.startYear))}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border">
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={labelStyles}>End date</Label>
            <div className="grid grid-cols-2 gap-6">
              <Select 
                value={formData.endMonth} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, endMonth: val }))}
                disabled={currentlyWorking}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.endMonth))}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border">
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select 
                value={formData.endYear} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, endYear: val }))}
                disabled={currentlyWorking}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.endYear))}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-border">
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="currentlyWorking"
              checked={currentlyWorking}
              onCheckedChange={(checked) => setCurrentlyWorking(checked as boolean)}
              className="w-[18px] h-[18px] rounded-[4px] border-2 border-[#000000] data-[state=checked]:bg-[#000000] data-[state=checked]:border-[#000000]"
            />
            <label
              htmlFor="currentlyWorking"
              className="text-[14px] font-medium text-[#111827]"
            >
              I currently work here
            </label>
          </div>

          <div className="flex flex-col">
            <Label className={labelStyles}>Details</Label>
            <Textarea 
              value={formData.description} 
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full min-h-[48px] bg-white border-[#E5E7EB] text-[#111827] placeholder-[#6B7280] rounded-[16px] px-[16px] py-[12px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus-visible:border-[#C7D2FE] focus-visible:outline-none transition-all shadow-none"
              placeholder="Describe your work, impact, or achievements"
            />
          </div>

          <div className="flex justify-center gap-4 pt-6 pb-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="w-[142px] h-[40px] rounded-[24px] bg-white border border-[#818CF8] text-[#818CF8] hover:bg-[#F9FAFB] font-medium transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid}
              className={`w-[142px] h-[40px] rounded-[24px] transition-all shadow-none border border-white font-medium text-white ${
                isFormValid 
                  ? "bg-[#6366F1] hover:bg-[#4F46E5] cursor-pointer" 
                  : "bg-[#C7D2FE] opacity-80 cursor-not-allowed"
              }`}
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
