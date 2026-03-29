"use client";

import React, { useRef, useState, useEffect } from 'react';
import { searchUsers, UserMention } from '@/services/api/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { searchHashtags, HashtagSuggestion } from '@/services/api/hashtags';

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onMentionSelect?: (user: UserMention) => void;
    placeholder?: string;
    className?: string;
}

export const MentionTextarea = ({ value, onChange, onMentionSelect, className, ...props }: MentionTextareaProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [query, setQuery] = useState('');
    const [mode, setMode] = useState<'mention' | 'hashtag' | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
    const [users, setUsers] = useState<UserMention[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        let isMounted = true;
        const abortController = new AbortController();

        const fetchData = async () => {
            if (!debouncedQuery || !mode) {
                setUsers([]);
                setHashtags([]);
                return;
            }

            setIsLoading(true);
            try {
                if (mode === 'mention') {
                    const results = await searchUsers(debouncedQuery);
                    if (isMounted) {
                        setUsers(results);
                        setActiveIndex(0);
                    }
                } else if (mode === 'hashtag') {
                    const results = await searchHashtags(debouncedQuery, abortController.signal);
                    if (isMounted) {
                        setHashtags(results.tags);
                        setActiveIndex(0);
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
    }, [debouncedQuery, mode]);

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
            const injected = `@${user.full_name} `;
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
                <div className="absolute z-50 w-64 mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
                    style={{ bottom: '100%', left: 0, marginBottom: '8px' }}
                >
                    <div className="p-1 max-h-[200px] overflow-y-auto">
                        {mode === 'mention' && users.map((user, index) => (
                            <button
                                key={user.id}
                                onClick={() => selectUser(user)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-sm select-none outline-none transition-colors",
                                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/80"
                                )}
                            >
                                <Avatar className="h-8 w-8 border border-border/50">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start overflow-hidden text-left">
                                    <span className="font-medium truncate">{user.full_name}</span>
                                    <span className="text-xs text-muted-foreground truncate">@{user.account_name}</span>
                                </div>
                            </button>
                        ))}

                        {mode === 'hashtag' && hashtags.map((h, index) => (
                            <button
                                key={h.tag}
                                onClick={() => selectHashtag(h)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded-sm select-none outline-none transition-colors",
                                    index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted/80"
                                )}
                            >
                                <span className="font-medium text-primary">#{h.tag}</span>
                                <span className="text-xs text-muted-foreground">{h.usage_count} posts</span>
                            </button>
                        ))}

                        {isLoading && (
                            <div className="px-3 py-2 text-xs text-muted-foreground animate-pulse">
                                Searching...
                            </div>
                        )}
                        
                        {!isLoading && ((mode === 'mention' && users.length === 0) || (mode === 'hashtag' && hashtags.length === 0)) && (
                            <div className="px-3 py-2 text-xs text-muted-foreground italic">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
