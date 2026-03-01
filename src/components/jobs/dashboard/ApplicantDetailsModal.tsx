"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MapPin, FileText, Download, X, Check } from "lucide-react"
import { downloadFile } from "@/lib/download"
import { useTheme } from "next-themes"
import { type Applicant } from "@/types/jobs"

interface ApplicantDetailsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicant: Applicant | null
    onStatusUpdate?: (status: string) => void
    onShortlist?: () => void
}

export function ApplicantDetailsModal({ open, onOpenChange, applicant, onStatusUpdate, onShortlist }: ApplicantDetailsModalProps) {
    const { theme } = useTheme()

    if (!applicant) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`max-w-2xl border border-border p-0 overflow-hidden rounded-xl ${theme === 'light' ? 'bg-[#f3f4f6]' : 'bg-[#0B0E14]'}`}>
                <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
                    <DialogTitle className="text-base font-semibold">Applicant Details</DialogTitle>
                    {/* Close button is handled by DialogContent's built-in close or we can add custom one if needed, but default X is top right usually */}
                </DialogHeader>

                <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Header Section */}
                    <div className="px-6 py-6 border-b border-border">
                        <div className="flex gap-4 items-start">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-medium ${applicant.color}`}>
                                {applicant.initials}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{applicant.name}</h2>
                                <p className="text-muted-foreground mt-1">{applicant.headline}</p>
                                <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {applicant.location}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* About */}
                        <section>
                            <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {applicant.about || "No detailed bio provided."}
                            </p>
                        </section>

                        {/* Skills */}
                        <section>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {applicant.skills?.map((skill, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 rounded-full bg-muted/50 border border-border text-xs font-medium text-foreground"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Experience */}
                        <section>
                            <h3 className="text-sm font-semibold text-foreground mb-4">Experience</h3>
                            <div className="relative border-l border-border ml-2 space-y-6">
                                {applicant.experience?.map((exp, index) => (
                                    <div key={index} className="pl-6 relative">
                                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-border" />
                                        <h4 className="font-medium text-foreground">{exp.role}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {exp.company} • {exp.duration}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Education */}
                        <section>
                            <h3 className="text-sm font-semibold text-foreground mb-4">Education</h3>
                            <div className="relative border-l border-border ml-2 space-y-6">
                                {applicant.education?.map((edu, index) => (
                                    <div key={index} className="pl-6 relative">
                                        <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-border" />
                                        <h4 className="font-medium text-foreground">{edu.degree}</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {edu.school} • {edu.year}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Resume */}
                        <section>
                            <h3 className="text-sm font-semibold text-foreground mb-3">Resume</h3>
                            <div className="p-4 rounded-lg bg-muted/20 border border-border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted/30 rounded-lg">
                                        <FileText className="w-5 h-5 text-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {applicant.resumeName || "resume.pdf"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">PDF Document</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (applicant.resumeUrl) {
                                            const cleanName = applicant.name ? `${applicant.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf` : (applicant.resumeName || 'resume.pdf');
                                            downloadFile(applicant.resumeUrl, cleanName);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </button>
                            </div>
                        </section>


                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-3 rounded-b-xl">
                    {applicant.status === 'Rejected' ? (
                        <button
                            onClick={() => onStatusUpdate?.("Applied")} // Move back to Applied
                            className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium flex items-center gap-2"
                        >
                            Undo Rejection
                        </button>
                    ) : (applicant.status === 'Applied' || !applicant.status) ? (
                        <>
                            <button
                                onClick={() => onStatusUpdate?.("Rejected")}
                                className="px-4 py-2 rounded-lg bg-red-500/10 text-red-500 text-sm font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Reject
                            </button>
                            <button
                                onClick={() => onShortlist?.()}
                                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                Shortlist
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => onOpenChange(false)}
                            className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
                        >
                            Close
                        </button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
