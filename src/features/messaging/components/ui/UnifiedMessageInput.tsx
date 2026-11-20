"use client"

import React, { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Smile, Mic, X, Play, User, Building2, ChevronDown, Check } from "lucide-react"
import { FileTextIcon, CancelIcon } from "@/components/icons"
import { MentionTextarea } from "@/components/ui/MentionTextarea"
import { UserMention } from "@/services/api/users"
import { formatMentionsForBackend } from "@/lib/mentions"
import ReplyPreview from "../ReplyPreview"
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { JobInputContextCard } from "../messages/SharedJobMessage"

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const ALLOWED_IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const ALLOWED_VIDEO_EXTS = [".mp4", ".webm", ".mov"];

const ALLOWED_DOC_TYPES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_DOC_EXTS = [".pdf", ".doc", ".docx"];

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB matching backend uploadChatMedia
const MAX_IMAGES_COUNT = 10;
const MAX_VIDEOS_COUNT = 5;
const MAX_DOCS_COUNT = 5;
const MAX_MESSAGE_LENGTH = 8000;

const IMAGE_ACCEPT = ["image/*", ...ALLOWED_IMAGE_TYPES, ...ALLOWED_IMAGE_EXTS].join(',');
const VIDEO_ACCEPT = ["video/*", ...ALLOWED_VIDEO_TYPES, ...ALLOWED_VIDEO_EXTS].join(',');
const DOC_ACCEPT = [...ALLOWED_DOC_EXTS, ...ALLOWED_DOC_TYPES].join(',');

const isImageFile = (file: File) => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ALLOWED_IMAGE_TYPES.includes(file.type) || ALLOWED_IMAGE_EXTS.includes(ext);
};

const isVideoFile = (file: File) => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ALLOWED_VIDEO_TYPES.includes(file.type) || ALLOWED_VIDEO_EXTS.includes(ext);
};

