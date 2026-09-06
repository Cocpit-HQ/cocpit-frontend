import React, { useState, useRef, useEffect } from 'react';
import { Smile, X, Send } from 'lucide-react';
import { searchUsers, UserMention } from '@/services/api/users';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { parseMentionsForFrontend, formatMentionsForBackend } from '@/lib/mentions';
import { EmojiPickerPortal, EmojiPickerPosition } from '@/shared/commonComponents/EmojiPickerPortal';

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
    variant?: 'default' | 'reply';
}

export default function CommentInput({
    onAddComment,
    replyingTo,
    onCancelReply,
    editingComment,
    onCancelEdit,
    currentUserAvatar = "/assets/pngegg.png",
    className = "",
    autoFocus = false,
    variant = 'default',
}: CommentInputProps) {
    const { activeProfile } = useActiveProfile();
    const [commentText, setCommentText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerPos, setEmojiPickerPos] = useState<EmojiPickerPosition | null>(null);
    const [mentions, setMentions] = useState<UserMention[]>([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const [inlineMentions, setInlineMentions] = useState<UserMention[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const mentionDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    // Focus when replying or editing
    useEffect(() => {
        // ORIGINAL: if (replyingTo && textareaRef.current) {
        if (replyingTo && textareaRef.current && variant !== 'reply') {
            textareaRef.current.focus();
            // Automatically add reply mention if not already there
            const mentionHandle = replyingTo.account_name || replyingTo.name.replace(/\s+/g, '_').toLowerCase();
            const mention = `@${mentionHandle} `;
            if (!commentText.startsWith(mention)) {
                setCommentText(prev => mention + prev);
            }
        }
        if (editingComment && textareaRef.current) {
            const parsed = parseMentionsForFrontend(editingComment.text);
            setCommentText(parsed.content);
            setInlineMentions(parsed.inlineMentions);
            textareaRef.current.focus();
            // Trigger auto-resize
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 128)}px`;
        }
    }, [replyingTo, editingComment, variant]);

    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (mentionQuery.length >= 1) {
                try {
                    const results = await searchUsers(mentionQuery);
                    setMentions(results);
                    setShowMentionDropdown(results.length > 0);
                    setMentionIndex(0);
                } catch (error) {
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

        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

        const textBeforeCursor = value.substring(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const query = textBeforeCursor.substring(lastAtIndex + 1);
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
        const mentionText = `\u200B${user.full_name} `;

        const newText = commentText.substring(0, lastAtIndex) + mentionText + textAfterCursor;
        setCommentText(newText);
        setMentionQuery('');
        setShowMentionDropdown(false);
        setInlineMentions(prev => [...prev, user]);

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

        const finalContent = formatMentionsForBackend(commentText, inlineMentions);

        onAddComment(finalContent.trim());
        setCommentText('');
        setShowEmojiPicker(false);
        setEmojiPickerPos(null);
        setMentionQuery('');
        setShowMentionDropdown(false);
        setInlineMentions([]);
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

    const handleToggleEmojiPicker = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (showEmojiPicker) {
            setShowEmojiPicker(false);
            setEmojiPickerPos(null);
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const pickerH = 340;
        const pickerW = 310;

        let top = rect.top - pickerH - 8;
        if (top < 10) {
            top = rect.bottom + 8;
            if (top + pickerH > window.innerHeight - 10) {
                top = Math.max(10, window.innerHeight - pickerH - 10);
            }
        }

        let left = rect.right - pickerW;
        if (left < 10) left = 10;
        if (left + pickerW > window.innerWidth - 10) {
            left = window.innerWidth - pickerW - 10;
        }

        setEmojiPickerPos({ top, left });
        setShowEmojiPicker(true);
    };

    const handleEmojiSelect = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setCommentText(prev => prev + emoji);
        } else {
            const start = textarea.selectionStart ?? commentText.length;
            const end = textarea.selectionEnd ?? commentText.length;
            const newText = commentText.substring(0, start) + emoji + commentText.substring(end);
            setCommentText(newText);

            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;

            requestAnimationFrame(() => {
                textarea.focus();
                const nextCursor = start + emoji.length;
                textarea.selectionStart = textarea.selectionEnd = nextCursor;
            });
        }
    };

    useEffect(() => {
        const handleScrollOrResize = () => {
            if (showEmojiPicker) {
                setShowEmojiPicker(false);
                setEmojiPickerPos(null);
            }
        };
        if (showEmojiPicker) {
            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
        }
        return () => {
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [showEmojiPicker]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(event.target as Node)) {
                setShowMentionDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderMentionsDropdown = () => (
        showMentionDropdown && (
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
                            <div className="relative w-8 h-8 rounded-full bg-ds-surface-1 text-ds-text-secondary flex items-center justify-center font-semibold text-xs overflow-hidden flex-shrink-0 select-none">
                                <span>{(user.full_name || 'U').charAt(0).toUpperCase()}</span>
                                {user.avatar_url && user.avatar_url !== '/assets/pngegg.png' ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.full_name}
                                        className="absolute inset-0 w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : null}
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                                <span className="ds-text-secondary-1 truncate w-full">{user.full_name}</span>
                                <span className="ds-text-meta text-ds-text-muted truncate w-full">@{user.account_name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        )
    );



    return (
        <div className={`bg-transparent font-dmsans ${className}`}>
            {replyingTo && variant !== 'reply' && (
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


            {variant === 'default' ? (
                /* ORIGINAL COMMENT INPUT CONTAINER:
                <div className="flex items-center gap-2 p-2 border border-border rounded-lg bg-background relative focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <textarea className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none text-sm text-foreground placeholder:text-muted-foreground" />
                    <div className="flex items-center gap-[24px] flex-none">
                        <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors flex-none order-0 flex-grow-0">
                            <Smile className="w-6 h-6" />
                        </button>
                        <button onClick={() => handleSubmit()} disabled={!commentText.trim()} className="w-6 h-6 flex items-center justify-center transition-all flex-none order-0 flex-grow-0 text-[#6366F1]">
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                */
                <div className={`box-border w-full min-h-[42px] border border-ds-border bg-transparent ${replyingTo && !editingComment ? 'rounded-b-[16px] border-t-0' : 'rounded-[16px]'} transition-all duration-300 relative`}>



                    <div className="flex flex-col p-[10px] w-full">
                        <div className="relative w-full min-h-[20px] flex items-center">
                            <textarea
                                ref={textareaRef}
                                value={commentText}
                                onChange={(e) => {
                                    handleTextChange(e);
                                    setCommentText(e.target.value);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={editingComment ? "Edit your comment..." : replyingTo ? `Reply to ${replyingTo.name}...` : "Write your thoughts"}
                                className={`w-full bg-transparent border-none focus:ring-0 p-0 resize-none ds-text-small text-ds-text-primary placeholder-ds-text-muted scrollbar-hide focus:outline-none transition-all duration-300 ${commentText.length > 0 ? 'pr-0' : 'pr-[30px]'}`}
                                rows={1}
                                style={{ height: 'auto', minHeight: '20px' }}
                            />
                            {renderMentionsDropdown()}
                        </div>
                        {/* Spacer for buttons when typing */}
                        <div className={`w-full transition-all duration-300 ease-in-out ${commentText.length > 0 ? 'h-[32px] mt-2' : 'h-0 mt-0'}`} />
                    </div>

                    {/* Emoji Button */}
                    <div
                        className={`absolute flex items-center transition-all duration-300 ease-in-out z-10`}
                        style={{
                            left: commentText.length > 0 ? '10px' : 'calc(100% - 30px)',
                            bottom: commentText.length > 0 ? '13px' : 'calc(50% - 10px)',
                        }}
                    >
                        <button
                            ref={buttonRef}
                            type="button"
                            aria-label="Insert emoji"
                            onClick={handleToggleEmojiPicker}
                            className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-white transition-colors bg-transparent"
                        >
                            <Smile className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Comment Button */}
                    <div
                        className={`absolute bottom-[10px] right-[10px] transition-all duration-300 ease-in-out z-10
                            ${commentText.trim().length > 0
                                ? 'opacity-100 translate-y-0 pointer-events-auto'
                                : 'opacity-0 translate-y-4 pointer-events-none'
                            }`}
                    >
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!commentText.trim()}
                            className={`px-4 py-1.5 rounded-[100px] font-dm-sans font-medium text-[14px] transition-all flex items-center justify-center shadow-sm
                                ${commentText.trim().length > 0
                                    ? 'bg-ds-accent text-ds-bg hover:opacity-80'
                                    : 'bg-ds-border text-ds-text-muted cursor-not-allowed'
                                }`}
                        >
                            Comment
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-row items-start gap-[8px] w-full mt-2 relative">
                    <div className="w-[24px] h-[24px] rounded-full bg-ds-surface-1 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {currentUserAvatar && currentUserAvatar !== '/assets/pngegg.png' ? (
                            <img src={currentUserAvatar} alt="User avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs font-semibold text-ds-text-secondary">{(activeProfile?.name || 'U').charAt(0).toUpperCase()}</span>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col items-start p-[10px] gap-[10px] border border-ds-border rounded-[16px] bg-transparent transition-all relative">
                        <div className="font-dm-sans font-semibold text-[12px] text-ds-text-primary w-full flex justify-between">
                            <span>{activeProfile?.name || 'You'}</span>
                            {onCancelReply && (
                                <button aria-label="Cancel reply" onClick={onCancelReply} className="text-ds-text-muted hover:text-ds-text-primary">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        
                        <div className="w-full relative flex-1 min-h-[16px]">
                            <textarea
                                ref={textareaRef}
                                value={commentText}
                                onChange={(e) => {
                                    handleTextChange(e);
                                    setCommentText(e.target.value);
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Write your thoughts"
                                className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none ds-text-small text-ds-text-primary placeholder-ds-text-muted scrollbar-hide focus:outline-none"
                                rows={1}
                                style={{ height: 'auto', minHeight: '16px' }}
                            />
                            {renderMentionsDropdown()}
                        </div>

                        <div className="flex flex-row justify-between items-center w-full mt-1">
                            <div className="relative flex items-center">
                                <button
                                    ref={buttonRef}
                                    type="button"
                                    aria-label="Insert emoji"
                                    onClick={handleToggleEmojiPicker}
                                    className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-white transition-colors"
                                >
                                    <Smile className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={() => handleSubmit()}
                                disabled={!commentText.trim()}
                                className={`px-3 py-1.5 rounded-[100px] font-dm-sans font-medium text-[12px] transition-all flex items-center justify-center
                                    ${commentText.trim().length > 0
                                        ? 'bg-ds-accent text-ds-bg hover:opacity-80'
                                        : 'bg-ds-border text-ds-text-muted cursor-not-allowed'
                                    }`}
                            >
                                Comment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <EmojiPickerPortal
                isOpen={showEmojiPicker}
                position={emojiPickerPos}
                onClose={() => {
                    setShowEmojiPicker(false);
                    setEmojiPickerPos(null);
                }}
                onEmojiSelect={handleEmojiSelect}
                zIndex={200}
            />
        </div>
    );
}
