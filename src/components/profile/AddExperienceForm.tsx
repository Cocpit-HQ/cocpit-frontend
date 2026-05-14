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
  experience_id?: string
  title: string
  work_type: string
  work_mode: string
  startMonth: string
  startYear: string
  endMonth: string
  endYear: string
  is_current: boolean
  description: string
  endCurrentRole: boolean
  experienceIdToEnd?: string
}

/** What the parent receives on save — one entry per role */
export interface SavedRole {
  experience_id?: string
  title: string
  company_name: string
  location: string | null
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
  onSave: (roles: SavedRole[], deletedIds: string[]) => Promise<void>
  onDelete?: (ids: string[]) => void
  initialExperiences?: Experience[]
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
  experienceIdToEnd: undefined,
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
  experienceIdToEnd: undefined,
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
  fieldErrors?: Record<string, string>    // blocking — shown in red
  fieldWarnings?: Record<string, string>  // non-blocking — shown in amber
  existingCurrentRoleId?: string          // ID of the role to end if checkbox is checked
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
  fieldWarnings = {},
  existingCurrentRoleId,
}: RoleSectionProps) {
  const inputStyles =
    "bg-card border-border placeholder-muted-foreground rounded-[16px] h-[48px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] text-left"
  const labelStyles = "text-[14px] font-medium text-foreground mb-1.5"
  const getSelectTextColor = (value: string) =>
    value ? "text-foreground" : "text-muted-foreground"

  const set = (field: keyof RoleFormState, value: any) =>
    onChange({ ...role, [field]: value })

  return (
    <div className="relative pl-0">

      <div className="space-y-6">
        {/* New Role Indicator & Remove Button */}
        {!isFirst && (
          <div className="flex items-center justify-end mb-2">
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="text-red-400 hover:text-red-600 transition-colors flex items-center gap-1.5 text-[12px]"
                aria-label="Remove this role"
              >
                <Trash2 className="w-4 h-4" />
                Remove role
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

        {/* "End current role" checkbox — shown for new roles when an existing active role exists */}
        {showEndCurrentRole && (
          <div className="flex items-start space-x-2 bg-muted/50 border border-border rounded-[12px] px-4 py-3">
            <Checkbox
              id={`endCurrentRole-${index}`}
              checked={role.endCurrentRole}
              onCheckedChange={(checked) => {
                const isChecked = checked as boolean
                onChange({
                  ...role,
                  endCurrentRole: isChecked,
                  experienceIdToEnd: isChecked ? existingCurrentRoleId : undefined,
                })
              }}
              className="mt-0.5 w-[18px] h-[18px] rounded-[4px] border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <label
              htmlFor={`endCurrentRole-${index}`}
              className="text-[13px] font-medium text-foreground cursor-pointer leading-[20px]"
            >
              End current role
              {previousRoleTitle && (
                <span className="text-muted-foreground font-normal">
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
              className="w-full min-h-[48px] bg-card border-border text-foreground placeholder-muted-foreground rounded-[16px] px-[16px] py-[12px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus-visible:border-primary/50 focus-visible:outline-none transition-all shadow-none"
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
                    : "skill-chip hover:opacity-80"
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
                    : "skill-chip hover:opacity-80"
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
          {!fieldErrors.startDate && fieldWarnings.startDate && (
            <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />{fieldWarnings.startDate}
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
              const isChecked = checked as boolean
              const update: Partial<RoleFormState> = {
                is_current: isChecked,
                endMonth: isChecked ? "" : role.endMonth,
                endYear: isChecked ? "" : role.endYear,
              }

              // Automatic toggle: If checking "Currently work here" and there's a candidate role to end,
              // set endCurrentRole to true automatically.
              if (isChecked && showEndCurrentRole && existingCurrentRoleId) {
                update.endCurrentRole = true
                update.experienceIdToEnd = existingCurrentRoleId
              } else if (!isChecked) {
                // If unchecking "Currently work here", reset the termination state
                update.endCurrentRole = false
                update.experienceIdToEnd = undefined
              }

              onChange({
                ...role,
                ...update,
              })
            }}
            className="w-[18px] h-[18px] rounded-[4px] border-2 border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <label
            htmlFor={`currentlyWorking-${index}`}
            className="text-[14px] font-medium text-foreground"
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
              className="w-full min-h-[48px] bg-card border-border text-foreground placeholder-muted-foreground rounded-[16px] px-[16px] py-[12px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] resize-none focus-visible:border-primary/50 focus-visible:outline-none transition-all shadow-none"
              placeholder="Describe your work, impact, or achievements"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Form Component ──────────────────────────────────────────────────────

export default function AddExperienceForm({
  onCancel,
  onSave,
  onDelete,
  initialExperiences,
  companyName,
  isSaving = false,
  existingExperiences = [],
}: AddExperienceFormProps) {
  const isEditing = !!initialExperiences && initialExperiences.length > 0
  const firstExp = initialExperiences?.[0]

  const [company, setCompany] = useState(
    companyName ?? firstExp?.company_name ?? ""
  )
  const [orgId, setOrgId] = useState<string | null>(firstExp?.org_id ?? null)
  const [logoUrl, setLogoUrl] = useState<string | null>(firstExp?.logo_url ?? null)
  const [location, setLocation] = useState(firstExp?.location ?? "")
  const [roles, setRoles] = useState<RoleFormState[]>(() =>
    initialExperiences && initialExperiences.length > 0
      ? initialExperiences.map(mapToRole)
      : [emptyRole()]
  )
  const [deletedRoleIds, setDeletedRoleIds] = useState<string[]>([])
  const [activeRoleIndex, setActiveRoleIndex] = useState(0)

  // Per-role field errors (blocking, shown in red) — map of index → { field: message }
  const [fieldErrors, setFieldErrors] = useState<Record<number, Record<string, string>>>({})
  // Per-role field warnings (non-blocking, shown in amber) — map of index → { field: message }
  const [fieldWarnings, setFieldWarnings] = useState<Record<number, Record<string, string>>>({})

  // Sync state when initialExperiences changes
  useEffect(() => {
    const exp = initialExperiences?.[0]
    setCompany(companyName ?? exp?.company_name ?? "")
    setOrgId(exp?.org_id ?? null)
    setLogoUrl(exp?.logo_url ?? null)
    setLocation(exp?.location ?? "")
    setRoles(
      initialExperiences && initialExperiences.length > 0
        ? initialExperiences.map(mapToRole)
        : [emptyRole()]
    )
    setFieldErrors({})
    setFieldWarnings({})
    setActiveRoleIndex(0)
  }, [initialExperiences, companyName])

  const updateRole = useCallback(
    (index: number, updated: RoleFormState) => {
      setRoles((prev) => prev.map((r, i) => (i === index ? updated : r)))
      // Clear errors and warnings for this role when user edits
      setFieldErrors((prev) => { const next = { ...prev }; delete next[index]; return next })
      setFieldWarnings((prev) => { const next = { ...prev }; delete next[index]; return next })
    },
    []
  )

  const removeRole = useCallback(
    (index: number) => {
      const roleToRemove = roles[index]
      if (roleToRemove?.experience_id) {
        setDeletedRoleIds(prev => [...prev, roleToRemove.experience_id!])
      }
      setRoles((prev) => prev.filter((_, i) => i !== index))
      setActiveRoleIndex((prev) => {
        if (prev >= index && prev > 0) return prev - 1
        return prev
      })
    },
    [roles]
  )

  const addNewRole = () => {
    setRoles((prev) => {
      const newRoles = [...prev, emptyRole()]
      setActiveRoleIndex(newRoles.length - 1)
      return newRoles
    })
  }

  // ── Validation ────────────────────────────────────────────────────────────────

  /** Runs full validation. Returns true if form can be saved. Updates fieldErrors + fieldWarnings. */
  const validate = (): boolean => {
    const errors: Record<number, Record<string, string>> = {}
    const warnings: Record<number, Record<string, string>> = {}
    let valid = true

    roles.forEach((role, index) => {
      const roleErrors: Record<string, string> = {}
      const roleWarnings: Record<string, string> = {}

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

        // Future start date — amber warning only, does NOT block save
        if (dayjs(startDate).isAfter(dayjs())) {
          roleWarnings.startDate = "Start date is in the future — double-check this"
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


        // Check for overlaps within this session (same company) — blocking
        const endDate = role.is_current ? null : buildDate(role.endMonth, role.endYear)

        // Calculate effective end date for this role if it's being ended by another role in this form
        let effectiveEndDate = endDate;
        if (role.is_current) {
          const ender = roles.find(r => r.endCurrentRole && r.experienceIdToEnd === role.experience_id);
          if (ender) {
            effectiveEndDate = buildDate(ender.startMonth, ender.startYear);
          }
        }

        roles.forEach((other, oIdx) => {
          if (index === oIdx) return

          // Ignore if this role is explicitly ending the 'other' role in this form
          if (role.endCurrentRole && role.experienceIdToEnd && role.experienceIdToEnd === other.experience_id) {
            return;
          }

          const otherStart = buildDate(other.startMonth, other.startYear)
          let otherEnd = other.is_current ? null : buildDate(other.endMonth, other.endYear)

          // Calculate effective end date for the other role
          if (other.is_current) {
            const otherEnder = roles.find(r => r.endCurrentRole && r.experienceIdToEnd === other.experience_id);
            if (otherEnder) {
              otherEnd = buildDate(otherEnder.startMonth, otherEnder.startYear);
            }
          }

          if (otherStart && datesOverlap(startDate, effectiveEndDate, otherStart, otherEnd)) {
            roleErrors.startDate = `Overlaps with "${other.title || 'another role'}"`
            valid = false
          }
        })

        // Check for overlaps with existing database records (same company) — blocking
        const companyNorm = company.trim().toLowerCase()
        if (companyNorm) {
          existingExperiences
            .filter(e => {
              // 1. Ignore self if editing
              if (e.experience_id === role.experience_id) return false

              // 2. Ignore if this experience is ALREADY in the form (handled by session-loop above)
              if (roles.some(r => r.experience_id === e.experience_id)) return false

              // 3. Ignore if this role is being ended by ANY role in this form
              const isBeingEnded = roles.some(r => r.endCurrentRole && r.experienceIdToEnd === e.experience_id);
              if (isBeingEnded) return false;

              return (orgId && e.org_id === orgId) ||
                (!orgId && !e.org_id && e.company_name.toLowerCase().trim() === companyNorm)
            })
            .forEach(e => {
              if (datesOverlap(startDate, effectiveEndDate, e.start_date, e.end_date)) {
                roleErrors.startDate = `Overlaps with existing role: "${e.title}"`
                valid = false
              }
            })
        }

        // Impossible scenario check (Full-time On-site + Full-time On-site) — cross-company
        if (role.is_current && !roleErrors.startDate) {
          const norm = (s: string | null | undefined) => (s || '').toLowerCase().replace(/-/g, ' ').trim();
          const isNewFT = norm(role.work_type) === 'full time';
          const isNewOnsite = norm(role.work_mode) === 'on site' || norm(role.work_mode) === 'onsite';

          if (isNewFT && isNewOnsite) {
            // Check within this form session first
            const formConflict = roles.find((other, oIdx) => {
              if (index === oIdx) return false;
              const oNorm = (s: string | null | undefined) => (s || '').toLowerCase().replace(/-/g, ' ').trim();

              // Must be FT + On-site
              if (oNorm(other.work_type) !== 'full time') return false;
              if (oNorm(other.work_mode) !== 'on site' && oNorm(other.work_mode) !== 'onsite') return false;

              // Check if they overlap in time using effective dates
              const otherStart = buildDate(other.startMonth, other.startYear)
              let otherEnd = other.is_current ? null : buildDate(other.endMonth, other.endYear)
              if (other.is_current) {
                const otherEnder = roles.find(r => r.endCurrentRole && r.experienceIdToEnd === other.experience_id);
                if (otherEnder) {
                  otherEnd = buildDate(otherEnder.startMonth, otherEnder.startYear);
                }
              }

              return otherStart && datesOverlap(startDate, effectiveEndDate, otherStart, otherEnd);
            });

            if (formConflict) {
              roleErrors.startDate = `You cannot have two active full-time on-site roles at once ("${formConflict.title}").`
              valid = false
            } else {
              const conflict = existingExperiences.find(e => {
                // Ignore if this role is being ended by ANY role in this form
                const isBeingEnded = roles.some(r => r.endCurrentRole && r.experienceIdToEnd === e.experience_id);
                if (isBeingEnded) return false;
                // Ignore self if editing
                if (e.experience_id === role.experience_id) return false;

                const isEFT = norm(e.work_type) === 'full time';
                const isEOnsite = norm(e.work_mode) === 'on site' || norm(e.work_mode) === 'onsite';
                if (!isEFT || !isEOnsite) return false;

                // For existing records, we just check if they overlap with our effective period
                return datesOverlap(startDate, effectiveEndDate, e.start_date, e.end_date);
              });

              if (conflict) {
                roleErrors.startDate = `You already have a full-time on-site role ("${conflict.title}" at "${conflict.company_name}"). Please end it first.`
                valid = false
              }
            }
          }
        }
      }

      if (Object.keys(roleErrors).length > 0) errors[index] = roleErrors
      if (Object.keys(roleWarnings).length > 0) warnings[index] = roleWarnings
    })

    if (!valid) {
      const firstErrorIdx = Number(Object.keys(errors)[0])
      if (!isNaN(firstErrorIdx)) {
        setActiveRoleIndex(firstErrorIdx)
      }
    }

    setFieldErrors(errors)
    setFieldWarnings(warnings)
    return valid
  }

  // ── existingCurrentRole (used for "End current role" checkbox) ───────────────

  /** Detect the most recent existing active role (across ALL companies) that isn't currently open in the form */
  const existingCurrentRole = useMemo(() => {
    const activeRoles = existingExperiences
      .filter(e => (e.is_current || !e.end_date) && !roles.some(r => r.experience_id === e.experience_id))
      .sort((a, b) => {
        const timeA = a.start_date ? new Date(a.start_date).getTime() : 0;
        const timeB = b.start_date ? new Date(b.start_date).getTime() : 0;
        return timeB - timeA;
      });
    return activeRoles.length > 0 ? activeRoles[0] : null;
  }, [existingExperiences, roles])

  /** Detect multiple "currently working" across ALL experiences (cross-company) */
  const existingCurrentCount = existingExperiences.filter(
    e => (e.is_current || !e.end_date) && !roles.some(r => r.experience_id === e.experience_id)
  ).length
  const newCurrentRolesCount = roles.filter(r => r.is_current).length
  const endedExistingIds = new Set(roles.filter(r => r.endCurrentRole && r.experienceIdToEnd).map(r => r.experienceIdToEnd));
  const remainingExistingCurrentCount = existingExperiences.filter(
    e => (e.is_current || !e.end_date) && !roles.some(r => r.experience_id === e.experience_id) && !endedExistingIds.has(e.experience_id)
  ).length;

  const multipleCurrentRoles =
    roles.filter(r => r.is_current).length > 1 ||
    (remainingExistingCurrentCount > 0 && newCurrentRolesCount > 0)

  /** Find the best candidate role to "end" for a given index in the roles array */
  const getTargetRoleToEnd = (index: number) => {
    // Collect all IDs already targeted by roles in this form session (to avoid 1:N termination mapping)
    const alreadyTargetedIds = roles
      .map((r, i) => ({ id: r.experienceIdToEnd, index: i }))
      .filter(x => x.index !== index && !!x.id)
      .map(x => x.id as string);

    // 1. Try to find an active role in the current session (roles array)
    // We look at all roles EXCEPT the current one that aren't already being ended by someone else
    const sessionActive = roles
      .map((r, i) => ({ role: r, index: i }))
      .filter(x =>
        x.index !== index &&
        x.role.is_current &&
        !!x.role.experience_id &&
        !alreadyTargetedIds.includes(x.role.experience_id)
      )
      .sort((a, b) => {
        const dateA = buildDate(a.role.startMonth, a.role.startYear);
        const dateB = buildDate(b.role.startMonth, b.role.startYear);
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })[0];

    if (sessionActive) {
      return {
        title: sessionActive.role.title,
        id: sessionActive.role.experience_id!
      };
    }

    // 2. Fallback to an active role from another company (database state)
    // Only if it hasn't been claimed by another role in this form
    if (existingCurrentRole && !alreadyTargetedIds.includes(existingCurrentRole.experience_id)) {
      return {
        title: `${existingCurrentRole.title} at ${existingCurrentRole.company_name}`,
        id: existingCurrentRole.experience_id
      };
    }

    return null;
  };

  /** Check if the company currently entered exists in the user's current profile */
  const isExistingCompany = useMemo(() => {
    if (!company.trim()) return false;
    const norm = company.toLowerCase().trim();
    return existingExperiences.some(e =>
      (orgId && e.org_id === orgId) ||
      (!orgId && !e.org_id && e.company_name.toLowerCase().trim() === norm)
    );
  }, [company, orgId, existingExperiences]);

  /** Disable "Add new role" if it's a brand new company record (not editing, not existing) */
  const canAddRole = isEditing || isExistingCompany;

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
      const shouldEnd = (index > 0 || (index === 0 && !!existingCurrentRole)) && role.endCurrentRole
      return {
        experience_id: role.experience_id,
        title: role.title.trim(),
        company_name: company.trim(),
        org_id: orgId,
        location: location.trim() || null,
        work_type: role.work_type || null,
        work_mode: role.work_mode || null,
        start_date: startDate,
        end_date: endDate,
        is_current: role.is_current,
        description: role.description.trim() || null,
        shouldEndPreviousRole: shouldEnd,
        experienceIdToEnd: role.experienceIdToEnd,
      }
    })
    try {
      await onSave(savedRoles, deletedRoleIds)
    } catch (err: any) {
      if (err.response?.status === 422 && err.response.data?.errors) {
        const newFieldErrors = { ...fieldErrors }
        err.response.data.errors.forEach((e: any) => {
          // Parse path like "experiences.0" or "experiences.1.is_current"
          const pathParts = e.path ? e.path.split(".") : []
          if (pathParts[0] === "experiences" && pathParts[1] !== undefined) {
            const roleIndex = parseInt(pathParts[1], 10)
            if (!isNaN(roleIndex)) {
              // Map to the start date field so it shows up in the UI
              newFieldErrors[roleIndex] = { startDate: e.message }
            }
          }
        })
        setFieldErrors(newFieldErrors)
      } else if (err.response?.status === 409) {
        alert("Version conflict: someone else updated this profile. Please refresh the page.")
      }
    }
  }

  const inputStyles =
    "bg-white border-[#E5E7EB] placeholder-[#6B7280] rounded-[16px] h-[48px] font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] text-left"
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

        {/* Close button handled by global DialogPrimitive.Close in ProfilePage */}

        {/* Desktop header */}
        <div className="hidden sm:block text-left mb-8 relative">
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
            disabled={!canAddRole}
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full border border-border transition-all text-primary font-[family-name:var(--font-poppins)] text-[14px] font-medium",
              canAddRole ? "hover:bg-secondary" : "opacity-30 cursor-not-allowed border-dashed"
            )}
            title={!canAddRole ? "You can only add multiple roles to an existing company" : "Add another role at this company"}
          >
            <Plus className="w-4 h-4" />
            Add new role
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Company + Location — shared across roles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
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
          {multipleCurrentRoles && activeRoleIndex === 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-[12px]">
              <Icon icon="mdi:alert-outline" className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-[12px] text-amber-700 font-[family-name:var(--font-poppins)]">
                You already have an active role. Adding another "currently working" role is allowed
                (e.g. freelance, parallel positions) but make sure this is intentional.
              </p>
            </div>
          )}

          {/* Role sections — array-driven */}
          {roles.map((role, index) => {
            const targetRole = getTargetRoleToEnd(index);
            return (
              <div key={index} className={index !== activeRoleIndex ? "hidden" : "block"}>
                <RoleSection
                  role={role}
                  index={index}
                  isFirst={index === 0}
                  isOnly={roles.length === 1}
                  showEndCurrentRole={!!targetRole}
                  existingCurrentRoleId={targetRole?.id}
                  previousRoleTitle={targetRole?.title}
                  onChange={(updated) => updateRole(index, updated)}
                  onRemove={
                    roles.length > 1 ? () => removeRole(index) : undefined
                  }
                  fieldErrors={fieldErrors[index]}
                  fieldWarnings={fieldWarnings[index]}
                />
              </div>
            );
          })}

          {/* Mobile: Add new role button */}
          <button
            type="button"
            onClick={addNewRole}
            disabled={!canAddRole}
            className={cn(
              "sm:hidden flex items-center gap-2 w-full justify-center py-3 rounded-[16px] border border-dashed text-[14px] font-medium font-[family-name:var(--font-poppins)] transition-all",
              canAddRole
                ? "border-[#6366F1] text-[#6366F1] hover:bg-[#EEF2FF]"
                : "border-gray-300 text-gray-400 opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-4 h-4" />
            Add new role
          </button>

          {/* Desktop footer actions */}
          <div className="hidden sm:flex justify-center items-center gap-4 pt-8 border-t border-[#E5E7EB]">
            {isEditing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (initialExperiences && initialExperiences.length > 0) {
                    const allIds = initialExperiences
                      .map(exp => exp.experience_id)
                      .filter((id): id is string => !!id);
                    onDelete?.(allIds);
                  }
                }}
                disabled={isSaving}
                className="h-10 px-8 rounded-full border-red-200 text-red-500 hover:bg-transparent bg-transparent font-medium w-[142px]"
              >
                Delete
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
                className="h-10 px-8 rounded-full border-[#818CF8] text-[#818CF8] hover:bg-transparent bg-white font-medium w-[142px]"
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="h-10 px-8 rounded-full bg-[#6366F1] text-white hover:bg-[#4F46E5] font-medium w-[142px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
