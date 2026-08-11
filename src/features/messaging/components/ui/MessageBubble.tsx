"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Message } from "@/types/messaging"
import { Job } from "@/types/jobs"
import { getJobById } from "@/services/api/jobs"
import { useQuery } from "@tanstack/react-query"
import { MoreVertical, Info, Copy, Pencil, Trash2, Check, CheckCheck, Smile, Reply } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ProfilePreviewCard } from "../../ProfilePreviewCard"
import { EntityPreviewCard } from "../../EntityPreviewCard"
import Avatar from "@/components/shared/Avatar"
import { Icon } from "@iconify/react"
import RepliedMessageBox from "../RepliedMessageBox"
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react"
import { useTheme } from "next-themes"
import { ReactionListPopup } from "../ReactionListPopup"
import { createPortal } from "react-dom"
import { useActiveProfile } from "@/context/ActiveProfileContext"

import UnavailableContentCard from "./UnavailableContentCard"

const CustomReplyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className}>
    <path d="M0 0h32v32H0z" fill="none" />
    <path fill="currentColor" d="M28.88 30a1 1 0 0 1-.88-.5A15.19 15.19 0 0 0 15 22v6a1 1 0 0 1-.62.92a1 1 0 0 1-1.09-.21l-12-12a1 1 0 0 1 0-1.42l12-12a1 1 0 0 1 1.09-.21A1 1 0 0 1 15 4v6.11a17.19 17.19 0 0 1 15 17a16 16 0 0 1-.13 2a1 1 0 0 1-.79.86ZM14.5 20A17.62 17.62 0 0 1 28 26a15.31 15.31 0 0 0-14.09-14a1 1 0 0 1-.91-1V6.41L3.41 16L13 25.59V21a1 1 0 0 1 1-1h.54Z" />
  </svg>
)

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
  isGroup?: boolean
  showAvatar?: boolean
  showTime?: boolean
  isOpponentOnline?: boolean
  onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void
  onMediaLoad?: () => void
  onReply?: (message: Message) => void
  onReplyClick?: (messageId: string) => void
  isHighlighted?: boolean
  onReaction?: (message: Message, emoji: string) => void
  currentUserId?: string
  conversationId?: string
  otherUserType?: "COMPANY" | "USER"
  otherUserSlug?: string
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

