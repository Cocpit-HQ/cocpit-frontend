"use client"

import { useJobs } from "@/context/JobsContext"
import { JobDetailView } from "@/components/jobs/JobDetailView"
import { notFound } from "next/navigation"
import { use, useEffect, useState } from "react"
import type { Job } from "@/types/jobs"
import * as api from "@/services/api/jobs"

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { jobs } = useJobs()
  const { id } = use(params)
  const jobId = id // Direct usage, assume string UUID

  const [fetchedJob, setFetchedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)

  // First try to find in context
  const contextJob = jobs.find(j => j.id === jobId)

  useEffect(() => {
    if (!jobId) return;

    if (contextJob) {
      setFetchedJob(contextJob);
      setLoading(false);
      return;
    }

    // If not in context, fetch from API
    api.getJobById(jobId)
      .then(job => {
        setFetchedJob(job);
      })
      .catch(() => {
        setFetchedJob(null);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [jobId, contextJob]);

  if (!jobId) {
    return notFound()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!fetchedJob) {
    // If failed to fetch and not in context
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold">Job not found</h2>
        <p className="text-muted-foreground">This job listing may have expired or been removed.</p>
        <a href="/jobs" className="text-primary hover:underline">Back to Jobs</a>
      </div>
    )
  }

  return <JobDetailView job={fetchedJob} />
}
