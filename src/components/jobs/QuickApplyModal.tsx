"use client"

import { useState } from "react"
import { useJobs } from "@/context/JobsContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, Upload } from "lucide-react"

interface QuickApplyModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  jobId: number
  jobTitle: string
}

export function QuickApplyModal({ open, onOpenChange, trigger, jobId, jobTitle }: QuickApplyModalProps) {
  const { applyToJob } = useJobs()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }

  const isOpen = isControlled ? open : internalOpen

  const [formData, setFormData] = useState({
    name: "Alex Doe", // Mock user
    email: "alex@example.com",
    phone: "",
    resume: null as File | null,
    coverNote: ""
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      applyToJob(jobId)
      setIsSubmitting(false)
      setIsSuccess(true)

      // Close after success
      setTimeout(() => {
        setIsSuccess(false)
        handleOpenChange(false)
        setFormData({ name: "Alex Doe", email: "alex@example.com", phone: "", resume: null, coverNote: "" })
      }, 1500)
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md bg-background rounded-xl border border-border">
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
             <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
               <Check className="w-8 h-8 text-green-500" />
             </div>
             <div>
               <h3 className="text-xl font-bold">Application Sent!</h3>
               <p className="text-muted-foreground mt-2">Good luck! You can track your status in My Jobs.</p>
             </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply to {jobTitle}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  required
                  type="text"
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    required
                    type="email"
                    className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone (Optional)</label>
                  <input
                    type="tel"
                    className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resume</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/30 transition-colors">
                   <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                   <span className="text-sm text-primary font-medium">Upload Resume</span>
                   <span className="text-xs text-muted-foreground mt-1">PDF, DOCX up to 5MB</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Note (Optional)</label>
                <textarea
                  rows={3}
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none resize-none"
                  value={formData.coverNote}
                  onChange={e => setFormData({...formData, coverNote: e.target.value})}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Submit Application"}
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
