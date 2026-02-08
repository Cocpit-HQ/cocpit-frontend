"use client"

import React from "react"
import { Message } from "@/types/messaging"

interface MessageBubbleProps {
  message: Message
}

import { useRouter } from "next/navigation"
import { Check, CheckCheck, MoreVertical, Info, Copy, Pencil, Trash2 } from "lucide-react" // Added icons
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useState, useEffect, useRef } from "react"
// ... imports

interface MessageBubbleProps {
  message: Message
  onAction?: (action: string, message: Message) => void
  isEditing?: boolean
  onSaveEdit?: (text: string) => void
  onCancelEdit?: () => void
  isSelected?: boolean
  onMessageClick?: (message: Message) => void
}

export default function MessageBubble({ message, onAction, isEditing, onSaveEdit, onCancelEdit, isSelected, onMessageClick }: MessageBubbleProps) {
  const isMe = message.sender === "me"
  const router = useRouter()
  const [editText, setEditText] = useState(message.text || message.text_content || "")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing) {
      setEditText(message.text || message.text_content || "")
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length)
          // Initial resize
          textareaRef.current.style.height = "auto"
          textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
        }
      }, 0)
    }
  }, [isEditing, message])

  // Auto-resize on text change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [editText])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSaveEdit?.(editText)
    } else if (e.key === 'Escape') {
      onCancelEdit?.()
    }
  }

  return (
    <div
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-1 group ${message.is_deleted_for_everyone ? "cursor-default" : "cursor-pointer"}`}
      onClick={() => !message.is_deleted_for_everyone && onMessageClick?.(message)}
    >
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`px-3 py-2 md:px-4 md:py-2.5 relative break-words text-sm md:text-base w-full transition-colors ${isSelected ? "bg-primary/20 ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
            } ${message.is_deleted_for_everyone
              ? `italic text-sm py-2 px-4 shadow-none rounded-3xl ${isMe ? "bg-primary text-primary-foreground/75" : "bg-muted text-muted-foreground"}`
              : message.isBlocked
                ? "bg-muted/30 text-muted-foreground italic border border-dashed border-border rounded-2xl rounded-tl-sm"
                : isMe
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                  : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border shadow-sm"
            }`}
        >
          {isEditing ? (
            <div className="flex flex-col gap-1">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent outline-none resize-none p-0 text-inherit leading-snug overflow-hidden"
                rows={1}
              />
            </div>
          ) : (
            <>
              {message.sharedPost && (
                <div
                  className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden max-w-[280px] cursor-pointer hover:bg-background/80 transition-all shadow-sm group"
                  onClick={() => router.push(`/post/${message.sharedPost?.id}`)}
                  role="button"
                  tabIndex={0}
                >
                  {/* ... Shared Post Content (Keep same) ... */}
                  {/* Simplify for brevity in replace, but assuming strict replacement... I need to include the sharedPost content if I replace the whole block. 
                       Wait, I should probably target smaller chunks or ensure I copy the sharedPost logic correctly. 
                       The sharedPost logic is long. I'll use multi_replace or be careful.
                       Actually, I can wrap the content in a fragment logic.
                   */}
                  <div className="p-3 border-b border-white/10 flex items-center gap-2.5">
                    {/* ... (rest of shared post logic from original file) ... */}
                    {/* Placeholder for brevity: reusing existing logic if I can. 
                        But replace_file_content requires exact match. 
                        The sharedPost block is lines 46-96. 
                        I will copy it exactly.
                    */}
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden ring-1 ring-white/20">
                      <img src={message.sharedPost.authorAvatar || '/assets/pngegg.png'} alt={message.sharedPost.author} className="w-full h-full object-cover" />
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
                            preload="metadata" // Load first frame
                            muted
                            playsInline
                          />
                          {/* Play Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img src={message.sharedPost.media[0].url} className="w-full h-full object-cover" loading="lazy" />
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
              )}
              <span className="leading-snug block">
                {message.is_deleted_for_everyone ? "This message was deleted" : message.text}
                {message.is_edited && !message.is_deleted_for_everyone && <span className="text-[10px] opacity-60 ml-1 italic">(edited)</span>}
              </span>

              {/* Metadata: Time only, no ticks */}
              <div className={`flex items-center gap-1 justify-end mt-1 ${message.is_deleted_for_everyone ? (isMe ? "text-primary-foreground/60" : "text-muted-foreground") : (isMe ? "text-primary-foreground/70" : "text-muted-foreground/70")}`}>
                <span className="text-[10px]">
                  {message.time}
                </span>
              </div>
            </>
          )}
        </div>
        {!isEditing && !message.is_deleted_for_everyone && (
          <div className={`absolute top-0 ${isMe ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity bg-background/50 rounded-full`}>
            <MessageMenu message={message} onAction={onAction} />
          </div>
        )}
      </div>
    </div>
  )
}

function MessageMenu({ message, onAction }: { message: Message, onAction?: (action: string, message: Message) => void }) {
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
