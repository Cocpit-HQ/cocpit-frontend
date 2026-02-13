"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, MapPin, Briefcase, Clock, DollarSign, Building, Globe, Zap, CheckCircle, Bookmark, Share2, X } from "lucide-react"
import { useJobs } from "@/context/JobsContext"
import { cn } from "@/lib/utils"
import { QuickApplyModal } from "@/components/jobs/QuickApplyModal"
import { type Job } from "@/types/jobs"
import { getRecruiterStats } from "@/services/api/jobs"
import { TaskSubmissionModal } from "./dashboard/TaskSubmissionModal"
import { useActiveProfile } from "@/context/ActiveProfileContext"


interface JobDetailViewProps {
  job: Job
}

import { useRouter } from "next/navigation"

export function JobDetailView({ job: initialJob }: JobDetailViewProps) {
  const router = useRouter()
  const { jobs, saveJob } = useJobs()
  const { isCompany } = useActiveProfile()

  // Try to find the job in the live context (which might have updated status)
  // If not found (e.g., direct link, not in feed yet), fallback to initialJob
  const displayJob = jobs.find(j => j.id === initialJob.id) || initialJob
  const job = displayJob;

  const [showQuickApply, setShowQuickApply] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [recruiterStats, setRecruiterStats] = useState<{ responseRate: number, typicallyRespondsIn: string, isActive: boolean } | null>(null)


  useEffect(() => {
    if (job.recruiterId) {
      getRecruiterStats(job.recruiterId).then(setRecruiterStats).catch(console.error)
    }
  }, [job.recruiterId])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Helper for Timeline
  const renderTimeline = () => {
    if (!job.applicationTimeline || job.applicationTimeline.length === 0) return null

    // Check if we need to glow the Task Assignment step
    const isTaskPending = job.applicationScreening?.required && !job.applicationScreening.submittedAt;

    return (
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-lg mb-6">Application Status</h3>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-0">
          <div className="hidden sm:block absolute left-0 right-0 top-[15px] h-0.5 bg-muted -z-10" />
          <div className="sm:hidden absolute top-0 bottom-0 left-[15px] w-0.5 bg-muted -z-10" />

          {job.applicationTimeline.map((step, idx) => {
            // Glow if this is the Task Assignment step and it's pending (or just the active step)
            const isGlow = step.status === 'Task Assignment' && isTaskPending;

            return (
              <div key={idx} className="flex sm:flex-col items-center gap-4 sm:gap-2 bg-card z-10 pr-4 sm:pr-0">
                <div className={cn(
                  "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500",
                  step.completed
                    ? (step.status === 'Rejected' ? "bg-red-500 border-red-500 text-white" : "bg-primary border-primary text-primary-foreground")
                    : isGlow ? "bg-card border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.5)] animate-pulse" :
                      "bg-card border-muted-foreground text-muted-foreground"
                )}>
                  {step.completed && (step.status === 'Rejected' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />)}
                  {isGlow && <div className="w-2 h-2 bg-primary rounded-full animate-ping" />}
                </div>
                <div className="flex flex-col sm:items-center">
                  <span className={cn(
                    "text-sm font-medium",
                    step.completed ? "text-primary" : isGlow ? "text-primary font-bold" : "text-muted-foreground"
                  )}>{step.status}</span>
                  {step.date && <span className="text-xs text-muted-foreground">{step.date}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header / Nav */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <span className="font-medium text-lg truncate flex-1">{job.title}</span>
          <button
            onClick={handleShare}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            {isCopied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Job Header Card */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            {job.companyLogo ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-border shadow-inner shrink-0 relative">
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${job.logo} flex items-center justify-center text-white font-bold text-3xl shadow-inner shrink-0`}>
                {job.company.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                {job.companySlug ? (
                  <Link href={`/company/${job.companySlug}`} className="font-medium text-foreground flex items-center gap-1.5 hover:underline">
                    <Building className="w-4 h-4" />
                    {job.company}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground flex items-center gap-1.5">
                    <Building className="w-4 h-4" />
                    {job.company}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {job.postedTime}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {job.type}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                  {job.workMode || "Onsite"}
                </span>
                {job.salary && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    {job.salary}
                  </span>
                )}
                {job.activelyHiring && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Actively Hiring
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {(job.status === 'applied' || job.hasApplied) ? (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground rounded-lg py-2.5 font-medium cursor-not-allowed">
                    <CheckCircle className="w-5 h-5" />
                    Application Submitted
                  </div>
                ) : isCompany ? (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-muted text-muted-foreground rounded-lg py-2.5 font-medium cursor-not-allowed">
                    <Building className="w-5 h-5" />
                    Switch to Personal Profile to Apply
                  </div>
                ) : (
                  <button
                    onClick={() => setShowQuickApply(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2.5 font-medium transition-colors"
                  >
                    <Zap className="w-5 h-5" />
                    Quick Apply
                  </button>
                )}

                <button
                  onClick={() => saveJob(job.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-lg border font-medium flex items-center justify-center gap-2 transition-colors",
                    job.isSaved
                      ? "bg-pink-500/10 border-pink-500/20 text-pink-500"
                      : "border-border hover:bg-muted"
                  )}
                >
                  <Bookmark className={cn("w-5 h-5", job.isSaved && "fill-current")} />
                  {job.isSaved ? "Saved" : "Save Job"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status / Timeline (if applicable) */}
        {(job.status === 'applied' || job.status === 'in-progress' || job.hasApplied) && renderTimeline()}

        {/* Action Required Prompt */}
        {job.applicationScreening?.required && !job.applicationScreening.submittedAt && (
          <div className="max-w-4xl mx-auto mb-6 bg-orange-500/5 border border-orange-500/40 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                {job.applicationScreening.type === 'video' ? <Zap className="w-6 h-6 text-orange-500" /> : <Zap className="w-6 h-6 text-orange-500" />}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Action Required</h3>
                <p className="text-sm text-muted-foreground">The recruiter has requested a {job.applicationScreening.type} introduction.</p>
              </div>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              className="whitespace-nowrap px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-lg shadow-orange-500/20"
            >
              Complete Task
            </button>
          </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* About Job */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">About the Job</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-line">
                {job.description || "No description available."}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Skills Required</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills?.map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-muted rounded-full text-sm text-foreground">
                    {skill}
                  </span>
                )) || <span className="text-muted-foreground">Not specified</span>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Recruiter Insight */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 rounded-xl p-6">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Recruiter Insights
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                {job.recruiterInsight || "Recruiters are actively reviewing applications for this role."}
              </p>

              {recruiterStats && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-background/80 p-2 rounded-lg border border-primary/10 text-center">
                    <div className="text-xs text-muted-foreground">Response Rate</div>
                    <div className={`font-bold ${recruiterStats.responseRate > 50 ? 'text-green-500' : 'text-orange-500'}`}>
                      {recruiterStats.responseRate}%
                    </div>
                  </div>
                  <div className="bg-background/80 p-2 rounded-lg border border-primary/10 text-center">
                    <div className="text-xs text-muted-foreground">Responds In</div>
                    <div className="font-bold text-foreground">
                      {recruiterStats.typicallyRespondsIn}
                    </div>
                  </div>
                </div>
              )}
              {job.matchScore && (
                <div className="bg-background/50 rounded-lg p-3 border border-primary/10">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Your Match</span>
                    <span className="font-bold text-primary">{job.matchScore}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${job.matchScore}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* About Company */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-medium text-foreground mb-4">About {job.company}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {job.aboutCompany || "Company description not available."}
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Industry</span>
                  <span className="font-medium">{job.industry || "Technology"}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">{job.companyType || "Private"}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Headquarters</span>
                  <span className="font-medium">{job.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <QuickApplyModal
        open={showQuickApply}
        onOpenChange={setShowQuickApply}
        jobId={job.id}
        jobTitle={job.title}

      />

      <TaskSubmissionModal
        open={showTaskModal}
        onOpenChange={setShowTaskModal}
        applicationId={job.applicationId!}
        taskType={job.applicationScreening?.type || 'voice'}
        question={job.applicationScreening?.question || ''}
        onSuccess={() => {
          setShowTaskModal(false)
          router.refresh()
          // Optionally trigger a context reload if exposed, but refresh works for server components/data
        }}
      />
    </div>
  )
}
