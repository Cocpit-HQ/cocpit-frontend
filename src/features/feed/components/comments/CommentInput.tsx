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
    editingComment?: {
        id: string | number;
        text: string;
    } | null;
    onCancelEdit?: () => void;
    currentUserAvatar?: string;
    className?: string;
    autoFocus?: boolean;
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"];

export default function CommentInput({
    onAddComment,
    replyingTo,
    onCancelReply,
    editingComment,
    onCancelEdit,
    currentUserAvatar = "/assets/pngegg.png",
    className = "",
    autoFocus = false,
}: CommentInputProps) {
    const [commentText, setCommentText] = useState('');
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

    // Focus when replying or editing
    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
            // Automatically add reply mention if not present
            const mentionHandle = replyingTo.account_name || replyingTo.name.replace(/\s+/g, '_').toLowerCase();
            const mention = `@${mentionHandle} `;
            if (!commentText.startsWith(mention)) {
                setCommentText(prev => mention + prev);
            }
        }
        if (editingComment && textareaRef.current) {
            setCommentText(editingComment.text);
            textareaRef.current.focus();
            // Trigger auto-resize
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
        }
    }, [replyingTo, editingComment]);

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
        setCommentText(value);

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
        const textBeforeCursor = commentText.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        const textAfterCursor = commentText.substring(cursorPos);
        const mentionText = `@${user.account_name || user.full_name.replace(/\s+/g, '_').toLowerCase()} `;

        const newText = commentText.substring(0, lastAtIndex) + mentionText + textAfterCursor;
        setCommentText(newText);
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
        if (!commentText.trim()) return;

        onAddComment(commentText.trim());
        setCommentText('');
        setShowEmojiPicker(false);
        setMentionQuery('');
        setShowMentionDropdown(false);
        onCancelReply?.();
        onCancelEdit?.();

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
        const newText = commentText.substring(0, start) + emoji + commentText.substring(end);

        setCommentText(newText);

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
        <div className={`bg-card font-poppins ${className}`}>
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

            {/* Edit Context Bar */}
            {editingComment && (
                <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-t border-x border-primary/20 rounded-t-lg mx-0.5 text-sm">
                    <span className="text-primary font-medium">
                        Editing comment
                    </span>
                    <button
                        onClick={onCancelEdit}
                        className="p-1 hover:bg-primary/10 rounded-full transition-colors text-primary"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="flex flex-row items-end p-0 gap-[8px] w-[524px] max-w-full min-h-[56px] h-auto flex-none order-4 flex-grow-0">
                <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex-shrink-0 flex-none order-0 flex-grow-0 bg-[#D9D9D9] mb-[8px]">
                    <img src={currentUserAvatar} alt="User" className="w-full h-full object-cover" />
                </div>

                <div className={`box-border flex flex-row items-end py-[16px] px-[16px] gap-[8px] w-[476px] min-h-[56px] h-auto bg-white border border-[#E0E7FF] ${replyingTo ? 'rounded-b-[24px] border-t-0' : 'rounded-[24px]'} flex-none order-1 flex-grow focus-within:ring-1 focus-within:ring-primary/50 focus-within:border-primary transition-all relative`}>
                    <div className="flex-1 relative flex items-end h-auto min-h-[24px]">
                        <textarea
                            ref={textareaRef}
                            value={commentText}
                            onChange={(e) => {
                                handleTextChange(e);
                                setCommentText(e.target.value);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={editingComment ? "Edit your comment..." : replyingTo ? `Reply to ${replyingTo.name}...` : "Write your thoughts"}
                            className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none text-sm sm:text-base placeholder:text-muted-foreground/60 scrollbar-hide focus:outline-none font-poppins leading-[24px]"
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

                    <div className="flex items-center gap-[24px] flex-none">
                        <button
                            ref={buttonRef}
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors flex-none order-0 flex-grow-0"
                        >
                            <Smile className="w-6 h-6" />
                        </button>
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!commentText.trim()}
                            className={`w-6 h-6 flex items-center justify-center transition-all flex-none order-0 flex-grow-0
                                ${commentText.trim().length > 0
                                    ? 'text-[#6366F1] hover:text-[#6366F1]/80'
                                    : 'text-muted-foreground/40 cursor-not-allowed'
                                }`}
                        >
                            <Send className="w-6 h-6" />
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
        </div>
    );
}
