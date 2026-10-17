"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface JobDescriptionStepProps {
  formData: {
    description: string
    easyApply: boolean
    activelyHiring: boolean
  }
  updateFormData: (data: Partial<JobDescriptionStepProps["formData"]>) => void
  errors?: Record<string, string>
}

export function JobDescriptionStep({ formData, updateFormData, errors = {} }: JobDescriptionStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 transition-all">
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border pb-2">Job Description</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description *</label>
          <textarea
            rows={8}
            placeholder="Describe the role, responsibilities, and requirements..."
            className={`w-full p-3 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all duration-200 ${
              errors.description ? "border-red-500 bg-red-500/5" : "border-border"
            }`}
            value={formData.description}
            onChange={e => updateFormData({ description: e.target.value })}
            autoFocus
          />
          {errors.description && <p className="text-xs text-red-500 mt-1 flex items-center gap-1 font-medium italic">
            <span className="w-1 h-1 rounded-full bg-red-500" />
            {errors.description}
          </p>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b border-border pb-2">Settings</h3>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-4 cursor-pointer p-4 border border-border rounded-2xl hover:bg-muted/30 transition-all duration-200 group relative overflow-hidden">
            <div className={cn(
              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300",
              formData.easyApply ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/20" : "border-muted-foreground group-hover:border-primary"
            )}>
              {formData.easyApply && <Check className="w-4 h-4 text-primary-foreground stroke-[3] animate-in zoom-in duration-200" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={formData.easyApply} 
              onChange={e => updateFormData({ easyApply: e.target.checked })} 
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Enable Easy Apply</span>
              <span className="text-xs text-muted-foreground">Allow candidates to apply with one click</span>
            </div>
          </label>

          <label className="flex items-center gap-4 cursor-pointer p-4 border border-border rounded-2xl hover:bg-muted/30 transition-all duration-200 group relative overflow-hidden">
            <div className={cn(
              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-300",
              formData.activelyHiring ? "bg-primary border-primary scale-110 shadow-lg shadow-primary/20" : "border-muted-foreground group-hover:border-primary"
            )}>
              {formData.activelyHiring && <Check className="w-4 h-4 text-primary-foreground stroke-[3] animate-in zoom-in duration-200" />}
            </div>
            <input 
              type="checkbox" 
              className="hidden" 
              checked={formData.activelyHiring} 
              onChange={e => updateFormData({ activelyHiring: e.target.checked })} 
            />
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight">Actively Hiring Badge</span>
              <span className="text-xs text-muted-foreground">Show an 'Actively Hiring' badge on the job card</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
