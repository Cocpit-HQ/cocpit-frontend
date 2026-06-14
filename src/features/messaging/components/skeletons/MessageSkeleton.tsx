import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MessageSkeletonProps {
  sender?: 'me' | 'them'
  type?: 'text' | 'media'
}

export function MessageSkeleton({ sender = 'them', type = 'text' }: MessageSkeletonProps) {
  const isMe = sender === 'me'

  return (
    <div
      className={cn(
        "flex w-full py-1 mb-[12px]",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn("flex flex-col w-full relative", isMe ? "items-end" : "items-start")}>
        {/* ROW 1: Bubble — indented 32px for opponent to align after avatar space */}
        <div className={cn("flex w-full items-center", isMe ? "justify-end" : "justify-start pl-[32px]")}>
          <div className="relative max-w-[70%] md:max-w-[85%] flex">
            {type === 'media' ? (
              // Media/Post card skeleton: fixed height/width matching post card
              <div className="w-[280px] rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 p-3 flex flex-col gap-2">
                {/* Header: avatar + title */}
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex flex-col gap-1 w-full">
                    <Skeleton className="h-3 w-[100px] rounded" />
                    <Skeleton className="h-2 w-[60px] rounded" />
                  </div>
                </div>
                {/* Media Image Area: fixed aspect ratio aspect-[4/3] */}
                <Skeleton className="w-full aspect-[4/3] rounded-lg" />
                {/* Content area: lines */}
                <div className="space-y-1.5 mt-1">
                  <Skeleton className="h-2.5 w-full rounded" />
                  <Skeleton className="h-2.5 w-[90%] rounded" />
                </div>
              </div>
            ) : (
              // Text message skeleton: height matching text bubble, varying width
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 min-w-[120px] max-w-[300px]",
                  isMe
                    ? "bg-[var(--primary)]/20 rounded-tr-sm"
                    : "bg-[var(--primary-tint)]/40 rounded-tl-sm"
                )}
              >
                <div className="flex flex-col gap-1.5">
                  <Skeleton className={cn("h-3.5 rounded", isMe ? "w-[180px]" : "w-[160px]")} />
                  <Skeleton className={cn("h-3.5 rounded", isMe ? "w-[120px]" : "w-[140px]")} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Avatar + Time */}
        {!isMe && (
          <div className="flex flex-row items-center gap-[8px] mt-[2px]">
            <div className="w-[24px] h-[24px] shrink-0">
              <Skeleton className="w-[24px] h-[24px] rounded-full" />
            </div>
            <Skeleton className="h-3 w-[40px] rounded" />
          </div>
        )}
        {isMe && (
          <div className="flex flex-row items-center justify-end gap-[8px] mt-[4px]">
            <Skeleton className="h-3 w-[14px] rounded-full" />
            <Skeleton className="h-3 w-[40px] rounded" />
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageSkeleton
