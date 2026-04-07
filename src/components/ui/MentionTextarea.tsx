"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { searchUsers, UserMention } from '@/services/api/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { searchHashtags, HashtagSuggestion } from '@/services/api/hashtags';

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
    
    // State - Aligning with CommentInput logic
    const [query, setQuery] = useState('');
    const [trigger, setTrigger] = useState<'@' | '#' | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [users, setUsers] = useState<UserMention[]>([]);
    const [hashtags, setHashtags] = useState<HashtagSuggestion[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const debouncedQuery = useDebounce(query, 300);

    // Fetch data based on the active trigger
    const fetchData = useCallback(async () => {
        if (!trigger) {
            setUsers([]);
            setHashtags([]);
            setHasSearched(false);
            return;
        }

        setIsLoading(true);
        try {
            if (trigger === '@') {
                const results = searchUsersFn ? await searchUsersFn(debouncedQuery) : await searchUsers(debouncedQuery);
                setUsers(results || []);
            } else if (trigger === '#') {
                const results = await searchHashtags(debouncedQuery);
                setHashtags(results?.tags || []);
            }
            setActiveIndex(0);
            setHasSearched(true);
        } catch (err) {
            console.error('Mention search failed', err);
            setUsers([]);
            setHashtags([]);
            setHasSearched(true);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedQuery, trigger, searchUsersFn]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle detection - Copied pattern from working CommentInput.tsx
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const cursorPos = e.target.selectionStart;
        
        // Let parent update its state
        onChange(e);

        // Logic from CommentInput: identify last trigger before cursor
        const textBeforeCursor = val.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        const lastHashIndex = textBeforeCursor.lastIndexOf('#');
        
        const lastTriggerIndex = Math.max(lastAtIndex, lastHashIndex);
        const activeTrigger = lastTriggerIndex === lastAtIndex ? '@' : '#';

        if (lastTriggerIndex !== -1) {
            const queryAfterTrigger = textBeforeCursor.substring(lastTriggerIndex + 1);
            
            // Criteria for valid mention:
            // 1. No spaces in query
            // 2. Trigger is at start OR preceded by a space
            const isAtStartOrAfterSpace = lastTriggerIndex === 0 || /\s/.test(textBeforeCursor[lastTriggerIndex - 1]);
            
            if (!queryAfterTrigger.match(/\s/) && isAtStartOrAfterSpace) {
                setQuery(queryAfterTrigger);
                setTrigger(activeTrigger as '@' | '#');
                setShowSuggestions(true);
            } else {
                setShowSuggestions(false);
                setTrigger(null);
            }
        } else {
            setShowSuggestions(false);
            setTrigger(null);
        }
    };

    const insertMention = (item: any) => {
        if (!textareaRef.current) return;
        const cursorPos = textareaRef.current.selectionStart;
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastTriggerIndex = textBeforeCursor.lastIndexOf(trigger || '@');

        const textAfterCursor = value.substring(cursorPos);
        const handle = item.account_name || (item.tag || item.full_name || '').replace(/\s+/g, '_').toLowerCase();
        const insertion = `${trigger || '@'}${handle} `;

        const newValue = value.substring(0, lastTriggerIndex) + insertion + textAfterCursor;
        
        // Manually trigger onChange for the parent
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        nativeInputValueSetter?.call(textareaRef.current, newValue);
        
        const event = new Event('input', { bubbles: true });
        textareaRef.current.dispatchEvent(event);

        setShowSuggestions(false);
        setTrigger(null);

        // Reset cursor focus
        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = lastTriggerIndex + insertion.length;
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const itemsCount = trigger === '@' ? users.length : hashtags.length;
        
        if (showSuggestions && itemsCount > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % itemsCount);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + itemsCount) % itemsCount);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selectedItem = trigger === '@' ? users[activeIndex] : hashtags[activeIndex];
                insertMention(selectedItem);
                if (trigger === '@' && onMentionSelect) onMentionSelect(selectedItem as UserMention);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
                setTrigger(null);
            }
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
                        {trigger === '@' && users.map((user, index) => (
                            <button
                                key={user.id}
                                onClick={() => insertMention(user)}
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

                        {trigger === '#' && hashtags.map((h, index) => (
                            <button
                                key={h.tag}
                                onClick={() => insertMention(h)}
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
                        
                        {!isLoading && hasSearched && ((trigger === '@' && users.length === 0) || (trigger === '#' && hashtags.length === 0)) && (
                            <div className="px-3 py-3 text-xs text-muted-foreground italic text-center">
                                No results found (0 members found)
                            </div>
                        )}
                        
                        {process.env.NODE_ENV === 'development' && users.length > 0 && (
                            <div className="px-3 py-1 text-[8px] text-muted-foreground opacity-30 text-center border-t border-border/20">
                                Verified Trace: {users.length} results
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
