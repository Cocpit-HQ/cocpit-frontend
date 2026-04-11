"use client";

import React, { useRef, useState, useEffect } from 'react';
import { searchUsers, UserMention } from '@/services/api/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { searchHashtags, getTrendingHashtags, HashtagSuggestion } from '@/services/api/hashtags';

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
    
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<'mention' | 'hashtag' | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [users, setUsers] = useState<UserMention[]>([]);
    const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        const fetchData = async () => {
            if (!mode) {
                setUsers([]);
                setHashtags([]);
                return;
            }

            setIsLoading(true);
            try {
                if (mode === 'mention') {
                    // For mentions: use custom searchUsersFn if provided (e.g. group members)
                    // For global search, skip empty queries (no point searching all users)
                    if (searchUsersFn) {
                        const results = await searchUsersFn(debouncedQuery);
                        if (isMounted) {
                            setUsers(results || []);
                            setActiveIndex(0);
                        }
                    } else if (debouncedQuery) {
                        const results = await searchUsers(debouncedQuery);
                        if (isMounted) {
                            setUsers(results || []);
                            setActiveIndex(0);
                        }
                    }
                } else if (mode === 'hashtag') {
                    // For hashtags: empty query → trending, keyword → ranked search
                    if (debouncedQuery) {
                        // Ranked search with Instagram-style scoring from backend
                        const results = await searchHashtags(debouncedQuery, abortController.signal);
                        if (isMounted) {
                            setHashtags(results.tags || []);
                            setActiveIndex(0);
                        }
                    } else {
                        // Just typed '#' → show trending hashtags
                        const trending = await getTrendingHashtags();
                        if (isMounted) {
                            setHashtags(trending || []);
                            setActiveIndex(0);
                        }
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') console.error('Search failed', err);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
            abortController.abort();
        };
    }, [debouncedQuery, mode, searchUsersFn]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e);

        const cursor = e.target.selectionStart;
        const text = e.target.value;
        const textBeforeCursor = text.substring(0, cursor);

        const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
        const hashtagMatch = textBeforeCursor.match(/#([a-zA-Z0-9_]*)$/);

        if (mentionMatch) {
            setQuery(mentionMatch[1]);
            setMode('mention');
            setShowSuggestions(true);
        } else if (hashtagMatch) {
            setQuery(hashtagMatch[1]);
            setMode('hashtag');
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setMode(null);
            setQuery('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const itemsCount = mode === 'mention' ? users.length : hashtags.length;
        
        if (showSuggestions && itemsCount > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % itemsCount);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + itemsCount) % itemsCount);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                if (mode === 'mention') {
                    selectUser(users[activeIndex]);
                } else {
                    selectHashtag(hashtags[activeIndex]);
                }
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const selectUser = (user: UserMention) => {
        const el = textareaRef.current;
        if (!el) return;

        const cursor = el.selectionStart;
        const textBefore = value.substring(0, cursor);
        const textAfter = value.substring(cursor);
        
        const match = textBefore.match(/@([a-zA-Z0-9_]*)$/);
        if (match) {
            const baseLeft = textBefore.substring(0, match.index);
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

        // Duplicate prevention using regex boundary
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

    // Helper for matching text highlighting
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
                onKeyDown={handleKeyDown}
                className={cn("w-full resize-none bg-transparent outline-none", className)}
                {...props}
            />

            {showSuggestions && (
                <div className="absolute z-50 w-64 bg-popover text-popover-foreground border rounded-md shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
                    style={{ bottom: '100%', left: 0, marginBottom: '12px' }}
                >
                    <div className="p-1 max-h-[240px] overflow-y-auto custom-scrollbar">
                        {mode === 'mention' && users.map((user, index) => (
                            <button
                                key={user.id}
                                onClick={() => selectUser(user)}
                                onMouseEnter={() => setActiveIndex(index)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-sm transition-colors text-left",
                                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/80"
                                )}
                            >
                                <Avatar className="h-8 w-8 border border-border/50">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="font-medium truncate w-full">{highlightMatch(user.full_name, query)}</span>
                                    <span className="text-xs text-muted-foreground truncate w-full">@{highlightMatch(user.account_name, query)}</span>
                                </div>
                            </button>
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
                        
                        {!isLoading && showSuggestions && ((mode === 'mention' && users.length === 0) || (mode === 'hashtag' && hashtags.length === 0)) && debouncedQuery && (
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
