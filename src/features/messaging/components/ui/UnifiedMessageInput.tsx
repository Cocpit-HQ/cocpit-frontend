"use client"

import React, { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Smile, Mic, X, FileText, Film, Image as ImageIcon } from "lucide-react"
import { MentionTextarea } from "@/components/ui/MentionTextarea"
import { UserMention } from "@/services/api/users"
import ReplyPreview from "../ReplyPreview"
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"

interface UnifiedMessageInputProps {
    onSendMessage: (text: string, files: File[]) => void
    onTyping?: () => void
    disabled?: boolean
    disabledMessage?: string
    placeholder?: string
    isLoading?: boolean
    searchUsersFn?: (query: string) => Promise<UserMention[]>
    replyingTo?: { messageId: string; senderName: string; content: string } | null;
    onCancelReply?: () => void;
    pendingSharedPost?: any | null;
    onCancelPendingSharedPost?: () => void;
    pendingSharedProfile?: any | null;
    onCancelPendingSharedProfile?: () => void;
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
    pendingSharedPost,
    onCancelPendingSharedPost,
    pendingSharedProfile,
    onCancelPendingSharedProfile
}: UnifiedMessageInputProps) {
    const [text, setText] = useState("")
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const pickerRef = useRef<HTMLDivElement>(null)
    const emojiButtonRef = useRef<HTMLButtonElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { theme, resolvedTheme } = useTheme()
    const isDarkTheme = resolvedTheme === "dark" || theme === "dark" || theme === "navy"

    const handleInputEmojiSelect = (emojiData: EmojiClickData) => {
        const emojiChar = emojiData.emoji;
        insertEmoji(emojiChar);
    };

    const isDisabled = disabled || isLoading;

    const handleSend = () => {
        if (isDisabled) return;
        if (text.trim() || files.length > 0 || pendingSharedPost || pendingSharedProfile) {
            onSendMessage(text, files)
            setText("")
            setFiles([])
            if (textareaRef.current) {
                textareaRef.current.style.height = '44px';
            }
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
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
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
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

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
        if (file.type.startsWith('video/')) return <Film className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    };

    return (
        <div className="px-4 py-3 md:px-6 md:py-4 w-full bg-background shrink-0">
            <div className={`flex flex-col w-full border border-border/60 ${files.length > 0 || replyingTo || pendingSharedPost || pendingSharedProfile ? 'rounded-[20px]' : 'rounded-[32px]'} bg-transparent p-1.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all relative`}>
                {replyingTo && onCancelReply && (
                    <ReplyPreview replyingTo={replyingTo} onCancel={onCancelReply} />
                )}

                {pendingSharedPost && onCancelPendingSharedPost && (
                    <div className="flex items-center justify-between gap-3 w-full relative px-[16px] py-[12px] bg-[var(--primary-tint)] border border-[var(--border)] rounded-[16px] mb-1.5">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-[var(--card)] dark:bg-[#1E293B] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                {pendingSharedPost.author_avatar || pendingSharedPost.authorAvatar ? (
                                    <img src={pendingSharedPost.author_avatar || pendingSharedPost.authorAvatar} alt={pendingSharedPost.author_name || pendingSharedPost.author} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="font-semibold text-[var(--primary)]">{(pendingSharedPost.author_name || pendingSharedPost.author)?.[0]?.toUpperCase() || "P"}</span>
                                )}
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="font-['Poppins'] font-semibold text-[13px] text-[var(--foreground)] dark:text-white truncate">
                                    Shared Post by {pendingSharedPost.author_name || pendingSharedPost.author}
                                </span>
                                <span className="font-['Poppins'] font-normal text-[12px] text-[var(--primary)] dark:text-[#818CF8] truncate">
                                    {pendingSharedPost.content || "View shared post"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onCancelPendingSharedPost}
                            className="text-[var(--primary)] dark:text-[#818CF8] hover:bg-[var(--border)]/30 p-1.5 rounded-full transition-colors shrink-0"
                            aria-label="Remove shared post"
                        >
                            <X className="w-[18px] h-[18px]" strokeWidth={2} />
                        </button>
                    </div>
                )}

                {pendingSharedProfile && onCancelPendingSharedProfile && (
                    <div className="flex items-center justify-between gap-3 w-full relative px-[16px] py-[12px] bg-[var(--primary-tint)] border border-[var(--border)] rounded-[16px] mb-1.5">
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                            <div className="h-10 w-10 rounded-full overflow-hidden bg-[var(--card)] dark:bg-[#1E293B] flex items-center justify-center shrink-0 border border-[var(--border)]">
                                {pendingSharedProfile.avatar || pendingSharedProfile.avatar_url ? (
                                    <img src={pendingSharedProfile.avatar || pendingSharedProfile.avatar_url} alt={pendingSharedProfile.name} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="font-semibold text-[var(--primary)]">{pendingSharedProfile.name?.[0]?.toUpperCase() || "P"}</span>
                                )}
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className="font-['Poppins'] font-semibold text-[13px] text-[var(--foreground)] dark:text-white truncate">
                                    Shared Profile of {pendingSharedProfile.name}
                                </span>
                                <span className="font-['Poppins'] font-normal text-[12px] text-[var(--primary)] dark:text-[#818CF8] truncate">
                                    {pendingSharedProfile.headline || "View shared profile"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onCancelPendingSharedProfile}
                            className="text-[var(--primary)] dark:text-[#818CF8] hover:bg-[var(--border)]/30 p-1.5 rounded-full transition-colors shrink-0"
                            aria-label="Remove shared profile"
                        >
                            <X className="w-[18px] h-[18px]" strokeWidth={2} />
                        </button>
                    </div>
                )}

                {/* File Previews inside the input box */}
                {files.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto px-2 pt-2 pb-1">
                        {files.map((file, index) => (
                            <div key={index} className="relative group shrink-0 mt-1 mr-1">
                                {file.type.startsWith('image/') ? (
                                    <div className="w-[60px] h-[60px] relative overflow-hidden rounded-[12px] bg-muted border border-border/50">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="object-cover w-full h-full" />
                                    </div>
                                ) : (
                                    <div className="w-[60px] h-[60px] flex flex-col items-center justify-center bg-muted rounded-[12px] text-muted-foreground border border-border/50 p-1">
                                        {getFileIcon(file)}
                                        <span className="text-[9px] truncate w-full text-center mt-1 text-foreground/80">{file.name}</span>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeFile(index)}
                                    className="absolute -top-2 -right-2 bg-[var(--card)] border border-[var(--border)] text-[var(--destructive)] rounded-full p-[2px] shadow-sm hover:bg-[var(--destructive)] hover:text-[var(--primary-foreground)] transition-colors z-10"
                                    aria-label="Remove file"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-1.5 w-full">
                    {/* Attachment button */}
                    <button
                        className="w-9 h-9 mb-0.5 flex items-center justify-center rounded-full transition-colors text-muted-foreground hover:bg-muted shrink-0 disabled:opacity-40 ml-1"
                        disabled={isDisabled}
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Attach file"
                    >
                        <Paperclip className="w-5 h-5" strokeWidth={1.5} />
                    </button>

                    {/* Input textarea */}
                    <div className="flex-1 relative">
                        <MentionTextarea
                            innerRef={textareaRef}
                            value={text}
                            searchUsersFn={searchUsersFn}
                            onChange={(e) => {
                                setText(e.target.value);
                                if (onTyping) onTyping();

                                const target = e.target;
                                if (target && 'style' in target) {
                                    target.style.height = 'auto';
                                    const newHeight = Math.min(target.scrollHeight, 128);
                                    target.style.height = `${newHeight}px`;
                                    target.style.overflowY = target.scrollHeight > 128 ? 'auto' : 'hidden';
                                }
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={disabledMessage || placeholder || (isDisabled ? "Loading..." : "Write a message...")}
                            rows={1}
                            className="w-full px-2 py-2.5 bg-transparent border-0 resize-none focus:outline-none max-h-32 text-[15px] text-foreground placeholder:text-muted-foreground/60 scrollbar-hide overflow-hidden"
                            style={{ minHeight: "40px" }}
                            disabled={isDisabled}
                        />
                    </div>

                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept="image/*,video/*,application/pdf"
                    />

                    {/* Right side controls */}
                    <div className="flex items-center gap-1.5 mb-0.5 shrink-0 mr-1">
                        <button
                            ref={emojiButtonRef}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'}`}
                            disabled={isDisabled}
                            aria-label="Open emoji picker"
                        >
                            <Smile className="w-5 h-5" strokeWidth={1.5} />
                        </button>

                        <button
                            onClick={handleSend}
                            disabled={isDisabled || (!text.trim() && files.length === 0 && !pendingSharedPost && !pendingSharedProfile)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-sm
                                ${text.trim() || files.length > 0 || pendingSharedPost || pendingSharedProfile
                                    ? 'bg-[var(--primary-tint)] text-[var(--primary)] hover:bg-[var(--primary-tint)]/80'
                                    : 'bg-transparent text-muted-foreground/40 cursor-not-allowed'
                                }`}
                            aria-label="Send message"
                        >
                            <Send className="w-5 h-5" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* Emoji Picker Overlay */}
                {showEmojiPicker && (
                    <div ref={pickerRef} className="absolute bottom-[calc(100%+10px)] right-4 shadow-xl z-50 rounded-2xl overflow-hidden border border-border">
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

