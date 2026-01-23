import { useState, useMemo, useEffect } from "react"
import { Search, MapPin, FileText, Download, Filter, ChevronDown } from "lucide-react"
import { ApplicantDetailsModal, type Applicant } from "./ApplicantDetailsModal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResumePreviewModal } from "./ResumePreviewModal"
import * as api from "@/services/api/jobs"

interface JobApplicantsViewProps {
    jobId: string
}

export function JobApplicantsView({ jobId }: JobApplicantsViewProps) {
    const [applicants, setApplicants] = useState<Applicant[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [resumePreviewState, setResumePreviewState] = useState<{ open: boolean, applicant: Applicant | null }>({
        open: false,
        applicant: null
    })
    const [statusFilter, setStatusFilter] = useState("All Status")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchApplicants = async () => {
            if (!jobId) return
            setLoading(true)
            try {
                // @ts-ignore - Backend returns strict matching shape, type casting for loose frontend compat
                const data = await api.getJobApplicants(jobId)
                setApplicants(data)
            } catch (error) {
                console.error("Failed to fetch applicants:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchApplicants()
    }, [jobId])

    const handleViewProfile = (applicant: Applicant) => {
        setSelectedApplicant(applicant)
        setIsModalOpen(true)
    }

    const filteredApplicants = useMemo(() => {
        let filtered = applicants;

        if (statusFilter !== "All Status") {
            filtered = filtered.filter(app => {
                // Map backend status to frontend filter terms roughly if needed, or exact match
                // Backend: Applied, Under Review, Interview, Rejected
                // Frontend Filters: New, Reviewed, Shortlisted, Rejected
                const s = (app as any).status || "";
                if (statusFilter === "New" && s === "Applied") return true;
                if (statusFilter === "Reviewed" && s === "Under Review") return true;
                if (statusFilter === "Shortlisted" && (s === "Interview" || s === "Offer")) return true;
                return s === statusFilter;
            });
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(q) ||
                app.headline.toLowerCase().includes(q) ||
                app.email?.toLowerCase().includes(q)
            )
        }

        return filtered;
    }, [applicants, statusFilter, searchQuery]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Applied': return 'bg-blue-500/10 text-blue-500';
            case 'Under Review': return 'bg-purple-500/10 text-purple-500';
            case 'Interview': return 'bg-amber-500/10 text-amber-500';
            case 'Offer': return 'bg-emerald-500/10 text-emerald-500';
            case 'Rejected': return 'bg-red-500/10 text-red-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    }

    if (loading) {
        return (
            <div className="bg-card border border-border rounded-xl flex flex-col h-full min-h-[600px] p-6 items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground">Loading applicants...</p>
            </div>
        )
    }

    if (!jobId) {
        return (
            <div className="bg-card border border-border rounded-xl flex flex-col h-full min-h-[600px] p-6 items-center justify-center text-muted-foreground">
                Select a job to view applicants
            </div>
        )
    }

    return (
        <>
            <div className="bg-card border border-border rounded-xl flex flex-col h-full min-h-[600px]">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Applicants</h2>
                    <p className="text-muted-foreground text-sm">{filteredApplicants.length} applicants</p>

                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search applicants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors min-w-[140px] justify-between">
                                    <div className="flex items-center gap-2">
                                        <Filter className="w-4 h-4 text-muted-foreground" />
                                        <span>{statusFilter}</span>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[140px]">
                                <DropdownMenuItem onClick={() => setStatusFilter("All Status")}>
                                    All Status
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("New")}>
                                    New
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("Reviewed")}>
                                    Reviewed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("Shortlisted")}>
                                    Shortlisted
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setStatusFilter("Rejected")}>
                                    Rejected
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {filteredApplicants.length > 0 ? (
                        filteredApplicants.map((applicant) => {
                            const status = (applicant as any).status || "New";
                            return (
                                <div key={applicant.id} className="p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors">
                                    <div className="flex gap-4 mb-3">
                                        <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center text-white font-medium ${applicant.color || 'bg-blue-500'}`}>
                                            {applicant.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <h3 className="font-semibold text-foreground text-lg leading-tight truncate pr-2">{applicant.name}</h3>
                                                <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(status)}`}>
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{applicant.headline}</p>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {applicant.location}
                                                </span>
                                                <span className="hidden sm:inline text-muted-foreground/40">•</span>
                                                <span>{(applicant as any).appliedAt ? new Date((applicant as any).appliedAt).toLocaleDateString() : "Applied recently"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 sm:pl-16">
                                        <button
                                            onClick={() => handleViewProfile(applicant)}
                                            className="flex-1 sm:flex-none px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
                                        >
                                            View Profile
                                        </button>
                                        <button
                                            onClick={() => setResumePreviewState({ open: true, applicant: applicant })}
                                            className="flex-1 sm:flex-none px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Resume
                                        </button>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No applicants found.</p>
                        </div>
                    )}
                </div>
            </div>

            <ApplicantDetailsModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                applicant={selectedApplicant}
            />

            <ResumePreviewModal
                open={resumePreviewState.open}
                onOpenChange={(open) => setResumePreviewState(prev => ({ ...prev, open }))}
                userName={resumePreviewState.applicant?.name || ""}
                resumeName={resumePreviewState.applicant?.resumeName || "resume.pdf"}
                resumeUrl={resumePreviewState.applicant?.resumeUrl || ""}
            />
        </>
    )
}
