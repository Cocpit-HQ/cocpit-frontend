import { useState } from "react"
import { MapPin, MoreVertical, Users, Edit, Trash, Loader2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Job } from "@/features/jobs/types/jobs.types"
import * as api from "@/services/api/jobs"
import { CreateJobModal } from "../CreateJobModal"
import { useRecruiterJobs } from "@/features/jobs/hooks/useRecruiterJobs"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useInView } from "react-intersection-observer"
import { useEffect } from "react"
import { toast } from "sonner"

interface JobPostsListProps {
    selectedJobId: string
    onSelectJob: (id: string) => void
}

export function JobPostsList({ selectedJobId, onSelectJob }: JobPostsListProps) {
    const { activeProfile, isCompany } = useActiveProfile()
    const companyId = isCompany && activeProfile?.type === 'COMPANY' ? activeProfile.id : undefined
    const {
        jobs,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        removeJob
    } = useRecruiterJobs(companyId)

    const [editingJob, setEditingJob] = useState<Job | undefined>(undefined)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const { ref, inView } = useInView()

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    // Auto-select logic moved here?
    useEffect(() => {
        if (jobs.length > 0 && !selectedJobId) {
            onSelectJob(jobs[0].id)
        }
    }, [jobs, selectedJobId, onSelectJob])


    if (isLoading) {
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
                    <>
                        {jobs.map((job) => {
                            const isSelected = selectedJobId === job.id
                            const status = job.actively_hiring ? "Open" : "Closed"

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
                                                    setEditingJob(job as any)
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
                                                            const deletePromise = removeJob(job.id);
                                                            
                                                            toast.promise(deletePromise, {
                                                                loading: 'Deleting job...',
                                                                success: 'Job deleted successfully',
                                                                error: 'Failed to delete job'
                                                            });
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
                                        <span>{job.job_type}</span>
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                                        <div className="flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" />
                                            <span>{job.applicants} applicants</span>
                                        </div>
                                        <span>{job.posted_at}</span>
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
                        })}

                        {/* Infinite Scroll Trigger */}
                        {(hasNextPage || isFetchingNextPage) && (
                            <div ref={ref} className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </>
                )}
            </div>

            <CreateJobModal
                open={isEditModalOpen}
                onOpenChange={(open) => {
                    setIsEditModalOpen(open)
                    if (!open) setEditingJob(undefined)
                }}
                initialData={editingJob as any}
            />
        </div>
    )
}
