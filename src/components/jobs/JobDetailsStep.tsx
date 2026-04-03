"use client"

import type { WorkMode, CompanyType } from "@/types/jobs"

interface JobDetailsStepProps {
  formData: {
    title: string
    location: string
    type: string
    minSalary: string
    maxSalary: string
    experience: string
    workMode: WorkMode
    skills: string
  }
  updateFormData: (data: Partial<JobDetailsStepProps["formData"]>) => void
  errors: Record<string, string>
  step: number
}

export function JobDetailsStep({ formData, updateFormData, errors, step }: JobDetailsStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Basic Information</h3>
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title *</label>
            <input
              type="text"
              placeholder="e.g. Senior Frontend Engineer"
              className={`w-full p-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
                errors.title ? "border-red-500 bg-red-500/5" : "border-border"
              }`}
              value={formData.title}
              onChange={e => updateFormData({ title: e.target.value })}
              autoFocus
            />
            {errors.title && <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium italic">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {errors.title}
            </p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Location & Compensation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employment Type *</label>
              <select
                className="w-full p-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Work Mode *</label>
              <select
                className="w-full p-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                value={formData.workMode}
                onChange={e => updateFormData({ workMode: e.target.value as WorkMode })}
              >
                <option>Onsite</option>
                <option>Hybrid</option>
                <option>Remote</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location *</label>
            <input
              type="text"
              placeholder="e.g. San Francisco, CA"
              className={`w-full p-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 ${
                errors.location ? "border-red-500 bg-red-500/5" : "border-border"
              }`}
              value={formData.location}
              onChange={e => updateFormData({ location: e.target.value })}
            />
            {errors.location && <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium italic">
              <span className="w-1 h-1 rounded-full bg-red-500" />
              {errors.location}
            </p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Salary (Annual)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  className="w-full pl-7 p-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                  value={formData.minSalary}
                  onChange={e => updateFormData({ minSalary: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Salary (Annual)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  className="w-full pl-7 p-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                  value={formData.maxSalary}
                  onChange={e => updateFormData({ maxSalary: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">Requirements & Skills</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Experience Level</label>
            <select
              className="w-full p-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
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
            <textarea
              placeholder="e.g. React, TypeScript, Tailwind CSS"
              className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 min-h-[100px] resize-none"
              value={formData.skills}
              onChange={e => updateFormData({ skills: e.target.value })}
            />
            <p className="text-[10px] text-muted-foreground italic">Add your top skills separated by commas to help candidates find your job.</p>
          </div>
        </div>
      )}
    </div>
  )
}
