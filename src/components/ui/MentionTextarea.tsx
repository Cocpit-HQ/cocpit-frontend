"use client";

import React, { useRef, useEffect } from 'react';
import { UserMention } from '@/services/api/users';
import { cn } from '@/lib/utils';
import { HashtagSuggestion } from '@/services/api/hashtags';
import { useMentions } from '@/hooks/use-mentions';
import { CocpitMentionListCard } from '@/shared/commonComponents/CocpitMentionListCard';

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
            const injected = `@${user.account_name} `;
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

    const backdropRef = useRef<HTMLDivElement>(null);

    const renderHighlightedText = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(@[a-zA-Z0-9_.]+)/g);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('@')) {
                        return (
                            <span key={i} style={{ color: '#6366F1' }} className="font-semibold">
                                {part}
                            </span>
                        );
                    }
                    return part;
                })}
            </>
        );
    };

    const handleScroll = () => {
        if (textareaRef.current && backdropRef.current) {
            backdropRef.current.scrollTop = textareaRef.current.scrollTop;
            backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (textareaRef.current && backdropRef.current) {
                backdropRef.current.scrollTop = textareaRef.current.scrollTop;
                backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [value]);

    return (
        <div className="flex flex-col w-full">
            {showSuggestions && mode === 'mention' && (
                <CocpitMentionListCard
                    users={users}
                    activeIndex={activeIndex}
                    query={query}
                    isLoading={isLoading}
                    onSelect={(user) => selectUser(user as UserMention, 'account')}
                    onHoverIndex={setActiveIndex}
                    onDismiss={() => setShowSuggestions(false)}
                    showNoResults={!isLoading && showSuggestions && users.length === 0 && !!query}
                />
            )}

            {showSuggestions && mode === 'hashtag' && (
                <div
                    className="animate-in fade-in-0 zoom-in-95"
                    style={{
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        padding: '16px',
                        gap: '8px',
                        width: '100%',
                        background: '#FFFFFF',
                        border: '1px solid #EEF2FF',
                        borderRadius: '12px',
                        maxHeight: '232px',
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                        marginBottom: '8px',
                    }}
                >
                    {hashtags.map((h, index) => (
                        <button
                            key={h.tag}
                            onClick={() => selectHashtag(h)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm transition-colors text-left",
                                index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/80"
                            )}
                        >
                            <span className="font-medium text-primary">#{h.tag}</span>
                            <span className="text-xs text-muted-foreground">{h.usage_count} posts</span>
                        </button>
                    ))}
                    {isLoading && (
                        <div className="px-3 py-3 text-xs text-muted-foreground animate-pulse text-center w-full">
                            Searching...
                        </div>
                    )}
                    {!isLoading && hashtags.length === 0 && query && (
                        <div className="px-3 py-3 text-xs text-muted-foreground italic text-center w-full">
                            No results found
                        </div>
                    )}
                </div>
            )}

            <div className="relative w-full">
                {/* Backdrop containing the highlighted text */}
                <div
                    ref={backdropRef}
                    className={cn(
                        "absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-y-auto scrollbar-hide text-foreground",
                        value.length === 0 ? "opacity-0" : "opacity-100",
                        className
                    )}
                    style={{
                        borderColor: 'transparent',
                        backgroundColor: 'transparent',
                        color: value.length > 0 ? 'inherit' : 'transparent',
                    }}
                >
                    {renderHighlightedText(value)}
                </div>

                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleInput}
                    onScroll={handleScroll}
                    onKeyDown={(e) => mentionKeyDown(e, onSelect)}
                    className={cn("w-full resize-none bg-transparent outline-none relative z-10", className)}
                    {...props}
                    style={{
                        ...props.style,
                        color: value.length > 0 ? 'transparent' : 'inherit',
                        caretColor: 'var(--foreground, currentColor)',
                    }}
                />
            </div>
        </div>
    );
};
