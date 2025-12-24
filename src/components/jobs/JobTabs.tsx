"use client"

import type { JobListMode, JobStatus } from "@/types/jobs"

interface JobTabsProps {
  mode: JobListMode
  setMode: (mode: JobListMode) => void
  myJobsTab: JobStatus
  setMyJobsTab: (tab: JobStatus) => void
  offersCount: number
}

export function JobTabs({ mode, setMode, myJobsTab, setMyJobsTab, offersCount }: JobTabsProps) {
  return (
    <div>
      {/* Top-level tabs */}
      <div className="mb-4 md:mb-6 flex gap-2 overflow-x-auto rounded-full bg-transparent">
        {[
          { id: "view" as JobListMode, label: "View Jobs" },
          { id: "my-jobs" as JobListMode, label: "My Jobs" },
          { id: "offers" as JobListMode, label: "Offers", badge: offersCount },
        ].map((tab) => {
          const isActive = mode === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] text-white shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* My Jobs sub-tabs */}
      {mode === "my-jobs" && (
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {(
            [
              { id: "in-progress", label: "In Progress" },
              { id: "applied", label: "Applied" },
              { id: "in-past", label: "In Past" },
              { id: "saved", label: "Saved" },
            ] as const
          ).map((tab) => {
            const isActive = myJobsTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMyJobsTab(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
