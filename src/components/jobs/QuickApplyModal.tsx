"use client"

import { useState, useEffect } from "react"
import { useJobs } from "@/context/JobsContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Check, Upload, AlertCircle, FileText } from "lucide-react"
import * as api from "@/services/api/jobs"
import { getProfile } from "@/services/api/profile"
import { UserProfile } from "@/types/user"

interface QuickApplyModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  jobId: string
  jobTitle: string
}

export function QuickApplyModal({ open, onOpenChange, trigger, jobId, jobTitle }: QuickApplyModalProps) {
  const { applyToJob: refreshContext } = useJobs()
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
    name: "",
    email: "",
    phone: "",
    resume: null as File | null,
    coverNote: ""
  })

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resumeSource, setResumeSource] = useState<'profile' | 'upload'>('upload');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Fetch profile on mount or when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingProfile(true);
      getProfile()
        .then(data => {
          setProfile(data);
          setFormData(prev => ({
            ...prev,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone || "",
            coverNote: "" // Reset cover note on new open? optional
          }));

          if (data.resume && data.resume.url) {
            setResumeSource('profile');
          }
        })
        .catch(err => console.error("Failed to fetch profile", err))
        .finally(() => setIsLoadingProfile(false));
    }
  }, [isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, resume: e.target.files[0] });
      setError(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Validation
    if (resumeSource === 'upload' && !formData.resume) {
      setError("Please upload your resume.");
      setIsSubmitting(false);
      return;
    }

    if (resumeSource === 'profile' && !profile?.resume?.url) {
      setError("No profile resume found. Please upload one.");
      setIsSubmitting(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("full_name", formData.name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("cover_note", formData.coverNote);

      if (resumeSource === 'upload') {
        if (formData.resume) {
          data.append("resume", formData.resume);
        }
      } else {
        // Pass the resume URL from profile
        if (profile?.resume?.url) {
          data.append("resume_url", profile.resume.url);
        }
      }

      await api.applyToJob(jobId, data);

      // Update context to reflect changed status
      refreshContext(jobId);

      setIsSuccess(true)

      // Close after success
      setTimeout(() => {
        setIsSuccess(false)
        handleOpenChange(false)
        // Reset form but keep name/email
        if (profile) {
          setFormData({
            name: profile.user.name,
            email: profile.user.email,
            phone: profile.user.phone || "",
            resume: null,
            coverNote: ""
          })
          if (profile.resume?.url) setResumeSource('profile'); else setResumeSource('upload');
        } else {
          setFormData({ name: "", email: "", phone: "", resume: null, coverNote: "" })
        }

      }, 2000)

    } catch (err: any) {
      console.error("Application failed", err);
      setError(err.response?.data?.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false)
    }
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
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {isLoadingProfile && (
                <div className="text-xs text-muted-foreground text-center">Loading your profile...</div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  required
                  readOnly
                  type="text"
                  className="w-full p-2 rounded-lg border border-border bg-muted text-muted-foreground focus:outline-none cursor-not-allowed"
                  value={formData.name}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    required
                    readOnly
                    type="email"
                    className="w-full p-2 rounded-lg border border-border bg-muted text-muted-foreground focus:outline-none cursor-not-allowed"
                    value={formData.email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone (Optional)</label>
                  <input
                    type="tel"
                    className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium block">Resume</label>

                {profile?.resume?.url && (
                  <div className="flex flex-col gap-2 mb-2">
                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="resumeSource"
                        value="profile"
                        checked={resumeSource === 'profile'}
                        onChange={() => setResumeSource('profile')}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Use Profile Resume</span>
                          <span className="text-xs text-muted-foreground max-w-[200px] truncate" title={profile.resume.originalName}>
                            {profile.resume.originalName}
                          </span>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                      <input
                        type="radio"
                        name="resumeSource"
                        value="upload"
                        checked={resumeSource === 'upload'}
                        onChange={() => setResumeSource('upload')}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm font-medium">Upload New Resume</span>
                    </label>
                  </div>
                )}

                {(resumeSource === 'upload' || !profile?.resume?.url) && (
                  <div className={`relative border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors group ${profile?.resume?.url ? 'mt-0' : 'mt-2'}`}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                    {formData.resume ? (
                      <div className="text-sm font-medium text-primary flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        {formData.resume.name}
                      </div>
                    ) : (
                      <>
                        <span className="text-sm text-primary font-medium">Upload Resume</span>
                        <span className="text-xs text-muted-foreground mt-1">PDF, DOCX up to 5MB</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Note (Optional)</label>
                <textarea
                  rows={3}
                  className="w-full p-2 rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary outline-none resize-none"
                  value={formData.coverNote}
                  onChange={e => setFormData({ ...formData, coverNote: e.target.value })}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || isLoadingProfile}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : "Submit Application"}
                </button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
