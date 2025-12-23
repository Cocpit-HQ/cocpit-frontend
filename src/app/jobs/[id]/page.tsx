"use client"

import { useJobs } from "@/context/JobsContext"
import { JobDetailView } from "@/components/jobs/JobDetailView"
import { notFound } from "next/navigation"
import { use } from "react"

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { jobs } = useJobs()
  const { id } = use(params)
  const jobId = parseInt(id)

  if (isNaN(jobId)) {
    return notFound()
  }

  const job = jobs.find(j => j.id === jobId)

  if (!job) {
    // In a real app we might fetch here if not in context,
    // but for this mock we assume context has it or it doesn't exist.
    // However, since context is client-side only and might not be hydrated on server render,
    // this component effectively waits for client hydration if wrapped properly,
    // but since this is a page, we need to handle the case where we are accessing it directly.
    // The `useJobs` hook will work on client.

    // Fallback for initial render if jobs aren't populated yet might be needed,
    // but `enhancedInitialJobs` in context ensures there is data.
    // If refreshing on a dynamic ID that was added via "Create Job", it might persist via localStorage.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    )
  }

  return <JobDetailView job={job} />
}
