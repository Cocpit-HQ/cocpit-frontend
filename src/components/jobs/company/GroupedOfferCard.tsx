"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
    Briefcase, MapPin, ChevronDown, ChevronUp,
    Users, Clock, CheckCircle2, XCircle, AlertCircle, Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type Job } from "@/types/jobs";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { getCompanyOfferRecipients, type OfferRecipient } from "@/services/api/offers";
import Avatar from "@/components/shared/Avatar";

interface GroupedOfferCardProps {
    job: Job;
}

export function GroupedOfferCard({ job }: GroupedOfferCardProps) {
    const { activeProfile } = useActiveProfile();
    const [expanded, setExpanded] = useState(false);
    const [recipients, setRecipients] = useState<OfferRecipient[]>([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const [recipientsLoaded, setRecipientsLoaded] = useState(false);

    const handleToggle = async () => {
        if (!expanded && !recipientsLoaded && activeProfile?.id) {
            setLoadingRecipients(true);
            try {
                const data = await getCompanyOfferRecipients(activeProfile.id, job.jobId || job.id);
                setRecipients(data);
                setRecipientsLoaded(true);
            } catch (err) {
                console.error("Error fetching recipients:", err);
            } finally {
                setLoadingRecipients(false);
            }
        }
        setExpanded(!expanded);
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case "pending": return <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />;
            case "accepted": return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
            case "declined": return <XCircle className="w-3.5 h-3.5 text-red-500" />;
            default: return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
        }
    };

    const statusBadgeClass = (status: string) => {
        switch (status) {
            case "pending": return "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400";
            case "accepted": return "bg-green-500/15 text-green-700 dark:text-green-400";
            case "declined": return "bg-red-500/15 text-red-700 dark:text-red-400";
            default: return "bg-gray-500/15 text-gray-600 dark:text-gray-400";
        }
    };

    return (
        <div className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors">
            {/* Main card row */}
            <div
                className="flex items-center justify-between p-4 sm:p-5 cursor-pointer"
                onClick={handleToggle}
            >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {job.companyLogo ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-border shadow-inner shrink-0">
                            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
                            {job.company?.charAt(0)}
                        </div>
                    )}

                    <div className="min-w-0">
                        <p className="font-semibold text-sm sm:text-base text-foreground truncate">{job.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                            <span>{job.company}</span>
                            {job.location && (
                                <>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span className="flex items-center gap-0.5">
                                        <MapPin className="w-3 h-3" /> {job.location}
                                    </span>
                                </>
                            )}
                            {job.type && (
                                <>
                                    <span className="text-muted-foreground/40">•</span>
                                    <span>{job.type}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side: counts + expand arrow */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                    {/* Offer count badges */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0 gap-1 text-xs">
                            <Users className="w-3 h-3" /> {job.totalOffers || 0}
                        </Badge>
                        {(job.pendingOffers || 0) > 0 && (
                            <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0 gap-1 text-xs">
                                <AlertCircle className="w-3 h-3" /> {job.pendingOffers}
                            </Badge>
                        )}
                        {(job.acceptedOffers || 0) > 0 && (
                            <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0 gap-1 text-xs">
                                <CheckCircle2 className="w-3 h-3" /> {job.acceptedOffers}
                            </Badge>
                        )}
                        {(job.declinedOffers || 0) > 0 && (
                            <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-0 gap-1 text-xs">
                                <XCircle className="w-3 h-3" /> {job.declinedOffers}
                            </Badge>
                        )}
                    </div>

                    {/* Mobile: compact count */}
                    <div className="sm:hidden">
                        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0 text-xs">
                            {job.totalOffers || 0} sent
                        </Badge>
                    </div>

                    {expanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Mobile counts row */}
            {expanded && (
                <div className="sm:hidden flex items-center gap-1.5 px-4 pb-2 flex-wrap">
                    {(job.pendingOffers || 0) > 0 && (
                        <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0 gap-1 text-xs">
                            Pending: {job.pendingOffers}
                        </Badge>
                    )}
                    {(job.acceptedOffers || 0) > 0 && (
                        <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0 gap-1 text-xs">
                            Accepted: {job.acceptedOffers}
                        </Badge>
                    )}
                    {(job.declinedOffers || 0) > 0 && (
                        <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-0 gap-1 text-xs">
                            Declined: {job.declinedOffers}
                        </Badge>
                    )}
                </div>
            )}

            {/* Expanded: Recipients list */}
            {expanded && (
                <div className="border-t border-border bg-muted/10">
                    {loadingRecipients ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : recipients.length === 0 ? (
                        <div className="text-center py-6 text-sm text-muted-foreground">
                            No recipients found
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {recipients.map((r) => (
                                <div key={r.offer_id} className="flex items-center justify-between px-4 sm:px-5 py-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar
                                            url={r.avatar_url || undefined}
                                            name={r.full_name}
                                            size="sm"
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {r.full_name}
                                            </p>
                                            {r.headline && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {r.headline}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Sent {format(new Date(r.created_at), "MMM d, yyyy")}
                                                {r.sent_by_name && ` by ${r.sent_by_name}`}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 ml-2 flex items-center gap-1.5">
                                        <Badge className={`${statusBadgeClass(r.status)} border-0 gap-1 text-xs`}>
                                            {statusIcon(r.status)}
                                            <span className="capitalize">{r.status}</span>
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
