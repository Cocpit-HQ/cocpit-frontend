"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Experience } from "@/types/entities"
import { Checkbox } from "@/components/ui/checkbox"
import { X, Plus, ChevronDown, Trash2, AlertTriangle } from "lucide-react"
import { Icon } from '@iconify/react'
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import LocationAutocomplete from "@/components/ui/LocationAutocomplete"
import CompanyAutocomplete from "@/components/ui/CompanyAutocomplete"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ─── Constants ────────────────────────────────────────────────────────────────

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 60 }, (_, i) => (currentYear - i).toString())

const WORK_TYPES = ["Full time", "Part-time", "Internship", "Freelance", "Contract"]
const WORK_MODES = ["Remote", "Hybrid", "On-site"]

// ─── Internal Types ───────────────────────────────────────────────────────────

interface RoleFormState {
  experience_id?: string     // undefined = new role, set = existing
  title: string
  work_type: string
  work_mode: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  is_current: boolean
  description: string
  endCurrentRole: boolean    // checkbox: "End current role" (only for new roles)
}

/** What the parent receives on save — one entry per role */
export interface SavedRole {
  experience_id?: string
  title: string
  company_name: string
  location: string
  work_type: string | null
  work_mode: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  shouldEndPreviousRole: boolean
  org_id: string | null
  /** ID of an EXISTING experience to end when shouldEndPreviousRole is true on index 0 */
  experienceIdToEnd?: string
}

