import React, { useState, useRef, useEffect } from 'react';
import { Smile, X, Send } from 'lucide-react';
import { searchUsers, UserMention } from '@/services/api/users';

interface CommentInputProps {
    onAddComment: (text: string) => void;
    replyingTo?: {
        name: string;
        id: string | number;
        account_name?: string;
    } | null;
    onCancelReply?: () => void;
    currentUserAvatar?: string;
    className?: string;
    autoFocus?: boolean;
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"];

export default function CommentInput({
    onAddComment,
    replyingTo,
    onCancelReply,
    currentUserAvatar = "/assets/pngegg.png",
    className = "",
    autoFocus = false,
}: CommentInputProps) {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [mentions, setMentions] = useState<UserMention[]>([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const mentionDropdownRef = useRef<HTMLDivElement>(null);

    // Focus management
    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    // Focus when replying
    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
            // Automatically add reply mention if not present
            // Prioritize account_name as requested. If missing, use name but replace spaces.
            const mentionHandle = replyingTo.account_name || replyingTo.name.replace(/\s+/g, '_').toLowerCase();
            const mention = `@${mentionHandle} `;
            if (!text.startsWith(mention)) {
                setText(prev => mention + prev);
            }
        }
    }, [replyingTo]);

    // Handle user search for mentions
    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (mentionQuery.length >= 1) {
                try {
                    const results = await searchUsers(mentionQuery);
                    setMentions(results);
                    setShowMentionDropdown(results.length > 0);
                    setMentionIndex(0);
                } catch (error) {
                    console.error("Mention search failed", error);
                    setMentions([]);
                    setShowMentionDropdown(false);
                }
            } else {
                setMentions([]);
                setShowMentionDropdown(false);
            }
        }, 300);

        return () => clearTimeout(searchTimer);
    }, [mentionQuery]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const cursorPos = e.target.selectionStart;
        setText(value);

        // Auto-resize logic
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

        // Check for @ mention trigger
        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const query = textBeforeCursor.substring(lastAtIndex + 1);
            // If query contains space or newline, it's not a mention query anymore
            if (!query.match(/\s/)) {
                setMentionQuery(query);
            } else {
                setMentionQuery('');
                setShowMentionDropdown(false);
            }
        } else {
            setMentionQuery('');
            setShowMentionDropdown(false);
        }
    };

    const insertMention = (user: UserMention) => {
        if (!textareaRef.current) return;
        const cursorPos = textareaRef.current.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        const textAfterCursor = text.substring(cursorPos);
        const mentionText = `@${user.account_name || user.full_name.replace(/\s+/g, '_').toLowerCase()} `;

        const newText = text.substring(0, lastAtIndex) + mentionText + textAfterCursor;
        setText(newText);
        setMentionQuery('');
        setShowMentionDropdown(false);

        // Set cursor focus back to textarea after state update
        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = lastAtIndex + mentionText.length;
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
                textareaRef.current.focus();
            }
        }, 0);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!text.trim()) return;

        onAddComment(text.trim());
        setText('');
        setShowEmojiPicker(false);
        setMentionQuery('');
        setShowMentionDropdown(false);
        onCancelReply?.();

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentionDropdown) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => (prev + 1) % mentions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + mentions.length) % mentions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(mentions[mentionIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentionDropdown(false);
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = text.substring(0, start) + emoji + text.substring(end);

        setText(newText);

        // Restore cursor position
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }, 0);
        setShowEmojiPicker(false);
    };

    // Click outside hooks
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
            if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(event.target as Node)) {
                setShowMentionDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`bg-card ${className}`}>
            {/* Reply Context Bar */}
            {replyingTo && (
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-t border-x border-border rounded-t-lg mx-0.5 text-sm">
                    <span className="text-muted-foreground">
                        Replying to <span className="font-semibold text-primary">@{replyingTo.account_name || replyingTo.name}</span>
                    </span>
                    <button
                        onClick={onCancelReply}
                        className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className={`relative flex items-end gap-2 p-1 sm:p-2 border border-border bg-muted/20 ${replyingTo ? 'rounded-b-xl border-t-0' : 'rounded-xl'} focus-within:ring-1 focus-within:ring-primary/50 transition-all`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 overflow-hidden flex-shrink-0 mb-1 hidden sm:block">
                    <img src={currentUserAvatar} alt="User" className="w-full h-full object-cover" />
                </div>

                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Add a comment..."}
                        className="w-full bg-transparent border-none focus:ring-0 p-1.5 sm:p-2 min-h-[36px] max-h-32 resize-none text-sm sm:text-base placeholder:text-muted-foreground/60 scrollbar-hide focus:outline-none"
                        rows={1}
                        style={{ height: 'auto' }}
                    />

                    {/* Mention Autocomplete Dropdown */}
                    {showMentionDropdown && (
                        <div
                            ref={mentionDropdownRef}
                            className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden pointer-events-auto"
                        >
                            <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                                {mentions.map((user, index) => (
                                    <button
                                        key={user.id}
                                        onClick={() => insertMention(user)}
                                        onMouseEnter={() => setMentionIndex(index)}
                                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${index === mentionIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                            <img src={user.avatar_url || '/assets/pngegg.png'} alt={user.full_name} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-sm font-semibold truncate w-full">{user.full_name}</span>
                                            <span className="text-[10px] text-muted-foreground truncate w-full">@{user.account_name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1 mb-1">
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-muted"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!text.trim()}
                        className="p-2 text-primary hover:text-primary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                    <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 z-50 shadow-xl rounded-xl overflow-hidden bg-popover border border-border w-72">
                        <div className="p-2 grid grid-cols-7 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {EMOJI_LIST.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => insertEmoji(emoji)}
                                    className="p-2 hover:bg-muted rounded-md text-xl transition-colors flex items-center justify-center leading-none"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
