"use client";

import React, { useEffect, useState } from "react";
import { Briefcase, Loader2, Send, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { sendJobOffer } from "@/services/api/offers";
import { getCompanyJobs, getMyCreatedJobs } from "@/services/api/jobs";
import api from "@/lib/axios";
import { toast } from "sonner";

interface SendOfferDialogProps {
    targetUserId: string;
    targetUserName: string;
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

interface CompanyJob {
    job_id: string;
    title: string;
    location: string;
    job_type: string;
}

export function SendOfferDialog({
    targetUserId,
    targetUserName,
    isOpen: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    trigger,
}: SendOfferDialogProps) {
    const { activeProfile, isCompany } = useActiveProfile();
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const [jobs, setJobs] = useState<CompanyJob[]>([]);
    const [selectedJobId, setSelectedJobId] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [offeredJobIds, setOfferedJobIds] = useState<string[]>([]);
    const [offerLoading, setOfferLoading] = useState(false);
    const [fetchingJobs, setFetchingJobs] = useState(false);

    const loadDialogData = async () => {
        setFetchingJobs(true);
        setOfferLoading(true);

        let fetchedJobs: CompanyJob[] = [];
        let fetchedOfferedIds: string[] = [];

        try {
            const fetchedList = isCompany
                ? await getCompanyJobs(activeProfile!.id)
                : await getMyCreatedJobs();
            fetchedJobs = fetchedList
                .filter((j: any) => j.status === 'active' || (j as any).status === 'ACTIVE')
                .map((j: any) => ({
                    job_id: j.id || j.job_id,
                    title: j.title,
                    location: j.location,
                    job_type: j.jobType || j.job_type
                })) as CompanyJob[];
        } catch (err) {
            console.error("[SendOfferDialog] Error fetching jobs:", err);
        }

        try {
            const endpoint = isCompany
                ? `/jobs/companies/${activeProfile!.id}/offers/check/${targetUserId}`
                : `/jobs/offers/check/${targetUserId}`;
            const offersRes = await api.get(endpoint);
            fetchedOfferedIds = offersRes.data.jobIds || [];
        } catch (err) {
            console.error("[SendOfferDialog] Error checking offers:", err);
        }

        setJobs(fetchedJobs);
        setOfferedJobIds(fetchedOfferedIds);

        setFetchingJobs(false);
        setOfferLoading(false);
    };

    useEffect(() => {
        if (open) {
            loadDialogData();
            setSelectedJobId("");
            setMessage("");
        }
    }, [open]);

    const handleOpen = (nextOpen: boolean) => {
        if (!isControlled) {
            setInternalOpen(nextOpen);
        }
        controlledOnOpenChange?.(nextOpen);
    };

    const availableJobs = jobs.filter(j => {
        const id = j.job_id || (j as any).id;
        return !offeredJobIds.includes(id);
    });
    const allOffered = jobs.length > 0 && availableJobs.length === 0;

    const handleSend = async () => {
        if (!selectedJobId) {
            toast.error("Please select a job position");
            return;
        }

        try {
            setLoading(true);
            await sendJobOffer(isCompany ? activeProfile!.id : null, selectedJobId, targetUserId, message || undefined);
            toast.success(`Offer sent to ${targetUserName}!`);
            setOfferedJobIds(prev => [...prev, selectedJobId]);
            handleOpen(false);
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to send offer";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isCompany || !activeProfile) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

            <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-emerald-500" />
                        Send Job Offer
                    </DialogTitle>
                    <DialogDescription>
                        Send a direct job offer to <strong>{targetUserName}</strong> from{" "}
                        <strong>{activeProfile.name || "your company"}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="job-select">Select Job Position *</Label>
                        {fetchingJobs ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading jobs...
                            </div>
                        ) : availableJobs.length === 0 ? (
                            <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-lg text-center">
                                All your active jobs already have pending offers for this user.
                            </div>
                        ) : (
                            <select
                                id="job-select"
                                value={selectedJobId}
                                onChange={(e) => setSelectedJobId(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                            >
                                <option value="">-- Select a job --</option>
                                {availableJobs.map((job) => {
                                    const id = job.job_id || (job as any).id;
                                    return (
                                        <option key={id} value={id}>
                                            {job.title} {job.location ? `(${job.location})` : ""} {job.job_type ? `• ${job.job_type}` : ""}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="offer-message">Personal Message (optional)</Label>
                        <Textarea
                            id="offer-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add a personal note about why you'd be a great fit..."
                            rows={3}
                            className="resize-none bg-background text-foreground border-input"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpen(false)} disabled={loading} className="cursor-pointer">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading || !selectedJobId}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                            <Send className="w-4 h-4 mr-1" />
                        )}
                        Send Offer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
