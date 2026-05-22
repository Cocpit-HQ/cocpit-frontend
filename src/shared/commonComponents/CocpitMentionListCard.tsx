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
    if (!queryText.trim()) return text;
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
    return (
        <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[var(--popover,#FFFFFF)] border border-[var(--border,#EEF2FF)] rounded-xl max-h-[232px] overflow-y-auto mb-2 custom-scrollbar animate-in fade-in-0 zoom-in-95">
            {/* ── User rows ── */}
            {users.map((user, index) => (
                <div
                    key={user.id}
                    onMouseEnter={() => onHoverIndex(index)}
                    onClick={() => onSelect(user)}
                    className={cn(
                        "flex flex-row items-center px-4 py-2 gap-2 h-14 rounded-xl shrink-0 self-stretch cursor-pointer transition-colors duration-150 w-full box-border",
                        index === activeIndex
                            ? "bg-[var(--edit-btn-hover,#C7D2FE)]"
                            : "bg-[var(--muted,#EEF2FF)]"
                    )}
                >
                    {/* Avatar */}
                    <img
                        src={user.avatar_url || ""}
                        alt={user.full_name || "User"}
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        className="w-6 h-6 rounded-full object-cover bg-[#D9D9D9] shrink-0 grow-0 mr-2 ml-4"
                    />

                    {/* Text column */}
                    <div className="flex flex-col justify-center items-start p-0 h-10 shrink-0 grow-0">
                        {/* Full name */}
                        <span className="font-poppins font-medium text-base leading-6 text-[var(--foreground,#000000)] shrink-0 grow-0 whitespace-nowrap">
                            {highlightMatch(user.full_name, query)}
                        </span>

                        {/* Headline or @account_name */}
                        <span className="font-poppins font-normal text-xs leading-4 text-[var(--muted-foreground,#6B7280)] shrink-0 grow-0 whitespace-nowrap">
                            {user.headline
                                ? user.headline
                                : `@${highlightMatch(user.account_name, query)}`}
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
