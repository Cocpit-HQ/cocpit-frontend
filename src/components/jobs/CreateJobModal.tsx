"use client"

import { useState, useEffect } from "react"
import { useJobs } from "@/context/JobsContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkMode, CompanyType, JobFormData, Job } from "@/types/jobs"
import * as api from "@/services/api/jobs"

interface CreateJobModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  initialData?: Job
}

import { useActiveProfile } from "@/context/ActiveProfileContext"

export function CreateJobModal({ open, onOpenChange, trigger, initialData }: CreateJobModalProps) {
  const { addJob } = useJobs()
  const { activeProfile, isCompany } = useActiveProfile()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const isOpen = isControlled ? open : internalOpen

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    minSalary: "",
    maxSalary: "",
    description: "",
    skills: "",
    experience: "Entry Level",
    workMode: "Onsite" as WorkMode,
    companyType: "Startup" as CompanyType,
    industry: "Technology",
    easyApply: true,
    activelyHiring: true,
    aboutCompany: "",

  })

  // Pre-fill form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        company: initialData.company,
        location: initialData.location,
        type: initialData.type,
        minSalary: "", // Salary parsing would go here if needed
        maxSalary: "",
        description: initialData.description || "",
        skills: initialData.skills?.join(", ") || "",
        experience: initialData.experience || "Entry Level",
        workMode: (initialData.workMode as WorkMode) || "Onsite",
        companyType: (initialData.companyType as CompanyType) || "Startup",
        industry: initialData.industry || "Technology",
        easyApply: initialData.easyApply || false,
        activelyHiring: initialData.activelyHiring || false,
        aboutCompany: initialData.aboutCompany || "",

      })
    } else {
      // Reset defaults if no initialData (e.g. when opening "Post Job" after editing)
      setFormData({
        title: "",
        company: "",
        location: "",
        type: "Full-time",
        minSalary: "",
        maxSalary: "",
        description: "",
        skills: "",
        experience: "Entry Level",
        workMode: "Onsite" as WorkMode,
        companyType: "Startup" as CompanyType,
        industry: "Technology",
        easyApply: true,
        activelyHiring: true,
        aboutCompany: "",

      })
    }
  }, [initialData, isOpen]) // Reset/Fill when modal opens or data changes

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Map to strict JobFormData interface
      const apiData: JobFormData = {
        jobTitle: formData.title,
        companyName: formData.company,
        jobDescription: formData.description,
        location: formData.location,
        experience: formData.experience,
        jobType: formData.type,
        minSalary: formData.minSalary,
        maxSalary: formData.maxSalary,
        skills: formData.skills,
        workMode: formData.workMode,
        companyType: formData.companyType,
        industry: formData.industry,
        aboutCompany: formData.aboutCompany,
        activelyHiring: formData.activelyHiring,
        easyApply: formData.easyApply,
        companyId: isCompany && activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined,
      }

      if (initialData?.id) {
        await api.updateJob(initialData.id, apiData)
      } else {
        await api.createJob(apiData)
        await addJob({} as any) // Trigger context refresh
      }

      handleOpenChange(false)

      if (!initialData) {
        setFormData({
          title: "",
          company: "",
          location: "",
          type: "Full-time",
          minSalary: "",
          maxSalary: "",
          description: "",
          skills: "",
          experience: "Entry Level",
          workMode: "Onsite",
          companyType: "Startup",
          industry: "Technology",
          easyApply: true,
          activelyHiring: true,
          aboutCompany: "",

        })
      }

    } catch (err: any) {
      console.error("Failed to save job", err);
      setError(err.response?.data?.message || "Failed to save job. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background rounded-xl border border-border">
        <DialogHeader className="p-6 pb-2 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">{initialData ? "Edit Job" : "Post a Job"}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">{initialData ? "Update the job details below." : "Create a new job listing to find the best talent."}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Section 1: Job Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Job Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Employment Type *</label>
                <select
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Freelance</option>
                  <option>Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. San Francisco, CA"
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Work Mode *</label>
                <select
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.workMode}
                  onChange={e => setFormData({ ...formData, workMode: e.target.value as WorkMode })}
                >
                  <option>Onsite</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Min Salary (Annual)</label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.minSalary}
                  onChange={e => setFormData({ ...formData, minSalary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Salary (Annual)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.maxSalary}
                  onChange={e => setFormData({ ...formData, maxSalary: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Experience Level</label>
              <select
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                value={formData.experience}
                onChange={e => setFormData({ ...formData, experience: e.target.value })}
              >
                <option>Entry Level</option>
                <option>Mid Level</option>
                <option>Senior Level</option>
                <option>Director</option>
                <option>Executive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                rows={4}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skills (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. React, TypeScript, Tailwind CSS"
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                value={formData.skills}
                onChange={e => setFormData({ ...formData, skills: e.target.value })}
              />
            </div>
          </div>

          {/* Section 2: Company Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Company Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Company Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Acme Corp"
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.company}
                  onChange={e => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company Type</label>
                <select
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.companyType}
                  onChange={e => setFormData({ ...formData, companyType: e.target.value as CompanyType })}
                >
                  <option>Startup</option>
                  <option>MNC</option>
                  <option>Product-based</option>
                  <option>Service-based</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">About Company</label>
              <textarea
                rows={3}
                placeholder="Brief description about the company..."
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none resize-none"
                value={formData.aboutCompany}
                onChange={e => setFormData({ ...formData, aboutCompany: e.target.value })}
              />
            </div>
          </div>

          {/* Section 3: Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Settings</h3>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50">
                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.easyApply ? "bg-primary border-primary" : "border-muted-foreground")}>
                  {formData.easyApply && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <input type="checkbox" className="hidden" checked={formData.easyApply} onChange={e => setFormData({ ...formData, easyApply: e.target.checked })} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Enable Easy Apply</span>
                  <span className="text-xs text-muted-foreground">Allow candidates to apply with one click</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50">
                <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.activelyHiring ? "bg-primary border-primary" : "border-muted-foreground")}>
                  {formData.activelyHiring && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                </div>
                <input type="checkbox" className="hidden" checked={formData.activelyHiring} onChange={e => setFormData({ ...formData, activelyHiring: e.target.checked })} />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Actively Hiring Badge</span>
                  <span className="text-xs text-muted-foreground">Show an 'Actively Hiring' badge on the job card</span>
                </div>
              </label>
            </div>

            {/* Voice Pitch Requirement */}

          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-3 sticky bottom-0 bg-background pb-6">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              className="px-4 py-2 rounded-lg border border-border font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {initialData ? "Updating..." : "Posting..."}
                </>
              ) : (initialData ? "Update Job" : "Post Job")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
