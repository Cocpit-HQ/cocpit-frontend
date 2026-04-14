"use client";

import React, { useRef, useEffect } from 'react';
import { UserMention } from '@/services/api/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { HashtagSuggestion } from '@/services/api/hashtags';
import { useMentions } from '@/hooks/use-mentions';

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onMentionSelect?: (user: UserMention) => void;
    searchUsersFn?: (query: string) => Promise<UserMention[]>;
    innerRef?: React.RefObject<HTMLTextAreaElement | null>;
    placeholder?: string;
    className?: string;
}

export const MentionTextarea = ({ 
    value, 
    onChange, 
    onMentionSelect, 
    searchUsersFn, 
    innerRef, 
    className, 
    ...props 
}: MentionTextareaProps) => {
    const defaultRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = innerRef || defaultRef;
    
    const {
        query, setQuery,
        mode, setMode,
        showSuggestions, setShowSuggestions,
        suggestionPosition, setSuggestionPosition,
        users, hashtags,
        activeIndex, setActiveIndex,
        isLoading,
        handleKeyDown: mentionKeyDown
    } = useMentions({ searchUsersFn });

    // Helper to calculate caret coordinates for absolute positioning
    const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
        const div = document.createElement('div');
        const style = window.getComputedStyle(element);
        
        const properties = [
            'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
            'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
            'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
            'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
        ];

        div.style.position = 'absolute';
        div.style.visibility = 'hidden';
        div.style.whiteSpace = 'pre-wrap';
        div.style.wordBreak = 'break-word';

        properties.forEach(prop => {
            (div.style as any)[prop] = (style as any)[prop];
        });

        const content = element.value.substring(0, position);
        div.textContent = content;

        const span = document.createElement('span');
        span.textContent = element.value.substring(position) || '.';
        div.appendChild(span);

        document.body.appendChild(div);
        const { offsetLeft: left, offsetTop: top } = span;
        document.body.removeChild(div);

        return {
            top: top - element.scrollTop + parseInt(style.lineHeight || '20'),
            left: Math.min(left, element.clientWidth - 150)
        };
    };

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e);

        const cursor = e.target.selectionStart;
        const text = e.target.value;
        const textBeforeCursor = text.substring(0, cursor);

        const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
        const hashtagMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);

        if (mentionMatch || hashtagMatch) {
            const coords = getCaretCoordinates(e.target, cursor);
            setSuggestionPosition(coords);
            setQuery(mentionMatch ? mentionMatch[1] : hashtagMatch![1]);
            setMode(mentionMatch ? 'mention' : 'hashtag');
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setMode(null);
            setQuery('');
        }
    };

    const onSelect = (item: UserMention | HashtagSuggestion) => {
        if (mode === 'mention') {
            selectUser(item as UserMention);
        } else {
            selectHashtag(item as HashtagSuggestion);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const handled = mentionKeyDown(e, onSelect);
        if (!handled) {
            // Additional custom key handling if needed
        }
    };

    const selectUser = (user: UserMention, format: 'account' | 'full' = 'account') => {
        const el = textareaRef.current;
        if (!el) return;

        const cursor = el.selectionStart;
        const textBefore = value.substring(0, cursor);
        const textAfter = value.substring(cursor);
        
        const match = textBefore.match(/@([a-zA-Z0-9._ ]*)$/);
        if (match) {
            const baseLeft = textBefore.substring(0, match.index);
            const content = format === 'full' ? user.full_name : user.account_name;
            const injected = `@[${content}](${user.account_name}) `;
            const newValue = baseLeft + injected + textAfter;

            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
            setShowSuggestions(false);
            if (onMentionSelect) onMentionSelect(user);

            setTimeout(() => {
                const newPos = baseLeft.length + injected.length;
                el.setSelectionRange(newPos, newPos);
                el.focus();
            }, 0);
        }
    };

    const selectHashtag = (tag: HashtagSuggestion) => {
        const el = textareaRef.current;
        if (!el) return;

        const boundaryRegex = new RegExp(`(^|\\s)#${tag.tag}(\\s|$)`, 'i');
        if (boundaryRegex.test(value)) {
            setShowSuggestions(false);
            return;
        }

        const cursor = el.selectionStart;
        const textBefore = value.substring(0, cursor);
        const textAfter = value.substring(cursor);
        
        const match = textBefore.match(/#([a-zA-Z0-9_]*)$/);
        if (match) {
            const baseLeft = textBefore.substring(0, match.index);
            const injected = `#${tag.tag} `;
            const newValue = baseLeft + injected + textAfter;

            const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(event);
            setShowSuggestions(false);

            setTimeout(() => {
                const newPos = baseLeft.length + injected.length;
                el.setSelectionRange(newPos, newPos);
                el.focus();
            }, 0);
        }
    };

    const highlightMatch = (text: string, queryText: string) => {
        if (!queryText.trim()) return text;
        try {
            const parts = text.split(new RegExp(`(${queryText})`, 'gi'));
            return (
                <>
                    {parts.map((part, i) => 
                        part.toLowerCase() === queryText.toLowerCase() 
                            ? <b key={i} className="text-primary font-bold">{part}</b> 
                            : part
                    )}
                </>
            );
        } catch (e) {
            return text;
        }
    };

    return (
        <div className="relative w-full">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleInput}
                onKeyDown={(e) => mentionKeyDown(e, onSelect)}
                className={cn("w-full resize-none bg-transparent outline-none", className)}
                {...props}
            />

            {showSuggestions && (
                <div className="absolute z-50 w-72 bg-popover text-popover-foreground border rounded-lg shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95"
                    style={{ 
                        top: suggestionPosition.top, 
                        left: suggestionPosition.left,
                    }}
                >
                    <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {mode === 'mention' && users.map((user, index) => (
                            <div
                                key={user.id}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cn(
                                    "group flex items-center justify-between p-1 rounded-md transition-all duration-200",
                                    index === activeIndex ? "bg-accent/50" : "hover:bg-muted/30"
                                )}
                            >
                                <div className="flex items-center gap-3 px-2 py-1 flex-1 overflow-hidden">
                                    <Avatar className="h-9 w-9 border border-border/50 shrink-0">
                                        <AvatarImage src={user.avatar_url} />
                                        <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start overflow-hidden">
                                        <span className="font-semibold text-sm truncate w-full">{highlightMatch(user.full_name, query)}</span>
                                        <span className="text-xs text-muted-foreground truncate w-full">@{highlightMatch(user.account_name, query)}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pr-1">
                                    <button
                                        onClick={() => selectUser(user, 'full')}
                                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                        Name
                                    </button>
                                    <button
                                        onClick={() => selectUser(user, 'account')}
                                        className="text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 rounded bg-muted text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
                                    >
                                        @
                                    </button>
                                </div>
                            </div>
                        ))}



                        {mode === 'hashtag' && hashtags.map((h, index) => (
                            <button
                                key={h.tag}
                                onClick={() => selectHashtag(h)}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm transition-colors text-left",
                                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/80"
                                )}
                            >
                                <span className="font-medium text-primary">#{highlightMatch(h.tag, query)}</span>
                                <span className="text-xs text-muted-foreground">{h.usage_count} posts</span>
                            </button>
                        ))}

                        {isLoading && (
                            <div className="px-3 py-3 text-xs text-muted-foreground animate-pulse text-center">
                                Searching...
                            </div>
                        )}
                        
                        {!isLoading && showSuggestions && ((mode === 'mention' && users.length === 0) || (mode === 'hashtag' && hashtags.length === 0)) && query && (
                            <div className="px-3 py-3 text-xs text-muted-foreground italic text-center">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
