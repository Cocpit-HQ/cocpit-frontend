"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Education } from "@/types/entities"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, X } from "lucide-react"
import { Icon } from '@iconify/react'
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import SchoolAutocomplete from "@/components/ui/SchoolAutocomplete"
import LocationAutocomplete from "@/components/ui/LocationAutocomplete"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddEducationFormProps {
  onCancel?: () => void
  onSave?: (data: Partial<Education>) => void
  onDelete?: (id: string) => void
  isDark?: boolean
  initialData?: Education | null
  existingEducations?: Education[]
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 60 }, (_, i) => (currentYear - i).toString())

export default function AddEducationForm({ onCancel, onSave, onDelete, initialData, existingEducations = [] }: AddEducationFormProps) {
  const [formData, setFormData] = useState(() => {
    if (initialData) {
      const start = dayjs(initialData.start_date)
      const end = initialData.end_date ? dayjs(initialData.end_date) : null

      return {
        school_name: initialData.school_name ?? "",
        degree: initialData.degree ?? "",
        field_of_study: initialData.field_of_study ?? "",
        location: (initialData as any).location ?? "",
        startMonth: initialData.start_date ? months[start.month()] : "",
        startYear: initialData.start_date ? start.year().toString() : "",
        endMonth: end ? months[end.month()] : "",
        endYear: end ? end.year().toString() : "",
        description: initialData.description ?? "",
      }
    }
    return {
      school_name: "",
      degree: "",
      field_of_study: "",
      location: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      description: "",
    }
  })
  const [stillStudying, setStillStudying] = useState(!!initialData && !initialData.end_date)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      const start = dayjs(initialData.start_date)
      const end = initialData.end_date ? dayjs(initialData.end_date) : null

      setFormData({
        school_name: initialData.school_name ?? "",
        degree: initialData.degree ?? "",
        field_of_study: initialData.field_of_study ?? "",
        location: (initialData as any).location ?? "",
        startMonth: initialData.start_date ? months[start.month()] : "",
        startYear: initialData.start_date ? start.year().toString() : "",
        endMonth: end ? months[end.month()] : "",
        endYear: end ? end.year().toString() : "",
        description: initialData.description ?? "",
      })
      setStillStudying(!initialData.end_date)
    } else {
      setFormData({
        school_name: "",
        degree: "",
        field_of_study: "",
        location: "",
        startMonth: "",
        startYear: "",
        endMonth: "",
        endYear: "",
        description: "",
      })
      setStillStudying(false)
    }
    setFieldErrors({})
  }, [initialData])

  const existingCurrentEducation = useMemo(() => {
    return existingEducations.find(education =>
      education.education_id !== initialData?.education_id &&
      !education.end_date
    ) || null
  }, [existingEducations, initialData])

  const validate = () => {
    const errors: Record<string, string> = {}

    if (!formData.school_name.trim()) {
      errors.school_name = "Education is required"
    }

    if (!formData.degree.trim()) {
      errors.degree = "Qualification is required"
    }

    if (!formData.startMonth || !formData.startYear) {
      errors.startDate = "Start date is required"
    }

    const startMonthIdx = months.indexOf(formData.startMonth)
    const startDate = formData.startYear && startMonthIdx !== -1
      ? dayjs(`${formData.startYear}-${startMonthIdx + 1}-01`).format("YYYY-MM-DD")
      : ""

    if (!stillStudying) {
      if (!formData.endMonth || !formData.endYear) {
        errors.endDate = "End date is required when not currently studying here"
      } else {
        const endMonthIdx = months.indexOf(formData.endMonth)
        const endDate = formData.endYear && endMonthIdx !== -1
          ? dayjs(`${formData.endYear}-${endMonthIdx + 1}-01`).format("YYYY-MM-DD")
          : ""

        if (startDate && endDate && endDate <= startDate) {
          errors.endDate = "End date must be after start date"
        }
      }
    }

    if (stillStudying && existingCurrentEducation) {
      errors.currentEducation = `Overlaps with existing current education: "${existingCurrentEducation.school_name}"`
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!validate()) return

    // Combine month/year into YYYY-MM-DD
    const startMonthIdx = months.indexOf(formData.startMonth)
    const startDate = formData.startYear && startMonthIdx !== -1
      ? dayjs(`${formData.startYear}-${startMonthIdx + 1}-01`).format("YYYY-MM-DD")
      : ""

    const endMonthIdx = months.indexOf(formData.endMonth)
    const endDate = !stillStudying && formData.endYear && endMonthIdx !== -1
      ? dayjs(`${formData.endYear}-${endMonthIdx + 1}-01`).format("YYYY-MM-DD")
      : null

    onSave?.({
      ...initialData,
      school_name: formData.school_name,
      degree: formData.degree,
      field_of_study: formData.field_of_study,
      location: formData.location,
      start_date: startDate,
      end_date: endDate,
      description: formData.description
    })
  }

  const inputStyles = "bg-card border border-border placeholder:text-muted-foreground rounded-[16px] h-[48px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] text-foreground focus:border-[#C7D2FE] dark:focus:border-primary focus-visible:outline-none focus-visible:ring-0 transition-all data-[state=open]:border-[#C7D2FE] dark:data-[state=open]:border-primary"
  const labelStyles = "block font-[family-name:var(--font-poppins)] font-normal text-[14px] leading-[20px] text-foreground mb-2"

  const getSelectTextColor = (value: string) => value ? "text-foreground" : "text-muted-foreground";

  const isFormValid =
    formData.school_name.trim() !== "" &&
    formData.degree.trim() !== "" &&
    formData.startMonth !== "" &&
    formData.startYear !== "";

  return (
    <div className="relative bg-card rounded-none sm:rounded-[24px] p-0 sm:p-[16px] w-full sm:w-[800px] h-[100dvh] sm:h-auto sm:max-h-[90vh] mx-auto shadow-sm flex flex-col overflow-hidden outline-none">

      {/* Mobile Header */}
      <div className="sm:hidden flex items-center justify-between sticky top-0 bg-card z-50 px-4 py-4 border-b border-border">
        <button type="button" onClick={onCancel} className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors">
          <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
        </button>
        <span className="text-[16px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
          Add education
        </span>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid}
          className="px-4 py-1.5 rounded-full bg-secondary text-primary font-medium text-[14px] disabled:opacity-50 transition-all"
        >
          Save
        </button>
      </div>

      {/* Scrollable area with hidden scrollbar */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-4 scrollbar-hide pb-20 sm:pb-4">
        {/* Close Button handled by global DialogPrimitive.Close in ProfilePage */}

        {/* Header */}
        <div className="hidden sm:block text-center mb-8">
          <h2 className="text-[18px] leading-[26px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-1">Add education</h2>
          <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">Update your professional information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Education & Qualification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <Label className={labelStyles}>Education</Label>
              <SchoolAutocomplete
                selectedName={formData.school_name}
                selectedId={null}
                onSelect={(_, name) => setFormData(prev => ({ ...prev, school_name: name }))}
              />
            </div>
            <div className="flex flex-col">
              <Label className={labelStyles}>Qualification</Label>
              <Select
                value={formData.degree}
                onValueChange={(val) => setFormData(prev => ({ ...prev, degree: val }))}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.degree))}>
                  <SelectValue placeholder="e.g. MBA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High School">High School</SelectItem>
                  <SelectItem value="Associate's">Associate's</SelectItem>
                  <SelectItem value="Bachelor's">Bachelor's</SelectItem>
                  <SelectItem value="Master's">Master's</SelectItem>
                  <SelectItem value="MBA">MBA</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Specialization & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <Label className={labelStyles}>Specialization</Label>
              <Select
                value={formData.field_of_study}
                onValueChange={(val) => setFormData(prev => ({ ...prev, field_of_study: val }))}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.field_of_study))}>
                  <SelectValue placeholder="e.g. Finance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col">
              <Label className={labelStyles}>Location</Label>
              <LocationAutocomplete
                value={formData.location}
                onSelect={(val) => setFormData(prev => ({ ...prev, location: val?.name || val || "" }))}
              />
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label className={labelStyles}>Start date</Label>
            <div className="grid grid-cols-2 gap-6">
              <Select
                value={formData.startMonth}
                onValueChange={(val) => setFormData(prev => ({ ...prev, startMonth: val }))}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.startMonth), fieldErrors.startDate && "border-red-400")}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select
                value={formData.startYear}
                onValueChange={(val) => setFormData(prev => ({ ...prev, startYear: val }))}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.startYear), fieldErrors.startDate && "border-red-400")}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {fieldErrors.startDate && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{fieldErrors.startDate}
              </p>
            )}
          </div>

          {/* End Date */}
          <div className={cn("space-y-2", stillStudying && "opacity-50")}>
            <Label className={cn(labelStyles, stillStudying && "text-muted-foreground")}>End date</Label>
            <div className="grid grid-cols-2 gap-6">
              <Select
                value={formData.endMonth}
                onValueChange={(val) => setFormData(prev => ({ ...prev, endMonth: val }))}
                disabled={stillStudying}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.endMonth), fieldErrors.endDate && "border-red-400")}>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select
                value={formData.endYear}
                onValueChange={(val) => setFormData(prev => ({ ...prev, endYear: val }))}
                disabled={stillStudying}
              >
                <SelectTrigger className={cn(inputStyles, getSelectTextColor(formData.endYear), fieldErrors.endDate && "border-red-400")}>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {fieldErrors.endDate && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />{fieldErrors.endDate}
              </p>
            )}
          </div>

          {/* Still Studying Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="stillStudying"
              checked={stillStudying}
              onCheckedChange={(checked) => {
                const isChecked = checked as boolean
                setStillStudying(isChecked)
                if (isChecked) {
                  setFormData(prev => ({ ...prev, endMonth: "", endYear: "" }))
                }
              }}
              className="w-[18px] h-[18px] rounded-[4px] border-2 border-border dark:border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor="stillStudying"
              className="text-[14px] font-medium text-[#111827] dark:text-foreground"
            >
              I currently study here
            </label>
          </div>
          {fieldErrors.currentEducation && (
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{fieldErrors.currentEducation}
            </p>
          )}

          {/* Details Textarea */}
          <div className="flex flex-col">
            <Label className={labelStyles}>Details</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-[40px] min-h-[40px] bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-[16px] px-[16px] py-[8px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus:border-[#C7D2FE] focus-visible:outline-none focus-visible:ring-0 transition-all shadow-none"
              placeholder="Describe your work, impact, or achievements"
            />
          </div>

          {/* Action Buttons */}
          <div className="hidden sm:flex justify-center items-center gap-4 pt-8 border-t border-[#E5E7EB] mt-8">
            {initialData ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => onDelete?.(initialData.education_id!)}
                className="h-10 px-8 rounded-full border-[#FF6B6B]/20 text-[#FF6B6B] hover:bg-transparent bg-transparent font-medium w-[142px]"
              >
                Delete
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-10 px-8 rounded-full border-[#818CF8] text-[#818CF8] hover:bg-transparent bg-white font-medium w-[142px]"
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              disabled={!isFormValid}
              className="h-10 px-8 rounded-full bg-[#6366F1] text-white hover:bg-[#4F46E5] font-medium w-[142px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
