"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Briefcase, Calendar, User, Building2, FileText, Loader2, AlertCircle } from "lucide-react";
import { fetchEntityPreview, EntityPreview, EntityType } from "@/services/api/shareService";
import { useQuery } from "@tanstack/react-query";
import { UnavailableContentCard } from "./components/ui/UnavailableContentCard";
import { useSocial } from "@/context/SocialContext";

// ─── Props ──────────────────────────────────────────────────

interface EntityPreviewCardProps {
    entityType: EntityType;
    entityId: string;
    onLoad?: () => void;
    isMe?: boolean;
}

// ─── Icon Map ───────────────────────────────────────────────

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
    post: <FileText className="w-3 h-3" />,
    profile: <User className="w-3 h-3" />,
    company: <Building2 className="w-3 h-3" />,
    job: <Briefcase className="w-3 h-3" />,
    event: <Calendar className="w-3 h-3" />,
    offer: <Briefcase className="w-3 h-3" />,
    channel: <Building2 className="w-3 h-3" />,
    community: <Building2 className="w-3 h-3" />,
};

const ENTITY_LABELS: Record<EntityType, string> = {
    post: "Shared Post",
    profile: "User Profile",
    company: "Company Profile",
    job: "Job Posting",
    event: "Event",
    offer: "Job Offer",
    channel: "Channel",
    community: "Channel",
};

// ─── Component ──────────────────────────────────────────────

export function EntityPreviewCard({ entityType, entityId, onLoad, isMe = false }: EntityPreviewCardProps) {
    const router = useRouter();
    const { isBlocked } = useSocial();

    const {
        data: preview,
        isLoading: loading,
        error: fetchError,
    } = useQuery({
        queryKey: ["entityPreview", entityType, entityId],
        queryFn: async () => {
            if (!entityId) return null;
            return fetchEntityPreview(entityType, entityId);
        },
        enabled: Boolean(entityId) && !isBlocked(entityId),
        staleTime: 0,
        retry: false,
    });

    useEffect(() => {
        if (!loading) {
            onLoad?.();
        }
    }, [loading, onLoad]);

    if (isBlocked(entityId)) {
        return <UnavailableContentCard isMe={isMe} />;
    }

    if (loading) {
        return (
            <div className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden max-w-[280px] w-full animate-pulse">
                {/* Header — Avatar + Title */}
                <div className="p-3 border-b border-white/10 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                    <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-3 bg-muted rounded w-2/3" />
                        <div className="h-2.5 bg-muted rounded w-1/3" />
                    </div>
                </div>
                {/* Content / Subtitle */}
                <div className="p-3 space-y-1.5">
                    <div className="h-2.5 bg-muted rounded w-full" />
                    <div className="h-2.5 bg-muted rounded w-5/6" />
                    
                    <div className="flex items-center gap-1 pt-1.5">
                        <div className="w-3 h-3 bg-muted rounded" />
                        <div className="h-2.5 bg-muted rounded w-1/3" />
                    </div>
                </div>
            </div>
        );
    }

    if (fetchError || !preview || isBlocked(preview.entityId)) {
        return <UnavailableContentCard isMe={isMe} />;
    }

    return (
        <div
            className="mt-1 mb-2 rounded-xl bg-chat-shared-card-bg border border-gray-100 dark:border-zinc-700 overflow-hidden max-w-[280px] cursor-pointer hover:opacity-95 transition-all shadow-sm group"
            onClick={(e) => { e.stopPropagation(); router.push(preview.url); }}
            role="button"
            tabIndex={0}
        >
            {/* Header — Avatar + Title */}
            <div className="p-3 border-b border-white/10 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden ring-1 ring-white/20 shrink-0">
                    {preview.image ? (
                        <img
                            src={preview.image}
                            alt={preview.title}
                            className="w-full h-full object-cover"
                            onLoad={onLoad}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                            {ENTITY_ICONS[entityType] || <FileText className="w-3 h-3" />}
                        </div>
                    )}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate leading-none mb-0.5">
                        {preview.title}
                    </span>
                    <span className="text-xs text-muted-foreground leading-none">
                        {ENTITY_LABELS[entityType] || "Shared"}
                    </span>
                </div>
            </div>

            {/* Subtitle / Content */}
            <div className="p-3 space-y-1.5">
                {preview.subtitle && (
                    <p className="text-xs line-clamp-2 text-muted-foreground/90 font-medium">
                        {preview.subtitle}
                    </p>
                )}

                <div className="flex items-center gap-1 text-[11px] text-primary/80 font-medium pt-0.5">
                    <ExternalLink className="w-3 h-3" />
                    <span>View {ENTITY_LABELS[entityType] || "Content"}</span>
                </div>
            </div>
        </div>
    );
}
