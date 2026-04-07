"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Message } from "@/types/messaging"
import { MoreVertical, Info, Copy, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ProfilePreviewCard } from "../ProfilePreviewCard"
import { EntityPreviewCard } from "../EntityPreviewCard"

// --- Types ---
interface MessageBubbleProps {
  message: Message
  onAction?: (action: string, message: Message) => void
  isEditing?: boolean
  onSaveEdit?: (text: string) => void
  onCancelEdit?: () => void
  isSelected?: boolean
  onMessageClick?: (message: Message) => void
  showSenderName?: boolean
  onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void
  onMediaLoad?: () => void
}

// --- Hooks ---
const useMessageEditor = (
  initialText: string,
  isEditing: boolean = false,
  onSave?: (text: string) => void,
  onCancel?: () => void
) => {
  const [text, setText] = useState(initialText)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset text when editing starts
  useEffect(() => {
    if (isEditing) {
      setText(initialText)
      // Focus and resize after render
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(
            textareaRef.current.value.length,
            textareaRef.current.value.length
          )
          adjustHeight()
        }
      }, 0)
    }
  }, [isEditing, initialText])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }

  // Auto-resize on text change
  useEffect(() => {
    adjustHeight()
  }, [text])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSave?.(text)
    } else if (e.key === 'Escape') {
      onCancel?.()
    }
  }

  return { text, setText, textareaRef, handleKeyDown }
}

// --- Sub-Components ---

