import { useState, useMemo, useEffect } from "react"
import { Search, MapPin, FileText, Download, Filter, ChevronDown } from "lucide-react"
import { ApplicantDetailsModal } from "./ApplicantDetailsModal"
import { type Applicant } from "@/types/jobs"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResumePreviewModal } from "./ResumePreviewModal"
import { ShortlistConfigModal } from "./ShortlistConfigModal"
import { ReviewSubmissionModal } from "./ReviewSubmissionModal"
import * as api from "@/services/api/jobs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"


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
    const [shortlistModalOpen, setShortlistModalOpen] = useState(false)
    const [reviewModalOpen, setReviewModalOpen] = useState(false)
    const [actionApplicant, setActionApplicant] = useState<Applicant | null>(null)

    const [statusFilter, setStatusFilter] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchApplicants = async () => {
            if (!jobId) return
            setLoading(true)
            try {
                // @ts-ignore
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

        if (statusFilter !== "All") {
            filtered = filtered.filter(app => {
                const s = (app as any).status || "";

                if (statusFilter === "Shortlisted") {
                    return s === "Shortlisted" || s.includes("Pending") || s.includes("Submission");
                }
                if (statusFilter === "Approved") {
                    return s === "Approved" || s === "Interview" || s === "Offer";
                }
                if (statusFilter === "Rejected") {
                    return s === "Rejected";
                }

                return false;
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
            case 'Shortlisted': return 'bg-purple-500/10 text-purple-500';
            case 'Approved': return 'bg-emerald-500/10 text-emerald-500';
            case 'Rejected': return 'bg-red-500/10 text-red-500';
            default: return 'bg-gray-500/10 text-gray-500';
        }
    }

    const handleShortlistClick = (applicant: Applicant) => {
        setActionApplicant(applicant)
        setShortlistModalOpen(true)
    }

    const handleConfirmShortlist = async (config: { screening: { required: boolean, type: "voice" | "video", question: string } | null }) => {
        if (!actionApplicant) return

        try {
            await api.updateApplicationStatus((actionApplicant as any).applicationId, "Shortlisted", config.screening)
            toast.success("Applicant shortlisted")
            // Refresh
            // @ts-ignore
            const data = await api.getJobApplicants(jobId)
            setApplicants(data)
        } catch (err) {
            console.error(err)
            toast.error("Failed to shortlist")
        }
    }

    const handleReviewClick = (applicant: Applicant) => {
        setActionApplicant(applicant)
        setReviewModalOpen(true)
    }

    const handleApprove = async (id: string, appId: string) => {
        try {
            await api.updateApplicationStatus(appId, "Approved")
            toast.success("Applicant Approved")
            setReviewModalOpen(false)
            // @ts-ignore
            const data = await api.getJobApplicants(jobId)
            setApplicants(data)
        } catch (err) {
            toast.error("Failed to approve")
        }
    }

    const handleReject = async (id: string, appId: string) => {
        try {
            await api.updateApplicationStatus(appId, "Rejected")
            toast.success("Applicant Rejected")
            setReviewModalOpen(false)
            // @ts-ignore
            const data = await api.getJobApplicants(jobId)
            setApplicants(data)
        } catch (err) {
            toast.error("Failed to reject")
        }
    }



    return (
        <>
            <div className="bg-card border border-border rounded-xl flex flex-col h-full min-h-[600px]">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Applicants</h2>
                    <p className="text-muted-foreground text-sm">{filteredApplicants.length} applicants</p>

                    {/* Filter Tabs */}
                    <div className="mt-6 border-b border-border">
                        <div className="flex items-center gap-6 overflow-x-auto">
                            {['All', 'Shortlisted', 'Approved', 'Rejected'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setStatusFilter(tab)}
                                    className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${statusFilter === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search applicants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
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

                                        {/* Dynamic Action Button */}
                                        {applicant.status === 'Applied' && (
                                            <button
                                                onClick={() => handleShortlistClick(applicant)}
                                                className="flex-1 sm:flex-none px-4 py-2 border border-green-500/30 bg-green-500/10 text-green-600 text-sm font-medium rounded-lg hover:bg-green-500/20 transition-colors whitespace-nowrap"
                                            >
                                                Shortlist
                                            </button>
                                        )}

                                        {applicant.status === 'Shortlisted' && applicant.screening?.required && !applicant.screening.submittedAt && (
                                            <div className="flex-1 sm:flex-none px-4 py-2 border border-orange-500/30 bg-orange-500/10 text-orange-600 text-sm font-medium rounded-lg flex items-center justify-center gap-2 cursor-wait">
                                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                                Waiting for Task
                                            </div>
                                        )}

                                        {applicant.status === 'Shortlisted' && applicant.screening?.required && applicant.screening.submittedAt && (
                                            <button
                                                onClick={() => handleReviewClick(applicant)}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                                            >
                                                Review Task
                                                <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                                            </button>

                                        )}

                                        {applicant.status === 'Approved' && applicant.screening?.required && applicant.screening.submittedAt && (
                                            <button
                                                onClick={() => handleReviewClick(applicant)}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
                                            >
                                                Review Task
                                                <span className="flex h-2 w-2 rounded-full bg-white/50" />
                                            </button>
                                        )}

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
            </div >

            <ApplicantDetailsModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                applicant={selectedApplicant}
                onStatusUpdate={async (status) => {
                    if (selectedApplicant) {
                        try {
                            await api.updateApplicationStatus((selectedApplicant as any).applicationId || selectedApplicant.id, status)
                            toast.success(`Applicant ${status}`)
                            // Refresh
                            // @ts-ignore
                            const data = await api.getJobApplicants(jobId)
                            setApplicants(data)
                            // Update local selected applicant status to reflect change immediately if modal stays open
                            setSelectedApplicant(prev => prev ? { ...prev, status } : null)
                            if (status !== 'Applied' && status !== 'Rejected') {
                                setIsModalOpen(false)
                            }
                        } catch (err) {
                            toast.error("Failed to update status")
                        }
                    }
                }}
                onShortlist={() => {
                    if (selectedApplicant) {
                        handleShortlistClick(selectedApplicant)
                        setIsModalOpen(false)
                    }
                }}
            />

            <ResumePreviewModal
                open={resumePreviewState.open}
                onOpenChange={(open) => setResumePreviewState(prev => ({ ...prev, open }))}
                userName={resumePreviewState.applicant?.name || ""}
                resumeName={resumePreviewState.applicant?.resumeName || "resume.pdf"}
                resumeUrl={resumePreviewState.applicant?.resumeUrl || ""}
            />

            <ShortlistConfigModal
                open={shortlistModalOpen}
                onOpenChange={setShortlistModalOpen}
                onConfirm={handleConfirmShortlist}
                applicantName={actionApplicant?.name || ""}
            />

            <ReviewSubmissionModal
                open={reviewModalOpen}
                onOpenChange={setReviewModalOpen}
                applicant={actionApplicant}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </>
    )
}
