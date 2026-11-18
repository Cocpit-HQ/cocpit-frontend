"use client"

import React, { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Smile, Mic, X, Play } from "lucide-react"
import { FileTextIcon, CancelIcon } from "@/components/icons"
import { MentionTextarea } from "@/components/ui/MentionTextarea"
import { UserMention } from "@/services/api/users"
import { formatMentionsForBackend } from "@/lib/mentions"
import ReplyPreview from "../ReplyPreview"
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface UnifiedMessageInputProps {
    onSendMessage: (text: string, files: File[]) => void
    onTyping?: () => void
    disabled?: boolean
    disabledMessage?: string
    placeholder?: string
    isLoading?: boolean
    searchUsersFn?: (query: string, forTagging?: boolean, cursor?: string) => Promise<any>
    replyingTo?: {
        messageId: string;
        senderName: string;
        content: string;
        isMe?: boolean;
        mediaType?: 'image' | 'video' | 'document' | 'attachment' | string | null;
        mediaName?: string | null;
        mediaUrl?: string | null;
        sharedPostId?: string | null;
        sharedProfileId?: string | null;
        sharedProfileType?: string | null;
        entityType?: string | null;
        entityId?: string | null;
        isAttachment?: boolean;
    } | null;
    onCancelReply?: () => void;
    editingMessage?: { id: string; text?: string; text_content?: string } | null;
    onCancelEdit?: () => void;
    onSaveEdit?: (messageId: string, text: string) => void;
    pendingSharedPost?: any | null;
    onCancelPendingSharedPost?: () => void;
    pendingSharedProfile?: any | null;
    onCancelPendingSharedProfile?: () => void;
    pendingEntityContext?: { type: 'job' | 'offer' | 'event', id: string } | null;
    onDismissEntityContext?: () => void;
    isQuickChat?: boolean;
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"];

export default function UnifiedMessageInput({
    onSendMessage,
    onTyping,
    disabled,
    disabledMessage,
    placeholder,
    isLoading,
    searchUsersFn,
    replyingTo,
    onCancelReply,
    editingMessage,
    onCancelEdit,
    onSaveEdit,
    pendingSharedPost,
    onCancelPendingSharedPost,
    pendingSharedProfile,
    onCancelPendingSharedProfile,
    pendingEntityContext,
    onDismissEntityContext,
    isQuickChat
}: UnifiedMessageInputProps) {
    const [text, setText] = useState("")
    const [inlineMentions, setInlineMentions] = useState<UserMention[]>([])
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const pickerRef = useRef<HTMLDivElement>(null)
    const emojiButtonRef = useRef<HTMLButtonElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { theme, resolvedTheme } = useTheme()
    const isDarkTheme = resolvedTheme === "dark" || theme === "dark" 

    const handleInputEmojiSelect = (emojiData: EmojiClickData) => {
        const emojiChar = emojiData.emoji;
        insertEmoji(emojiChar);
    };

    const isDisabled = disabled || isLoading;

    useEffect(() => {
        if (editingMessage) {
            const initialText = editingMessage.text || editingMessage.text_content || "";
            setText(initialText);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    const len = initialText.length;
                    textareaRef.current.setSelectionRange(len, len);
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 68)}px`;
                }
            }, 0);
        }
    }, [editingMessage]);

    const handleSend = () => {
        if (isDisabled) return;
        if (editingMessage && onSaveEdit) {
            if (text.trim()) {
                const formattedText = formatMentionsForBackend(text, inlineMentions);
                onSaveEdit(editingMessage.id, formattedText);
                setText("");
                setInlineMentions([]);
                if (onCancelEdit) onCancelEdit();
                if (textareaRef.current) {
                    textareaRef.current.style.height = '20px';
                    textareaRef.current.style.overflowY = 'hidden';
                }
            }
            return;
        }
        if (text.trim() || files.length > 0 || pendingSharedPost || pendingSharedProfile) {
            const formattedText = formatMentionsForBackend(text, inlineMentions);
            onSendMessage(formattedText, files)
            setText("")
            setInlineMentions([])
            setFiles([])
            if (textareaRef.current) {
                textareaRef.current.style.height = '20px';
                textareaRef.current.style.overflowY = 'hidden';
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape" && editingMessage && onCancelEdit) {
            e.preventDefault();
            onCancelEdit();
            setText("");
            return;
        }
        if (isDisabled) return;
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setText(prev => prev + emoji);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = text.substring(0, start) + emoji + text.substring(end);

        setText(newText);

        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
        }, 0);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const filePreviews = React.useMemo(() => {
        return files.map(file => ({
            file,
            url: URL.createObjectURL(file),
            isDoc: file.type === "application/pdf" ||
                file.type.includes("word") ||
                file.type.includes("officedocument") ||
                /\.(doc|docx|pdf|txt|rtf|xls|xlsx|ppt|pptx)$/i.test(file.name),
            isVideo: file.type.startsWith("video/"),
            isImg: file.type.startsWith("image/")
        }));
    }, [files]);

    useEffect(() => {
        return () => {
            filePreviews.forEach(p => URL.revokeObjectURL(p.url));
        };
    }, [filePreviews]);

    return (
        <div className={`w-full px-4 py-0 bg-[var(--ds-bg)] shrink-0 ${isQuickChat ? 'p-3' : ''}`}>
            <div className="flex flex-col w-full bg-transparent transition-all relative">
                {/* Frame 2610122: Editing message banner matching Figma */}
                {editingMessage && onCancelEdit && (
                    <div className="flex flex-row items-center justify-between gap-2 w-full h-5 mb-2 self-stretch">
                        <span className="font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-accent)] flex-1 truncate select-none">
                            Editing message
                        </span>
                        <button
                            type="button"
                            onClick={() => {
                                onCancelEdit();
                                setText("");
                            }}
                            className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity p-0 cursor-pointer shrink-0"
                            aria-label="Cancel editing"
                            title="Cancel editing"
                        >
                            <CancelIcon size={20} className="w-5 h-5 text-[var(--ds-text-primary)]" fill="currentColor" />
                        </button>
                    </div>
                )}

                {replyingTo && onCancelReply && (
                    <ReplyPreview replyingTo={replyingTo} onCancel={onCancelReply} />
                )}

                {pendingSharedPost && onCancelPendingSharedPost && (
                    <div className="flex items-center justify-between gap-3 w-full relative px-3 py-2 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-lg mb-1.5">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="size-8 rounded-full overflow-hidden bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0 border border-[var(--ds-border)]">
                                {pendingSharedPost.author_avatar || pendingSharedPost.authorAvatar ? (
                                    <img src={pendingSharedPost.author_avatar || pendingSharedPost.authorAvatar} alt={pendingSharedPost.author_name || pendingSharedPost.author} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="font-semibold text-xs text-[var(--ds-accent)]">{(pendingSharedPost.author_name || pendingSharedPost.author)?.[0]?.toUpperCase() || "P"}</span>
                                )}
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="font-['DM_Sans'] font-medium text-xs text-[var(--ds-text-primary)] truncate">
                                    Shared Post by {pendingSharedPost.author_name || pendingSharedPost.author}
                                </span>
                                <span className="font-['DM_Sans'] font-normal text-[10px] text-[var(--ds-text-secondary)] truncate">
                                    {pendingSharedPost.content || "View shared post"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onCancelPendingSharedPost}
                            className="text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] p-1 rounded-full transition-colors shrink-0"
                            aria-label="Remove shared post"
                        >
                            <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </div>
                )}

                {pendingSharedProfile && onCancelPendingSharedProfile && (
                    <div className="flex items-center justify-between gap-3 w-full relative px-3 py-2 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-lg mb-1.5">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="size-8 rounded-full overflow-hidden bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0 border border-[var(--ds-border)]">
                                {pendingSharedProfile.avatar || pendingSharedProfile.avatar_url ? (
                                    <img src={pendingSharedProfile.avatar || pendingSharedProfile.avatar_url} alt={pendingSharedProfile.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="font-semibold text-xs text-[var(--ds-accent)]">{pendingSharedProfile.name?.[0]?.toUpperCase() || "P"}</span>
                                )}
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="font-['DM_Sans'] font-medium text-xs text-[var(--ds-text-primary)] truncate">
                                    Shared Profile of {pendingSharedProfile.name}
                                </span>
                                <span className="font-['DM_Sans'] font-normal text-[10px] text-[var(--ds-text-secondary)] truncate">
                                    {pendingSharedProfile.headline || "View shared profile"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onCancelPendingSharedProfile}
                            className="text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] p-1 rounded-full transition-colors shrink-0"
                            aria-label="Remove shared profile"
                        >
                            <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </div>
                )}

                {pendingEntityContext && onDismissEntityContext && (
                    <div className="flex items-center justify-between gap-3 w-full relative px-3 py-2 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-lg mb-1.5">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="size-8 rounded-full overflow-hidden bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0 border border-[var(--ds-border)]">
                                <span className="text-xs">
                                    {pendingEntityContext.type === 'job' ? '💼' : pendingEntityContext.type === 'event' ? '📅' : '📝'}
                                </span>
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="font-['DM_Sans'] font-medium text-xs text-[var(--ds-text-primary)] truncate">
                                    {pendingEntityContext.type === 'job' ? 'Job Application Context' : pendingEntityContext.type === 'event' ? 'Event Context' : 'Job Offer Context'}
                                </span>
                                <span className="font-['DM_Sans'] font-normal text-[10px] text-[var(--ds-text-secondary)] truncate">
                                    This context will be attached to your first message
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onDismissEntityContext}
                            className="text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] p-1 rounded-full transition-colors shrink-0"
                            aria-label="Remove context"
                        >
                            <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                    </div>
                )}

                {/* Frame 2610066: File Previews inside the input box matching Figma */}
                {filePreviews.length > 0 && (
                    <div className="w-full px-3 py-0 flex flex-row items-center gap-2.5 h-10 overflow-x-auto overflow-y-hidden scrollbar-none mb-1.5 shrink-0 self-stretch">
                        {filePreviews.map(({ file, url, isDoc, isVideo, isImg }, index) => {
                            if (isImg) {
                                return (
                                    <div
                                        key={index}
                                        className="relative w-[60px] h-10 rounded-[8px] overflow-hidden shrink-0 border border-[var(--ds-border)] bg-[var(--ds-surface-1)]"
                                    >
                                        <img
                                            src={url}
                                            alt={file.name}
                                            className="w-[60px] h-10 object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[var(--ds-error)] hover:opacity-80 transition-opacity z-10 p-0"
                                            aria-label="Remove image"
                                        >
                                            <X className="w-3 h-3 stroke-[2.5]" />
                                        </button>
                                    </div>
                                );
                            }

                            if (isVideo) {
                                return (
                                    <div
                                        key={index}
                                        className="relative w-[60px] h-10 rounded-[8px] overflow-hidden shrink-0 border border-[var(--ds-border)] bg-[var(--ds-surface-1)]"
                                    >
                                        <video
                                            src={url}
                                            className="w-[60px] h-10 object-cover pointer-events-none"
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <Play className="w-5 h-5 text-[var(--ds-text-secondary)] fill-current" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[var(--ds-error)] hover:opacity-80 transition-opacity z-10 p-0"
                                            aria-label="Remove video"
                                        >
                                            <X className="w-3 h-3 stroke-[2.5]" />
                                        </button>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={index}
                                    className="relative w-[50px] h-10 rounded-[8px] overflow-hidden shrink-0 border border-[var(--ds-border)] bg-[var(--ds-surface-1)]"
                                >
                                    <div className="w-full h-full flex flex-col items-center justify-center px-1 py-0 select-none">
                                        <FileTextIcon className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0" size={20} />
                                        <span className="font-['DM_Sans'] text-[10px] leading-3 font-normal text-[var(--ds-text-primary)] text-center truncate max-w-[38px]">
                                            {file.name}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeFile(index)}
                                        className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[var(--ds-error)] hover:opacity-80 transition-opacity z-10 p-0"
                                        aria-label="Remove document"
                                    >
                                        <X className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Frame 2610043: Input row matching Figma */}
                <div className="self-stretch flex flex-row items-center p-0 gap-2.5 w-full min-h-[40px]">
                    {/* Search / Left Underline Input with Paperclip */}
                    <div
                        className={cn(
                            "box-border flex flex-row items-center px-3 py-1.5 gap-2.5 flex-1 min-h-[40px] h-10 border-b transition-colors",
                            isDisabled
                                ? "border-[var(--ds-text-muted)]"
                                : "border-[var(--ds-text-primary)] focus-within:border-[var(--ds-accent)]"
                        )}
                    >
                        <button
                            type="button"
                            className={cn(
                                "w-5 h-5 flex items-center justify-center transition-colors shrink-0 p-0",
                                isDisabled
                                    ? "text-[var(--ds-text-muted)] cursor-default"
                                    : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer"
                            )}
                            disabled={isDisabled}
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Attach file"
                            title="Attach file"
                        >
                            <Paperclip className="w-5 h-5" strokeWidth={1.5} />
                        </button>

                        <div className="flex-1 relative flex items-center justify-start min-w-0">
                            <MentionTextarea
                                ref={textareaRef}
                                value={text}
                                searchUsersFn={searchUsersFn}
                                placement="top"
                                onMentionsChange={setInlineMentions}
                                maxHeight={68}
                                enableHashtags={false}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    if (onTyping) onTyping();
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={disabledMessage || (isQuickChat ? "Write a message..." : (placeholder || (isDisabled ? "Loading..." : "Write a message...")))}
                                rows={1}
                                className="w-full bg-transparent border-0 resize-none focus:outline-none scrollbar-hide text-xs leading-4 font-normal font-['DM_Sans'] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] p-0 min-h-4 max-h-[68px] overflow-y-auto"
                                disabled={isDisabled}
                            />
                        </div>
                    </div>

                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    />

                    {/* Right side emoji and send buttons */}
                    <button
                        ref={emojiButtonRef}
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={cn(
                            "w-5 h-5 flex items-center justify-center transition-colors shrink-0 p-0",
                            isDisabled
                                ? "text-[var(--ds-text-muted)] cursor-default"
                                : showEmojiPicker
                                    ? "text-[var(--ds-accent)] cursor-pointer"
                                    : "text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer"
                        )}
                        disabled={isDisabled}
                        aria-label="Open emoji picker"
                        title="Emoji"
                    >
                        <Smile className="w-5 h-5" strokeWidth={1.5} />
                    </button>

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isDisabled || (!text.trim() && files.length === 0 && !pendingSharedPost && !pendingSharedProfile)}
                        className={cn(
                            "w-5 h-5 flex items-center justify-center transition-all shrink-0 p-0",
                            isDisabled
                                ? "text-[var(--ds-text-muted)] cursor-default"
                                : text.trim() || files.length > 0 || pendingSharedPost || pendingSharedProfile
                                    ? "text-[var(--ds-accent)] hover:opacity-80 cursor-pointer"
                                    : "text-[var(--ds-text-muted)] opacity-50 cursor-default"
                        )}
                        aria-label="Send message"
                        title="Send message"
                    >
                        <Send className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Emoji Picker Overlay */}
                {showEmojiPicker && (
                    <div ref={pickerRef} className="absolute bottom-[calc(100%+10px)] right-4 shadow-xl z-50 rounded-2xl overflow-hidden border border-[var(--ds-border)]">
                        <EmojiPicker
                            onEmojiClick={handleInputEmojiSelect}
                            lazyLoadEmojis
                            width={310}
                            height={340}
                            previewConfig={{ showPreview: false }}
                            theme={isDarkTheme ? Theme.DARK : Theme.LIGHT}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}


