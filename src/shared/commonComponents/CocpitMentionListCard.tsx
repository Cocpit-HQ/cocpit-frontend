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
        <div 
            ref={listRef} 
            className="w-[274px] h-[256px] self-stretch flex flex-col items-start p-0 gap-2 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden box-border"
        >
            {/* ── User rows ── */}
            {users.map((user, index) => {
                const isActive = index === activeIndex;
                const displayName = user.full_name || user.account_name || "User";

                return (
                    <div
                        key={user.id || index}
                        onMouseEnter={() => onHoverIndex(index)}
                        onClick={() => onSelect(user)}
                        className={cn(
                            "w-[274px] h-9 self-stretch shrink-0 flex flex-row justify-between items-center p-0 gap-2 cursor-pointer transition-colors duration-150 box-border group",
                            isActive
                                ? "text-ds-text-primary"
                                : "text-ds-text-secondary hover:text-ds-text-primary"
                        )}
                    >
                        {/* User Information Container */}
                        <div className="flex flex-row items-center p-0 gap-2 h-5 min-w-0 flex-1">
                            {/* Avatar: 20px × 20px, rounded-[100px] */}
                            <div className="relative w-5 h-5 rounded-[100px] shrink-0 overflow-hidden flex items-center justify-center bg-ds-surface-1 text-ds-text-secondary border border-ds-border text-[10px] font-medium">
                                {/* Fallback Letter */}
                                <span>{(user.full_name || user.account_name || "U").charAt(0).toUpperCase()}</span>
                                
                                {/* Image overlay */}
                                {user.avatar_url && (
                                    <img
                                        src={user.avatar_url}
                                        alt={displayName}
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = "none";
                                        }}
                                        className="absolute inset-0 w-full h-full object-cover rounded-[100px]"
                                    />
                                )}
                            </div>

                            {/* User Name */}
                            <span className={cn(
                                "font-['DM_Sans'] font-normal text-[14px] leading-5 truncate",
                                isActive ? "text-ds-text-primary" : "text-ds-text-secondary group-hover:text-ds-text-primary"
                            )}>
                                {highlightMatch(displayName, query)}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* ── Loading state ── */}
            {isLoading && (
                <div className="w-full py-3 text-xs text-ds-text-muted animate-pulse text-center">
                    Searching...
                </div>
            )}

            {/* ── No results ── */}
            {showNoResults && !isLoading && (
                <div className="w-full py-3 text-xs text-ds-text-muted italic text-center">
                    No results found
                </div>
            )}
        </div>
    );
};

export default CocpitMentionListCard;
