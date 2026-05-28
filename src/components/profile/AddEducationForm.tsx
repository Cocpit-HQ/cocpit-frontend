"use client"

/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */

import React, { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Education } from "@/types/entities"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, X, Loader2, GraduationCap, ChevronDown, Plus } from "lucide-react"
import { Icon } from '@iconify/react'
import dayjs from "dayjs"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { getEducationList } from "@/services/api/onboarding"
import acStyles from "@/components/ui/LocationAutocomplete.module.css"
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

  // ── School autocomplete state ─────────────────────────────────────────────
  const [schoolOptions, setSchoolOptions] = useState<string[]>([])
  const [schoolSearch, setSchoolSearch] = useState(formData.school_name)
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false)
  const [schoolLoading, setSchoolLoading] = useState(false)
  const [schoolHighlight, setSchoolHighlight] = useState(-1)
  const schoolWrapperRef = useRef<HTMLDivElement>(null)
  const schoolInputRef = useRef<HTMLInputElement>(null)
  const schoolSelectedRef = useRef(false)
  const schoolListRef = useRef<HTMLUListElement>(null)
  const debouncedSchoolSearch = useDebounce(schoolSearch, 300)

  // ── Degree autocomplete state ─────────────────────────────────────────────
  const [degreeOptions, setDegreeOptions] = useState<string[]>([])
  const [degreeSearch, setDegreeSearch] = useState(formData.degree)
  const [showDegreeDropdown, setShowDegreeDropdown] = useState(false)
  const [degreeLoading, setDegreeLoading] = useState(false)
  const [degreeHighlight, setDegreeHighlight] = useState(-1)
  const degreeWrapperRef = useRef<HTMLDivElement>(null)
  const degreeInputRef = useRef<HTMLInputElement>(null)
  const degreeSelectedRef = useRef(false)
  const degreeListRef = useRef<HTMLUListElement>(null)
  const debouncedDegreeSearch = useDebounce(degreeSearch, 300)

  // ── specialisation autocomplete state ─────────────────────────────────────────────

  const [specializationOptions, setSpecializationOptions] = useState<string[]>([])
  const [specializationSearch, setSpecializationSearch] = useState(formData.field_of_study)
  const [showSpecializationDropdown, setShowSpecializationDropdown] = useState(false)
  const [specializationLoading, setSpecializationLoading] = useState(false)
  const [specializationHighlight, setSpecializationHighlight] = useState(-1)

  const specializationWrapperRef = useRef<HTMLDivElement>(null)
  const specializationInputRef = useRef<HTMLInputElement>(null)
  const specializationListRef = useRef<HTMLUListElement>(null)
  const specializationSelectedRef = useRef(false)
  const schoolDirtyRef = useRef(false)
  const degreeDirtyRef = useRef(false)
  const specializationDirtyRef = useRef(false)

  const lastSchoolQueryRef = useRef(initialData?.school_name ?? "")
  const schoolCacheRef = useRef<Record<string, string[]>>({})

  const lastDegreeQueryRef = useRef(initialData?.degree ?? "")
  const degreeCacheRef = useRef<Record<string, string[]>>({})

  const lastSpecializationQueryRef = useRef(initialData?.field_of_study ?? "")
  const specializationCacheRef = useRef<Record<string, string[]>>({})

  const debouncedSpecializationSearch = useDebounce(specializationSearch, 300)

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
      setSchoolSearch(initialData.school_name ?? "")
      setDegreeSearch(initialData.degree ?? "")
      setSpecializationSearch(initialData.field_of_study ?? "")
      lastSchoolQueryRef.current = initialData.school_name ?? ""
      lastDegreeQueryRef.current = initialData.degree ?? ""
      lastSpecializationQueryRef.current = initialData.field_of_study ?? ""
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
      setSchoolSearch("")
      setDegreeSearch("")
      setSpecializationSearch("")
      lastSchoolQueryRef.current = ""
      lastDegreeQueryRef.current = ""
      lastSpecializationQueryRef.current = ""
    }
    schoolDirtyRef.current = false
    degreeDirtyRef.current = false
    specializationDirtyRef.current = false
    setFieldErrors({})
  }, [initialData])

  const existingCurrentEducation = useMemo(() => {
    return existingEducations.find(education =>
      education.education_id !== initialData?.education_id &&
      !education.end_date
    ) || null
  }, [existingEducations, initialData])

  // ── Fetch school suggestions ──────────────────────────────────────────────
  useEffect(() => {
    const query = debouncedSchoolSearch.trim()

    // ❌ 1. Empty input → reset
    if (!query) {
      setSchoolOptions([])
      lastSchoolQueryRef.current = ""
      return
    }

    // ❌ 2. Prevent API after selecting from dropdown
    if (schoolSelectedRef.current) {
      schoolSelectedRef.current = false
      return
    }

    // ❌ 3. Prevent duplicate API for same query
    if (lastSchoolQueryRef.current === query) return

    // ✅ 4. Serve from cache (NO API call)
    if (schoolCacheRef.current[query]) {
      const cached = schoolCacheRef.current[query]
      setSchoolOptions(cached)

      if (
        cached.length > 0 &&
        document.activeElement === schoolInputRef.current &&
        schoolSearch.trim() === query
      ) {
        setShowSchoolDropdown(true)
      }

      setSchoolHighlight(-1)

      // ✅ mark as handled
      lastSchoolQueryRef.current = query
      return
    }

    let cancelled = false
    setSchoolLoading(true)

    // 🚫 DO NOT set lastQueryRef here

    getEducationList(query, "")
      .then((res) => {
        if (cancelled) return

        const names = res.school_names || []
        const uniqueNames = Array.from(new Set(names))

        // ✅ Save to cache
        schoolCacheRef.current[query] = uniqueNames

        setSchoolOptions(uniqueNames)

        if (
          uniqueNames.length > 0 &&
          document.activeElement === schoolInputRef.current &&
          schoolSearch.trim() === query
        ) {
          setShowSchoolDropdown(true)
        }

        setSchoolHighlight(-1)

        // ✅ IMPORTANT: set AFTER success
        lastSchoolQueryRef.current = query
      })
      .catch(() => {
        if (!cancelled) setSchoolOptions([])
      })
      .finally(() => {
        if (!cancelled) setSchoolLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSchoolSearch])


  // ── Fetch degree suggestions ──────────────────────────────────────────────
  useEffect(() => {
    const query = debouncedDegreeSearch.trim()

    // ❌ 1. Empty input → reset
    if (!query) {
      setDegreeOptions([])
      lastDegreeQueryRef.current = ""
      return
    }

    // ❌ 2. Prevent API after selecting from dropdown
    if (degreeSelectedRef.current) {
      degreeSelectedRef.current = false
      return
    }

    // ❌ 3. Prevent duplicate API for same query
    if (lastDegreeQueryRef.current === query) return

    // ✅ 4. Serve from cache (NO API call)
    if (degreeCacheRef.current[query]) {
      const cached = degreeCacheRef.current[query]
      setDegreeOptions(cached)

      if (
        cached.length > 0 &&
        document.activeElement === degreeInputRef.current &&
        degreeSearch.trim() === query
      ) {
        setShowDegreeDropdown(true)
      }

      setDegreeHighlight(-1)

      // ✅ mark as handled
      lastDegreeQueryRef.current = query
      return
    }

    let cancelled = false
    setDegreeLoading(true)

    // 🚫 DO NOT set lastQueryRef here

    getEducationList("", query)
      .then((res) => {
        if (cancelled) return

        const degs = res.degrees || []
        const uniqueDegrees = Array.from(new Set(degs))

        // ✅ Save to cache
        degreeCacheRef.current[query] = uniqueDegrees

        setDegreeOptions(uniqueDegrees)

        if (
          uniqueDegrees.length > 0 &&
          document.activeElement === degreeInputRef.current &&
          degreeSearch.trim() === query
        ) {
          setShowDegreeDropdown(true)
        }

        setDegreeHighlight(-1)

        // ✅ IMPORTANT: set AFTER success
        lastDegreeQueryRef.current = query
      })
      .catch(() => {
        if (!cancelled) setDegreeOptions([])
      })
      .finally(() => {
        if (!cancelled) setDegreeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedDegreeSearch])

  // ── Fetch specialization suggestions ─────────────────────────────────────
  useEffect(() => {
    const query = debouncedSpecializationSearch.trim()

    // ❌ 1. Empty input → reset
    if (!query) {
      setSpecializationOptions([])
      lastSpecializationQueryRef.current = ""
      return
    }

    // ❌ 2. Prevent API after selecting from dropdown
    if (specializationSelectedRef.current) {
      specializationSelectedRef.current = false
      return
    }

    // ❌ 3. Prevent duplicate API for same query
    if (lastSpecializationQueryRef.current === query) return

    // ✅ 4. Serve from cache (NO API call)
    if (specializationCacheRef.current[query]) {
      const cached = specializationCacheRef.current[query]
      setSpecializationOptions(cached)

      if (
        cached.length > 0 &&
        document.activeElement === specializationInputRef.current &&
        specializationSearch.trim() === query
      ) {
        setShowSpecializationDropdown(true)
      }

      setSpecializationHighlight(-1)

      // ✅ mark as handled
      lastSpecializationQueryRef.current = query
      return
    }

    let cancelled = false
    setSpecializationLoading(true)

    // 🚫 DO NOT set lastQueryRef here

    getEducationList("", "", query)
      .then((res) => {
        if (cancelled) return

        const specs = res.specializations || []
        const uniqueSpecs = Array.from(new Set(specs))

        // ✅ Save to cache
        specializationCacheRef.current[query] = uniqueSpecs

        setSpecializationOptions(uniqueSpecs)

        if (
          uniqueSpecs.length > 0 &&
          document.activeElement === specializationInputRef.current &&
          specializationSearch.trim() === query
        ) {
          setShowSpecializationDropdown(true)
        }

        setSpecializationHighlight(-1)

        // ✅ IMPORTANT: set AFTER success
        lastSpecializationQueryRef.current = query
      })
      .catch(() => {
        if (!cancelled) setSpecializationOptions([])
      })
      .finally(() => {
        if (!cancelled) setSpecializationLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedSpecializationSearch])

  // ── Focus handlers (open dropdown on click/focus and fetch suggestions) ─────
  const handleSchoolFocus = () => {
    if (schoolOptions.length > 0) {
      setShowSchoolDropdown(true)
    }
    const query = schoolSearch.trim()

    // Serve from cache if available
    if (schoolCacheRef.current[query]) {
      const cached = schoolCacheRef.current[query]
      setSchoolOptions(cached)
      if (cached.length > 0) {
        setShowSchoolDropdown(true)
      }
      setSchoolHighlight(-1)
      return
    }

    setSchoolLoading(true)
    getEducationList(query, "")
      .then((res) => {
        const names = res.school_names || []
        const uniqueNames = Array.from(new Set(names))
        schoolCacheRef.current[query] = uniqueNames
        setSchoolOptions(uniqueNames)
        if (uniqueNames.length > 0) {
          setShowSchoolDropdown(true)
        }
        setSchoolHighlight(-1)
        lastSchoolQueryRef.current = query
      })
      .catch(() => {})
      .finally(() => setSchoolLoading(false))
  }
  const handleDegreeFocus = () => {
    if (degreeOptions.length > 0) {
      setShowDegreeDropdown(true)
    }
    const query = degreeSearch.trim()

    // Serve from cache if available
    if (degreeCacheRef.current[query]) {
      const cached = degreeCacheRef.current[query]
      setDegreeOptions(cached)
      if (cached.length > 0) {
        setShowDegreeDropdown(true)
      }
      setDegreeHighlight(-1)
      return
    }

    setDegreeLoading(true)
    getEducationList("", query)
      .then((res) => {
        const degs = res.degrees || []
        const uniqueDegrees = Array.from(new Set(degs))
        degreeCacheRef.current[query] = uniqueDegrees
        setDegreeOptions(uniqueDegrees)
        if (uniqueDegrees.length > 0) {
          setShowDegreeDropdown(true)
        }
        setDegreeHighlight(-1)
        lastDegreeQueryRef.current = query
      })
      .catch(() => {})
      .finally(() => setDegreeLoading(false))
  }
  const handleSpecializationFocus = () => {
    if (specializationOptions.length > 0) {
      setShowSpecializationDropdown(true)
    }
    const query = specializationSearch.trim()

    // Serve from cache if available
    if (specializationCacheRef.current[query]) {
      const cached = specializationCacheRef.current[query]
      setSpecializationOptions(cached)
      if (cached.length > 0) {
        setShowSpecializationDropdown(true)
      }
      setSpecializationHighlight(-1)
      return
    }

    setSpecializationLoading(true)
    getEducationList("", "", query)
      .then((res) => {
        const specs = res.specializations || []
        const uniqueSpecs = Array.from(new Set(specs))
        specializationCacheRef.current[query] = uniqueSpecs
        setSpecializationOptions(uniqueSpecs)
        if (uniqueSpecs.length > 0) {
          setShowSpecializationDropdown(true)
        }
        setSpecializationHighlight(-1)
        lastSpecializationQueryRef.current = query
      })
      .catch(() => {})
      .finally(() => setSpecializationLoading(false))
  }

  // ── Outside click ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (schoolWrapperRef.current && !schoolWrapperRef.current.contains(e.target as Node)) {
        setShowSchoolDropdown(false)
      }
      if (degreeWrapperRef.current && !degreeWrapperRef.current.contains(e.target as Node)) {
        setShowDegreeDropdown(false)
      }
      if (specializationWrapperRef.current && !specializationWrapperRef.current.contains(e.target as Node)) {
        setShowSpecializationDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // ── Selection helpers ─────────────────────────────────────────────────────
  const selectSchool = (name: string) => {
    schoolSelectedRef.current = true
    schoolDirtyRef.current = false
    const value = name
    setFormData(prev => ({ ...prev, school_name: value }))
    setSchoolSearch(value)
    setShowSchoolDropdown(false); setSchoolOptions([])
    lastSchoolQueryRef.current = value.trim()
  }
  const selectDegree = (deg: string) => {
    degreeSelectedRef.current = true
    degreeDirtyRef.current = false
    const value = deg
    setFormData(prev => ({ ...prev, degree: value }))
    setDegreeSearch(value)
    setShowDegreeDropdown(false); setDegreeOptions([])
    lastDegreeQueryRef.current = value.trim()
  }
  const selectSpecialization = (spec: string) => {
    specializationSelectedRef.current = true
    specializationDirtyRef.current = false
    const value = spec
    setFormData(prev => ({ ...prev, field_of_study: value }))
    setSpecializationSearch(value)
    setShowSpecializationDropdown(false); setSpecializationOptions([])
    lastSpecializationQueryRef.current = value.trim()
  }

  // ── "Other" option ── always visible at bottom of dropdown ─────────────────────────
  const schoolExactMatch = schoolOptions.some(n => n.toLowerCase() === schoolSearch.trim().toLowerCase())
  const degreeExactMatch = degreeOptions.some(d => d.toLowerCase() === degreeSearch.trim().toLowerCase())
  const specializationExactMatch = specializationOptions.some(s => s.toLowerCase() === specializationSearch.trim().toLowerCase())
  const showOtherSchool = !!schoolSearch.trim() && !schoolExactMatch
  const showOtherDegree = !!degreeSearch.trim() && !degreeExactMatch
  const showOtherSpecialization = !!specializationSearch.trim() && !specializationExactMatch
  const schoolTotalItems = schoolOptions.length + (showOtherSchool ? 1 : 0)
  const degreeTotalItems = degreeOptions.length + (showOtherDegree ? 1 : 0)
  const specializationTotalItems = specializationOptions.length + (showOtherSpecialization ? 1 : 0)

  // ── Auto-scroll on keyboard highlight ─────────────────────────────────────
  useEffect(() => {
    if (schoolHighlight >= 0 && schoolListRef.current) {
      const el = schoolListRef.current.querySelector(`[data-idx="${schoolHighlight}"]`) as HTMLElement
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [schoolHighlight])
  useEffect(() => {
    if (degreeHighlight >= 0 && degreeListRef.current) {
      const el = degreeListRef.current.querySelector(`[data-idx="${degreeHighlight}"]`) as HTMLElement
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [degreeHighlight])
  useEffect(() => {
    if (specializationHighlight >= 0 && specializationListRef.current) {
      const el = specializationListRef.current.querySelector(`[data-idx="${specializationHighlight}"]`) as HTMLElement
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [specializationHighlight])

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const handleSchoolKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setShowSchoolDropdown(false); return }
    if (!showSchoolDropdown || schoolTotalItems === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setSchoolHighlight(p => (p < schoolTotalItems - 1 ? p + 1 : 0)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSchoolHighlight(p => (p > 0 ? p - 1 : schoolTotalItems - 1)) }
    else if (e.key === "Enter") {
      e.preventDefault()
      if (schoolHighlight >= 0) {
        if (schoolHighlight < schoolOptions.length) {
          selectSchool(schoolOptions[schoolHighlight])
        } else if (showOtherSchool) {
          selectSchool(schoolSearch.trim())
        }
      }
    }
  }
  const handleDegreeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setShowDegreeDropdown(false); return }
    if (!showDegreeDropdown || degreeTotalItems === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setDegreeHighlight(p => (p < degreeTotalItems - 1 ? p + 1 : 0)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setDegreeHighlight(p => (p > 0 ? p - 1 : degreeTotalItems - 1)) }
    else if (e.key === "Enter") {
      e.preventDefault()
      if (degreeHighlight >= 0) {
        if (degreeHighlight < degreeOptions.length) {
          selectDegree(degreeOptions[degreeHighlight])
        } else if (showOtherDegree) {
          selectDegree(degreeSearch.trim())
        }
      }
    }
  }
  const handleSpecializationKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setShowSpecializationDropdown(false); return }
    if (!showSpecializationDropdown || specializationTotalItems === 0) return
    if (e.key === "ArrowDown") { e.preventDefault(); setSpecializationHighlight(p => (p < specializationTotalItems - 1 ? p + 1 : 0)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSpecializationHighlight(p => (p > 0 ? p - 1 : specializationTotalItems - 1)) }
    else if (e.key === "Enter") {
      e.preventDefault()
      if (specializationHighlight >= 0) {
        if (specializationHighlight < specializationOptions.length) {
          selectSpecialization(specializationOptions[specializationHighlight])
        } else if (showOtherSpecialization) {
          selectSpecialization(specializationSearch.trim())
        }
      }
    }
  }

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
          className="px-4 py-1.5 rounded-full bg-secondary text-primary font-medium text-[14px] disabled:opacity-50 transition-all font-[family-name:var(--font-poppins)]"
        >
          Save
        </button>
      </div>

      {/* Scrollable area with hidden scrollbar */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-12 py-4 scrollbar-hide pb-20 sm:pb-4 relative">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 hidden sm:block text-muted-foreground hover:text-foreground transition-colors outline-none border-none bg-transparent"
        >
          <X className="w-5 h-5 text-[#FF6B6B]" strokeWidth={1} />
        </button>
        {/* Close Button handled by global DialogPrimitive.Close in ProfilePage */}

        {/* Header */}
        <div className="hidden sm:block text-center mb-8">
          <h2 className="text-[18px] leading-[26px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-1">Add education</h2>
          <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">Update your professional information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Education & Qualification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col" ref={schoolWrapperRef}>
              <Label className={labelStyles}>Education</Label>
              <div className={acStyles.wrapper}>
                <div className={cn(acStyles.inputWrapper, showSchoolDropdown && acStyles.isOpen)} onClick={() => schoolInputRef.current?.focus()}>
                  <input ref={schoolInputRef} type="text" className={acStyles.input} placeholder="Enter your school or university" value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value)
                      setFormData(prev => ({ ...prev, school_name: e.target.value }))
                      schoolDirtyRef.current = true
                    }}
                    onFocus={handleSchoolFocus}
                    onKeyDown={handleSchoolKeyDown} autoComplete="off" />
                  <div className={acStyles.suffix}>
                    {schoolLoading ? <Loader2 className={acStyles.spinner} /> : schoolSearch ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSchoolSearch(""); setFormData(prev => ({ ...prev, school_name: "" })); setSchoolOptions([]); setShowSchoolDropdown(false) }} className={acStyles.clearBtn}>
                        <X className={acStyles.clearIcon} />
                      </button>
                    ) : (
                      <ChevronDown className={cn(acStyles.clearIcon, "text-muted-foreground transition-transform", showSchoolDropdown && "rotate-180")} />
                    )}
                  </div>
                </div>
                {showSchoolDropdown && (
                  <ul ref={schoolListRef} className={acStyles.dropdown}>
                    {schoolOptions.map((name, idx) => (
                      <li key={name} data-idx={idx} className={cn(acStyles.item, "date-select-item", idx === schoolHighlight && "bg-[#C7D2FE] text-[#111827] highlighted")} onMouseDown={() => selectSchool(name)} onMouseEnter={() => setSchoolHighlight(idx)}>
                        <GraduationCap className={acStyles.itemIcon} /><span>{name}</span>
                      </li>
                    ))}
                    {showOtherSchool && (
                      <li data-idx={schoolOptions.length} className={cn(acStyles.item, "border-t border-border date-select-item", schoolOptions.length === schoolHighlight && "bg-[#C7D2FE] text-[#111827] highlighted")}
                        onMouseDown={() => selectSchool(schoolSearch.trim())}
                        onMouseEnter={() => setSchoolHighlight(schoolOptions.length)}>
                        <Plus className={acStyles.itemIcon} />
                        <span>Other: &quot;{schoolSearch.trim()}&quot;</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex flex-col" ref={degreeWrapperRef}>
              <Label className={labelStyles}>Qualification</Label>
              <div className={acStyles.wrapper}>
                <div className={cn(acStyles.inputWrapper, showDegreeDropdown && acStyles.isOpen)} onClick={() => degreeInputRef.current?.focus()}>
                  <input ref={degreeInputRef} type="text" className={acStyles.input} placeholder="e.g. MBA" value={degreeSearch}
                    onChange={(e) => {
                      setDegreeSearch(e.target.value)
                      setFormData(prev => ({ ...prev, degree: e.target.value }))
                      degreeDirtyRef.current = true
                    }}
                    onFocus={handleDegreeFocus}
                    onKeyDown={handleDegreeKeyDown} autoComplete="off" />
                  <div className={acStyles.suffix}>
                    {degreeLoading ? <Loader2 className={acStyles.spinner} /> : degreeSearch ? (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setDegreeSearch(""); setFormData(prev => ({ ...prev, degree: "" })); setDegreeOptions([]); setShowDegreeDropdown(false) }} className={acStyles.clearBtn}>
                        <X className={acStyles.clearIcon} />
                      </button>
                    ) : (
                      <ChevronDown className={cn(acStyles.clearIcon, "text-muted-foreground transition-transform", showDegreeDropdown && "rotate-180")} />
                    )}
                  </div>
                </div>
                {showDegreeDropdown && (
                  <ul ref={degreeListRef} className={acStyles.dropdown}>
                    {degreeOptions.map((deg, idx) => (
                      <li key={deg} data-idx={idx} className={cn(acStyles.item, "date-select-item", idx === degreeHighlight && "bg-[#C7D2FE] text-[#111827] highlighted")} onMouseDown={() => selectDegree(deg)} onMouseEnter={() => setDegreeHighlight(idx)}>
                        <GraduationCap className={acStyles.itemIcon} /><span>{deg}</span>
                      </li>
                    ))}
                    {showOtherDegree && (
                      <li data-idx={degreeOptions.length} className={cn(acStyles.item, "border-t border-border date-select-item", degreeOptions.length === degreeHighlight && "bg-[#C7D2FE] text-[#111827] highlighted")}
                        onMouseDown={() => selectDegree(degreeSearch.trim())}
                        onMouseEnter={() => setDegreeHighlight(degreeOptions.length)}>
                        <Plus className={acStyles.itemIcon} />
                        <span>Other: &quot;{degreeSearch.trim()}&quot;</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Specialization & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col" ref={specializationWrapperRef}>
              <Label className={labelStyles}>Specialization</Label>
              <div className={acStyles.wrapper}>
                <div
                  className={cn(acStyles.inputWrapper, showSpecializationDropdown && acStyles.isOpen)}
                  onClick={() => specializationInputRef.current?.focus()}
                >
                  <input
                    ref={specializationInputRef}
                    type="text"
                    className={acStyles.input}
                    placeholder="e.g. Finance"
                    value={specializationSearch}
                    onChange={(e) => {
                      setSpecializationSearch(e.target.value)
                      setFormData(prev => ({ ...prev, field_of_study: e.target.value }))
                      specializationDirtyRef.current = true
                    }}
                    onFocus={handleSpecializationFocus}
                    onKeyDown={handleSpecializationKeyDown}
                    autoComplete="off"
                  />
                  <div className={acStyles.suffix}>
                    {specializationLoading ? (
                      <Loader2 className={acStyles.spinner} />
                    ) : specializationSearch ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSpecializationSearch("")
                          setFormData(prev => ({ ...prev, field_of_study: "" }))
                          setSpecializationOptions([])
                          setShowSpecializationDropdown(false)
                        }}
                        className={acStyles.clearBtn}
                      >
                        <X className={acStyles.clearIcon} />
                      </button>
                    ) : (
                      <ChevronDown className={cn(acStyles.clearIcon, "text-muted-foreground transition-transform", showSpecializationDropdown && "rotate-180")} />
                    )}
                  </div>
                </div>
                {showSpecializationDropdown && (
                  <ul ref={specializationListRef} className={acStyles.dropdown}>
                    {specializationOptions.map((item, idx) => (
                      <li
                        key={item}
                        data-idx={idx}
                        className={cn(
                          acStyles.item,
                          "date-select-item",
                          idx === specializationHighlight && "bg-[#C7D2FE] text-[#111827] highlighted"
                        )}
                        onMouseDown={() => selectSpecialization(item)}
                        onMouseEnter={() => setSpecializationHighlight(idx)}
                      >
                        <GraduationCap className={acStyles.itemIcon} />
                        <span>{item}</span>
                      </li>
                    ))}
                    {showOtherSpecialization && (
                      <li
                        data-idx={specializationOptions.length}
                        className={cn(
                          acStyles.item,
                          "border-t border-border date-select-item",
                          specializationOptions.length === specializationHighlight && "bg-[#C7D2FE] text-[#111827] highlighted"
                        )}
                        onMouseDown={() => selectSpecialization(specializationSearch.trim())}
                        onMouseEnter={() => setSpecializationHighlight(specializationOptions.length)}
                      >
                        <Plus className={acStyles.itemIcon} />
                        <span>Other: &quot;{specializationSearch.trim()}&quot;</span>
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <Label className={labelStyles}>Location</Label>
              <LocationAutocomplete
                mode="places"
                value={formData.location}
                onSelect={(val) => {
                  let locStr = "";
                  if (!val) {
                    locStr = "";
                  } else if (typeof val === 'string') {
                    locStr = val;
                  } else if ('formattedAddress' in val) {
                    locStr = val.formattedAddress;
                  } else {
                    locStr = val.name || "";
                  }
                  setFormData(prev => ({ ...prev, location: locStr }));
                }}
              />
            </div>
          </div>
          {/* Start Date */}
          <div className="space-y-2">
            <Label className={labelStyles}>Start date</Label>
            <div className="grid grid-cols-2 gap-6">
              <Select
                value={formData.startMonth}
                onValueChange={(val) =>
                  setFormData(prev => ({ ...prev, startMonth: val }))
                }
              >
                <SelectTrigger
                  className={cn(
                    inputStyles,
                    getSelectTextColor(formData.startMonth),
                    fieldErrors.startDate && "border-red-400"
                  )}
                >
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m} value={m} className="date-select-item">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={formData.startYear}
                onValueChange={(val) =>
                  setFormData(prev => ({ ...prev, startYear: val }))
                }
              >
                <SelectTrigger
                  className={cn(
                    inputStyles,
                    getSelectTextColor(formData.startYear),
                    fieldErrors.startDate && "border-red-400"
                  )}
                >
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(y => (
                    <SelectItem key={y} value={y} className="date-select-item">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldErrors.startDate && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {fieldErrors.startDate}
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
                  {months.map(m => <SelectItem key={m} value={m} className="date-select-item">{m}</SelectItem>)}
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
                  {years.map(y => <SelectItem key={y} value={y} className="date-select-item">{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {fieldErrors.endDate && (
              <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-[family-name:var(--font-poppins)]">
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
              className="text-[14px] font-medium text-[#111827] dark:text-foreground font-[family-name:var(--font-poppins)]"
            >
              I currently study here
            </label>
          </div>
          {fieldErrors.currentEducation && (
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-[family-name:var(--font-poppins)]">
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
                className="h-10 px-8 rounded-full border-[#FF6B6B]/20 text-[#FF6B6B] hover:bg-transparent bg-transparent font-medium w-[142px] font-[family-name:var(--font-poppins)]"
              >
                Delete
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="h-10 px-8 rounded-full border-[#818CF8] text-[#818CF8] hover:bg-transparent bg-white font-medium w-[142px] font-[family-name:var(--font-poppins)]"
              >
                Cancel
              </Button>
            )}

            <Button
              type="submit"
              disabled={!isFormValid}
              className="h-10 px-8 rounded-full bg-[#6366F1] text-white hover:bg-[#4F46E5] font-medium w-[142px] disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-poppins)]"
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
