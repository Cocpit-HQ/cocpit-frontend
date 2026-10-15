import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Smile, X, Send } from 'lucide-react';
import { UserIcon, BusinessBuildingIcon } from '@/components/icons';
import { searchUsers, UserMention } from '@/services/api/users';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { formatMentionsForBackend } from '@/lib/mentions';
import { MentionTextarea } from '@/shared/commonComponents/MentionTextarea';
import { EmojiPickerPortal, EmojiPickerPosition } from '@/shared/commonComponents/EmojiPickerPortal';
import { toast } from '@/shared/commonComponents/GlobalToast';

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
    isDrawer?: boolean;
    hideCancelButton?: boolean;
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
    isDrawer = false,
    hideCancelButton = false,
}: CommentInputProps) {
    const { activeProfile, isCompany } = useActiveProfile();
    const isCompanyActor = Boolean(isCompany || activeProfile?.type === 'COMPANY');
    const [commentText, setCommentText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiPickerPos, setEmojiPickerPos] = useState<EmojiPickerPosition | null>(null);
    const [inlineMentions, setInlineMentions] = useState<UserMention[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    // Focus when replying or editing
    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
            // User requested to NOT show the name in the input box, 
            // so we handle mention injection in handleSubmit instead.
        }
        if (editingComment && textareaRef.current) {
            setCommentText(editingComment.text);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 60);
        }
    }, [replyingTo, editingComment, variant]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCommentText(e.target.value);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!commentText.trim()) return;

        let finalContent = formatMentionsForBackend(commentText, inlineMentions);

        if (replyingTo) {
            const mentionStr = `@[${replyingTo.name}](${replyingTo.account_name || replyingTo.name.replace(/\s+/g, '_').toLowerCase()})`;
            if (!finalContent.includes(mentionStr)) {
                finalContent = `${mentionStr} ${finalContent}`;
            }
        }

        if (commentText.length > 1000) {
            toast.error("Comment should be less than 1000 characters");
            return;
        }

        onAddComment(finalContent.trim());
        setCommentText('');
        setShowEmojiPicker(false);
        setEmojiPickerPos(null);

        setInlineMentions([]);
        onCancelReply?.();
        onCancelEdit?.();

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // On mobile/touch devices or inside mobile drawer, Enter key should insert a newline rather than submitting
        const isMobileDevice = isDrawer || (typeof window !== 'undefined' && (
            window.innerWidth < 768 || 
            'ontouchstart' in window || 
            navigator.maxTouchPoints > 0
        ));

        if (isMobileDevice) {
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
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
            if (commentText.length + emoji.length <= 1000) {
                setCommentText(prev => prev + emoji);
            }
        } else {
            const start = textarea.selectionStart ?? commentText.length;
            const end = textarea.selectionEnd ?? commentText.length;

            if (commentText.length - (end - start) + emoji.length > 1000) {
                return;
            }

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
        const handleScrollOrResize = (e: Event) => {
            if (showEmojiPicker) {
                // Don't close if scrolling inside the emoji picker
                const target = e.target as HTMLElement;
                if (target?.closest?.('.cocpit-emoji-picker') || target?.closest?.('.cocpit-emoji-picker-backdrop')) {
                    return;
                }
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

    return (
        <div className={`bg-transparent font-dmsans ${className}`}>
            {editingComment ? (
                <div className="flex flex-col gap-2 w-full mt-2 relative">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ds-text-primary">
                            Editing Comment
                        </span>
                        {onCancelEdit && (
                            <button
                                type="button"
                                aria-label="Cancel edit"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTimeout(() => {
                                        setCommentText('');
                                        setInlineMentions([]);
                                        onCancelEdit();
                                    }, 0);
                                }}
                                className="text-ds-text-muted hover:text-ds-accent transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="w-full border border-ds-border rounded-[16px] p-3 bg-ds-surface-1 focus-within:border-ds-text-secondary transition-all flex flex-col justify-between gap-2 relative">
                        <div className="flex flex-col items-start w-full min-w-0">
                            <MentionTextarea
                                ref={textareaRef as any}
                                value={commentText}
                                onChange={(e: any) => handleTextChange(e)}
                                onMentionsChange={setInlineMentions}
                                searchUsersFn={searchUsers}
                                onKeyDown={handleKeyDown}
                                placeholder="Edit your comment..."
                                className="w-full bg-transparent border-none focus:ring-0 p-0 m-0 resize-none text-[14px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none leading-[20px] scrollbar-hide min-h-[48px] max-h-[160px]"
                                rows={2}
                                maxLength={1000}
                            />
                        </div>

                        <div className="flex items-center justify-between w-full mt-auto pt-1">
                            <button
                                ref={buttonRef}
                                type="button"
                                aria-label="Insert emoji"
                                onClick={handleToggleEmojiPicker}
                                className="text-ds-text-secondary hover:text-ds-text-primary transition-colors flex items-center justify-center w-5 h-5 shrink-0 cursor-pointer"
                            >
                                <Smile className="w-5 h-5" />
                            </button>

                            <div className="flex items-center justify-center">
                                <span className="text-[11px] font-medium mr-2 text-ds-text-muted">
                                    {commentText.length}/1000
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    disabled={!commentText.trim()}
                                    className={`px-4 py-1.5 rounded-[100px] font-dm-sans font-medium text-[14px] transition-all flex items-center justify-center shadow-sm cursor-pointer
                                        ${commentText.trim().length > 0
                                            ? 'bg-ds-accent text-white hover:opacity-90 active:scale-95'
                                            : 'bg-ds-border text-ds-text-muted cursor-default opacity-70'
                                        }`}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : replyingTo ? (
                <div className="w-full mt-2 relative flex items-start gap-2 min-w-0">
                    {(() => {
                        const avatarUrl = currentUserAvatar || activeProfile?.avatar_url;
                        const hasCustomAvatar = avatarUrl && avatarUrl !== '/assets/pngegg.png';
                        return (
                            <div className={`w-6 h-6 ${isCompanyActor ? 'rounded-[4px]' : 'rounded-full'} bg-ds-surface-1 text-ds-text-secondary overflow-hidden flex items-center justify-center font-semibold text-[10px] select-none shrink-0 border border-ds-border mt-1`}>
                                {hasCustomAvatar && (
                                    <img
                                        src={avatarUrl}
                                        alt="Current user"
                                        className={`w-full h-full object-cover ${isCompanyActor ? 'rounded-[4px]' : 'rounded-full'}`}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            const parent = (e.target as HTMLImageElement).parentElement;
                                            if (parent) {
                                                const fallback = parent.querySelector('[data-fallback]');
                                                if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                            }
                                        }}
                                    />
                                )}
                                <span data-fallback className="p-0.5 w-full h-full flex items-center justify-center text-ds-text-primary" style={{ display: hasCustomAvatar ? 'none' : 'flex' }}>
                                    {isCompanyActor ? (
                                        <BusinessBuildingIcon className="w-full h-full text-ds-text-primary" />
                                    ) : (
                                        <UserIcon className="w-full h-full text-ds-text-primary" />
                                    )}
                                </span>
                            </div>
                        );
                    })()}
                    <div className="flex-1 min-w-0 max-w-full border border-ds-border rounded-[16px] p-2.5 bg-transparent focus-within:border-ds-text-secondary transition-all flex flex-col justify-between min-h-[94px] gap-2 box-border">
                        <div className="flex items-center justify-between px-0.5 relative w-full min-w-0 gap-1">
                            <span className="text-[13px] sm:text-[14px] font-semibold text-ds-text-primary truncate max-w-full leading-[20px]">
                                {replyingTo.account_name || replyingTo.name}
                            </span>
                            {onCancelReply && (
                                <button
                                    type="button"
                                    aria-label="Cancel reply"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setTimeout(() => {
                                            setCommentText('');
                                            setInlineMentions([]);
                                            onCancelReply();
                                        }, 0);
                                    }}
                                    className="text-ds-text-muted hover:text-ds-text-primary transition-colors p-0.5 shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex flex-col items-start px-0.5 relative w-full min-w-0 gap-1">
                            <MentionTextarea
                                ref={textareaRef as any}
                                value={commentText}
                                onChange={(e: any) => handleTextChange(e)}
                                onMentionsChange={setInlineMentions}
                                searchUsersFn={searchUsers}
                                onKeyDown={handleKeyDown}
                                placeholder="Write your reply..."
                                className="w-full bg-transparent border-none focus:ring-0 p-0 m-0 resize-none text-[13px] sm:text-[14px] text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none leading-[20px] scrollbar-hide min-h-[24px] max-h-[128px]"
                                rows={1}
                                maxLength={1000}
                            />
                        </div>

                        <div className="flex items-center justify-between w-full gap-1.5 mt-auto pt-1">
                            <button
                                ref={buttonRef}
                                type="button"
                                aria-label="Insert emoji"
                                onClick={handleToggleEmojiPicker}
                                className="text-ds-text-secondary hover:text-ds-text-primary transition-colors flex items-center justify-center w-5 h-5 shrink-0"
                            >
                                <Smile className="w-[18px] h-[18px]" />
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[11px] font-medium mr-1 text-ds-text-muted">
                                    {commentText.length}/1000
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleSubmit()}
                                    disabled={!commentText.trim()}
                                    className={`h-[30px] sm:h-[32px] px-3 rounded-full font-dm-sans font-medium text-[12px] sm:text-[13px] transition-all flex items-center justify-center shadow-sm bg-ds-accent text-white leading-none whitespace-nowrap shrink-0
                                        ${!commentText.trim() ? 'opacity-70 cursor-default' : 'hover:opacity-90'}`}
                                >
                                    Comment
                                </button>
                                {onCancelReply && !hideCancelButton && (
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setTimeout(() => {
                                                setCommentText('');
                                                setInlineMentions([]);
                                                onCancelReply();
                                            }, 0);
                                        }}
                                        className="h-[30px] sm:h-[32px] px-2.5 rounded-full font-dm-sans font-medium text-[12px] sm:text-[13px] transition-all flex items-center justify-center border border-ds-border bg-transparent text-ds-text-primary hover:bg-ds-surface-1 leading-none whitespace-nowrap shrink-0"
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`flex w-full mt-2 relative border border-ds-border rounded-[24px] bg-ds-surface-1 transition-colors overflow-hidden focus-within:border-ds-text-secondary min-h-[40px] ${commentText.trim().length > 0 ? 'flex-col p-3' : 'flex-row items-center pl-4 pr-1 py-1'}`}>
                    <div className={`w-full relative flex-1 ${commentText.trim().length > 0 ? 'min-h-[20px]' : 'flex items-center min-h-[20px]'}`}>
                        <MentionTextarea
                            ref={textareaRef as any}
                            value={commentText}
                            onChange={(e: any) => handleTextChange(e)}
                            onMentionsChange={setInlineMentions}
                            searchUsersFn={searchUsers}
                            onKeyDown={handleKeyDown}
                            placeholder="Write your thoughts"
                            className={`w-full bg-transparent border-none focus:ring-0 p-0 resize-none ds-text-small text-ds-text-primary placeholder-ds-text-muted md:scrollbar-hide focus:outline-none leading-normal ${isDrawer ? 'max-h-[35vh] md:max-h-none overflow-y-auto' : ''} ${commentText.trim().length > 0 ? '' : 'flex items-center m-0'}`}
                            rows={1}
                            maxLength={1000}
                        />
                    </div>

                    <div className={`flex flex-row items-center ${commentText.trim().length > 0 ? 'justify-between w-full mt-1' : 'gap-1 shrink-0 ml-2'}`}>
                        <div className="relative flex items-center">
                            <button
                                ref={buttonRef}
                                type="button"
                                aria-label="Insert emoji"
                                onClick={handleToggleEmojiPicker}
                                className="w-8 h-8 flex items-center justify-center text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1 rounded-full transition-colors"
                            >
                                <Smile className="w-[18px] h-[18px]" />
                            </button>
                        </div>

                        <div
                            className={`flex items-center justify-center ${commentText.trim().length > 0 ? 'opacity-100' : 'hidden'}`}
                        >
                            <span className="text-[11px] font-medium mr-2 text-ds-text-muted">
                                {commentText.length}/1000
                            </span>
                            <button
                                onClick={() => handleSubmit()}
                                disabled={!commentText.trim()}
                                className="px-4 py-1.5 rounded-full font-dm-sans font-medium text-[14px] transition-all flex items-center justify-center bg-ds-accent hover:opacity-90 text-white whitespace-nowrap ml-1"
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
