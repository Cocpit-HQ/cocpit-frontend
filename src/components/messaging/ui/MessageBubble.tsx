"use client"

import React from "react"
import { Message } from "@/types/messaging"

interface MessageBubbleProps {
  message: Message
}

import { useRouter } from "next/navigation"

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isMe = message.sender === "me"
  const router = useRouter()

  return (
    <div className={`flex w-full ${isMe ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isMe ? "items-end" : "items-start"}`}>
        <div
          className={`px-3 py-2 md:px-4 md:py-2.5 relative break-words text-sm md:text-base ${isMe
            ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
            : "bg-muted text-foreground rounded-2xl rounded-tl-sm border border-border shadow-sm"
            }`}
        >
          {message.sharedPost && (
            <div
              className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden max-w-[280px] cursor-pointer hover:bg-background/80 transition-all shadow-sm group"
              onClick={() => router.push(`/post/${message.sharedPost?.id}`)}
              role="button"
              tabIndex={0}
            >
              {/* Header */}
              <div className="p-3 border-b border-white/10 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden ring-1 ring-white/20">
                  <img src={message.sharedPost.authorAvatar || '/assets/pngegg.png'} alt={message.sharedPost.author} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold truncate leading-none mb-0.5">{message.sharedPost.author}</span>
                  <span className="text-[10px] text-muted-foreground leading-none">Shared a post</span>
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
          <span className="leading-snug block">{message.text}</span>
        </div>
        {message.isLastInGroup && (
          <span className="text-[10px] mt-1 px-1 text-muted-foreground">
            {message.time}
          </span>
        )}
      </div>
    </div>
  )
}
