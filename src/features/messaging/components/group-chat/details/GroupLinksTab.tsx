"use client";

import React from "react";
import { Link2 } from "lucide-react";
import { SharedLinkItem } from "@/types/group-chat";

interface GroupLinksTabProps {
    links?: SharedLinkItem[];
    isLoading: boolean;
}

/**
 * Extracts and cleans the hostname/domain from a URL string.
 */
export function extractDomain(urlStr: string): string {
    if (!urlStr) return "";
    try {
        const fullUrl = urlStr.startsWith("http://") || urlStr.startsWith("https://")
            ? urlStr
            : `https://${urlStr}`;
        const hostname = new URL(fullUrl).hostname;
        return hostname.replace(/^www\./i, "");
    } catch {
        return urlStr.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[\/?#]/)[0];
    }
}

export const GroupLinksTab: React.FC<GroupLinksTabProps> = ({
    links,
    isLoading
}) => {
    return (
        /* Frame 2610097: 16px below tabs, max-w-[618px], gap 16px, hidden scrollbar */
        <div className="mt-4 max-w-[618px] mx-auto w-full font-['DM_Sans'] flex flex-col gap-4 max-h-[413.32px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {isLoading ? (
                /* Skeleton rows matching clean list layout */
                <div className="flex flex-col gap-4 max-w-[618px] w-full">
                    {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="flex flex-col gap-1 w-full animate-pulse">
                            <div className="h-[20px] w-28 rounded bg-[var(--ds-surface-1)]/60" />
                            <div className="h-[16px] w-56 rounded bg-[var(--ds-surface-1)]/40" />
                        </div>
                    ))}
                </div>
            ) : links && links.length > 0 ? (
                links.map((linkItem, idx) => {
                    const domain = linkItem.domain || extractDomain(linkItem.url);
                    // Use title if it's a descriptive name (like 'Project Cocpit 1'), otherwise domain
                    const hasDescriptiveTitle = Boolean(
                        linkItem.title &&
                        linkItem.title !== linkItem.url &&
                        !linkItem.title.startsWith("http")
                    );
                    const displayName = hasDescriptiveTitle ? linkItem.title : (domain || "Link");
                    const href = linkItem.url.startsWith("http://") || linkItem.url.startsWith("https://")
                        ? linkItem.url
                        : `https://${linkItem.url}`;
                    const uniqueKey = linkItem.id ? `${linkItem.id}-${idx}` : `link-${idx}`;

                    return (
                        /* Frame 2610097: flex column, items-start, gap 8px / 4px, width 618px, height: 40px+ (multiple lines allowed) */
                        <div
                            key={uniqueKey}
                            className="flex flex-col items-start gap-1 w-full"
                        >
                            {/* Domain Name / Title: 14px, line-height 20px, #FFECE6 / --ds-text-primary */}
                            <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)]">
                                {displayName}
                            </span>

                            {/* Link URL: 12px, line-height 16px, #EC6229 / --ds-accent, multi-line wrap, opens in new tab, no underline */}
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-ds-accent !text-[var(--ds-accent)] no-underline hover:no-underline hover:opacity-85 transition-opacity break-all cursor-pointer block"
                                style={{ color: "var(--ds-accent)" }}
                            >
                                {linkItem.url}
                            </a>
                        </div>
                    );
                })
            ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center text-[var(--ds-text-secondary)]">
                    <Link2 className="w-10 h-10 mb-2 opacity-30 text-[var(--ds-text-secondary)]" />
                    <p className="text-sm font-medium text-[var(--ds-text-primary)]">No links shared yet</p>
                    <p className="text-xs text-[var(--ds-text-muted)] mt-1">
                        Links shared in this group will be collected here
                    </p>
                </div>
            )}
        </div>
    );
};
