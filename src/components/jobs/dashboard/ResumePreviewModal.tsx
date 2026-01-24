"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, FileText, X, ExternalLink } from "lucide-react"
import { downloadFile } from "@/utils/download"

interface ResumePreviewModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userName: string
    resumeName: string
    resumeUrl: string
}

export function ResumePreviewModal({ open, onOpenChange, userName, resumeName, resumeUrl }: ResumePreviewModalProps) {

    const handleDownload = () => {
        if (!resumeUrl) return;
        const cleanName = userName ? `${userName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf` : (resumeName || 'resume.pdf');
        downloadFile(resumeUrl, cleanName);
    }

    // Google Docs Viewer URL for embedding
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resumeUrl)}&embedded=true`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] bg-[#0B0E14] border border-border p-0 flex flex-col rounded-xl overflow-hidden [&>button]:hidden">
                <DialogHeader className="px-4 py-3 md:px-6 md:py-4 border-b border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-muted/10 shrink-0">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <DialogTitle className="text-sm md:text-base font-semibold truncate">{userName}'s Resume</DialogTitle>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[300px]" title={resumeUrl}>{resumeName}</p>
                        </div>
                        {/* Close button for mobile - visible only on small screens, absolute positioned or part of flex */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="md:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ml-auto"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 border border-border text-foreground text-xs md:text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="truncate">Open Original</span>
                        </a>
                        <button
                            onClick={handleDownload}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-xs md:text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            Download
                        </button>
                        {/* Close button for desktop */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="hidden md:block p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-muted/20 p-6 md:p-10 overflow-hidden flex items-center justify-center relative">
                    {resumeUrl ? (
                        <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden relative">
                            {/* Fallback iframe using Google Docs Viewer */}
                            <iframe
                                src={viewerUrl}
                                className="w-full h-full border-none"
                                title="Resume Preview"
                            >
                            </iframe>
                            <div className="absolute inset-0 pointer-events-none border border-border/10 rounded-lg"></div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No resume URL provided.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
