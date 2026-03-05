"use client";

import React, { useEffect, useState } from "react";
import * as api from "@/services/api/jobs";
import { type Job } from "@/types/jobs";
import { JobCard } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";

interface OrganizationPublicJobsProps {
    companyId: string;
}

export function OrganizationPublicJobs({ companyId }: OrganizationPublicJobsProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchJobs = async () => {
            try {
                setLoading(true);
                // Fetch public jobs directly via the company endpoint
                const data = await api.getCompanyJobs(companyId);
                if (mounted) {
                    setJobs(data);
                }
            } catch (error) {
                console.error("Failed to fetch company jobs:", error);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (companyId) {
            fetchJobs();
        }

        return () => {
            mounted = false;
        };
    }, [companyId]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-xl p-4 sm:p-6 shadow-sm">
                        <div className="flex gap-4">
                            <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-5 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                                <div className="flex gap-2 mt-4">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-dashed border-border/50">
                No active job listings.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {jobs.map((job) => (
                <JobCard key={job.id} job={job} mode="view" />
            ))}
        </div>
    );
}
