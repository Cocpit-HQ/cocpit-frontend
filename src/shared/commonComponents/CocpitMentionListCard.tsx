"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { UserIcon, BusinessBuildingIcon } from "@/components/icons";
import { Users } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

/**
 * Minimal shape required for each row in the mention list.
 * Matches the UserMention interface from @/services/api/users.
 */
export interface MentionUser {
    id: string;
    full_name: string;
    account_name: string;
    avatar_url?: string;
    headline?: string;
    account_type?: string;
    type?: string;
    slug?: string;
    org_id?: string;
    is_company?: boolean;
}

export interface CocpitMentionListCardProps {
    /** Array of users to display in the list */
    users: MentionUser[];
    /** Currently highlighted row index (keyboard nav) */
    activeIndex: number;
    /** Search query — used to bold-highlight matching characters */
    query: string;
    /** True while fetching results */
    isLoading: boolean;
    /** Called when the user clicks / keyboard-selects a row */
    onSelect: (user: MentionUser) => void;
    /** Called when mouse enters a row (syncs keyboard activeIndex) */
    onHoverIndex: (index: number) => void;
    /** Called when the close / dismiss button is pressed */
    onDismiss: () => void;
    /**
     * When true and not loading and users is empty, shows "No results found".
     * Caller should only set this to true when the suggestion panel is open
     * and a non-empty query has been typed.
     */
    showNoResults?: boolean;
    /** Has more results for cursor pagination */
    hasMore?: boolean;
    /** Called when scrolled near bottom to fetch next cursor page */
    onLoadMore?: () => void;
    /** Custom container class */
    className?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Wraps the characters matching `queryText` inside a <b> element.
 * Returns plain string when there is nothing to highlight.
 */
function highlightMatch(text: string, queryText: string): React.ReactNode {
    if (!text) return text;
    if (!queryText?.trim()) return text;
    try {
        const parts = text.split(new RegExp(`(${queryText})`, "gi"));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === queryText.toLowerCase() ? (
                        <b key={i} className="text-ds-text-primary font-bold">
                            {part}
                        </b>
                    ) : (
                        part
                    )
                )}
            </>
        );
    } catch {
        return text;
    }
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * CocpitMentionListCard
 *
 * A reusable mention / @-suggestion dropdown card.
 *
 * Width policy: the component stretches to 100 % of whatever container the
 * caller places it in.  The caller (input box, comment box, etc.) is
 * responsible for providing the correct width context — this component never
 * sets a fixed pixel width.
 *
 * Usage:
 *   <CocpitMentionListCard
 *     users={users}
 *     activeIndex={activeIndex}
 *     query={query}
 *     isLoading={isLoading}
 *     onSelect={(user) => insertMention(user)}
 *     onHoverIndex={(i) => setActiveIndex(i)}
 *     onDismiss={() => setShowSuggestions(false)}
 *     showNoResults={!isLoading && query.length > 0 && users.length === 0}
 *   />
 */
export const CocpitMentionListCard: React.FC<CocpitMentionListCardProps> = ({
    users,
    activeIndex,
    query,
    isLoading,
    onSelect,
    onHoverIndex,
    onDismiss,
    showNoResults = false,
    hasMore = false,
    onLoadMore,
    className,
}) => {
    const listRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!listRef.current) return;
        const activeItem = listRef.current.children[activeIndex] as HTMLElement;
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 32) {
            if (hasMore && !isLoading && onLoadMore) {
                onLoadMore();
            }
        }
    };

    return (
        <div 
            ref={listRef} 
            onScroll={handleScroll}
            className={cn(
                "w-full h-[168px] self-stretch flex flex-col items-start pl-[12px] pr-0 py-0 gap-[8px] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden box-border",
                className
            )}
        >
            {/* ── User rows ── */}
            {users.map((user, index) => {
                const isActive = index === activeIndex;
                const displayName = user.full_name || user.account_name || "User";
                const isEveryone = user.id === "everyone" || user.type === "GROUP" || displayName.toLowerCase() === "everyone";
                const isCompany =
                    !isEveryone && (
                        user.type === "company" ||
                        user.type === "COMPANY" ||
                        user.account_type === "company" ||
                        user.account_type === "COMPANY" ||
                        Boolean(user.org_id) ||
                        Boolean(user.is_company)
                    );
                const roundedClass = isCompany ? "rounded-[4px]" : "rounded-[100px]";

                return (
                    <div
                        key={user.id || index}
                        onMouseEnter={() => onHoverIndex(index)}
                        onClick={() => onSelect(user)}
                        className={cn(
                            "w-full h-[36px] self-stretch shrink-0 flex flex-row justify-between items-center p-0 gap-[8px] cursor-pointer transition-colors duration-150 box-border group",
                            isActive
                                ? "opacity-100"
                                : "opacity-80 hover:opacity-100"
                        )}
                    >
                        {/* Frame 2609542: User Information Container (h: 20px, gap: 12px) */}
                        <div className="flex flex-row items-center p-0 gap-[12px] h-[20px] min-w-0 flex-1">
                            {/* Rectangle 31: Avatar (20px × 20px, rounded-[100px]) */}
                            <div className={cn(
                                "relative w-[20px] h-[20px] shrink-0 overflow-hidden flex items-center justify-center border text-[10px] font-medium",
                                isEveryone
                                    ? "rounded-[100px] bg-[var(--ds-accent)]/15 border-[var(--ds-accent)]/30 text-[var(--ds-accent)]"
                                    : "bg-[var(--ds-surface-1)] text-[var(--ds-text-secondary)] border-[var(--ds-border)]",
                                roundedClass
                            )}>
                                {/* Fallback Icon */}
                                {isEveryone ? (
                                    <Users className="w-3 h-3 text-[var(--ds-accent)]" strokeWidth={2} />
                                ) : isCompany ? (
                                    <BusinessBuildingIcon className="w-[60%] h-[60%] text-current" />
                                ) : (
                                    <UserIcon className="w-[60%] h-[60%] text-current" />
                                )}
                                
                                {/* Image overlay */}
                                {!isEveryone && user.avatar_url && (
                                    <img
                                        src={user.avatar_url}
                                        alt={displayName}
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = "none";
                                        }}
                                        className={cn("absolute inset-0 w-full h-full object-cover", roundedClass)}
                                    />
                                )}
                            </div>

                            {/* User Name (DM Sans 14px / 20px LH, color: #FFECE6 / var(--ds-text-primary)) */}
                            <span className={cn(
                                "font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] truncate",
                                isActive ? "text-[var(--ds-text-primary)] font-medium" : "text-[var(--ds-text-primary)]",
                                isEveryone && "text-[var(--ds-accent)] font-medium"
                            )}>
                                {highlightMatch(displayName, query)}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* ── Loading state ── */}
            {isLoading && (
                <div className="w-full py-2 text-xs text-[var(--ds-text-muted)] animate-pulse text-left pl-[32px]">
                    Searching...
                </div>
            )}

            {/* ── No results ── */}
            {showNoResults && !isLoading && (
                <div className="w-full py-2 text-xs text-[var(--ds-text-muted)] italic text-left pl-[32px]">
                    No results found
                </div>
            )}
        </div>
    );
};

export default CocpitMentionListCard;