const isDocFile = (file: File) => {
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    return ALLOWED_DOC_TYPES.includes(file.type) || ALLOWED_DOC_EXTS.includes(ext);
};

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
        sharedProfile?: any;
        sharedPost?: any;
        poll?: any;
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
    /** @deprecated Feature deprecated: manual sendAs switcher removed per product specification */
    showSendAs?: boolean;
    /** @deprecated Feature deprecated: manual sendAs switcher removed per product specification */
    sendAs?: 'applicant' | 'recruiter';
    /** @deprecated Feature deprecated: manual sendAs switcher removed per product specification */
    onSendAsChange?: (identity: 'applicant' | 'recruiter') => void;
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
    isQuickChat,
    showSendAs,
    sendAs = 'applicant',
    onSendAsChange
}: UnifiedMessageInputProps) {
    const [text, setText] = useState("")
    const [inlineMentions, setInlineMentions] = useState<UserMention[]>([])
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false)
    const [showSendAsMenu, setShowSendAsMenu] = useState(false)
    const [files, setFiles] = useState<File[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const pickerRef = useRef<HTMLDivElement>(null)
    const emojiButtonRef = useRef<HTMLButtonElement>(null)
    const attachmentMenuRef = useRef<HTMLDivElement>(null)
    const sendAsMenuRef = useRef<HTMLDivElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const docInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const currentMediaType = React.useMemo<'image' | 'video' | 'document' | null>(() => {
        if (files.length === 0) return null;
        const first = files[0];
        if (isImageFile(first)) return 'image';
        if (isVideoFile(first)) return 'video';
        if (isDocFile(first)) return 'document';
        return null;
    }, [files]);

    const handlePaperclipClick = () => {
        if (disabled || isLoading) return;
        // If files are already attached, directly open picker for the current locked category
        if (currentMediaType === 'image') {
            imageInputRef.current?.click();
            return;
        }
        if (currentMediaType === 'video') {
            videoInputRef.current?.click();
            return;
        }
        if (currentMediaType === 'document') {
            docInputRef.current?.click();
            return;
        }
        // If empty, toggle attachment dropdown menu
        setShowAttachmentMenu(prev => !prev);
    };

    const handleSelectCategory = (category: 'image' | 'video' | 'document') => {
        setShowAttachmentMenu(false);
        if (category === 'image') {
            imageInputRef.current?.click();
        } else if (category === 'video') {
            videoInputRef.current?.click();
        } else if (category === 'document') {
            docInputRef.current?.click();
        }
    };

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
                    const scrollH = textareaRef.current.scrollHeight;
                    textareaRef.current.style.height = `${Math.min(scrollH, 240)}px`;
                    textareaRef.current.style.overflowY = scrollH > 240 ? 'auto' : 'hidden';
                }
            }, 0);
        }
    }, [editingMessage]);

    const handleSend = () => {
        if (isDisabled) return;
        if (editingMessage && onSaveEdit) {
            if (text.trim()) {
                const formattedText = formatMentionsForBackend(text, inlineMentions);
                if (formattedText.length > MAX_MESSAGE_LENGTH) return;
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
            if (formattedText.length > MAX_MESSAGE_LENGTH) return;
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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, targetCategory?: 'image' | 'video' | 'document') => {
        const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
        // Reset input value so re-selecting same file triggers change
        e.target.value = '';
        processSelectedFiles(selectedFiles, targetCategory);
    };

    const processSelectedFiles = (selectedFiles: File[], targetCategory?: 'image' | 'video' | 'document') => {
        if (selectedFiles.length === 0) return;

        let activeType = currentMediaType || targetCategory;
        if (!activeType) {
            const first = selectedFiles[0];
            if (isImageFile(first)) activeType = 'image';
            else if (isVideoFile(first)) activeType = 'video';
            else if (isDocFile(first)) activeType = 'document';
            else {
                toast({
                    title: "Unsupported file",
                    description: "Selected file format is not supported.",
                    variant: "destructive"
                });
                return;
            }
        }

        const validFiles: File[] = [];
        let hadIncompatibleFiles = false;

        for (const file of selectedFiles) {
            // Check file size (100MB limit)
            if (file.size > MAX_FILE_SIZE_BYTES) {
                toast({
                    title: "File too large",
                    description: `"${file.name}" exceeds the maximum allowed size of 100MB.`,
                    variant: "destructive"
                });
                continue;
            }

            // Ensure selected file matches the active locked category (non-matching types hidden at file picker level)
            if (activeType === 'image' && !isImageFile(file)) {
                hadIncompatibleFiles = true;
                continue;
            }
            if (activeType === 'video' && !isVideoFile(file)) {
                hadIncompatibleFiles = true;
                continue;
            }
            if (activeType === 'document' && !isDocFile(file)) {
                hadIncompatibleFiles = true;
                continue;
            }

            validFiles.push(file);
        }

        if (hadIncompatibleFiles && validFiles.length > 0) {
            toast({
                description: `Cannot mix different file types in one message. Only ${activeType} files were added.`,
            });
        }

        if (validFiles.length === 0) return;

        const maxLimit = activeType === 'image' ? MAX_IMAGES_COUNT : activeType === 'video' ? MAX_VIDEOS_COUNT : MAX_DOCS_COUNT;
        const totalCount = files.length + validFiles.length;

        if (totalCount > maxLimit) {
            const allowedCount = maxLimit - files.length;
            if (allowedCount <= 0) {
                toast({
                    description: `Maximum ${maxLimit} ${activeType}s allowed per message.`,
                    variant: "destructive"
                });
                return;
            }
            toast({
                description: `Only ${allowedCount} more ${activeType}(s) added. Maximum is ${maxLimit}.`,
            });
            validFiles.splice(allowedCount);
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setText(prev => {
                if (prev.length + emoji.length > MAX_MESSAGE_LENGTH) return prev;
                return prev + emoji;
            });
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = text.substring(0, start) + emoji + text.substring(end);
        if (newText.length > MAX_MESSAGE_LENGTH) return;

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
            if (
                attachmentMenuRef.current &&
                !attachmentMenuRef.current.contains(event.target as Node)
            ) {
                setShowAttachmentMenu(false);
            }
            if (
                sendAsMenuRef.current &&
                !sendAsMenuRef.current.contains(event.target as Node)
            ) {
                setShowSendAsMenu(false);
            }
        };

        if (showEmojiPicker || showAttachmentMenu || showSendAsMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker, showAttachmentMenu, showSendAsMenu]);

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

    // Drag-and-drop file upload handlers
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const dragCounter = useRef(0);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDisabled) return;
        dragCounter.current += 1;
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDraggingOver(true);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDisabled && e.dataTransfer) {
            e.dataTransfer.dropEffect = "copy";
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setIsDraggingOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        setIsDraggingOver(false);
        if (isDisabled) return;
        const droppedFiles = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
        if (droppedFiles.length > 0) {
            processSelectedFiles(droppedFiles);
        }
    };

    // Attachment preview scroll handlers (horizontal drag-to-scroll & mouse wheel)
    const previewScrollRef = useRef<HTMLDivElement>(null);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handlePreviewMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || !previewScrollRef.current) return;
        setIsMouseDown(true);
        setStartX(e.pageX - previewScrollRef.current.offsetLeft);
        setScrollLeft(previewScrollRef.current.scrollLeft);
    };

    const handlePreviewMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isMouseDown || !previewScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - previewScrollRef.current.offsetLeft;
        const walk = (x - startX) * 1.5;
        previewScrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handlePreviewMouseUpOrLeave = () => {
        setIsMouseDown(false);
    };

    const handlePreviewWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (e.deltaY !== 0 && previewScrollRef.current) {
            e.currentTarget.scrollLeft += e.deltaY;
        }
    };

    return (
        <div
            className={`w-full px-4 py-0 bg-[var(--ds-bg)] shrink-0 ${isQuickChat ? 'p-3' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex flex-col w-full bg-transparent transition-all relative">
                {/* Visual drop indicator overlay when user drags files over the chat input */}
                {isDraggingOver && (
                    <div className="absolute inset-0 -top-1 -bottom-1 -left-1 -right-1 z-50 flex items-center justify-center bg-[var(--ds-bg)]/90 backdrop-blur-sm border-2 border-dashed border-[var(--ds-accent)] rounded-lg pointer-events-none transition-all">
                        <span className="font-['DM_Sans'] text-xs md:text-sm font-medium text-[var(--ds-accent)] flex items-center gap-2">
                            Drop files to attach
                        </span>
                    </div>
                )}
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
                    pendingEntityContext.type === 'job' || pendingEntityContext.type === 'offer' ? (
                        <JobInputContextCard
                            entityId={pendingEntityContext.id}
                            entityType={pendingEntityContext.type}
                            onDismiss={onDismissEntityContext}
                        />
                    ) : (
                        <div className="flex items-center justify-between gap-3 w-full relative px-3 py-2 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-lg mb-1.5">
                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                <div className="size-8 rounded-full overflow-hidden bg-[var(--ds-surface-2)] flex items-center justify-center shrink-0 border border-[var(--ds-border)]">
                                    <span className="text-xs">
                                        {pendingEntityContext.type === 'event' ? '📅' : '📝'}
                                    </span>
                                </div>
                                <div className="flex flex-col text-left overflow-hidden">
                                    <span className="font-['DM_Sans'] font-medium text-xs text-[var(--ds-text-primary)] truncate">
                                        {pendingEntityContext.type === 'event' ? 'Event Context' : 'Context'}
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
                    )
                )}

                {/* Frame 2610066: File Previews inside the input box matching Figma */}
                {filePreviews.length > 0 && (
                    <div
                        ref={previewScrollRef}
                        onMouseDown={handlePreviewMouseDown}
                        onMouseMove={handlePreviewMouseMove}
                        onMouseUp={handlePreviewMouseUpOrLeave}
                        onMouseLeave={handlePreviewMouseUpOrLeave}
                        onWheel={handlePreviewWheel}
                        className={cn(
                            "w-full max-w-full px-3 py-0 flex flex-row items-center gap-2.5 h-10 mb-1.5 shrink-0 self-stretch",
                            "overflow-x-auto overflow-y-hidden touch-pan-x select-none",
                            "scrollbar-hide no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                            isMouseDown ? "cursor-grabbing" : "cursor-grab"
                        )}
                        style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none"
                        }}
                    >
                        {filePreviews.map(({ file, url, isDoc, isVideo, isImg }, index) => {
                            if (isImg) {
                                return (
                                    <div
                                        key={index}
                                        className="relative w-[60px] h-10 rounded-[8px] overflow-hidden shrink-0 border border-[var(--ds-border)] bg-[var(--ds-surface-1)] select-none"
                                    >
                                        <img
                                            src={url}
                                            alt={file.name}
                                            draggable={false}
                                            className="w-[60px] h-10 object-cover pointer-events-none select-none"
                                        />
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[var(--ds-error)] hover:opacity-80 transition-opacity z-10 p-0 cursor-pointer"
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
                                        className="relative w-[60px] h-10 rounded-[8px] overflow-hidden shrink-0 border border-[var(--ds-border)] bg-[var(--ds-surface-1)] select-none"
                                    >
                                        <video
                                            src={url}
                                            className="w-[60px] h-10 object-cover pointer-events-none select-none"
                                            preload="metadata"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <Play className="w-5 h-5 text-[var(--ds-text-secondary)] fill-current" />
                                        </div>
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(index);
                                            }}
                                            className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[var(--ds-error)] hover:opacity-80 transition-opacity z-10 p-0 cursor-pointer"
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
                                    className="relative w-[50px] h-10 rounded-[8px] overflow-hidden shrink-0 border border-[var(--ds-border)] bg-[var(--ds-surface-1)] select-none"
                                >
                                    <div className="w-full h-full flex flex-col items-center justify-center px-1 py-0 select-none pointer-events-none">
                                        <FileTextIcon className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0" size={20} />
                                        <span className="font-['DM_Sans'] text-[10px] leading-3 font-normal text-[var(--ds-text-primary)] text-center truncate max-w-[38px]">
                                            {file.name}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[var(--ds-error)] hover:opacity-80 transition-opacity z-10 p-0 cursor-pointer"
                                        aria-label="Remove document"
                                    >
                                        <X className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 
                  @deprecated [DEPRECATED] Send As identity switcher feature is not required per product specification.
                  Keeping implementation commented for reference if multi-identity switching is reintroduced.
                */}
                {/* 
                {showSendAs && (
                    <div className="flex items-center justify-between w-full mb-1.5 px-0.5">
                        <div className="relative" ref={sendAsMenuRef}>
                            <button
                                type="button"
                                onClick={() => setShowSendAsMenu(prev => !prev)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[100px] bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] border border-[var(--ds-border)] transition-colors text-xs font-['DM_Sans'] text-[var(--ds-text-primary)] cursor-pointer select-none"
                                aria-label="Switch sending identity"
                                title="Switch between Applicant and Recruiter identity"
                            >
                                <span className="text-[var(--ds-text-secondary)] text-[11px] font-normal">Send as:</span>
                                {sendAs === 'recruiter' ? (
                                    <span className="flex items-center gap-1 text-[var(--ds-accent)] font-medium">
                                        <Building2 className="w-3.5 h-3.5" />
                                        Recruiter
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-[var(--ds-accent)] font-medium">
                                        <User className="w-3.5 h-3.5" />
                                        Applicant
                                    </span>
                                )}
                                <ChevronDown
                                    className="w-3 h-3 text-[var(--ds-text-secondary)] transition-transform duration-200"
                                    style={{ transform: showSendAsMenu ? 'rotate(180deg)' : 'none' }}
                                />
                            </button>

                            {showSendAsMenu && (
                                <div className="absolute bottom-full mb-1 left-0 z-50 min-w-[150px] p-1.5 flex flex-col gap-1 bg-[var(--ds-surface-2)] border border-[var(--ds-border)] rounded-[8px] shadow-lg animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSendAsChange?.('applicant');
                                            setShowSendAsMenu(false);
                                        }}
                                        className={cn(
                                            "flex items-center justify-between w-full px-2.5 py-1.5 rounded-[6px] text-xs font-['DM_Sans'] transition-colors text-left cursor-pointer",
                                            sendAs === 'applicant'
                                                ? "bg-[var(--ds-surface-1)] text-[var(--ds-accent)] font-medium"
                                                : "text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-1)]"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <User className="w-3.5 h-3.5" />
                                            Applicant
                                        </span>
                                        {sendAs === 'applicant' && <Check className="w-3.5 h-3.5 text-[var(--ds-accent)]" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSendAsChange?.('recruiter');
                                            setShowSendAsMenu(false);
                                        }}
                                        className={cn(
                                            "flex items-center justify-between w-full px-2.5 py-1.5 rounded-[6px] text-xs font-['DM_Sans'] transition-colors text-left cursor-pointer",
                                            sendAs === 'recruiter'
                                                ? "bg-[var(--ds-surface-1)] text-[var(--ds-accent)] font-medium"
                                                : "text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-1)]"
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5" />
                                            Recruiter
                                        </span>
                                        {sendAs === 'recruiter' && <Check className="w-3.5 h-3.5 text-[var(--ds-accent)]" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                */}

                {/* Frame 2610043: Input row matching Figma */}
                <div className="self-stretch flex flex-row items-end p-0 gap-2.5 w-full min-h-[40px]">
                    {/* Search / Left Underline Input with Paperclip */}
                    <div
                        className={cn(
                            "box-border flex flex-row items-end px-3 py-2 gap-2.5 flex-1 min-h-[40px] border-b transition-colors",
                            isDisabled
                                ? "border-[var(--ds-text-muted)]"
                                : "border-[var(--ds-text-primary)]"
                        )}
                    >
                        <div className="relative shrink-0 flex items-center justify-center mb-0.5" ref={attachmentMenuRef}>
                            <button
                                type="button"
                                className={cn(
                                    "w-5 h-5 flex items-center justify-center transition-colors shrink-0 p-0",
                                    isDisabled
                                        ? "text-[var(--ds-text-muted)] cursor-default"
                                        : showAttachmentMenu
                                            ? "text-[var(--ds-accent)] cursor-pointer"
                                            : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] cursor-pointer"
                                )}
                                disabled={isDisabled}
                                onClick={handlePaperclipClick}
                                aria-label="Attach file"
                                title="Attach file"
                            >
                                <Paperclip className="w-5 h-5" strokeWidth={1.5} />
                            </button>

                            {showAttachmentMenu && (
                                <div className="absolute bottom-full mb-2 left-0 z-50 w-[99px] h-[116px] p-3 flex flex-col items-start gap-4 bg-[var(--ds-bg)] border border-[var(--ds-border)] rounded-[8px] shadow-lg animate-in fade-in zoom-in-95 duration-100 box-border">
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCategory('image')}
                                        className="h-5 p-0 bg-transparent border-0 font-['DM_Sans'] font-normal text-[14px] leading-5 text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors text-left cursor-pointer flex-none"
                                    >
                                        Photos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCategory('video')}
                                        className="h-5 p-0 bg-transparent border-0 font-['DM_Sans'] font-normal text-[14px] leading-5 text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors text-left cursor-pointer flex-none"
                                    >
                                        Videos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCategory('document')}
                                        className="h-5 p-0 bg-transparent border-0 font-['DM_Sans'] font-normal text-[14px] leading-5 text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors text-left cursor-pointer flex-none"
                                    >
                                        Documents
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 relative flex items-center justify-start min-w-0 py-0.5">
                            <MentionTextarea
                                ref={textareaRef}
                                value={text}
                                searchUsersFn={searchUsersFn}
                                placement="top"
                                onMentionsChange={setInlineMentions}
                                maxHeight={240}
                                enableHashtags={false}
                                maxLength={MAX_MESSAGE_LENGTH}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.length <= MAX_MESSAGE_LENGTH) {
                                        setText(val);
                                        if (onTyping) onTyping();
                                    }
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder={disabledMessage || (isQuickChat ? "Write a message..." : (placeholder || (isDisabled ? "Loading..." : "Write a message...")))}
                                rows={1}
                                className="w-full bg-transparent border-0 resize-none focus:outline-none scrollbar-hide text-xs leading-4 font-normal font-['DM_Sans'] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] p-0 min-h-4 max-h-[240px] overflow-y-auto"
                                disabled={isDisabled}
                            />
                        </div>
                    </div>

                    {/* Dedicated hidden file inputs for Photos, Videos, and Documents */}
                    <input
                        ref={imageInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'image')}
                        accept={IMAGE_ACCEPT}
                    />
                    <input
                        ref={videoInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'video')}
                        accept={VIDEO_ACCEPT}
                    />
                    <input
                        ref={docInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'document')}
                        accept={DOC_ACCEPT}
                    />

                    {/* Right side emoji and send buttons */}
                    <button
                        ref={emojiButtonRef}
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={cn(
                            "w-5 h-5 flex items-center justify-center transition-colors shrink-0 p-0 mb-2.5",
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
                            "w-5 h-5 flex items-center justify-center transition-all shrink-0 p-0 mb-2.5",
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


