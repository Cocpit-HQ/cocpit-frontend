"use client";

import React from "react";
import { cn } from "@/lib/utils";

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
                        <b key={i} style={{ color: "#6366F1" }}>
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
}) => {
    const listRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!listRef.current) return;
        const activeItem = listRef.current.children[activeIndex] as HTMLElement;
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest' });
        }
    }, [activeIndex]);

    return (
        <div ref={listRef} className="box-border flex flex-col items-start p-2 gap-1 w-full animate-in fade-in-0 zoom-in-95">
            {/* ── User rows ── */}
            {users.map((user, index) => (
                <div
                    key={user.id}
                    onMouseEnter={() => onHoverIndex(index)}
                    onClick={() => onSelect(user)}
                    className={cn(
                        "flex flex-row items-center px-3 py-2 gap-3 h-14 rounded-lg cursor-pointer transition-colors duration-150 w-full box-border",
                        index === activeIndex
                            ? "bg-[var(--edit-btn-hover,#C7D2FE)]"
                            : "hover:bg-[var(--muted,#EEF2FF)] bg-transparent"
                    )}
                >
                    {/* Avatar */}
                    <div className="relative w-8 h-8 rounded-full shrink-0 overflow-hidden flex items-center justify-center bg-[#D9D9D9] text-[12px] font-semibold text-gray-500">
                        {/* Fallback Letter */}
                        <span>{(user.full_name || user.account_name || "U").charAt(0).toUpperCase()}</span>
                        
                        {/* Image overlay */}
                        {user.avatar_url && (
                            <img
                                src={user.avatar_url}
                                alt={user.full_name || "User"}
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        )}
                    </div>

                    {/* Text column */}
                    <div className="flex flex-col justify-center items-start p-0 min-w-0 overflow-hidden flex-1">
                        {/* Full name */}
                        <span className="font-poppins font-medium text-[14px] leading-5 text-[var(--foreground,#000000)] truncate w-full">
                            {highlightMatch(user.full_name, query)}
                        </span>

                        {/* @account_name */}
                        <span className="font-poppins font-normal text-[12px] leading-4 text-[var(--muted-foreground,#6B7280)] truncate w-full">
                            @{highlightMatch(user.account_name, query)}
                        </span>
                    </div>
                </div>
            ))}

            {/* ── Loading state ── */}
            {isLoading && (
                <div className="px-3 py-3 text-xs text-muted-foreground animate-pulse text-center w-full">
                    Searching...
                </div>
            )}

            {/* ── No results ── */}
            {showNoResults && !isLoading && (
                <div className="px-3 py-3 text-xs text-muted-foreground italic text-center w-full">
                    No results found
                </div>
            )}
        </div>
    );
};

export default CocpitMentionListCard;
