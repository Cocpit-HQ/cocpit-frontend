"use client"

import { useState } from "react"
import { DashboardStats } from "./DashboardStats"
import { JobPostsList } from "./JobPostsList"
import { JobApplicantsView } from "./JobApplicantsView"

export function JobPostsDashboard() {
    const [selectedJobId, setSelectedJobId] = useState("")

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Job Posts Dashboard</h1>
                <p className="text-muted-foreground">Manage your job postings and review applicants</p>
            </div>

            <DashboardStats />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                    <JobPostsList
                        selectedJobId={selectedJobId}
                        onSelectJob={setSelectedJobId}
                    />
                </div>
                <div className="lg:col-span-8" id="applicants-view-section">
                    <JobApplicantsView jobId={selectedJobId} />
                </div>
            </div>
        </div>
    )
}
