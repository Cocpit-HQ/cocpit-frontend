"use client"

import Link from "next/link"
import { Bookmark, Briefcase, Clock, MapPin, DollarSign, Zap, CheckCircle, Mic, Video, X, Share2 } from "lucide-react"
import { type Job } from "@/types/jobs"
import { useJobs } from "@/features/jobs/hooks/useJobs"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { QuickApplyModal } from "./QuickApplyModal"
import { TaskSubmissionModal } from "./dashboard/TaskSubmissionModal"
import { UniversalShareModal } from "@/components/share/UniversalShareModal"

interface JobCardProps {
  job: Job
  mode?: "view" | "my-jobs" | "offers" | "dashboard"
}

export function JobCard({ job, mode = "view" }: JobCardProps) {
  const { toggleSave: saveJob, activeTab } = useJobs()
  const { isCompany } = useActiveProfile()
  const [showQuickApply, setShowQuickApply] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  // Status Badge Helper for non-applied view
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "applied":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Applied</span>
      case "in-progress":
      case "shortlisted":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">In Progress</span>
      case "in-past":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">Closed</span>
      default:
        return null
    }
  }

  // Render Elaborate Timeline (for My Jobs)
  const renderTimeline = () => {
    if (!job.applicationTimeline || job.applicationTimeline.length === 0) return null
    return (
      <div className="mt-6">
        <h4 className="text-sm font-semibold mb-4">Application status</h4>
        <div className="relative flex items-center justify-between px-2">
          {/* Line */}


          {job.applicationTimeline.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 z-10">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors",
                step.completed
                  ? (step.status === 'Rejected' ? "bg-red-500 border-red-500 text-white" : "bg-green-500 border-green-500 text-white")
                  : "bg-card border-muted text-transparent"
              )}>
                {step.status === 'Rejected' ? <X className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
              </div>
              <div className="text-center">
                <div className={cn("text-[10px] sm:text-xs font-medium whitespace-nowrap", step.completed ? "text-foreground" : "text-muted-foreground")}>
                  {step.status}
                </div>
                {step.date && <div className="text-[10px] text-muted-foreground">{step.date}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render Action Box
  const renderActionBox = () => {
    if (job.applicationScreening?.required && !job.applicationScreening.submittedAt) {
      return (
        <div className="mt-6 border border-dashed border-primary/30 bg-primary/5 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-1">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            {job.applicationScreening.type === 'video' ? <Video className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-sm font-semibold text-foreground">Action Required: {job.applicationScreening.type === 'video' ? 'Video' : 'Voice'} Introduction</h4>
            <p className="text-xs text-muted-foreground mt-0.5">The recruiter has shortlisted you and requested a quick {job.applicationScreening.type} introduction to proceed.</p>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-[10px] text-red-500 font-medium">
              <Clock className="w-3 h-3" />
              <span>Deadline: ASAP</span>
            </div>
          </div>
          <Link
            href={`/jobs/${job.id}`}
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            Start Recording
          </Link>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className="job-card group bg-card border border-border rounded-xl p-4 sm:p-6 transition-all shadow-sm hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Logo & Info */}
          <Link href={`/jobs/${job.jobId || job.id}`} className="flex items-start gap-4 flex-1 min-w-0 w-full">
            {job.companyLogo ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-border shadow-inner shrink-0 relative">
                <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br ${job.logo} flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0`}>
                {job.company.charAt(0)}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                <h3 className="font-semibold text-base sm:text-lg text-foreground truncate group-hover:text-primary transition-colors pr-2">
                  {job.title}
                </h3>
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {activeTab !== 'my-jobs' && (
                    <>
                      {(job.status || job.hasApplied) && getStatusBadge(job.status || (job.hasApplied ? 'applied' : undefined))}
                      {job.isSaved && (
                        <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">Saved</span>
                      )}
                    </>
                  )}
                  {job.activelyHiring && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20 whitespace-nowrap">
                      Hiring
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-foreground/80 mb-2 flex items-center gap-1.5 sm:gap-2">
                <span className="font-medium truncate max-w-[140px] sm:max-w-none">{job.company}</span>
                <span className="text-muted-foreground shrink-0">•</span>
                <span className="text-muted-foreground truncate max-w-[120px] sm:max-w-none">{job.location}</span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-3 sm:gap-x-4 text-[11px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{job.type}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{job.salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{job.postedTime}</span>
                </div>
              </div>

              <div className="mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-muted-foreground flex items-center gap-2">
                {job.isOffer && job.offerStatus ? (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-medium",
                    job.offerStatus === 'pending' ? "bg-yellow-500/10 text-yellow-500" :
                      job.offerStatus === 'accepted' ? "bg-green-500/10 text-green-500" :
                        "bg-red-500/10 text-red-500"
                  )}>
                    Status: {job.offerStatus.charAt(0).toUpperCase() + job.offerStatus.slice(1)}
                  </span>
                ) : (
                  <span>{job.applicants} applicants applied</span>
                )}
              </div>

            </div>
          </Link>

          {/* Action Button */}
          <div className="w-full sm:w-auto shrink-0 flex flex-row sm:flex-col items-center justify-between sm:items-end gap-2 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-border sm:border-transparent">
            {/* Mobile Left: View Details & Status */}
            <div className="flex sm:hidden flex-row items-center gap-2">
              <Link href={`/jobs/${job.id}`} className="text-xs font-medium hover:underline text-foreground">Details</Link>
              {(job.status === 'applied' || job.hasApplied || job.status === 'shortlisted') ? (
                <div className="flex items-center gap-1 text-green-500 text-[11px] font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Applied
                </div>
              ) : isCompany ? (
                <span className="text-[10px] text-muted-foreground italic">Switch to user to apply</span>
              ) : null}
            </div>

            {/* Top Right on Desktop, Center/Right on Mobile: Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsShareOpen(true)
                }}
                className="p-1.5 sm:p-2 rounded-full text-muted-foreground hover:bg-muted/50 transition-colors"
                aria-label="Share Job"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {!isCompany && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    saveJob(job.jobId || job.id)
                  }}
                  className={cn(
                    "p-1.5 sm:p-2 rounded-full transition-colors",
                    job.isSaved
                      ? "text-pink-500 hover:bg-pink-500/10"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                  aria-label={job.isSaved ? "Saved Job" : "Save Job"}
                >
                  <Bookmark className={cn("w-4 h-4 sm:w-5 sm:h-5", job.isSaved && "fill-current")} />
                </button>
              )}
            </div>

            {/* Bottom Right on Desktop: View Details & Status */}
            <div className="hidden sm:flex mt-1 items-center gap-2">
              <Link href={`/jobs/${job.id}`} className="text-sm font-medium hover:underline text-foreground">Details</Link>
              {(job.status === 'applied' || job.hasApplied || job.status === 'shortlisted') ? (
                <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Applied
                </div>
              ) : isCompany ? (
                <span className="text-xs text-muted-foreground italic">Switch to user to apply</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Timeline only in My Jobs */}
        {activeTab === "my-jobs" && renderTimeline()}

        {/* Action Box only in My Jobs + Task Pending */}
        {activeTab === "my-jobs" && renderActionBox()}

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
          // can trigger refresh
          setShowTaskModal(false)
        }}
      />

      <UniversalShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        entityId={job.jobId || job.id}
        entityType="job"
        entityName={job.title}
        entityLocation={job.location}
        entityHeadline={job.company}
        entityAvatar={job.companyLogo}
      />
    </>
  )
}
