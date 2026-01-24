import { useEffect, useState } from "react"
import { MapPin, MoreVertical, Users } from "lucide-react"
import { Job } from "@/types/jobs"
import * as api from "@/services/api/jobs"

interface JobPostsListProps {
    selectedJobId: string
    onSelectJob: (id: string) => void
}

export function JobPostsList({ selectedJobId, onSelectJob }: JobPostsListProps) {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const data = await api.getMyCreatedJobs()
                setJobs(data)
                // Auto-select first job if none selected and jobs exist
                if (data.length > 0 && !selectedJobId) {
                    onSelectJob(data[0].id)
                }
            } catch (error) {
                console.error("Failed to fetch jobs:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchJobs()
    }, [selectedJobId, onSelectJob]) // Added deps but careful about loop. Actually onSelectJob is stable? logic inside ensures single call if id matches.

    if (loading) {
        return (
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Your Job Posts</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Your Job Posts ({jobs.length})</h2>
            <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {jobs.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground bg-card rounded-xl border border-dashed">
                        No job posts found.
                    </div>
                ) : (
                    jobs.map((job) => {
                        const isSelected = selectedJobId === job.id
                        const status = job.activelyHiring ? "Open" : "Closed"

                        return (
                            <div
                                key={job.id}
                                onClick={() => onSelectJob(job.id)}
                                className={`relative p-5 rounded-xl border transition-all cursor-pointer ${isSelected
                                    ? "bg-card border-primary ring-1 ring-primary shadow-lg"
                                    : "bg-card border-border hover:border-border/80"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-foreground">{job.title}</h3>
                                        <p className="text-sm text-muted-foreground">{job.company}</p>
                                    </div>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <span
                                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status === "Open"
                                            ? "bg-green-500/10 text-green-500"
                                            : "bg-red-500/10 text-red-500"
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === "Open" ? "bg-green-500" : "bg-red-500"
                                            }`} />
                                        {status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {job.location}
                                    </div>
                                    <span>•</span>
                                    <span>{job.type}</span>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{job.applicants} applicants</span>
                                    </div>
                                    <span>{job.postedTime}</span>
                                </div>

                                {isSelected && (
                                    <div className="mt-4">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const element = document.getElementById("applicants-view-section");
                                                if (element) {
                                                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                                                }
                                            }}
                                            className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                        >
                                            View Applicants
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
