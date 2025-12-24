"use client"

import Link from "next/link"
import { Bookmark, Briefcase, Clock, MapPin, DollarSign, Zap, CheckCircle } from "lucide-react"
import { type Job } from "@/types/jobs"
import { useJobs } from "@/context/JobsContext"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { QuickApplyModal } from "./QuickApplyModal"

interface JobCardProps {
  job: Job
  mode?: "view" | "my-jobs" | "offers"
}

export function JobCard({ job, mode = "view" }: JobCardProps) {
  const { saveJob, activeTab } = useJobs()
  const [showQuickApply, setShowQuickApply] = useState(false)

  // Status Badge Helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "applied":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">Applied</span>
      case "in-progress":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">In Progress</span>
      case "in-past":
        return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">Closed</span>
      default:
        return null
    }
  }

  // Render Timeline
  const renderTimeline = () => {
    if (!job.applicationTimeline || job.applicationTimeline.length === 0) return null
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
           <span>Application Timeline</span>
        </div>
        <div className="relative flex items-center justify-between">
           {/* Connecting Line */}
           <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -z-10" />

           {job.applicationTimeline.map((step, idx) => (
             <div key={idx} className="flex flex-col items-center gap-1 bg-card px-1">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full border-2",
                  step.completed ? "bg-primary border-primary" : "bg-card border-muted-foreground"
                )} />
                <span className={cn(
                  "text-[10px]",
                  step.completed ? "text-primary font-medium" : "text-muted-foreground"
                )}>{step.status}</span>
             </div>
           ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="job-card group bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          {/* Logo & Info */}
          <Link href={`/jobs/${job.id}`} className="flex items-start gap-4 flex-1">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gradient-to-br ${job.logo} flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0`}>
              {job.company.charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {job.title}
                </h3>
                {job.status && activeTab === "my-jobs" && getStatusBadge(job.status)}
                {job.isSaved && activeTab === "my-jobs" && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">Saved</span>
                )}
                {job.activelyHiring && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    Hiring
                  </span>
                )}
              </div>

              <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <span className="font-medium text-foreground/80">{job.company}</span>
                <span>•</span>
                <span>{job.location}</span>
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                   <Briefcase className="w-3.5 h-3.5" />
                   {job.type}
                </div>
                {job.salary && (
                  <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                     <DollarSign className="w-3.5 h-3.5" />
                     {job.salary}
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded-md">
                   <Clock className="w-3.5 h-3.5" />
                   {job.postedTime}
                </div>
                {job.matchScore && (
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium border border-purple-500/20">
                    <Zap className="w-3.5 h-3.5" />
                    {job.matchScore}% Match
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* Action Button */}
          <div className="shrink-0 flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                saveJob(job.id)
              }}
              className={cn(
                "p-2 rounded-full border transition-colors",
                job.isSaved
                  ? "bg-pink-500/10 border-pink-500/20 text-pink-500 hover:bg-pink-500/20"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Bookmark className={cn("w-5 h-5", job.isSaved && "fill-current")} />
            </button>
          </div>
        </div>

        {/* Footer info or timeline */}
        <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex flex-col gap-1">
             {job.recruiterInsight && (
               <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 {job.recruiterInsight}
               </div>
             )}
             <p className="text-xs text-muted-foreground">
               {job.applicants} applicants applied
             </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
             <Link
               href={`/jobs/${job.id}`}
               className="flex-1 sm:flex-none text-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
             >
               Details
             </Link>
             {!job.status && (
               <button
                 onClick={() => setShowQuickApply(true)}
                 className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
               >
                 <Zap className="w-4 h-4" />
                 Quick Apply
               </button>
             )}
             {job.status === 'applied' && (
                <div className="flex items-center gap-2 text-sm text-green-500 font-medium px-4 py-2">
                  <CheckCircle className="w-4 h-4" />
                  Applied
                </div>
             )}
          </div>
        </div>

        {/* Timeline only in My Jobs */}
        {activeTab === "my-jobs" && renderTimeline()}
      </div>

      <QuickApplyModal
        open={showQuickApply}
        onOpenChange={setShowQuickApply}
        jobId={job.id}
        jobTitle={job.title}
      />
    </>
  )
}
