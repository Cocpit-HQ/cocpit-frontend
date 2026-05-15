"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Briefcase, Calendar, User, Building2, FileText, Loader2 } from "lucide-react";
import { fetchEntityPreview, EntityPreview, EntityType } from "@/services/api/shareService";

// ─── Props ──────────────────────────────────────────────────

interface EntityPreviewCardProps {
    entityType: EntityType;
    entityId: string;
}

// ─── Icon Map ───────────────────────────────────────────────

const ENTITY_ICONS: Record<EntityType, React.ReactNode> = {
    post: <FileText className="w-3 h-3" />,
    profile: <User className="w-3 h-3" />,
    company: <Building2 className="w-3 h-3" />,
    job: <Briefcase className="w-3 h-3" />,
    event: <Calendar className="w-3 h-3" />,
};

const ENTITY_LABELS: Record<EntityType, string> = {
    post: "Shared Post",
    profile: "User Profile",
    company: "Company Profile",
    job: "Job Posting",
    event: "Event",
};

// ─── Component ──────────────────────────────────────────────

export function EntityPreviewCard({ entityType, entityId }: EntityPreviewCardProps) {
    const router = useRouter();
    const [preview, setPreview] = useState<EntityPreview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadPreview = async () => {
            try {
                setLoading(true);
                setError(false);
                const data = await fetchEntityPreview(entityType, entityId);
                if (!cancelled) setPreview(data);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadPreview();
        return () => { cancelled = true; };
    }, [entityType, entityId]);

    if (loading) {
        return (
            <div className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 p-4 max-w-[280px] flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Loading preview…</span>
            </div>
        );
    }

    if (error || !preview) {
        return (
            <div className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 p-3 max-w-[280px]">
                <p className="text-xs text-muted-foreground italic">Preview unavailable</p>
            </div>
        );
    }

    return (
        <div
            className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden max-w-[280px] cursor-pointer hover:bg-background/80 transition-all shadow-sm group"
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
