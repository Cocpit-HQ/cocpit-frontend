"use client";

import React, { useRef, useState, useEffect } from 'react';
import { searchUsers, UserMention } from '@/services/api/users';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onMentionSelect?: (user: UserMention) => void;
    placeholder?: string;
    className?: string;
}

export const MentionTextarea = ({ value, onChange, onMentionSelect, className, ...props }: MentionTextareaProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [users, setUsers] = useState<UserMention[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const debouncedQuery = useDebounce(mentionQuery, 300);

    useEffect(() => {
        if (debouncedQuery) {
            searchUsers(debouncedQuery).then(results => {
                setUsers(results);
                setActiveIndex(0);
            });
        } else {
            setUsers([]);
        }
    }, [debouncedQuery]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e);

        const cursor = e.target.selectionStart;
        const text = e.target.value;
        const lastAt = text.lastIndexOf('@', cursor - 1);

        if (lastAt !== -1) {
            const query = text.substring(lastAt + 1, cursor);
            if (!/\s/.test(query)) { // If no space, it's a potential mention
                setMentionQuery(query);
                setShowMentions(true);

                // Calculate position (approximation)
                // A real robust library would use getBoundingClientRect of a mirror div
                // For simplicity, we just anchor it near the cursor or bottom-left of textarea for now if we can't easily get cursor coordinates
                // Better approach: Floating absolute position relative to textarea container

                // For MVP, detailed cursor tracking is complex. 
                // We will position it at the bottom of the textarea or follow a simple logic.
                // Let's try to get coordinates.
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentions && users.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % users.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev - 1 + users.length) % users.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectUser(users[activeIndex]);
            } else if (e.key === 'Escape') {
                setShowMentions(false);
            }
        }
    };

    const selectUser = (user: UserMention) => {
        const cursor = textareaRef.current?.selectionStart || 0;
        const lastAt = value.lastIndexOf('@', cursor - 1);
        const prefix = value.substring(0, lastAt);
        const suffix = value.substring(cursor);

        // Insert name
        const newValue = `${prefix}@${user.full_name} ${suffix}`;

        // Create synthetic event
        const event = {
            target: { value: newValue }
        } as React.ChangeEvent<HTMLTextAreaElement>;

        onChange(event);
        setShowMentions(false);
        if (onMentionSelect) onMentionSelect(user);

        // Reset focus
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                // textareaRef.current.setSelectionRange... (optional correction)
            }
        }, 0);
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

            {showMentions && users.length > 0 && (
                <div className="absolute z-50 w-64 mt-1 bg-popover text-popover-foreground border rounded-md shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200"
                    style={{ bottom: '100%', left: 0, marginBottom: '8px' }}
                >
                    <div className="p-1 max-h-[200px] overflow-y-auto">
                        {users.map((user, index) => (
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
                    </div>
                </div>
            )}
        </div>
    );
};
