"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, FileText, X } from "lucide-react"

interface ResumePreviewModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userName: string
    resumeName: string
    // In a real app, you'd pass a resumeUrl
}

export function ResumePreviewModal({ open, onOpenChange, userName, resumeName }: ResumePreviewModalProps) {

    const handleDownload = () => {
        // Mock download - in real app would use the actual URL
        const link = document.createElement('a');
        link.href = '#'; // Replace with actual resume URL
        link.download = resumeName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] bg-[#0B0E14] border border-border p-0 flex flex-col rounded-xl overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between bg-muted/10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">{userName}'s Resume</DialogTitle>
                            <p className="text-xs text-muted-foreground">{resumeName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <Download className="w-4 h-4" />
                            Download
                        </button>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </DialogHeader>

                <div className="flex-1 bg-muted/20 p-6 md:p-10 overflow-y-auto flex items-center justify-center">
                    {/* Mock PDF Viewer Appearance */}
                    <div className="w-full max-w-3xl aspect-[1/1.4] bg-white text-black shadow-2xl rounded-lg p-10 md:p-16 flex flex-col gap-6 relative">
                        {/* This represents a document page */}
                        <div className="w-full h-8 bg-gray-200 rounded animate-pulse w-3/4 mb-4" />

                        <div className="space-y-3">
                            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="w-2/3 h-4 bg-gray-100 rounded animate-pulse" />
                        </div>

                        <div className="space-y-3 pt-8">
                            <div className="w-1/3 h-6 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="w-3/4 h-4 bg-gray-100 rounded animate-pulse" />
                        </div>

                        <div className="space-y-3 pt-8">
                            <div className="w-1/3 h-6 bg-gray-200 rounded animate-pulse mb-2" />
                            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                            <div className="w-full h-4 bg-gray-100 rounded animate-pulse" />
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center bg-black/5 backdrop-blur-[1px] rounded-lg">
                            <div className="bg-background/90 p-4 rounded-xl border border-border shadow-lg text-center">
                                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                                <p className="font-medium text-foreground">Preview not available</p>
                                <p className="text-sm text-muted-foreground">This is a mock resume file.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
