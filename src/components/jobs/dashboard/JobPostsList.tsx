import { MapPin, MoreVertical, Users } from "lucide-react"
import { Job } from "@/types/jobs"

// Mock data for now, ideally passed from parent
interface JobPostsListProps {
    selectedJobId: string
    onSelectJob: (id: string) => void
}

// Temporary mock data to match the image
const MOCK_JOBS = [
    {
        id: "1",
        title: "Senior Frontend Developer",
        company: "COCPIT",
        status: "Open",
        location: "Remote",
        type: "Full-time",
        applicants: 24,
        postedAt: "5 days ago",
    },
    {
        id: "2",
        title: "DevOps Engineer",
        company: "COCPIT",
        status: "Open",
        location: "Kolhapur",
        type: "Full-time",
        applicants: 18,
        postedAt: "1 week ago",
    },
    {
        id: "3",
        title: "UI/UX Designer",
        company: "COCPIT",
        status: "Closed",
        location: "Mumbai",
        type: "Full-time",
        applicants: 45,
        postedAt: "2 weeks ago",
    },
]

export function JobPostsList({ selectedJobId, onSelectJob }: JobPostsListProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Your Job Posts ({MOCK_JOBS.length})</h2>
            <div className="space-y-4 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {MOCK_JOBS.map((job) => {
                    const isSelected = selectedJobId === job.id
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
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${job.status === "Open"
                                            ? "bg-green-500/10 text-green-500"
                                            : "bg-red-500/10 text-red-500"
                                        }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.status === "Open" ? "bg-green-500" : "bg-red-500"
                                        }`} />
                                    {job.status}
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
                                <span>{job.postedAt}</span>
                            </div>

                            {isSelected && (
                                <div className="mt-4">
                                    <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                                        View Applicants
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
