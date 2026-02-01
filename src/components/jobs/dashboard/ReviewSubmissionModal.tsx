"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mic, Video, Check, X, Download } from "lucide-react"
import { type Applicant } from "@/types/jobs"

interface ReviewSubmissionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    applicant: Applicant | null
    onApprove: (applicantId: string, applicationId: string) => void
    onReject: (applicantId: string, applicationId: string) => void
}

export function ReviewSubmissionModal({ open, onOpenChange, applicant, onApprove, onReject }: ReviewSubmissionModalProps) {
    if (!applicant || !applicant.screening) return null

    const { type, question, responseUrl, submittedAt } = applicant.screening

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {type === 'video' ? <Video className="w-5 h-5 text-primary" /> : <Mic className="w-5 h-5 text-primary" />}
                        Review Submission: {applicant.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div className="bg-muted/30 p-4 rounded-lg border border-border">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Question/Instruction</h4>
                        <p className="text-foreground">{question}</p>
                    </div>

                    <div className="bg-black/90 rounded-xl overflow-hidden shadow-lg border border-border relative min-h-[300px] flex items-center justify-center">
                        {responseUrl ? (
                            type === 'video' ? (
                                <video controls className="w-full max-h-[400px]" src={responseUrl} />
                            ) : (
                                <div className="w-full p-8 flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                        <Mic className="w-10 h-10 text-primary" />
                                    </div>
                                    <audio controls className="w-full max-w-md" src={responseUrl} />
                                </div>
                            )
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center">
                                <p>File processing or not available</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                        <span>Submitted: {submittedAt ? new Date(submittedAt).toLocaleString() : 'N/A'}</span>
                        {responseUrl && (
                            <a href={responseUrl} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary">
                                <Download className="w-3 h-3" /> Download
                            </a>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="destructive"
                        onClick={() => onReject(applicant.id, (applicant as any).applicationId)}
                        className="w-full sm:w-auto"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Reject Candidate
                    </Button>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                            Close
                        </Button>
                        <Button
                            onClick={() => onApprove(applicant.id, (applicant as any).applicationId)}
                            className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