const MessageMenu = ({ message, onAction }: { message: Message, onAction?: (action: string, message: Message) => void }) => {
  if (!onAction) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 hover:bg-muted rounded-full transition-colors text-muted-foreground">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onAction('info', message)}>
          <Info className="w-4 h-4 mr-2" /> Info
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('copy', message)}>
          <Copy className="w-4 h-4 mr-2" /> Copy
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('edit', message)}>
          <Pencil className="w-4 h-4 mr-2" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction('delete', message)} className="text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const SharedPostCard = ({ message, onMediaLoad }: { message: Message, onMediaLoad?: () => void }) => {
  const router = useRouter()
  if (!message.sharedPost) return null

  return (
    <div
      className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden max-w-[280px] cursor-pointer hover:bg-background/80 transition-all shadow-sm group"
      onClick={() => router.push(`/post/${message.sharedPost?.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="p-3 border-b border-white/10 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden ring-1 ring-white/20">
          <img
            src={message.sharedPost.authorAvatar || '/assets/pngegg.png'}
            alt={message.sharedPost.author}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold truncate leading-none mb-0.5">{message.sharedPost.author}</span>
          <span className="text-xs text-muted-foreground leading-none">Shared a post</span>
        </div>
      </div>

      {/* Media Preview */}
      {message.sharedPost.media && message.sharedPost.media.length > 0 && (
        <div className="w-full aspect-[4/3] bg-black relative">
          {message.sharedPost.media[0].type === 'video' ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <video
                src={message.sharedPost.media[0].url}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                preload="metadata"
                muted
                playsInline
                onLoadedMetadata={onMediaLoad}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
          ) : (
            <img src={message.sharedPost.media[0].url} className="w-full h-full object-cover" loading="lazy" onLoad={onMediaLoad} />
          )}
        </div>
      )}

      {/* Content Snippet */}
      <div className="p-3">
        <p className="text-xs line-clamp-2 text-muted-foreground/90 font-medium">
          {message.sharedPost.content || "Shared content"}
        </p>
      </div>
    </div>
  )
}

const MessageMedia = ({
  message,
  isMediaOnly,
  onMediaClick,
  onMediaLoad
}: {
  message: Message,
  isMediaOnly: boolean,
  onMediaClick?: MessageBubbleProps['onMediaClick'],
  onMediaLoad?: () => void
}) => {
  if (!message.media || message.media.length === 0 || message.is_deleted_for_everyone || message.is_deleted_for_me) return null

  return (
    <div className={cn("flex flex-col gap-1", message.text || message.text_content ? "mb-0" : "")}>
      {message.media.map((item, index) => {
        const isLast = index === message.media!.length - 1
        const showOverlayTimestamp = isLast && isMediaOnly

        return (
          <div key={index} className="overflow-hidden relative group/media">
            {item.type === 'video' ? (
              <div
                className="w-full max-w-[300px] aspect-video bg-black relative cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onMediaClick?.(item.url, 'video', `Video-${index + 1}`)
                }}
              >
                <video
                  src={item.url}
                  className="w-full h-full object-contain pointer-events-none"
                  preload="metadata"
                  onLoadedMetadata={onMediaLoad}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] group-hover/media:bg-black/10 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover/media:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                </div>
                {showOverlayTimestamp && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-[10px] text-white/90">
                    {message.time}
                  </div>
                )}
              </div>
            ) : item.type === 'document' ? (
              <div className={cn("relative", isMediaOnly ? "bg-muted/40" : "")}>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onMediaClick?.(item.url, 'document', `Document-${index + 1}.pdf`)
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors w-full min-w-[200px] cursor-pointer",
                    isMediaOnly ? "bg-secondary/40 hover:bg-secondary/60" : "bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 mr-8">
                    <p className="text-sm font-medium truncate opacity-90">Document</p>
                    <p className="text-xs text-muted-foreground uppercase">PDF</p>
                  </div>
                </div>
                {showOverlayTimestamp && (
                  <span className="absolute bottom-3 right-4 text-[10px] text-muted-foreground">
                    {message.time}
                  </span>
                )}
              </div>
            ) : (
              <div className="max-w-[280px] md:max-w-[320px] relative cursor-pointer">
                <img
                  src={item.url}
                  alt="Attached image"
                  className="w-full h-auto object-cover max-h-[400px]"
                  loading="lazy"
                  onLoad={onMediaLoad}
                  onClick={(e) => {
                    e.stopPropagation()
                    onMediaClick?.(item.url, 'image', `Image-${index + 1}`)
                  }}
                />
                {showOverlayTimestamp && (
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex items-end justify-end p-2">
                    <span className="text-[10px] text-white/90 font-medium tracking-wide">
                      {message.time}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

import { Mention } from "./MentionCard"

const MessageText = ({
  message,
  isMediaOnly,
  isMe
}: {
  message: Message,
  isMediaOnly: boolean,
  isMe: boolean
}) => {
  const router = useRouter()
  if (isMediaOnly) return null

  const renderTextWithMentions = (text: string) => {
    if (!text) return null
    
    // Quick regex to find @mentions. Allows alphanumeric, underscore, dot, and dash.
    const mentionRegex = /(@[a-zA-Z0-9_.\-]+)/g
    const parts = text.split(mentionRegex)
    
    if (parts.length <= 1) return text
    
    return parts.map((part, i) => {
      if (part.match(mentionRegex)) {
        const username = part.substring(1) // remove the @
        return (
          <Mention key={i} username={username} isMe={isMe}>
            <span 
              className={cn(
                "hover:underline cursor-pointer font-bold",
                isMe ? "text-white" : "text-[#818cf8]"
              )}
            >
              {part}
            </span>
          </Mention>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className={cn(message.media && message.media.length > 0 ? "px-3 py-2 md:px-4 md:py-2.5" : "")}>
      <span className="leading-snug block whitespace-pre-wrap break-words">
        {message.is_deleted_for_everyone
          ? "This message deleted for everyone"
          : message.is_deleted_for_me
            ? "This message deleted for you"
            : renderTextWithMentions(message.text || message.text_content || "")}
        {message.is_edited && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (
          <span className="text-[10px] opacity-60 ml-1 italic">(edited)</span>
        )}
      </span>

      <div className={cn(
        "flex items-center gap-1 justify-end mt-1",
        (message.is_deleted_for_everyone || message.is_deleted_for_me)
          ? (isMe ? "text-primary-foreground/60" : "text-muted-foreground")
          : (isMe ? "text-primary-foreground/70" : "text-muted-foreground/70")
      )}>
        <span className="text-[10px]">
          {message.time}
        </span>
      </div>
    </div>
  )
}

const MessageEditor = ({
  message,
  isEditing,
  onSaveEdit,
  onCancelEdit
}: Pick<MessageBubbleProps, 'message' | 'isEditing' | 'onSaveEdit' | 'onCancelEdit'>) => {
  const { text, setText, textareaRef, handleKeyDown } = useMessageEditor(
    message.text || message.text_content || "",
    isEditing,
    onSaveEdit,
    onCancelEdit
  )

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent outline-none resize-none p-0 text-inherit leading-snug overflow-hidden"
        rows={1}
      />
    </div>
  )
}


// --- Main Component ---

function MessageBubble(props: MessageBubbleProps) {
  const {
    message,
    onAction,
    isEditing,
    onSaveEdit,
    onCancelEdit,
    isSelected,
    onMessageClick,
    showSenderName,
    onMediaClick,
    onMediaLoad
  } = props

  const isMe = message.sender === "me"

  // Helper to determine if message is media-only
  const isMediaOnly = message.media && message.media.length > 0 && (() => {
    const text = message.text || message.text_content
    const isDefaultMediaText = ["Sent a photo", "Sent a video", "Sent a document", "Attachment", "Sent an attachment"].includes(text?.trim() || "")
    return !text || isDefaultMediaText
  })() || false

  // Helper for dynamic classes
  const getBubbleClasses = () => {
    if (message.is_deleted_for_everyone || message.is_deleted_for_me) {
      return "italic text-sm py-2 px-4 shadow-none rounded-3xl bg-primary text-primary-foreground/75"
    }
    if (message.isBlocked) {
      return "bg-muted/30 text-muted-foreground italic border border-dashed border-border rounded-2xl rounded-tl-sm"
    }

    // Standard message styling
    const baseClasses = isMe
      ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
      : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border shadow-sm"

    const mediaOnlyClasses = "bg-transparent rounded-2xl"

    return isMediaOnly ? mediaOnlyClasses : baseClasses
  }

  const paddingClasses = (message.media && message.media.length > 0)
    ? "p-0 overflow-hidden"
    : "px-3 py-2 md:px-4 md:py-2.5"

  // Long press mobile detection
  const [showMobileActions, setShowMobileActions] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    if (message.is_deleted_for_everyone || message.is_deleted_for_me) return
    pressTimer.current = setTimeout(() => {
      setShowMobileActions(true)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
  }

  const handleMobileAction = (action: string) => {
    onAction?.(action, message)
    setShowMobileActions(false)
  }

  return (
    <>
      {showMobileActions && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity" 
          onClick={() => setShowMobileActions(false)} 
        />
      )}
      <div
        className={cn(
          "flex w-full mb-1 group transition-all relative",
          isMe ? "justify-end" : "justify-start",
          (message.is_deleted_for_everyone || message.is_deleted_for_me) ? "cursor-default" : "cursor-pointer"
        )}
        onClick={() => !message.is_deleted_for_everyone && !message.is_deleted_for_me && onMessageClick?.(message)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
      <div className={cn("max-w-[75%] md:max-w-[60%] flex flex-col", isMe ? "items-end" : "items-start")}>
        {showSenderName && !isMe && (
          <span className="text-xs text-muted-foreground mb-1 ml-1 font-medium">
            {message.senderName || "Unknown"}
          </span>
        )}

        <div
          className={cn(
            "relative break-words text-sm md:text-base w-full transition-colors",
            paddingClasses,
            getBubbleClasses(),
            (isSelected || showMobileActions) && "ring-2 ring-primary ring-offset-1 ring-offset-background"
          )}
        >
          {isEditing ? (
            <MessageEditor
              message={message}
              isEditing={isEditing}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          ) : (
            <>
              <SharedPostCard message={message} onMediaLoad={onMediaLoad} />
              {message.sharedProfileId && message.sharedProfileType && (
                <div className="mt-1 mb-2">
                  <ProfilePreviewCard
                    profile={message.sharedProfile || { name: "Profile", avatar: null }}
                    profileId={message.sharedProfileId}
                    profileType={message.sharedProfileType}
                  />
                </div>
              )}
              {/* Universal Entity Preview — for new share messages */}
              {message.entityType && message.entityId && !message.sharedPost && !message.sharedProfileId && (
                <div className="mt-1 mb-2">
                  <EntityPreviewCard
                    entityType={message.entityType}
                    entityId={message.entityId}
                  />
                </div>
              )}
              <MessageMedia
                message={message}
                isMediaOnly={isMediaOnly}
                onMediaClick={onMediaClick}
                onMediaLoad={onMediaLoad}
              />
              <MessageText
                message={message}
                isMediaOnly={isMediaOnly}
                isMe={isMe}
              />
            </>
          )}
        </div>

        {/* Desktop Action Menu (Three dots) */}
        {!isEditing && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (
          <div className={cn(
            "absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded-full hidden md:block",
            isMe ? "-left-8" : "-right-8"
          )}>
            <MessageMenu message={message} onAction={onAction} />
          </div>
        )}
      </div>

      {/* Mobile Action Bottom Sheet */}
      {showMobileActions && (
        <div className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-2xl shadow-xl overflow-hidden md:hidden animate-in slide-in-from-bottom flex flex-col text-sm font-medium">
          <div className="flex justify-center p-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>
          <button 
            className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left"
            onClick={() => handleMobileAction('copy')}
          >
            <Copy className="w-5 h-5 text-muted-foreground" />
            <span>Copy</span>
          </button>
          {isMe && (
            <>
              <button 
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50"
                onClick={() => handleMobileAction('info')}
              >
                <Info className="w-5 h-5 text-muted-foreground" />
                <span>Info</span>
              </button>
              <button 
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50"
                onClick={() => handleMobileAction('edit')}
              >
                <Pencil className="w-5 h-5 text-muted-foreground" />
                <span>Edit</span>
              </button>
              <button 
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50 text-destructive"
                onClick={() => handleMobileAction('delete')}
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
    </>
  )
}

export default React.memo(MessageBubble, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.text === nextProps.message.text &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.showSenderName === nextProps.showSenderName &&
    prevProps.message.is_deleted_for_everyone === nextProps.message.is_deleted_for_everyone &&
    prevProps.message.is_deleted_for_me === nextProps.message.is_deleted_for_me &&
    prevProps.message.is_edited === nextProps.message.is_edited &&
    prevProps.message.isBlocked === nextProps.message.isBlocked &&
    prevProps.message.media === nextProps.message.media &&
    prevProps.message.sharedProfile === nextProps.message.sharedProfile &&
    prevProps.message.entityType === nextProps.message.entityType &&
    prevProps.message.entityId === nextProps.message.entityId
  )
})
