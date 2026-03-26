"use client"

import type { WorkMode, CompanyType } from "@/types/jobs"

interface JobDetailsStepProps {
  formData: {
    title: string
    company: string
    location: string
    type: string
    minSalary: string
    maxSalary: string
    experience: string
    workMode: WorkMode
    companyType: CompanyType
    skills: string
  }
  updateFormData: (data: Partial<JobDetailsStepProps["formData"]>) => void
  errors: Record<string, string>
}

export function JobDetailsStep({ formData, updateFormData, errors }: JobDetailsStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border pb-2">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title *</label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              className={`w-full p-2 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors ${
                errors.title ? "border-red-500" : "border-border"
              }`}
              value={formData.title}
              onChange={e => updateFormData({ title: e.target.value })}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Employment Type *</label>
            <select
              className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={formData.type}
              onChange={e => updateFormData({ type: e.target.value })}
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
              type="text"
              placeholder="e.g. San Francisco, CA"
              className={`w-full p-2 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors ${
                errors.location ? "border-red-500" : "border-border"
              }`}
              value={formData.location}
              onChange={e => updateFormData({ location: e.target.value })}
            />
            {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Work Mode *</label>
            <select
              className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={formData.workMode}
              onChange={e => updateFormData({ workMode: e.target.value as WorkMode })}
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
              className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={formData.minSalary}
              onChange={e => updateFormData({ minSalary: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Salary (Annual)</label>
            <input
              type="number"
              placeholder="e.g. 150000"
              className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={formData.maxSalary}
              onChange={e => updateFormData({ maxSalary: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Experience Level</label>
            <select
              className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={formData.experience}
              onChange={e => updateFormData({ experience: e.target.value })}
            >
              <option>Entry Level</option>
              <option>Mid Level</option>
              <option>Senior Level</option>
              <option>Director</option>
              <option>Executive</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. React, TypeScript, Tailwind CSS"
              className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={formData.skills}
              onChange={e => updateFormData({ skills: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border pb-2">Company Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name *</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              className={`w-full p-2 rounded-lg border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors ${
                errors.company ? "border-red-500" : "border-border"
              }`}
              value={formData.company}
              onChange={e => updateFormData({ company: e.target.value })}
            />
            {errors.company && <p className="text-xs text-red-500">{errors.company}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Type *</label>
            <select
              className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={formData.companyType}
              onChange={e => updateFormData({ companyType: e.target.value as CompanyType })}
            >
              <option>Startup</option>
              <option>MNC</option>
              <option>Product-based</option>
              <option>Service-based</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
