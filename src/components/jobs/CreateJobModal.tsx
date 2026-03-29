"use client"

import { useState, useEffect, useRef } from "react"
import { useJobs } from "@/context/JobsContext"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkMode, CompanyType, JobFormData, Job } from "@/types/jobs"
import * as api from "@/services/api/jobs"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { JobDetailsStep } from "./JobDetailsStep"
import { JobDescriptionStep } from "./JobDescriptionStep"

interface CreateJobModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  initialData?: Job
}

export function CreateJobModal({ open, onOpenChange, trigger, initialData }: CreateJobModalProps) {
  const { addJob } = useJobs()
  const { activeProfile, isCompany } = useActiveProfile()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
    if (!newOpen) {
      setTimeout(() => setCurrentStep(1), 300)
    }
  }

  const isOpen = isControlled ? open : internalOpen

  // Stepper State
  const [currentStep, setCurrentStep] = useState(1)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    type: "Full-time",
    minSalary: "",
    maxSalary: "",
    description: "",
    skills: "",
    experience: "Entry Level",
    workMode: "Onsite" as WorkMode,
    industry: "Technology",
    easyApply: true,
    activelyHiring: true,
  })

  // Scroll to top when step changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep])

  // Pre-fill form when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        location: initialData.location,
        type: initialData.type,
        minSalary: "", 
        maxSalary: "",
        description: initialData.description || "",
        skills: initialData.skills?.join(", ") || "",
        experience: initialData.experience || "Entry Level",
        workMode: (initialData.workMode as WorkMode) || "Onsite",
        industry: initialData.industry || "Technology",
        easyApply: initialData.easyApply || false,
        activelyHiring: initialData.activelyHiring || false,
      })
    } else if (isOpen) {
      setFormData({
        title: "",
        location: "",
        type: "Full-time",
        minSalary: "",
        maxSalary: "",
        description: "",
        skills: "",
        experience: "Entry Level",
        workMode: "Onsite",
        industry: "Technology",
        easyApply: true,
        activelyHiring: true,
      })
    }
    setCurrentStep(1)
    setErrors({})
  }, [initialData, isOpen, activeProfile])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isStep1Valid = () => {
    return formData.title.trim() !== "" && 
           formData.location.trim() !== ""
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = "Job title is required"
    if (!formData.location.trim()) newErrors.location = "Location is required"
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep === 1) {
      handleNext()
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const apiData: JobFormData = {
        jobTitle: formData.title,
        jobDescription: formData.description,
        location: formData.location,
        experience: formData.experience,
        jobType: formData.type,
        minSalary: formData.minSalary,
        maxSalary: formData.maxSalary,
        skills: formData.skills,
        workMode: formData.workMode,
        industry: formData.industry,
        activelyHiring: formData.activelyHiring,
        easyApply: formData.easyApply,
        companyId: isCompany && activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined,
      }

      if (initialData?.id) {
        await api.updateJob(initialData.id, apiData)
      } else {
        await api.createJob(apiData)
        await addJob({} as any)
      }

      handleOpenChange(false)
    } catch (err: any) {
      console.error("Failed to save job", err);
      setSubmitError(err.response?.data?.message || "Failed to save job. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (data: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...data }))
    if (errors[Object.keys(data)[0]]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[Object.keys(data)[0]]
        return next
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 bg-background rounded-2xl border border-border overflow-hidden">
        <DialogHeader className="p-6 border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                Step {currentStep} of 2
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                — {currentStep === 1 ? "Job Details" : "Description & Settings"}
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">
              {initialData ? "Update Job Posting" : "Create New Job"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {initialData ? "Modify the details of your job listing." : "Provide the details for your new job opening."}
            </DialogDescription>
          </div>
          
          <div className="absolute bottom-0 left-0 h-1 bg-muted w-full">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
        </DialogHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
          <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
            <div className="p-6 space-y-6 flex-1">
              {submitError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-sm animate-in fade-in zoom-in duration-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              {currentStep === 1 ? (
                <JobDetailsStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                  errors={errors} 
                />
              ) : (
                <JobDescriptionStep 
                  formData={formData} 
                  updateFormData={updateFormData} 
                />
              )}
            </div>

            <div className="p-6 border-t border-border bg-background flex items-center justify-between gap-3 sticky bottom-0 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  currentStep === 1 ? handleOpenChange(false) : handleBack()
                }}
                className="px-5 py-2.5 rounded-xl border border-border font-semibold hover:bg-muted transition-all flex items-center gap-2"
              >
                {currentStep === 1 ? (
                  "Cancel"
                ) : (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </>
                )}
              </button>
              
              <div className="flex items-center gap-3">
                {currentStep === 1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleNext()
                    }}
                    disabled={!isStep1Valid()}
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale-[0.5] disabled:cursor-not-allowed"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {initialData ? "Updating..." : "Posting..."}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        {initialData ? "Update Job" : "Post Job"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
