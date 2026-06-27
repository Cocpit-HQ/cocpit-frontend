"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Briefcase, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyOffers, respondToOffer, JobOffer } from "@/services/api/offers";
import Avatar from "@/components/shared/Avatar";
import { Icon } from "@iconify/react";
import { getCurrencyIcon, formatSalaryRange } from "@/features/jobs/utils/currency.utils";

interface OffersTabProps {
    isOwnProfile: boolean;
}

export function OffersTab({ isOwnProfile }: OffersTabProps) {
    const [offers, setOffers] = useState<JobOffer[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOwnProfile) return;
        fetchOffers();
    }, [isOwnProfile]);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const data = await getMyOffers();
            setOffers(data);
        } catch (err) {
            console.error("Error fetching offers:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (offerId: string, action: "accepted" | "declined") => {
        try {
            setActionLoading(offerId);
            await respondToOffer(offerId, action);
            setOffers(prev =>
                prev.map(o => (o.offer_id === offerId ? { ...o, status: action, responded_at: new Date().toISOString() } : o))
            );
        } catch (err) {
            console.error("Error responding to offer:", err);
        } finally {
            setActionLoading(null);
        }
    };

    if (!isOwnProfile) return null;

    const statusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0 gap-1">
                        <AlertCircle className="w-3 h-3" /> Pending
                    </Badge>
                );
            case "accepted":
                return (
                    <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-0 gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Accepted
                    </Badge>
                );
            case "declined":
                return (
                    <Badge className="bg-red-500/15 text-red-700 dark:text-red-400 border-0 gap-1">
                        <XCircle className="w-3 h-3" /> Declined
                    </Badge>
                );
            case "withdrawn":
                return (
                    <Badge className="bg-gray-500/15 text-gray-600 dark:text-gray-400 border-0 gap-1">
                        Withdrawn
                    </Badge>
                );
            case "expired":
                return (
                    <Badge className="bg-gray-500/15 text-gray-600 dark:text-gray-400 border-0 gap-1">
                        Expired
                    </Badge>
                );
            default:
                return null;
        }
    };

    // formatSalary is replaced by formatSalaryRange in currency.utils.ts

    if (loading) {
        return (
            <div className="mt-8">
                <h2 className="text-xl text-foreground font-semibold mb-4">Job Offers</h2>
                <div className="bg-card rounded-xl border border-border p-8 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    if (offers.length === 0) {
        return (
            <div className="mt-8">
                <h2 className="text-xl text-foreground font-semibold mb-4">Job Offers</h2>
                <div className="bg-card rounded-xl border border-border border-dashed p-8 text-center">
                    <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No job offers yet</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8">
            <h2 className="text-xl text-foreground font-semibold mb-4">
                Job Offers
                <Badge variant="secondary" className="ml-2 text-xs">
                    {offers.filter(o => o.status === "pending").length} pending
                </Badge>
            </h2>

            <div className="space-y-3">
                {offers.map(offer => {
                    const isExpanded = expandedId === offer.offer_id;

                    return (
                        <div
                            key={offer.offer_id}
                            className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-colors"
                        >
                            {/* Compact Row */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : offer.offer_id)}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar
                                        url={offer.company_logo || undefined}
                                        name={offer.company_display_name || offer.company_name}
                                        size="sm"
                                    />
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm text-foreground truncate">
                                            {offer.title}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span>{offer.company_display_name || offer.company_name}</span>
                                            {offer.location && (
                                                <>
                                                    <span className="text-muted-foreground/40">•</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPin className="w-3 h-3" /> {offer.location}
                                                    </span>
                                                </>
                                            )}
                                            <span className="text-muted-foreground/40">•</span>
                                            <span>{format(new Date(offer.created_at), "MMM d, yyyy")}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    {statusBadge(offer.status)}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 bg-muted/10">
                                    {/* Job Details */}
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {offer.job_type && (
                                            <Badge variant="outline" className="text-xs">
                                                <Briefcase className="w-3 h-3 mr-1" /> {offer.job_type}
                                            </Badge>
                                        )}
                                        {offer.work_mode && (
                                            <Badge variant="outline" className="text-xs">
                                                {offer.work_mode}
                                            </Badge>
                                        )}
                                        {offer.experience_level && (
                                            <Badge variant="outline" className="text-xs">
                                                {offer.experience_level}
                                            </Badge>
                                        )}
                                        {(offer.salary_min || offer.salary_max) && (
                                            <Badge variant="outline" className="text-xs font-mono flex items-center gap-1">
                                                <Icon icon={getCurrencyIcon(offer.salary_currency)} className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                                <span>
                                                    {formatSalaryRange(offer.salary_min, offer.salary_max, offer.salary_currency)}
                                                    {offer.salary_period && ` / ${offer.salary_period.toLowerCase()}`}
                                                </span>
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {offer.description && (
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
                                            {offer.description}
                                        </p>
                                    )}

                                    {/* Personal Message */}
                                    {offer.message && (
                                        <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                                            <p className="text-xs font-medium text-primary mb-1">Personal message</p>
                                            <p className="text-sm text-foreground">{offer.message}</p>
                                        </div>
                                    )}

                                    {/* Sent by */}
                                    {offer.sent_by_name && (
                                        <p className="text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            Sent by {offer.sent_by_name} on {format(new Date(offer.created_at), "PPP p")}
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    {offer.status === "pending" && (
                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                onClick={(e) => { e.stopPropagation(); handleRespond(offer.offer_id, "accepted"); }}
                                                disabled={actionLoading === offer.offer_id}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {actionLoading === offer.offer_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                                ) : (
                                                    <CheckCircle2 className="w-4 h-4 mr-1" />
                                                )}
                                                Accept
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={(e) => { e.stopPropagation(); handleRespond(offer.offer_id, "declined"); }}
                                                disabled={actionLoading === offer.offer_id}
                                                className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Decline
                                            </Button>
                                        </div>
                                    )}

                                    {/* Responded info */}
                                    {offer.responded_at && (
                                        <p className="text-xs text-muted-foreground">
                                            Responded on {format(new Date(offer.responded_at), "PPP p")}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
