"use client"

import { useRouter } from "next/navigation"
import { MapPin, Briefcase, Bookmark, Clock } from "lucide-react"
import { logoGradients } from "@/lib/data/jobs"
import type { Job, JobListMode } from "@/types/jobs"

interface JobCardProps {
  job: Job
  mode: JobListMode
}

export function JobCard({ job, mode }: JobCardProps) {
  const router = useRouter()

  const baseCardClasses = "bg-card border-border border rounded-xl p-6 transition-all hover:border-primary"

  // Offers layout
  if (mode === "offers" || job.isOffer) {
    return (
      <div key={job.id} className={baseCardClasses}>
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="rounded-full bg-pink-500/15 px-3 py-1 text-[11px] font-medium text-pink-300">
            Direct Offer
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div
            className={`h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br ${logoGradients[job.logo]}`}
          />
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-foreground font-semibold">
              {job.title}
            </h3>
            <p className="mb-2 text-sm text-muted-foreground">
              {job.company}
            </p>
            <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.type}
              </span>
            </div>
            <p className="mb-4 text-sm text-primary">{job.salary}</p>
            <div className="flex flex-col gap-3 md:flex-row">
              <button className="flex-1 rounded-full bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                Accept Offer
              </button>
              <button
                className="flex-1 rounded-full border px-4 py-2 text-sm font-semibold border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // My Jobs layout
  if (mode === "my-jobs" && job.status) {
    const secondary =
      job.status === "applied"
        ? "Withdraw"
        : job.status === "in-progress"
          ? "View Details"
          : job.status === "saved"
            ? "Remove"
            : "View Details"

    return (
      <div key={job.id} className={baseCardClasses}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div
            className={`h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br ${logoGradients[job.logo]}`}
          />
          <div className="min-w-0 flex-1">
            <h3 className="mb-1 text-foreground font-semibold">
              {job.title}
            </h3>
            <p className="mb-1 text-sm text-muted-foreground">
              {job.company}
            </p>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{job.location}</span>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {job.postedTime}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button className="flex-1 rounded-full bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium hover:opacity-90">
                View Details
              </button>
              <button
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
                  secondary === "Withdraw"
                    ? "bg-destructive text-destructive-foreground hover:opacity-90"
                    : "border border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {secondary}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default open job listing layout (View Jobs)
  return (
    <div
      key={job.id}
      className={baseCardClasses}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${logoGradients[job.logo]} rounded-lg flex-shrink-0`}
          />
          <div className="min-w-0">
            <h3 className="font-semibold leading-tight text-foreground">
              {job.title}
            </h3>
            <p className="text-sm truncate text-muted-foreground">
              {job.company}
            </p>
          </div>
        </div>
        <button
          className="p-2 -mr-2 -mt-1 rounded-full transition-colors flex-shrink-0 hover:bg-muted text-muted-foreground hover:text-primary"
        >
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-3 text-muted-foreground"
      >
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {job.location}
        </span>
        <span className="flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5" />
          {job.type}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {job.postedTime}
        </span>
      </div>

      <div className="flex flex-col items-stretch gap-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-sm font-medium text-primary">{job.salary}</span>
          <span className="text-xs text-muted-foreground">
              {job.applicants} applicants
          </span>
          </div>
          <button 
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="px-5 py-1.5 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all text-center">
          Apply
          </button>
      </div>
    </div>
  )
}