interface AddExperienceFormProps {
  onCancel: () => void
  onSave: (roles: SavedRole[]) => Promise<void>
  onDelete?: (id: string) => void
  initialData?: Experience | null
  companyName?: string
  isSaving?: boolean
  /** Flat list of all existing experiences — used for cross-session validation */
  existingExperiences?: Experience[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyRole = (): RoleFormState => ({
  experience_id: undefined,
  title: "",
  work_type: "",
  work_mode: "",
  startMonth: "",
  startYear: "",
  endMonth: "",
  endYear: "",
  is_current: false,
  description: "",
  endCurrentRole: false,
})

const mapToRole = (exp: Experience): RoleFormState => ({
  experience_id: exp.experience_id,
  title: exp.title ?? "",
  work_type: exp.work_type ?? "",
  work_mode: exp.work_mode ?? "",
  startMonth: exp.start_date ? months[dayjs(exp.start_date).month()] : "",
  startYear: exp.start_date ? dayjs(exp.start_date).year().toString() : "",
  endMonth: exp.end_date ? months[dayjs(exp.end_date).month()] : "",
  endYear: exp.end_date ? dayjs(exp.end_date).year().toString() : "",
  is_current: !exp.end_date,
  description: exp.description ?? "",
  endCurrentRole: false,
})

const buildDate = (month: string, year: string): string => {
  const monthIdx = months.indexOf(month)
  if (monthIdx === -1 || !year) return ""
  return dayjs(`${year}-${monthIdx + 1}-01`).format("YYYY-MM-DD")
}

/** Returns true if two date ranges overlap. null end_date means "present" */
const datesOverlap = (
  aStart: string, aEnd: string | null,
  bStart: string, bEnd: string | null
): boolean => {
  const a1 = dayjs(aStart), a2 = aEnd ? dayjs(aEnd) : dayjs().add(100, 'year')
  const b1 = dayjs(bStart), b2 = bEnd ? dayjs(bEnd) : dayjs().add(100, 'year')
  return a1.isBefore(b2) && b1.isBefore(a2)
}

// ─── RoleSection sub-component ────────────────────────────────────────────────

interface RoleSectionProps {
  role: RoleFormState
  index: number
  isFirst: boolean
  isOnly: boolean
  showEndCurrentRole: boolean
  previousRoleTitle?: string
  onChange: (updated: RoleFormState) => void
  onRemove?: () => void
  fieldErrors?: Record<string, string>   // per-field error messages for this role
}

function RoleSection({
  role,
  index,
  isFirst,
  isOnly,
  showEndCurrentRole,
  previousRoleTitle,
  onChange,
  onRemove,
  fieldErrors = {},
}: RoleSectionProps) {
  const inputStyles =
    "bg-white border-[#E5E7EB] placeholder-[#6B7280] rounded-[16px] h-[48px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px]"
  const labelStyles = "text-[14px] font-medium text-[#111827] mb-1.5"
  const getSelectTextColor = (value: string) =>
    value ? "text-[#111827]" : "text-[#6B7280]"

  const set = (field: keyof RoleFormState, value: any) =>
    onChange({ ...role, [field]: value })

  return (
    <div className="space-y-6">
      {/* Divider between roles */}
      {!isFirst && (
        <div className="flex items-center gap-3 pt-2">
          <div className="h-px flex-1 bg-[#E5E7EB]" />
          <span className="text-[12px] text-[#6B7280] font-[family-name:var(--font-poppins)] whitespace-nowrap">
            New role
          </span>
          <div className="h-px flex-1 bg-[#E5E7EB]" />
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-red-400 hover:text-red-600 transition-colors"
              aria-label="Remove this role"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-1.5">
          <Label className={labelStyles}>{isFirst ? "Role" : "New role"}</Label>
          <span className={cn(
            "text-[11px]",
            role.title.length > 90 ? "text-amber-500" : "text-[#9CA3AF]"
          )}>
            {role.title.length}/100
          </span>
        </div>
        <div className="relative">
          <Input
            value={role.title}
            onChange={(e) => set("title", e.target.value)}
            className={cn(
              inputStyles, "pr-10 w-full",
              fieldErrors.title && "border-red-400 focus-visible:border-red-400"
            )}
            placeholder="e.g. Designer"
            maxLength={100}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
        {fieldErrors.title && (
          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{fieldErrors.title}
          </p>
        )}
      </div>

      {/* "End current role" checkbox — only shown for new roles (index > 0) */}
      {showEndCurrentRole && (
        <div className="flex items-start space-x-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[12px] px-4 py-3">
          <Checkbox
            id={`endCurrentRole-${index}`}
            checked={role.endCurrentRole}
            onCheckedChange={(checked) => set("endCurrentRole", checked as boolean)}
            className="mt-0.5 w-[18px] h-[18px] rounded-[4px] border-2 border-[#000000] data-[state=checked]:bg-[#000000] data-[state=checked]:border-[#000000]"
          />
          <label
            htmlFor={`endCurrentRole-${index}`}
            className="text-[13px] font-medium text-[#111827] cursor-pointer leading-[20px]"
          >
            End current role
            {previousRoleTitle && (
              <span className="text-[#6B7280] font-normal">
                {" "}"{previousRoleTitle}"
              </span>
            )}
          </label>
        </div>
      )}

      {/* Details textarea (only for non-first roles shown before dates) */}
      {!isFirst && (
        <div className="flex flex-col">
          <Label className={labelStyles}>Details</Label>
          <Textarea
            value={role.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full min-h-[48px] bg-white border-[#E5E7EB] text-[#111827] placeholder-[#6B7280] rounded-[16px] px-[16px] py-[12px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus-visible:border-[#C7D2FE] focus-visible:outline-none transition-all shadow-none"
            placeholder="Describe your work, impact, or achievements"
          />
        </div>
      )}

      {/* Work type */}
      <div className="space-y-2">
        <Label className={labelStyles}>Work type</Label>
        <div className="flex flex-wrap gap-3">
          {WORK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => set("work_type", role.work_type === type ? "" : type)}
              className={cn(
                "h-[32px] px-4 rounded-[8px] text-[12px] font-medium transition-all duration-200 border border-transparent",
                role.work_type === type
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-primary hover:opacity-80"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Work mode */}
      <div className="space-y-2">
        <Label className={labelStyles}>Work mode</Label>
        <div className="flex flex-wrap gap-3">
          {WORK_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => set("work_mode", role.work_mode === mode ? "" : mode)}
              className={cn(
                "h-[32px] px-4 rounded-[8px] text-[12px] font-medium transition-all duration-200 border border-transparent",
                role.work_mode === mode
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-primary hover:opacity-80"
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Start date */}
      <div className="space-y-1.5">
        <Label className={labelStyles}>Start date</Label>
        <div className="grid grid-cols-2 gap-6">
          <Select value={role.startMonth} onValueChange={(v) => set("startMonth", v)}>
            <SelectTrigger className={cn(inputStyles, getSelectTextColor(role.startMonth), fieldErrors.startDate && "border-red-400")}>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={role.startYear} onValueChange={(v) => set("startYear", v)}>
            <SelectTrigger className={cn(inputStyles, getSelectTextColor(role.startYear), fieldErrors.startDate && "border-red-400")}>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {fieldErrors.startDate && (
          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{fieldErrors.startDate}
          </p>
        )}
      </div>

      {/* End date */}
      <div className="space-y-1.5">
        <Label className={labelStyles}>End date</Label>
        <div className="grid grid-cols-2 gap-6">
          <Select
            value={role.endMonth}
            onValueChange={(v) => set("endMonth", v)}
            disabled={role.is_current}
          >
            <SelectTrigger className={cn(inputStyles, getSelectTextColor(role.endMonth), fieldErrors.endDate && "border-red-400")}>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select
            value={role.endYear}
            onValueChange={(v) => set("endYear", v)}
            disabled={role.is_current}
          >
            <SelectTrigger className={cn(inputStyles, getSelectTextColor(role.endYear), fieldErrors.endDate && "border-red-400")}>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {fieldErrors.endDate && (
          <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />{fieldErrors.endDate}
          </p>
        )}
      </div>

      {/* Currently working */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`currentlyWorking-${index}`}
          checked={role.is_current}
          onCheckedChange={(checked) => {
            onChange({
              ...role,
              is_current: checked as boolean,
              endMonth: checked ? "" : role.endMonth,
              endYear: checked ? "" : role.endYear,
            })
          }}
          className="w-[18px] h-[18px] rounded-[4px] border-2 border-[#000000] data-[state=checked]:bg-[#000000] data-[state=checked]:border-[#000000]"
        />
        <label
          htmlFor={`currentlyWorking-${index}`}
          className="text-[14px] font-medium text-[#111827]"
        >
          I currently work here
        </label>
      </div>

      {/* Details — only for first role, shown at the bottom */}
      {isFirst && (
        <div className="flex flex-col">
          <Label className={labelStyles}>Details</Label>
          <Textarea
            value={role.description}
            onChange={(e) => set("description", e.target.value)}
            className="w-full min-h-[48px] bg-white border-[#E5E7EB] text-[#111827] placeholder-[#6B7280] rounded-[16px] px-[16px] py-[12px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus-visible:border-[#C7D2FE] focus-visible:outline-none transition-all shadow-none"
            placeholder="Describe your work, impact, or achievements"
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Form Component ──────────────────────────────────────────────────────

export default function AddExperienceForm({
  onCancel,
  onSave,
  onDelete,
  initialData,
  companyName,
  isSaving = false,
  existingExperiences = [],
}: AddExperienceFormProps) {
  const isEditing = !!initialData

  const [company, setCompany] = useState(
    companyName ?? initialData?.company_name ?? ""
  )
  const [orgId, setOrgId] = useState<string | null>(initialData?.org_id ?? null)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo_url ?? null)
  const [location, setLocation] = useState(initialData?.location ?? "")
  const [roles, setRoles] = useState<RoleFormState[]>(() =>
    initialData ? [mapToRole(initialData)] : [emptyRole()]
  )

  // Per-role field errors — map of index → { field: message }
  const [fieldErrors, setFieldErrors] = useState<Record<number, Record<string, string>>>({})

  // Sync state when initialData changes
  useEffect(() => {
    setCompany(companyName ?? initialData?.company_name ?? "")
    setOrgId(initialData?.org_id ?? null)
    setLogoUrl(initialData?.logo_url ?? null)
    setLocation(initialData?.location ?? "")
    setRoles(initialData ? [mapToRole(initialData)] : [emptyRole()])
    setFieldErrors({})
  }, [initialData, companyName])

  const updateRole = useCallback(
    (index: number, updated: RoleFormState) => {
      setRoles((prev) => prev.map((r, i) => (i === index ? updated : r)))
      // Clear errors for this role when user edits
      setFieldErrors((prev) => { const next = { ...prev }; delete next[index]; return next })
    },
    []
  )

  const removeRole = useCallback(
    (index: number) => setRoles((prev) => prev.filter((_, i) => i !== index)),
    []
  )

  const addNewRole = () => setRoles((prev) => [...prev, emptyRole()])

  // ── Validation ────────────────────────────────────────────────────────────────

  /** Runs full validation. Returns true if form can be saved. Updates fieldErrors. */
  const validate = (): boolean => {
    const errors: Record<number, Record<string, string>> = {}
    let valid = true

    roles.forEach((role, index) => {
      const roleErrors: Record<string, string> = {}

      // Title required
      if (!role.title.trim()) {
        roleErrors.title = "Role title is required"
        valid = false
      }

      // Start date required
      if (!role.startMonth || !role.startYear) {
        roleErrors.startDate = "Start date is required"
        valid = false
      } else {
        const startDate = buildDate(role.startMonth, role.startYear)
        // Future start date — warn but don't block
        if (dayjs(startDate).isAfter(dayjs())) {
          roleErrors.startDate = "Start date is in the future — double-check this"
          // Not blocking, just informational
        }

        // End date checks (only if not current)
      if (!role.is_current) {
        if (!role.endMonth || !role.endYear) {
          roleErrors.endDate = "End date is required when not currently working here"
          valid = false
        } else {
          const endDate = buildDate(role.endMonth, role.endYear)
          if (endDate <= startDate) {
            roleErrors.endDate = "End date must be after start date"
            valid = false
          }
        }
      }

      // Check for overlaps within this session (same company)
      const endDate = role.is_current ? null : buildDate(role.endMonth, role.endYear)
      roles.forEach((other, oIdx) => {
        if (index === oIdx) return
        const otherStart = buildDate(other.startMonth, other.startYear)
        const otherEnd = other.is_current ? null : buildDate(other.endMonth, other.endYear)
        if (otherStart && datesOverlap(startDate, endDate, otherStart, otherEnd)) {
          roleErrors.startDate = `Overlaps with "${other.title || 'another role'}"`
          valid = false
        }
      })

      // Check for overlaps with existing database records (same company)
      const companyNorm = company.trim().toLowerCase()
      if (companyNorm) {
        existingExperiences
          .filter(e => {
            if (e.experience_id === role.experience_id) return false
            return (orgId && e.org_id === orgId) || 
                   (!orgId && !e.org_id && e.company_name.toLowerCase().trim() === companyNorm)
          })
          .forEach(e => {
            if (datesOverlap(startDate, endDate, e.start_date, e.end_date)) {
              roleErrors.startDate = `Overlaps with existing role: "${e.title}"`
              valid = false
            }
          })
      }
    }

    if (Object.keys(roleErrors).length > 0) errors[index] = roleErrors
  })

    setFieldErrors(errors)
    return valid
  }

  // ── Derived warnings (non-blocking) ──────────────────────────────────────────

  /** Detect overlap between roles in this form session and existing saved experiences */
  const overlapWarnings = useMemo(() => {
    const warnings: Record<number, string> = {}
    roles.forEach((role, index) => {
      if (!role.startMonth || !role.startYear) return
      const startDate = buildDate(role.startMonth, role.startYear)
      const endDate = role.is_current ? null : buildDate(role.endMonth, role.endYear)
      if (!endDate && role.is_current === false) return // incomplete

      const companyNorm = company.trim().toLowerCase()
      existingExperiences
        .filter(e =>
          e.company_name.toLowerCase().trim() === companyNorm &&
          e.experience_id !== role.experience_id
        )
        .forEach(e => {
          if (datesOverlap(startDate, endDate, e.start_date, e.end_date)) {
            warnings[index] = `This role's dates overlap with "${e.title}" at the same company`
          }
        })
    })
    return warnings
  }, [roles, company, existingExperiences])

  /** Detect the most recent existing active role (across ALL companies) that isn't currently open in the form */
  const existingCurrentRole = useMemo(() => {
    const activeRoles = existingExperiences
      .filter(e => (e.is_current || !e.end_date) && !roles.some(r => r.experience_id === e.experience_id))
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    return activeRoles.length > 0 ? activeRoles[0] : null;
  }, [existingExperiences, roles])

  /** Detect multiple "currently working" across ALL experiences (cross-company) */
  const existingCurrentCount = existingExperiences.filter(
    e => (e.is_current || !e.end_date) && !roles.some(r => r.experience_id === e.experience_id)
  ).length
  const newCurrentRolesCount = roles.filter(r => r.is_current).length
  const multipleCurrentRoles =
    roles.filter(r => r.is_current).length > 1 ||
    (existingCurrentCount > (roles[0]?.endCurrentRole ? 1 : 0) && newCurrentRolesCount > 0)

  // Form requires at minimum: company + each role has title + start date + (end date if not current)
  const isFormValid =
    company.trim() !== "" &&
    roles.every(
      (r) =>
        r.title.trim() !== "" &&
        r.startMonth !== "" &&
        r.startYear !== "" &&
        (r.is_current || (r.endMonth !== "" && r.endYear !== ""))
    )

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (isSaving) return
    if (!validate()) return   // run full validation, block on errors

    const savedRoles: SavedRole[] = roles.map((role, index) => {
      const startDate = buildDate(role.startMonth, role.startYear)
      const endDate = role.is_current ? null : buildDate(role.endMonth, role.endYear)
      return {
        experience_id: role.experience_id,
        title: role.title.trim(),
        company_name: company.trim(),
        org_id: orgId,
        location: location.trim(),
        work_type: role.work_type || null,
        work_mode: role.work_mode || null,
        start_date: startDate,
        end_date: endDate,
        is_current: role.is_current,
        description: role.description.trim() || null,
        shouldEndPreviousRole: (index > 0 || (index === 0 && !!existingCurrentRole)) && role.endCurrentRole,
        experienceIdToEnd: index === 0 && role.endCurrentRole ? existingCurrentRole?.experience_id : undefined,
      }
    })

    await onSave(savedRoles)
  }

  const inputStyles =
    "bg-white border-[#E5E7EB] placeholder-[#6B7280] rounded-[16px] h-[48px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px]"
  const labelStyles = "text-[14px] font-medium text-[#111827] mb-1.5"

  const modalTitle = isEditing ? "Edit experience" : "Add experience"

  return (
    <div className="relative bg-card rounded-none sm:rounded-[24px] p-0 sm:p-[16px] w-full sm:w-[800px] h-[100dvh] sm:h-auto sm:max-h-[90vh] mx-auto shadow-sm flex flex-col overflow-hidden outline-none">

      {/* ── Mobile Header ── */}
      <div className="sm:hidden flex items-center justify-between sticky top-0 bg-card z-50 px-4 py-4 border-b border-border">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors"
        >
          <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
        </button>
        <span className="text-[16px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
          {modalTitle}
        </span>
        <button
          onClick={() => handleSubmit()}
          disabled={!isFormValid || isSaving}
          className="px-4 py-1.5 rounded-full bg-secondary text-primary font-medium text-[14px] disabled:opacity-50 transition-all"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* ── Scrollable Body ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-4 scrollbar-hide pb-20 sm:pb-4">

        {/* Desktop close button */}
        <button
          onClick={onCancel}
          className="hidden sm:block absolute top-6 right-6 p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop header */}
        <div className="hidden sm:block text-center mb-8 relative">
          <h2 className="text-[18px] leading-[26px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-1">
            {modalTitle}
          </h2>
          <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
            Update your professional information
          </p>

          {/* "Add new role" button — only shown when editing or when already in form */}
          <button
            type="button"
            onClick={addNewRole}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full border border-border hover:bg-secondary transition-all text-primary font-[family-name:var(--font-poppins)] text-[14px] font-medium"
          >
            <Plus className="w-4 h-4" />
            Add new role
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Company + Location — shared across roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-[72px]">
            <div className="flex flex-col">
              <Label className={labelStyles}>Company</Label>
              <CompanyAutocomplete
                selectedId={orgId}
                selectedName={company}
                onSelect={(id, name, logo) => {
                  setOrgId(id)
                  setCompany(name)
                  if (logo !== undefined) setLogoUrl(logo)
                }}
              />
            </div>

            <div className="flex flex-col">
              <Label className={labelStyles}>Location</Label>
              <LocationAutocomplete
                value={location}
                onSelect={(val) =>
                  setLocation(val?.name || val || "")
                }
              />
            </div>
          </div>

          {/* Multiple current roles warning */}
          {multipleCurrentRoles && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-[12px]">
              <Icon icon="mdi:alert-outline" className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-[12px] text-amber-700 font-[family-name:var(--font-poppins)]">
                You already have an active role. Adding another "currently working" role is allowed
                (e.g. freelance, parallel positions) but make sure this is intentional.
              </p>
            </div>
          )}

          {/* Role sections — array-driven */}
          {roles.map((role, index) => (
            <React.Fragment key={index}>
              <RoleSection
                role={role}
                index={index}
                isFirst={index === 0}
                isOnly={roles.length === 1}
                showEndCurrentRole={index > 0 || (index === 0 && !!existingCurrentRole)}
                previousRoleTitle={
                  index > 0 && roles[index - 1]?.title
                    ? roles[index - 1].title
                    : index === 0 && existingCurrentRole
                      ? `${existingCurrentRole.title} at ${existingCurrentRole.company_name}`
                      : undefined
                }
                onChange={(updated) => updateRole(index, updated)}
                onRemove={
                  roles.length > 1 ? () => removeRole(index) : undefined
                }
                fieldErrors={fieldErrors[index]}
              />
              {overlapWarnings[index] && (
                <div className="flex items-start gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-[12px] -mt-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-[family-name:var(--font-poppins)]">
                    {overlapWarnings[index]}
                  </p>
                </div>
              )}
            </React.Fragment>
          ))}

          {/* Mobile: Add new role button */}
          <button
            type="button"
            onClick={addNewRole}
            className="sm:hidden flex items-center gap-2 w-full justify-center py-3 rounded-[16px] border border-dashed border-[#6366F1] text-[#6366F1] text-[14px] font-medium font-[family-name:var(--font-poppins)] hover:bg-[#EEF2FF] transition-all"
          >
            <Plus className="w-4 h-4" />
            Add new role
          </button>

          {/* Desktop footer actions */}
          <div className="hidden sm:flex justify-between items-center pt-8 border-t border-[#E5E7EB]">
            {isEditing && initialData ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => onDelete?.(initialData.experience_id!)}
                disabled={isSaving}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium px-4 h-10"
              >
                Delete record
              </Button>
            ) : (
              <div />
            )}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
                className="h-10 px-8 rounded-full border-[#818CF8] text-[#818CF8] hover:bg-[#EEF2FF] bg-white font-medium w-[142px]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid || isSaving}
                className="h-10 px-8 rounded-full bg-[#6366F1] text-white hover:bg-[#4F46E5] font-medium w-[142px] disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
