import { useEffect, useState } from "react"
import { MapPin, MoreVertical, Users, Edit, Trash } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Job } from "@/types/jobs"
import * as api from "@/services/api/jobs"
import { CreateJobModal } from "../CreateJobModal"

interface JobPostsListProps {
    selectedJobId: string
    onSelectJob: (id: string) => void
}

export function JobPostsList({ selectedJobId, onSelectJob }: JobPostsListProps) {
    const [jobs, setJobs] = useState<Job[]>([])
    const [loading, setLoading] = useState(true)
    const [editingJob, setEditingJob] = useState<Job | undefined>(undefined)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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
            <div className="space-y-4 h-[600px] overflow-y-auto pr-2 scrollbar-hide">
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation()
                                                setEditingJob(job)
                                                setIsEditModalOpen(true)
                                            }}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Job
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-red-500 focus:text-red-500"
                                                onClick={async (e) => {
                                                    e.stopPropagation()
                                                    if (confirm("Are you sure you want to delete this job?")) {
                                                        try {
                                                            await api.deleteJob(job.id)
                                                            setJobs(jobs.filter(j => j.id !== job.id))
                                                            if (selectedJobId === job.id && jobs.length > 1) {
                                                                onSelectJob(jobs.find(j => j.id !== job.id)?.id || "")
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to delete job", err)
                                                            alert("Failed to delete job")
                                                        }
                                                    }
                                                }}
                                            >
                                                <Trash className="w-4 h-4 mr-2" />
                                                Delete Job
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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

            <CreateJobModal
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open)
                    if (!open) setEditingJob(undefined)
                }}
                initialData={editingJob}
            />
        </div>
    )
}
