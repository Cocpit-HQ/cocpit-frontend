"use client"

import { useState } from "react"
import { useJobs } from "@/context/JobsContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { X, Plus, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Job, WorkMode, CompanyType } from "@/types/jobs"

interface CreateJobModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

export function CreateJobModal({ open, onOpenChange, trigger }: CreateJobModalProps) {
  const { addJob } = useJobs()
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
    salary: "",
    description: "",
    skills: "",
    workMode: "Onsite" as WorkMode,
    companyType: "Startup" as CompanyType,
    industry: "Technology",
    easyApply: true,
    activelyHiring: true,
    aboutCompany: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Convert form data to Job object
    const newJob: Job = {
      id: 0, // Set in context
      title: formData.title,
      company: formData.company,
      location: formData.location,
      type: formData.type,
      salary: formData.salary || "Competitive",
      postedTime: "Just now",
      applicants: 0,
      logo: "gradient-1", // randomized in context
      description: formData.description,
      skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
      workMode: formData.workMode,
      companyType: formData.companyType,
      industry: formData.industry,
      easyApply: formData.easyApply,
      activelyHiring: formData.activelyHiring,
      aboutCompany: formData.aboutCompany
    }

    addJob(newJob)
    handleOpenChange(false)

    // Reset form
    setFormData({
      title: "",
      company: "",
      location: "",
      type: "Full-time",
      salary: "",
      description: "",
      skills: "",
      workMode: "Onsite",
      companyType: "Startup",
      industry: "Technology",
      easyApply: true,
      activelyHiring: true,
      aboutCompany: ""
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-background rounded-xl border border-border">
        <DialogHeader className="p-6 pb-2 border-b border-border sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Post a Job</DialogTitle>
            {/* <DialogClose asChild>
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </DialogClose> */}
          </div>
          <p className="text-sm text-muted-foreground">Create a new job listing to find the best talent.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Employment Type *</label>
                <select
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
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
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Work Mode *</label>
                <select
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.workMode}
                  onChange={e => setFormData({...formData, workMode: e.target.value as WorkMode})}
                >
                  <option>Onsite</option>
                  <option>Hybrid</option>
                  <option>Remote</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Salary Range</label>
              <input
                type="text"
                placeholder="e.g. $120k - $160k"
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                value={formData.salary}
                onChange={e => setFormData({...formData, salary: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                rows={4}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Skills (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. React, TypeScript, Tailwind CSS"
                className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                value={formData.skills}
                onChange={e => setFormData({...formData, skills: e.target.value})}
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
                  onChange={e => setFormData({...formData, company: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Company Type</label>
                <select
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.companyType}
                  onChange={e => setFormData({...formData, companyType: e.target.value as CompanyType})}
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
                onChange={e => setFormData({...formData, aboutCompany: e.target.value})}
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
                 <input type="checkbox" className="hidden" checked={formData.easyApply} onChange={e => setFormData({...formData, easyApply: e.target.checked})} />
                 <div className="flex flex-col">
                   <span className="text-sm font-medium">Enable Easy Apply</span>
                   <span className="text-xs text-muted-foreground">Allow candidates to apply with one click</span>
                 </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 border border-border rounded-lg hover:bg-muted/50">
                 <div className={cn("w-5 h-5 rounded border flex items-center justify-center transition-colors", formData.activelyHiring ? "bg-primary border-primary" : "border-muted-foreground")}>
                   {formData.activelyHiring && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                 </div>
                 <input type="checkbox" className="hidden" checked={formData.activelyHiring} onChange={e => setFormData({...formData, activelyHiring: e.target.checked})} />
                 <div className="flex flex-col">
                   <span className="text-sm font-medium">Actively Hiring Badge</span>
                   <span className="text-xs text-muted-foreground">Show an 'Actively Hiring' badge on the job card</span>
                 </div>
              </label>
            </div>
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
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Post Job
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