const MessageMenu = ({ message, onAction, currentUserId }: { message: Message, onAction?: (action: string, message: Message) => void, currentUserId?: string }) => {
  if (!onAction) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1 hover:bg-[var(--primary-tint)] rounded-full transition-colors text-muted-foreground">
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
        <DropdownMenuItem onClick={() => onAction('delete_for_me', message)} className="text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" /> Delete for me
        </DropdownMenuItem>
        {(message.senderId === currentUserId || message.sender === 'me') && (
          <DropdownMenuItem onClick={() => onAction('delete_for_everyone', message)} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Delete for everyone
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const safeGetJobById = async (id: string): Promise<Job | { notFound: boolean; message: string }> => {
  try {
    const job = await getJobById(id);
    return job;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || 'Job not found';
    return { notFound: true, message: msg };
  }
};

function JobApplicationContextCard({ entityType, entityId, conversationId }: { entityType: 'job' | 'offer', entityId: string, conversationId?: string }) {
  const router = useRouter()
  const { data: job, isLoading: loading, error } = useQuery({
    queryKey: ['jobContext', entityType, entityId],
    queryFn: async () => {
      if (entityType === 'job') {
        return safeGetJobById(entityId);
      } else if (entityType === 'offer') {
        const { getOfferDetail } = await import('@/services/api/offers');
        const data = await getOfferDetail(entityId);
        if (data && data.job_id) {
          return safeGetJobById(data.job_id);
        }
      }
      return null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: false,
  });

  const wrapperClass = "mb-[8px] rounded-[32px] p-[8px] pr-[16px] w-full max-w-[260px] h-[66px] min-h-[66px] flex items-center justify-start border box-border shadow-sm overflow-hidden";

  if (loading) {
    return (
      <div className={cn(wrapperClass, "bg-[#EEF2FF] dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 animate-pulse")}>
        <div className="flex flex-row items-center gap-[12px] w-full">
          <div className="w-[48px] h-[48px] rounded-full bg-indigo-200/50 dark:bg-indigo-900/50 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="h-3.5 bg-indigo-200/50 dark:bg-indigo-900/50 rounded w-3/4" />
            <div className="h-3 bg-indigo-200/50 dark:bg-indigo-900/50 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const isNotFound = job && typeof job === 'object' && 'notFound' in job;

  if (error || !job || isNotFound) {
    const errMsg = isNotFound ? (job as any).message : ((error as any)?.response?.data?.message || (error as any)?.message || 'Job not found');
    return (
      <div className={cn(wrapperClass, "bg-[#EEF2FF] dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 gap-[10px]")}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-[20px] h-[20px] text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
        </svg>
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-['Poppins'] font-normal italic truncate">{errMsg}</p>
      </div>
    );
  }

  const jobId = (job as any).jobId || job.id;

  const handleClick = (e: React.MouseEvent) => {
    // Prevent the click from bubbling to the message row, which would
    // otherwise toggle message selection instead of navigating.
    e.stopPropagation();
    const returnTo = conversationId ? `/messaging?conversationId=${conversationId}` : '/messaging';
    router.push(`/jobs/${jobId}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  return (
    <div
      className={cn(wrapperClass, "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors")}
      onClick={handleClick}
    >
      <div className="flex flex-row items-center gap-[12px] w-full min-w-0">
        {/* Job poster's avatar: the org's logo if this job was posted by a
            company, or the individual recruiter's own picture if it's a
            personal posting — always the job's poster, regardless of which
            side of the conversation shared this card. job.logo is a gradient
            placeholder key (e.g. "gradient-3"), not a URL — never used as an img src. */}
        <div className="w-[48px] h-[48px] rounded-full bg-primary/10 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 text-primary">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
          ) : (
            <Icon icon="mynaui:briefcase-business" className="w-[24px] h-[24px]" />
          )}
        </div>

        {/* Job Details */}
        <div className="flex flex-col overflow-hidden text-left flex-1 justify-center min-w-0">
          <span className="font-['Poppins'] font-medium text-[15px] leading-[18px] text-gray-900 dark:text-gray-100 truncate block">
            {job.title} @ {job.company}
          </span>
          <span className="font-['Poppins'] font-normal text-[13px] leading-[16px] text-[#6B7280] dark:text-gray-400 truncate mt-[2px] block">
            {job.workMode || (job as any).work_mode || 'Hybrid'} • {job.location || 'Remote'}
          </span>
        </div>
      </div>
    </div>
  );
}


const SharedPostCard = ({ message, onMediaLoad }: { message: Message, onMediaLoad?: () => void }) => {
  const router = useRouter()
  const [loadedPost, setLoadedPost] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  const rawText = message.text || message.text_content || ""
  const postUrlRegex = /(?:https?:\/\/[^\/\s]+)?\/post\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})/i
  const match = rawText.match(postUrlRegex)
  const extractedPostId = match ? match[1] : null

  useEffect(() => {
    if (message.sharedPost || !extractedPostId) {
      setLoadedPost(null)
      return
    }

    let isMounted = true
    const fetchPost = async () => {
      setLoading(true)
      try {
        const { getPostById } = await import("@/services/api/posts")
        const backendPost = await getPostById(extractedPostId)
        if (isMounted) {
          if ((backendPost as any).is_active === false || (backendPost as any).is_removed) {
            setFetchError(true);
            return;
          }
          const media = backendPost.media?.map(m => ({
            url: m.url,
            type: m.media_type as 'image' | 'video'
          })) || []

          setLoadedPost({
            id: backendPost.post_id,
            content: backendPost.content || "",
            author: backendPost.author_name || "Unknown",
            authorAvatar: backendPost.author_avatar || "/assets/pngegg.png",
            media: media
          })
        }
      } catch (err: any) {
        if (isMounted) {
          setFetchError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchPost()
    return () => {
      isMounted = false
    }
  }, [message.sharedPost, extractedPostId])

  const hasSharedPost = Boolean(message.sharedPost || (message as any).sharedPostId || (message as any).shared_post_id || extractedPostId);

  if (!hasSharedPost) {
    return null;
  }

  const isPostUnavailable = Boolean(
    fetchError ||
    (message as any).is_unavailable || 
    (message as any).isUnavailable || 
    (message as any).is_blocked || 
    message.senderName === 'Unknown Page' || 
    message.senderName === 'Unknown user' ||
    message.sharedPost?.author === 'Unknown Page' ||
    message.sharedPost?.author === 'Unknown user' ||
    message.sharedPost?.author === 'Unknown Author'
  );

  if (isPostUnavailable) {
    return <UnavailableContentCard />;
  }

  const postToRender = message.sharedPost || loadedPost

  if (!postToRender) {
    if (loading) {
      return (
        <div className="mt-1 mb-2 rounded-xl bg-background/60 backdrop-blur-sm border border-white/10 overflow-hidden max-w-[280px] w-full animate-pulse">
          <div className="p-3 border-b border-white/10 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-muted shrink-0" />
            <div className="flex flex-col gap-1 flex-1">
              <div className="h-2.5 bg-muted rounded w-2/3" />
              <div className="h-2 bg-muted rounded w-1/3" />
            </div>
          </div>
          <div className="w-full aspect-[4/3] bg-muted relative" />
          <div className="p-3 space-y-1">
            <div className="h-2 bg-muted rounded w-full" />
            <div className="h-2 bg-muted rounded w-5/6" />
          </div>
        </div>
      )
    }
    return <UnavailableContentCard />;
  }

  return (
    <div
      className="mb-2.5 rounded-[24px] bg-white border border-[#EEF2FF] p-3 w-full max-w-[260px] cursor-pointer hover:bg-gray-50/90 transition-all shadow-[0px_2px_4px_rgba(99,102,241,0.05)] overflow-hidden"
      onClick={() => router.push(`/post/${postToRender.id}`)}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-row items-center gap-[10px] w-full min-w-0">
        {/* Avatar pill frame 2608515 */}
        <div className="w-[52px] h-[36px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={postToRender.authorAvatar || '/assets/pngegg.png'}
            alt={postToRender.author}
            className="w-full h-full object-cover rounded-[24px]"
          />
        </div>
        {/* Author info frame 2608692 */}
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className="font-['Poppins'] font-medium text-[12px] leading-[16px] text-black truncate block">
            {postToRender.author || postToRender.content}
          </span>
          {Boolean(postToRender.subtext || postToRender.location) && (
            <span className="font-['Poppins'] font-normal text-[10px] leading-[15px] text-[#6B7280] truncate block">
              {postToRender.subtext || postToRender.location || ""}
            </span>
          )}
        </div>
      </div>

      {/* Media Preview (if present) */}
      {postToRender.media && postToRender.media.length > 0 && (
        <div className="w-full aspect-[4/3] bg-black relative rounded-xl overflow-hidden mt-2">
          {postToRender.media[0].type === 'video' ? (
            <div className="w-full h-full relative flex items-center justify-center">
              <video
                src={postToRender.media[0].url}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                preload="metadata"
                muted
                playsInline
                onLoadedMetadata={onMediaLoad}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                </div>
              </div>
            </div>
          ) : (
            <img
              src={postToRender.media[0].url}
              alt="Post preview"
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={onMediaLoad}
            />
          )}
        </div>
      )}
    </div>
  )
}

const ImageMediaItem = ({
  item,
  index,
  isLastOdd,
  mediaLength,
  onMediaLoad,
  onMediaClick
}: {
  item: { url: string; type: string };
  index: number;
  isLastOdd: boolean;
  mediaLength: number;
  onMediaLoad?: () => void;
  onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void;
}) => {
  const [aspectClass, setAspectClass] = useState<string>(
    mediaLength === 1 ? "aspect-[4/3]" : "aspect-square"
  );

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (mediaLength === 1) {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      const ratio = naturalWidth / naturalHeight;
      if (ratio > 1.5) {
        setAspectClass("aspect-[16/9]");
      } else if (ratio < 0.8) {
        setAspectClass("aspect-[3/4]");
      } else if (ratio >= 0.8 && ratio <= 1.2) {
        setAspectClass("aspect-square");
      } else {
        setAspectClass("aspect-[4/3]");
      }
    }
    onMediaLoad?.();
  };

  return (
    <div
      className={cn(
        "relative bg-black/5 flex items-center justify-center overflow-hidden w-full",
        isLastOdd && mediaLength > 1 ? "col-span-2 aspect-[2/1]" : aspectClass
      )}
    >
      <img
        src={item.url}
        alt="Attached image"
        className="w-full h-full object-cover cursor-pointer"
        loading="lazy"
        onLoad={handleImageLoad}
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick?.(item.url, 'image', `Image-${index + 1}`);
        }}
      />
    </div>
  );
};

const VideoMediaItem = ({
  item,
  index,
  isLastOdd,
  mediaLength,
  onMediaLoad,
  onMediaClick
}: {
  item: { url: string; type: string };
  index: number;
  isLastOdd: boolean;
  mediaLength: number;
  onMediaLoad?: () => void;
  onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void;
}) => {
  const [aspectClass, setAspectClass] = useState<string>(
    mediaLength === 1 ? "aspect-[4/3]" : "aspect-square"
  );

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (mediaLength === 1) {
      const video = e.currentTarget;
      const ratio = video.videoWidth / video.videoHeight;
      if (ratio > 1.5) {
        setAspectClass("aspect-[16/9]");
      } else if (ratio < 0.8) {
        setAspectClass("aspect-[3/4]");
      } else if (ratio >= 0.8 && ratio <= 1.2) {
        setAspectClass("aspect-square");
      } else {
        setAspectClass("aspect-[4/3]");
      }
    }
    onMediaLoad?.();
  };

  return (
    <div
      className={cn(
        "relative bg-black/5 flex items-center justify-center overflow-hidden w-full",
        isLastOdd && mediaLength > 1 ? "col-span-2 aspect-[2/1]" : aspectClass
      )}
    >
      <div
        className="w-full h-full relative cursor-pointer group/media"
        onClick={(e) => {
          e.stopPropagation();
          onMediaClick?.(item.url, 'video', `Video-${index + 1}`);
        }}
      >
        <video
          src={item.url}
          className="w-full h-full object-cover pointer-events-none"
          preload="metadata"
          onLoadedMetadata={handleVideoMetadata}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] group-hover/media:bg-black/10 transition-colors">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg group-hover/media:scale-110 transition-transform">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageMedia = ({ message, isMediaOnly, onMediaClick, onMediaLoad }: { message: Message, isMediaOnly: boolean, onMediaClick?: (url: string, type: 'image' | 'video' | 'document', name?: string) => void, onMediaLoad?: () => void }) => {
  if (!message.media || message.media.length === 0 || message.is_deleted_for_everyone || message.is_deleted_for_me) return null

  return (
    <div className={cn(
      "grid gap-1 overflow-hidden w-full",
      isMediaOnly ? "rounded-[12px]" : "rounded-t-[12px]",
      message.media.length === 1 ? "grid-cols-1" :
        message.media.length === 2 ? "grid-cols-2" :
          "grid-cols-2"
    )}>
      {message.media.map((item, index) => {
        const isLastOdd = message.media!.length % 2 !== 0 && index === message.media!.length - 1

        if (item.type === 'video') {
          return (
            <VideoMediaItem
              key={index}
              item={item}
              index={index}
              isLastOdd={isLastOdd}
              mediaLength={message.media!.length}
              onMediaLoad={onMediaLoad}
              onMediaClick={onMediaClick}
            />
          )
        }

        if (item.type === 'document') {
          const displayName = item.name || `Document-${index + 1}`;
          const fileExt = item.name?.includes('.') ? item.name.split('.').pop()!.toLowerCase() : '';
          const isWordDoc = fileExt === 'doc' || fileExt === 'docx';
          const docIcon = isWordDoc ? 'selfhst:google-docs' : 'material-icon-theme:pdf';
          const extLabel = fileExt ? fileExt.toUpperCase() : 'PDF';
          return (
            <div
              key={index}
              className="relative bg-black/5 flex items-center justify-center overflow-hidden w-full max-w-[300px]"
            >
              <div className={cn("relative w-full", isMediaOnly ? "bg-muted/40" : "")}>
                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    onMediaClick?.(item.url, 'document', item.name || displayName)
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 transition-colors w-full min-w-[200px] cursor-pointer rounded-[12px_12px_0px_12px]",
                    isMediaOnly ? "bg-secondary/40 hover:bg-secondary/60" : "bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-background dark:bg-background/40 flex items-center justify-center shrink-0">
                    <Icon icon={docIcon} className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 mr-8">
                    <p className="text-sm font-medium truncate opacity-90">{displayName}</p>
                    <p className="text-xs text-muted-foreground uppercase">{extLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        return (
          <ImageMediaItem
            key={index}
            item={item}
            index={index}
            isLastOdd={isLastOdd}
            mediaLength={message.media!.length}
            onMediaLoad={onMediaLoad}
            onMediaClick={onMediaClick}
          />
        )
      })}
    </div>
  )
}

import { Mention } from "./MentionCard"

const JobCardSkeleton = () => {
  return (
    <div className="border rounded-xl p-4 w-[320px] max-w-full bg-white dark:bg-zinc-900 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
};

const JobCard = ({ job, onClick }: { job: Job, onClick: (e: React.MouseEvent) => void }) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer border rounded-xl p-4 w-[340px] max-w-full bg-white dark:bg-zinc-900 hover:shadow-md transition"
    >
      <div className="flex gap-3">
        {/* Logo / Initial */}
        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
          ) : (
            <Icon icon="mynaui:briefcase-business" className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Job Title */}
          <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate">
            {job.title}
          </p>

          {/* Company */}
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {job.company}
          </p>

          {/* Meta Info */}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
            {job.location}{job.workMode ? ` • ${job.workMode}` : ''}{job.type ? ` • ${job.type}` : ''}
          </p>

          {/* Experience */}
          {job.experience && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {job.experience}
            </p>
          )}
        </div>

        {/* Right Side */}
        <div className="flex flex-col items-end justify-end shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(e);
            }}
            className="text-blue-600 dark:text-blue-400 text-xs font-medium mt-auto"
          >
            View job
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-gray-400 mt-3 border-t border-gray-100 dark:border-zinc-800 pt-2">
        {job.postedTime || job.createdAt || "Just now"}
      </p>
    </div>
  );
};

const JobPreview = ({ jobId }: { jobId: string }) => {
  const [job, setJob] = useState<Job | { notFound: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    safeGetJobById(jobId)
      .then(data => {
        if (mounted) {
          setJob(data);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [jobId]);

  const wrapperClass = "mb-[8px] rounded-[32px] p-[8px] pr-[16px] w-full max-w-[260px] h-[66px] min-h-[66px] flex items-center justify-start border box-border shadow-sm overflow-hidden";

  if (loading) {
    return (
      <div className={cn(wrapperClass, "bg-[#EEF2FF] dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 animate-pulse")}>
        <div className="flex flex-row items-center gap-[12px] w-full">
          <div className="w-[48px] h-[48px] rounded-full bg-indigo-200/50 dark:bg-indigo-900/50 shrink-0" />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="h-3.5 bg-indigo-200/50 dark:bg-indigo-900/50 rounded w-3/4" />
            <div className="h-3 bg-indigo-200/50 dark:bg-indigo-900/50 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const isNotFound = job && typeof job === 'object' && 'notFound' in job;

  if (!job || isNotFound) {
    const errMsg = isNotFound ? (job as any).message : 'Job not found';
    return (
      <div className={cn(wrapperClass, "bg-[#EEF2FF] dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 gap-[10px]")}>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-[20px] h-[20px] text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
        </svg>
        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-['Poppins'] font-normal italic truncate">{errMsg}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(wrapperClass, "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors")}
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/jobs/${jobId}`);
      }}
    >
      <div className="flex flex-row items-center gap-[12px] w-full min-w-0">
        {/* Job poster's avatar */}
        <div className="w-[48px] h-[48px] rounded-full bg-primary/10 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 text-primary">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
          ) : (
            <Icon icon="mynaui:briefcase-business" className="w-[24px] h-[24px]" />
          )}
        </div>

        {/* Job Details */}
        <div className="flex flex-col overflow-hidden text-left flex-1 justify-center min-w-0">
          <span className="font-['Poppins'] font-medium text-[15px] leading-[18px] text-gray-900 dark:text-gray-100 truncate block">
            {job.title} @ {job.company}
          </span>
          <span className="font-['Poppins'] font-normal text-[13px] leading-[16px] text-[#6B7280] dark:text-gray-400 truncate mt-[2px] block">
            {job.workMode || (job as any).work_mode || 'Hybrid'} • {job.location || 'Remote'}
          </span>
        </div>
      </div>
    </div>
  );
};


const MessageText = ({
  message,
  isMediaOnly,
  isMe
}: {
  message: Message,
  isMediaOnly: boolean,
  isMe: boolean
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter()
  if (isMediaOnly) return null

  // If the message text contains only a post/org/profile/job/offer URL or entity link, hide it
  const rawText = message.text || message.text_content || "";
  const trimmedText = rawText.trim();
  const entityUrlRegex = /^(?:https?:\/\/[^\/\s]+)?\/(?:post|profile|organization|job|offer|channel|article)\/[^\s]+$/i;
  const postUrlRegex = /^(?:https?:\/\/[^\/\s]+)?\/post\/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})\/?$/i;
  const profileUrlRegex = /^(?:https?:\/\/[^\/\s]+)?\/(?:profile|organization|messaging)\b.*$/i;

  if (
    message.is_unavailable ||
    entityUrlRegex.test(trimmedText) ||
    postUrlRegex.test(trimmedText) || 
    (message.sharedProfileId && (profileUrlRegex.test(trimmedText) || trimmedText === "Shared a profile" || !trimmedText))
  ) {
    return null;
  }

  const renderTextWithMentions = (text: string) => {
    if (!text) return null

    // Support structured mentions, legacy mentions, AND Job URLs
    const combinedRegex = /(https?:\/\/[^\s]+\/jobs\/[a-zA-Z0-9-]+(?:\?[^\s]*)?)|(@\[[^\]]+\]\([^)]+\)|@[a-zA-Z0-9_.\-]+)/g
    const parts = text.split(combinedRegex)

    if (parts.length <= 1) return text

    return parts.map((part, i) => {
      if (!part) return null;

      // 1. Handle Job URL
      if (part.match(/^https?:\/\/[^\s]+\/jobs\/[a-zA-Z0-9-]+(?:\?[^\s]*)?$/)) {
        const match = part.match(/^https?:\/\/[^\s]+\/jobs\/([a-zA-Z0-9-]+)(?:\?[^\s]*)?$/);
        const jobId = match?.[1];
        if (jobId) {
          return (
            <div key={i} className="my-2 max-w-full overflow-hidden">
              <JobPreview jobId={jobId} />
            </div>
          );
        }
      }

      // 2. Handle Structured Mentions (@[Display Name](handle))
      const structuredMatch = part.match(/^@\[([^\]]+)\]\(([^)]+)\)$/);
      if (structuredMatch) {
        const username = structuredMatch[2];
        return (
          <Mention key={i} username={username} isMe={isMe}>
            <span
              className={cn(
                "hover:underline cursor-pointer font-bold font-['Poppins'] font-medium text-[12px]",
                isMe ? "text-[var(--primary-foreground)]" : "text-[var(--primary)]"
              )}
            >
              @{username}
            </span>
          </Mention>
        );
      }

      // 3. Handle Simple Mentions (@username)
      const simpleMatch = part.match(/^@([a-zA-Z0-9_.\-]+)$/);
      if (simpleMatch) {
        const username = simpleMatch[1];
        return (
          <Mention key={i} username={username} isMe={isMe}>
            <span
              className={cn(
                "hover:underline cursor-pointer font-['Poppins'] font-medium text-[12px]",
                isMe ? "text-[var(--primary-foreground)]" : "text-[var(--primary)]"
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

  const words = rawText.split(/\s+/);
  const isLong = words.length > 50;
  const textToShow = isLong && !isExpanded ? words.slice(0, 50).join(" ") + "..." : rawText;

  return (
    <div className={cn(message.media && message.media.length > 0 ? "px-3 py-2 md:px-4 md:py-2.5" : "")}>
      <span className="leading-snug block whitespace-pre-wrap break-words">
        {message.is_deleted_for_everyone
          ? "This message was deleted for everyone."
          : message.is_deleted_for_me
            ? "This message was deleted for you."
            : renderTextWithMentions(textToShow)}
        {isLong && !isExpanded && (
          <span
            className={cn(
              "font-['Poppins'] font-normal text-[12px] cursor-pointer ml-[4px] inline underline-offset-2 hover:underline",
              isMe ? "text-[var(--primary-foreground)]" : "text-[var(--primary)]"
            )}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }}
          >
            Read more
          </span>
        )}
        {isLong && isExpanded && (
          <span
            className={cn(
              "font-['Poppins'] font-normal text-[12px] cursor-pointer ml-[4px] inline underline-offset-2 hover:underline",
              isMe ? "text-[var(--primary-foreground)]" : "text-[var(--primary)]"
            )}
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          >
            Read less
          </span>
        )}
        {message.is_edited && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (
          <span className="text-[10px] opacity-60 ml-1 italic">(edited)</span>
        )}
      </span>
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
    <div className="flex flex-col gap-1 w-full min-w-[220px] sm:min-w-[300px] md:min-w-[400px] p-2.5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent outline-none resize-none p-1 text-inherit leading-snug overflow-hidden min-h-[40px]"
        rows={1}
      />
      <div className="flex justify-between items-center text-[10px] opacity-60 px-1 mt-1">
        <span>Enter to save, Esc to cancel</span>
      </div>
    </div>
  )
}

const JobOfferContextMessage = ({ jobId }: { jobId: string }) => {
  const [job, setJob] = useState<Job | { notFound: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    safeGetJobById(jobId)
      .then(data => {
        if (mounted) {
          setJob(data);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [jobId]);

  const getCityName = (loc: string) => {
    if (!loc) return '';
    if (loc.includes(',')) {
      return loc.split(',')[0].trim();
    }
    return loc.split(' ')[0];
  };

  if (loading) {
    return (
      <div className="w-full max-w-[740px] border border-[#EEF2FF] dark:border-zinc-800 rounded-[24px] p-[16px] bg-slate-50/50 dark:bg-zinc-900/50 animate-pulse flex flex-col md:flex-row justify-between items-center gap-[12px] mr-auto my-3 min-h-[116px]">
        <div className="flex flex-col items-start gap-[8px] flex-1">
          <div className="h-[24px] bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
        </div>
        <div className="flex flex-col items-start gap-[12px] shrink-0 w-[152px]">
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const isNotFound = job && typeof job === 'object' && 'notFound' in job;

  if (!job || isNotFound) {
    const errMsg = isNotFound ? (job as any).message : 'Job not found';
    return (
      <div className="w-full max-w-[740px] min-h-[116px] border border-[#EEF2FF] dark:border-zinc-800 rounded-[24px] p-[16px] bg-white dark:bg-zinc-950 flex items-center gap-3 mr-auto my-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
        </svg>
        <p className="font-['Poppins'] font-normal text-[14px] text-[#6B7280] italic">{errMsg}</p>
      </div>
    );
  }


  return (
    <div
      onClick={() => router.push(`/jobs/${jobId}`)}
      className="w-full max-w-[740px] border border-[#EEF2FF] dark:border-zinc-800 rounded-[24px] p-[16px] bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex flex-col md:flex-row justify-between items-center gap-[12px] mr-auto my-3 min-h-[116px]"
    >
      {/* Left side */}
      <div className="flex flex-col items-start gap-[8px] min-w-0">
        <h3 className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black dark:text-zinc-100 m-0 truncate">
          {job.title}
        </h3>
        <p className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] m-0 truncate">
          {job.company}
        </p>
        <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-[#6B7280] m-0">
          {job.type || 'Full time'}
        </span>
      </div>

      {/* Right side (icons) */}
      <div className="flex flex-col items-start gap-[12px] shrink-0">
        <div className="flex flex-row items-center gap-[8px]">
          <Icon icon="hugeicons:job-search" className="w-[20px] h-[20px] text-black dark:text-zinc-100 shrink-0" style={{ strokeWidth: '1.5px' }} />
          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black dark:text-zinc-100">
            {job.experience || '0-2Yrs'}
          </span>
        </div>
        <div className="flex flex-row items-center gap-[8px]">
          <Icon icon="hugeicons:location-05" className="w-[20px] h-[20px] text-black dark:text-zinc-100 shrink-0" style={{ strokeWidth: '1.5px' }} />
          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black dark:text-zinc-100">
            {job.workMode ? `${job.workMode} - ${getCityName(job.location)}` : getCityName(job.location)}
          </span>
        </div>
        {job.salary && job.salary !== 'Competitive' && (
          <div className="flex flex-row items-center gap-[8px]">
            <Icon icon="hugeicons:money-bag-02" className="w-[20px] h-[20px] text-black dark:text-zinc-100 shrink-0" style={{ strokeWidth: '1.5px' }} />
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black dark:text-zinc-100">
              {job.salary}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Component ---

function MessageBubble(props: MessageBubbleProps) {
  const router = useRouter()
  const { theme, resolvedTheme } = useTheme()
  const isDarkTheme = resolvedTheme === "dark" || theme === "dark" || theme === "navy"

  const {
    message,
    onAction,
    isEditing,
    onSaveEdit,
    onCancelEdit,
    isSelected,
    onMessageClick,
    showSenderName,
    isGroup,
    showAvatar,
    showTime = true,
    isOpponentOnline = false,
    onMediaClick,
    onMediaLoad,
    onReply,
    onReplyClick,
    isHighlighted,
    onReaction,
    currentUserId,
    conversationId,
    otherUserType,
    otherUserSlug,
  } = props

  const isMe = message.sender === "me"
  const resolvedShowAvatar = showAvatar !== undefined ? showAvatar : !isMe;

  // Helper to determine if message is media-only
  const isMediaOnly = message.media && message.media.length > 0 && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (() => {
    const text = message.text || message.text_content
    const isDefaultMediaText = ["Sent a photo", "Sent a video", "Sent a document", "Attachment", "Sent an attachment"].includes(text?.trim() || "")
    return !text || isDefaultMediaText
  })() || false

  // Helper to determine if message is profile-only
  const isProfileOnly = !!message.sharedProfileId && !message.is_deleted_for_everyone && !message.is_deleted_for_me;

  // Helper to determine if message is post-only
  const isPostOnly = !!message.sharedPost && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (() => {
    const text = (message.text || message.text_content || "").trim();
    const isJustUrl = /^https?:\/\/[^\s]+$/i.test(text);
    return !text || isJustUrl || text === "Shared a post";
  })();

  const { activeProfile } = useActiveProfile()
  const isCompanyProfile = activeProfile?.type === 'COMPANY'

  // Helper for dynamic classes
  const getBubbleClasses = () => {
    if (message.is_unavailable) {
      return isMe
        ? "bg-[var(--primary)] rounded-[12px_12px_0px_12px] shadow-sm"
        : "bg-[var(--primary-tint)] text-[var(--foreground)] rounded-[12px_12px_12px_0px] shadow-sm"
    }
    if (message.is_deleted_for_everyone || message.is_deleted_for_me) {
      return "italic text-sm shadow-none rounded-[12px] bg-muted/60 text-muted-foreground border border-dashed border-border"
    }
    if (message.isBlocked) {
      return "bg-muted/30 text-muted-foreground italic border border-dashed border-border rounded-[12px] rounded-bl-none"
    }

    if (message.repliedMessage && message.repliedMessage.senderName) {
      return isMe
        ? isCompanyProfile
          ? "box-border flex flex-col justify-center items-start bg-[#1A73E8] text-white rounded-[0px_0px_0px_12px] shadow-sm gap-[10px] w-full"
          : "box-border flex flex-col justify-center items-start bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[0px_0px_0px_12px] shadow-sm gap-[10px] w-full"
        : "box-border flex flex-col justify-center items-start bg-[var(--primary-tint)] text-[var(--foreground)] rounded-[12px_12px_12px_0px] gap-[10px] w-full"
    }

    // Standard message styling
    const baseClasses = isMe
      ? isCompanyProfile
        ? "bg-[#1A73E8] text-white rounded-[12px_12px_0px_12px] shadow-sm"
        : "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-[12px_12px_0px_12px] shadow-sm"
      : "bg-[var(--primary-tint)] text-[var(--foreground)] rounded-[12px_12px_12px_0px]"

    const mediaOnlyClasses = "bg-transparent rounded-[12px] overflow-hidden"

    return (isMediaOnly || isProfileOnly || isPostOnly) ? mediaOnlyClasses : baseClasses
  }

  const paddingClasses = isEditing
    ? "px-[16px] py-[16px]"
    : message.is_unavailable
      ? "px-[16px] py-[12px]"
      : (message.is_deleted_for_everyone || message.is_deleted_for_me)
        ? "px-[16px] py-[10px]"
        : ((message.media && message.media.length > 0) || isProfileOnly || isPostOnly)
          ? "p-0 overflow-hidden"
          : (message.repliedMessage && message.repliedMessage.senderName)
            ? "px-[8px] pt-[8px] pb-[16px]"
            : "px-[16px] py-[16px]"

  // Long press mobile detection
  const [showMobileActions, setShowMobileActions] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number } | null>(null)
  const [reactionListOpen, setReactionListOpen] = useState(false)
  const [reactionPopupPos, setReactionPopupPos] = useState<{ top: number; left: number } | null>(null)

  const handleReactionBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (reactionListOpen) {
      setReactionListOpen(false)
      setReactionPopupPos(null)
      return
    }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
    const popupW = 320
    const numReactions = message.reactions?.filter(r => r.emoji && r.emoji !== '').length || 0
    const estimatedH = Math.min(300, 60 + numReactions * 50)

    let top = rect.bottom + 8

    if (top + estimatedH > window.innerHeight - 10) {
      top = rect.top - estimatedH - 8
      if (top < 10) top = 10
    }

    let left = isMe ? rect.left - popupW + rect.width : rect.left
    if (left < 10) left = 10
    if (left + popupW > window.innerWidth - 10) left = window.innerWidth - popupW - 10

    setReactionPopupPos({ top, left })
    setReactionListOpen(true)
  }

  const handleEmojiButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (showEmojiPicker) {
      setShowEmojiPicker(false)
      setPickerPos(null)
      return
    }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect()
    // New 25% smaller picker size
    const pickerH = 340
    const pickerW = 310

    // Default position: below the icon
    let top = rect.bottom + 8

    // If it goes off the bottom of the screen, flip it above
    if (top + pickerH > window.innerHeight - 10) {
      top = rect.top - pickerH - 8

      // If it also goes off the top (e.g. very small screen), cap it to stay on screen
      if (top < 10) {
        top = 10
      }
    }

    // Horizontal positioning: align to the right edge if it's "my" message, else left
    let left = isMe ? rect.right - pickerW : rect.left
    if (left < 10) left = 10
    if (left + pickerW > window.innerWidth - 10) left = window.innerWidth - pickerW - 10

    setPickerPos({ top, left })
    setShowEmojiPicker(true)
  }

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setShowEmojiPicker(false)
    setPickerPos(null)
    onReaction?.(message, emojiData.emoji)
  }

  // Close picker on ESC
  useEffect(() => {
    if (!showEmojiPicker) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setShowEmojiPicker(false); setPickerPos(null) } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showEmojiPicker])

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

  // Compute reaction badge data
  const validReactions = (message.reactions || []).filter(r => r.emoji && r.emoji !== '')
  const myReaction = validReactions.find(r => r.user_id === currentUserId)
  // Display user's reaction if exists, else the last reaction in the list
  const displayReaction = myReaction || validReactions[validReactions.length - 1]

  // if (message.messageType === 'offer_context') {
  //   return (
  //     <div className="w-full py-2 flex justify-start">
  //       <JobOfferContextMessage jobId={message.entityId || ''} />
  //     </div>
  //   );
  // }

  return (
    <>
      {showMobileActions && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden transition-opacity"
          onClick={() => setShowMobileActions(false)}
        />
      )}
      <div
        id={`message-${message.id}`}
        className={cn(
          "flex w-full group transition-colors relative py-1",
          showTime ? "mb-[12px]" : "mb-[2px]",
          isMe ? "justify-end" : "justify-start",
          (message.is_deleted_for_everyone || message.is_deleted_for_me) ? "cursor-default" : "",
          (isHighlighted || isSelected) ? "duration-300" : "duration-1000"
        )}
        style={{ backgroundColor: (isHighlighted || isSelected) ? 'var(--primary-tint)' : 'transparent' }}
        onClick={() => !message.is_deleted_for_everyone && !message.is_deleted_for_me && onMessageClick?.(message)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <div className={cn("flex flex-col relative w-full gap-[4px]", isMe ? "items-end" : "items-start")}>

          {/* Sender name for sent messages (isMe) — rendered ONLY on the first message of a consecutive group when actor context is Organization or Group */}
          {isMe && (message.isFirstInGroup ?? true) && (isCompanyProfile || isGroup) && (
            <div className="pr-[4px] w-full flex justify-end">
              <span className="font-['Poppins'] font-medium text-[12px] leading-[16px] text-black dark:text-white truncate block max-w-[70%] md:max-w-[85%]">
                {isCompanyProfile ? (message.senderMemberName || "Member") : message.senderName}
              </span>
            </div>
          )}

          {/* Sender name for group/received messages — shown above the bubble row */}
          {showSenderName && !isMe && message.senderName && (
            <div className="pl-[32px] w-full">
              <span
                className="font-['Poppins'] font-semibold text-[11px] leading-[14px] text-[var(--primary)] truncate block max-w-[70%] md:max-w-[85%] cursor-pointer hover:underline"
                onClick={(e) => {
                  if (message.senderId || otherUserSlug) {
                    e.stopPropagation();
                    const returnTo = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/messaging';
                    const targetRoute = otherUserType === 'COMPANY'
                      ? `/organization/${otherUserSlug || message.senderId}`
                      : `/profile/${message.senderId}`;
                    router.push(`${targetRoute}?returnTo=${encodeURIComponent(returnTo)}`);
                  }
                }}
              >
                {message.senderName}
              </span>
            </div>
          )}

          {/* ROW 1: Bubble — indented 32px to align after avatar space */}
          <div className={cn("flex w-full group/message items-center", isMe ? "justify-end" : "justify-start pl-[32px]")}>

            {/* Action Icons for isMe */}
            {isMe && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (
              <div className={cn("flex flex-row items-center gap-[8px] bg-transparent opacity-0 transition-opacity px-2 shrink-0 z-20 relative", (isSelected || showMobileActions) ? "opacity-100 flex md:group-hover/message:opacity-100" : "group-hover/message:opacity-100 hidden md:flex")}>
                <button
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 z-50 relative"
                  onClick={handleEmojiButtonClick}
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                  <Smile className="w-[20px] h-[20px]" />
                </button>
                <button
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 z-50 relative"
                  onClick={(e) => { e.stopPropagation(); onReply?.(message); }}
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                  <CustomReplyIcon className="w-[20px] h-[20px]" />
                </button>
                <button
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 z-50 relative"
                  onClick={(e) => { e.stopPropagation(); onAction?.('copy', message); }}
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  title="Copy message"
                >
                  <Copy className="w-[20px] h-[20px]" />
                </button>
              </div>
            )}

            <div className={cn(
              "relative flex min-w-0",
              ((message.media && message.media.length > 0) || message.sharedPost || message.entityType) && !message.is_deleted_for_everyone && !message.is_deleted_for_me 
                ? "max-w-[85%] sm:max-w-[300px] w-full" 
                : "max-w-[70%] md:max-w-[85%]",
              isEditing && "w-full max-w-full md:max-w-[70%]"
            )}>
              <div
                className={cn(
                  "relative break-words w-full transition-all",
                  message.repliedMessage && message.repliedMessage.senderName
                    ? "font-['Poppins'] font-normal text-[12px] leading-[16px]"
                    : "text-[14px] leading-[20px]",
                  paddingClasses,
                  getBubbleClasses(),
                  (isSelected || showMobileActions) && "ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-background"
                )}
              >
                {isEditing ? (
                  <MessageEditor
                    message={message}
                    isEditing={isEditing}
                    onSaveEdit={onSaveEdit}
                    onCancelEdit={onCancelEdit}
                  />
                ) : message.is_unavailable ? (
                  <UnavailableContentCard isMe={isMe} />
                ) : (
                  <>
                    {message.repliedMessage && message.repliedMessage.senderName && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (
                      <RepliedMessageBox
                        senderName={message.repliedMessage.senderName}
                        content={message.repliedMessage.content}
                        isDeleted={message.repliedMessage.isDeleted}
                        isSent={isMe}
                        onClick={() => onReplyClick?.(message.repliedMessage!.messageId)}
                      />
                    )}
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
                    {message.entityType && message.entityId && !message.sharedPost && !message.sharedProfileId && message.entityType !== 'job' && message.entityType !== 'offer' && (
                      <div className="mt-1 mb-2">
                        <EntityPreviewCard
                          entityType={message.entityType}
                          entityId={message.entityId}
                          onLoad={onMediaLoad}
                        />
                      </div>
                    )}
                    {(message.entityType === 'job' || message.entityType === 'offer') && message.entityId && (
                      <JobApplicationContextCard
                        entityType={message.entityType as 'job' | 'offer'}
                        entityId={message.entityId}
                        conversationId={conversationId}
                      />
                    )}
                    <MessageMedia
                      message={message}
                      isMediaOnly={isMediaOnly}
                      onMediaClick={onMediaClick}
                      onMediaLoad={onMediaLoad}
                    />
                    <MessageText
                      message={message}
                      isMediaOnly={isMediaOnly || isPostOnly}
                      isMe={isMe}
                    />
                  </>
                )}
              </div>

              {/* Overlapping Reaction Badge */}
              {validReactions.length > 0 && displayReaction && (
                <button
                  onClick={handleReactionBadgeClick}
                  className={cn(
                    "absolute flex flex-row items-center justify-center gap-[4px] px-[8px] py-[3px] bg-[#FFFFFF] border border-[#E5E7EB] dark:bg-gray-800 dark:border-gray-700 rounded-[24px] shadow-sm cursor-pointer hover:scale-105 transition-all z-30",
                    isMe ? "-left-[12px] -bottom-[10px]" : "-right-[12px] -bottom-[10px]"
                  )}
                  style={{ minWidth: '32px', height: '24px', boxSizing: 'border-box' }}
                >
                  <span className="text-[14px] leading-normal flex items-center justify-center">{displayReaction.emoji}</span>
                  {validReactions.length > 1 && (
                    <span className="font-['Poppins'] font-medium text-[11px] leading-normal text-[#6B7280] dark:text-gray-300">
                      {validReactions.length}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Action Icons for !isMe */}
            {!isMe && !message.is_deleted_for_everyone && !message.is_deleted_for_me && (
              <div className={cn("flex flex-row items-center gap-[8px] bg-transparent opacity-0 transition-opacity px-2 shrink-0 z-20 relative", (isSelected || showMobileActions) ? "opacity-100 flex md:group-hover/message:opacity-100" : "group-hover/message:opacity-100 hidden md:flex")}>
                <button
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 z-50 relative"
                  onClick={handleEmojiButtonClick}
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                  <Smile className="w-[20px] h-[20px]" />
                </button>
                <button
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 z-50 relative"
                  onClick={(e) => { e.stopPropagation(); onReply?.(message); }}
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                >
                  <CustomReplyIcon className="w-[20px] h-[20px]" />
                </button>
                <button
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1 z-50 relative"
                  onClick={(e) => { e.stopPropagation(); onAction?.('copy', message); }}
                  onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); }}
                  title="Copy message"
                >
                  <Copy className="w-[20px] h-[20px]" />
                </button>
              </div>
            )}
          </div>

          {/* ROW 2: Avatar + Time — conditional on showTime prop */}
          {!isMe ? (
            showTime ? (
              <div className="flex flex-row items-center gap-[8px] mt-[2px]">
                {/* Avatar sits at position 0 — far left */}
                <div
                  className={cn("w-[24px] h-[24px] shrink-0", resolvedShowAvatar && (message.senderId || otherUserSlug) && "cursor-pointer")}
                  onClick={(e) => {
                    if (resolvedShowAvatar && (message.senderId || otherUserSlug)) {
                      e.stopPropagation();
                      const returnTo = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/messaging';
                      const targetRoute = otherUserType === 'COMPANY'
                        ? `/organization/${otherUserSlug || message.senderId}`
                        : `/profile/${message.senderId}`;
                      router.push(`${targetRoute}?returnTo=${encodeURIComponent(returnTo)}`);
                    }
                  }}
                >
                  {resolvedShowAvatar ? (() => {
                    const isUnknownSender = 
                      message.senderName === 'Unknown Page' || 
                      message.senderName === 'Unknown user' || 
                      message.senderName === 'Deleted User' ||
                      message.isBlocked ||
                      !message.senderAvatar;
                    return (
                      <Avatar 
                        url={isUnknownSender ? undefined : message.senderAvatar} 
                        name={message.senderName || "Unknown"} 
                        size="xs"
                        isUnknown={isUnknownSender}
                      />
                    );
                  })() : (
                    <div className="w-[24px] h-[24px]" />
                  )}
                </div>
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--muted-foreground)]">
                  {message.time}
                </span>
              </div>
            ) : null
          ) : (
            showTime ? (
              /* Sent message: tick icon LEFT of time, both right-aligned below bubble */
              <div className="flex flex-row items-center justify-end gap-[8px] mt-[4px]">
                {isGroup ? (
                  (message.active_member_count !== undefined && message.seen_count !== undefined && message.active_member_count > 0 && message.seen_count >= message.active_member_count) ? (
                    <Icon icon="mdi:check-all" className="w-[14px] h-[14px] text-[var(--primary)]" />
                  ) : (message.active_member_count !== undefined && message.delivered_count !== undefined && message.active_member_count > 0 && message.delivered_count >= message.active_member_count) ? (
                    <Icon icon="mdi:check-all" className="w-[14px] h-[14px] text-[var(--muted-foreground)]" />
                  ) : (
                    <Icon icon="mdi:check" className="w-[14px] h-[14px] text-[var(--muted-foreground)]" />
                  )
                ) : message.read_at ? (
                  <Icon icon="mdi:check-all" className="w-[14px] h-[14px] text-[var(--primary)]" />
                ) : isOpponentOnline ? (
                  <Icon icon="mdi:check-all" className="w-[14px] h-[14px] text-[var(--muted-foreground)]" />
                ) : (
                  <Icon icon="mdi:check" className="w-[14px] h-[14px] text-[var(--muted-foreground)]" />
                )}
                <span className="font-['Poppins'] font-normal text-[12px] leading-[16px] text-[var(--muted-foreground)]">
                  {message.time}
                </span>
              </div>
            ) : null
          )}

        </div>

        {/* Emoji Picker — fixed position portal */}
        {showEmojiPicker && pickerPos && typeof document !== 'undefined' && createPortal(
          <>
            <div
              className="fixed inset-0 z-[99]"
              onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); setPickerPos(null) }}
            />
            <div
              className="fixed z-[100] shadow-2xl rounded-2xl overflow-hidden"
              style={{ top: pickerPos.top, left: pickerPos.left }}
              onClick={e => e.stopPropagation()}
            >
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                lazyLoadEmojis
                width={310}
                height={340}
                previewConfig={{ showPreview: false }}
                theme={isDarkTheme ? Theme.DARK : Theme.LIGHT}
              />
            </div>
          </>,
          document.body
        )}

        {/* Reaction list popup */}
        {reactionListOpen && validReactions.length > 0 && reactionPopupPos && typeof document !== 'undefined' && createPortal(
          <ReactionListPopup
            reactions={validReactions}
            currentUserId={currentUserId || ''}
            messageId={message.id}
            onClose={() => { setReactionListOpen(false); setReactionPopupPos(null); }}
            onRemoveReaction={() => { onReaction?.(message, ''); setReactionListOpen(false); setReactionPopupPos(null); }}
            position={reactionPopupPos}
          />,
          document.body
        )}


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
              </>
            )}
            <button
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50 text-destructive"
              onClick={() => handleMobileAction('delete_for_me')}
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete for me</span>
            </button>
            {(message.senderId === currentUserId || isMe) && (
              <button
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors w-full text-left border-t border-border/50 text-destructive"
                onClick={() => handleMobileAction('delete_for_everyone')}
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete for everyone</span>
              </button>
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
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.showSenderName === nextProps.showSenderName &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.showTime === nextProps.showTime &&
    prevProps.isOpponentOnline === nextProps.isOpponentOnline &&
    prevProps.message.is_deleted_for_everyone === nextProps.message.is_deleted_for_everyone &&
    prevProps.message.is_deleted_for_me === nextProps.message.is_deleted_for_me &&
    prevProps.message.is_edited === nextProps.message.is_edited &&
    prevProps.message.isBlocked === nextProps.message.isBlocked &&
    prevProps.message.media === nextProps.message.media &&
    prevProps.message.sharedProfile === nextProps.message.sharedProfile &&
    prevProps.message.entityType === nextProps.message.entityType &&
    prevProps.message.entityId === nextProps.message.entityId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.message.reactions === nextProps.message.reactions &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.message.read_at === nextProps.message.read_at &&
    prevProps.message.seen_count === nextProps.message.seen_count &&
    prevProps.message.delivered_count === nextProps.message.delivered_count &&
    prevProps.message.active_member_count === nextProps.message.active_member_count
  )
})
