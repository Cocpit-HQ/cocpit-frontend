import { useState, useMemo } from "react"
import { Search, MapPin, FileText, Download, Filter, ChevronDown } from "lucide-react"
import { ApplicantDetailsModal, type Applicant } from "./ApplicantDetailsModal"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResumePreviewModal } from "./ResumePreviewModal"

interface JobApplicantsViewProps {
    jobId: string
}

// Mock Data
const MOCK_APPLICANTS: Applicant[] = [
    {
        id: "1",
        name: "Sarah Johnson",
        headline: "Senior React Developer with 5+ years experience",
        location: "San Francisco, CA",
        email: "sarah.j@example.com",
        phone: "+1 (555) 123-4567",
        about: "Passionate frontend developer with extensive experience in React, TypeScript, and modern web technologies. Led multiple successful projects from conception to deployment.",
        skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL", "Node.js"],
        experience: [
            { role: "Senior Frontend Developer", company: "TechCorp", duration: "2020 - Present" },
            { role: "Frontend Developer", company: "StartupXYZ", duration: "2018 - 2020" }
        ],
        education: [
            { degree: "BS Computer Science", school: "Stanford University", year: "2018" }
        ],
        resumeName: "Sarah_Johnson_Resume.pdf",
        status: "New", // This field would technically be outside the "Applicant" profile object in a real schema, but merging for mock
        initials: "SJ",
        color: "bg-blue-500",
    } as any,
    {
        id: "2",
        name: "Michael Chen",
        headline: "Full-stack Developer specializing in React & Node.js",
        location: "New York, NY",
        status: "Reviewed",
        initials: "MC",
        color: "bg-purple-500",
    } as any,
    {
        id: "3",
        name: "Emily Rodriguez",
        headline: "Frontend Engineer | React Specialist",
        location: "Austin, TX",
        status: "Shortlisted",
        initials: "ER",
        color: "bg-emerald-500",
    } as any,
]

export function JobApplicantsView({ jobId }: JobApplicantsViewProps) {
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [resumePreviewState, setResumePreviewState] = useState<{ open: boolean, applicant: Applicant | null }>({
        open: false,
        applicant: null
    })
    const [statusFilter, setStatusFilter] = useState("All Status")

    const handleViewProfile = (applicant: Applicant) => {
        setSelectedApplicant(applicant)
        setIsModalOpen(true)
    }

    const filteredApplicants = useMemo(() => {
        if (statusFilter === "All Status") return MOCK_APPLICANTS;
        return MOCK_APPLICANTS.filter(app => (app as any).status === statusFilter);
    }, [statusFilter]);

    return (
        <>
            <div className="bg-card border border-border rounded-xl flex flex-col h-full min-h-[600px]">
                <div className="p-6 border-b border-border">
                    <h2 className="text-xl font-semibold text-foreground mb-1">Senior Frontend Developer</h2>
                    <p className="text-muted-foreground text-sm">{filteredApplicants.length} applicants</p>

                    <div className="mt-6 flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search applicants..."
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
                        filteredApplicants.map((applicant) => (
                            <div key={applicant.id} className="p-4 rounded-xl border border-border bg-background hover:bg-muted/30 transition-colors">
                                <div className="flex gap-4 mb-3">
                                    <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center text-white font-medium ${applicant.color}`}>
                                        {applicant.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="font-semibold text-foreground text-lg leading-tight truncate pr-2">{applicant.name}</h3>
                                            <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-medium 
                                        ${/* @ts-ignore */
                                                applicant.status === 'New' ? 'bg-blue-500/10 text-blue-500' :
                                                    /* @ts-ignore */
                                                    applicant.status === 'Reviewed' ? 'bg-purple-500/10 text-purple-500' :
                                                        /* @ts-ignore */
                                                        applicant.status === 'Shortlisted' ? 'bg-emerald-500/10 text-emerald-500' :
                                                            'bg-red-500/10 text-red-500'}`}>
                                                {/* @ts-ignore */}
                                                {applicant.status}
                                            </span>
                                        </div>
                                        <p className="text-muted-foreground text-sm line-clamp-2 mb-2">{applicant.headline}</p>

                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5" />
                                                {applicant.location}
                                            </span>
                                            <span className="hidden sm:inline text-muted-foreground/40">•</span>
                                            {/* @ts-ignore */}
                                            <span>{applicant.appliedAt || "Applied recently"}</span>
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
                                        <Download className="w-3 h-3 ml-1 opacity-50" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No applicants found with status "{statusFilter}".</p>
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
            />
        </>
    )
}
