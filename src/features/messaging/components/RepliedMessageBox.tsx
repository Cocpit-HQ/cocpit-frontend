import React from 'react';
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { FileTextIcon } from '@/components/icons';
import { stripMentionSyntax } from '@/lib/mentions';

interface RepliedMessageBoxProps {
  senderName: string;
  content?: string;
  isDeleted?: boolean;
  isSent?: boolean;
  mediaType?: 'image' | 'video' | 'document' | 'attachment' | string | null;
  mediaName?: string | null;
  mediaUrl?: string | null;
  sharedPostId?: string | null;
  sharedProfileId?: string | null;
  sharedProfileType?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  isAttachment?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function RepliedMessageBox({
  senderName,
  content = "",
  isDeleted = false,
  isSent,
  mediaType,
  mediaName,
  mediaUrl,
  sharedPostId,
  sharedProfileId,
  sharedProfileType,
  entityType,
  entityId,
  isAttachment,
  onClick,
  className,
}: RepliedMessageBoxProps) {
  if (isDeleted) {
    return (
      <div 
        className={cn(
          "self-stretch w-full min-w-0 max-w-full px-2 py-1.5 bg-[var(--ds-surface-1)] rounded-[8px] flex flex-col justify-center items-start gap-1 cursor-pointer hover:bg-[var(--ds-surface-2)] transition-colors box-border select-none mb-2 min-h-[44px]",
          className
        )}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <span className="w-full h-4 font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-accent)] flex items-center truncate text-left">
          {senderName}
        </span>
        <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 flex items-center text-[var(--ds-text-primary)] truncate text-left">
          <i className="opacity-80 text-[var(--ds-text-muted)] truncate">Original message was deleted</i>
        </div>
      </div>
    );
  }

  const normType = (mediaType || '').toLowerCase();
  const nameStr = (mediaName || '').toLowerCase();
  const contentStr = (content || '').toLowerCase().trim();

  // Condition 1: Post Card, Job Card, Profile Card
  const isCardAttachment = Boolean(
    isAttachment ||
    normType === 'attachment' ||
    sharedPostId ||
    sharedProfileId ||
    ['post', 'job', 'profile', 'company', 'article', 'offer'].includes((entityType || '').toLowerCase()) ||
    contentStr === 'attachment' ||
    contentStr === 'shared a post' ||
    contentStr.includes('/post/') ||
    contentStr.includes('/jobs/') ||
    contentStr.includes('/profile/') ||
    contentStr.includes('/organization/') ||
    contentStr.includes('/company/')
  );

  // Condition 4: Document (PDF, Word, or any Doc)
  const isDocType = normType === 'document' || normType === 'file';
  const hasDocExt = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(nameStr || contentStr);
  const isDocument = !isCardAttachment && (isDocType || hasDocExt);

  // Condition 2 & 3: Visual media (Image or Video)
  const isVideo = !isCardAttachment && !isDocument && (
    normType === 'video' ||
    nameStr.endsWith('.mp4') || nameStr.endsWith('.mov') || nameStr.endsWith('.webm') ||
    contentStr.endsWith('.mp4') || contentStr.endsWith('.mov') || contentStr.endsWith('.webm')
  );

  const isImage = !isCardAttachment && !isDocument && !isVideo && (
    normType === 'image' ||
    nameStr.endsWith('.jpg') || nameStr.endsWith('.jpeg') || nameStr.endsWith('.png') || nameStr.endsWith('.webp') ||
    Boolean(mediaUrl)
  );

  const isGenericMediaText = [
    "attachment",
    "photo",
    "video",
    "document",
    "sent a photo",
    "sent a video",
    "sent a document",
    "shared a post",
  ].includes(contentStr);

  const hasMessageText = Boolean(content && content.trim() && !isGenericMediaText && content.trim() !== mediaName);

  return (
    <div 
      className={cn(
        "self-stretch w-full min-w-0 max-w-full px-2 py-1.5 bg-[var(--ds-surface-1)] rounded-[8px] flex flex-col justify-center items-start gap-1 cursor-pointer hover:bg-[var(--ds-surface-2)] transition-colors box-border select-none mb-2 min-h-[44px]",
        className
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span className="w-full h-4 font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-accent)] flex items-center truncate text-left">
        {senderName}
      </span>

      {/* Case 1: Post Card, Job Card, Profile Card -> show as Attachment */}
      {isCardAttachment ? (
        <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 flex items-center gap-1.5 text-[var(--ds-text-primary)] truncate text-left">
          <Icon icon="solar:paperclip-linear" className="w-4 h-4 shrink-0 text-[var(--ds-text-secondary)]" />
          <span className="truncate">Attachment</span>
        </div>
      ) : isDocument ? (
        /* Case 4: Document (PDF, Word, or any Doc) -> icon + filename + file extension/domain */
        (() => {
          const rawFileName = mediaName || (content && !['document', 'sent a document'].includes(contentStr) ? content : "Document.pdf");
          const extMatch = rawFileName.match(/\.([a-zA-Z0-9]+)$/);
          const extLabel = extMatch ? extMatch[1].toUpperCase() : (normType === 'document' ? 'PDF' : 'DOC');

          return (
            <div className="flex flex-row items-center gap-2 py-0.5 min-w-0 max-w-full">
              <FileTextIcon className="w-5 h-5 shrink-0 text-[var(--ds-text-primary)]" size={20} />
              <div className="flex flex-col justify-center items-start min-w-0 flex-1 overflow-hidden">
                <span className="font-['DM_Sans'] text-xs leading-4 font-normal text-[var(--ds-text-primary)] truncate max-w-full">
                  {rawFileName}
                </span>
                <span className="font-['DM_Sans'] text-[10px] leading-3 font-normal text-[var(--ds-text-secondary)] uppercase">
                  {extLabel}
                </span>
              </div>
            </div>
          );
        })()
      ) : (isImage || isVideo) && !hasMessageText && mediaUrl ? (
        /* Case 3: Single Image or Single Video without message text -> Frame 2610073 & Rectangle 89 thumbnail only */
        <div className="flex flex-row items-end gap-1 w-auto max-w-[186px] h-[36px]">
          {isVideo ? (
            <div className="relative w-[54px] h-[36px] rounded-[8px] overflow-hidden shrink-0 bg-black/40">
              <video
                src={`${mediaUrl}#t=0.001`}
                preload="metadata"
                className="w-[54px] h-[36px] object-cover pointer-events-none"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                <Icon icon="solar:play-bold" className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          ) : (
            <img 
              src={mediaUrl} 
              alt="" 
              className="w-[54px] h-[36px] rounded-[8px] object-cover shrink-0" 
            />
          )}
        </div>
      ) : (isImage || isVideo) && hasMessageText ? (
        /* Case 2: Image or Video WITH message text present -> show that message text (no thumbnail) */
        <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 flex items-center gap-1.5 text-[var(--ds-text-primary)] truncate text-left">
          <Icon 
            icon={isVideo ? "solar:videocamera-linear" : "solar:gallery-linear"} 
            className="w-4 h-4 shrink-0 text-[var(--ds-text-secondary)]" 
          />
          <span className="truncate">{stripMentionSyntax(content)}</span>
        </div>
      ) : (
        /* Case 5: Pure text message */
        <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 flex items-center text-[var(--ds-text-primary)] truncate text-left">
          <span className="truncate">{stripMentionSyntax(content) || (mediaName || "Attachment")}</span>
        </div>
      )}
    </div>
  );
}
