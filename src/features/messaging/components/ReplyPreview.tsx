import React from 'react';
import { Icon } from '@iconify/react';
import { CancelIcon, FileTextIcon } from '@/components/icons';
import { stripMentionSyntax } from '@/lib/mentions';

interface ReplyPreviewProps {
  replyingTo: {
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
  };
  onCancel: () => void;
}

export default function ReplyPreview({ replyingTo, onCancel }: ReplyPreviewProps) {
  const normType = (replyingTo.mediaType || '').toLowerCase();
  const nameStr = (replyingTo.mediaName || '').toLowerCase();
  const contentStr = (replyingTo.content || '').toLowerCase().trim();

  // Condition 1: Post Card, Job Card, Profile Card
  const isCardAttachment = Boolean(
    replyingTo.isAttachment ||
    normType === 'attachment' ||
    replyingTo.sharedPostId ||
    replyingTo.sharedProfileId ||
    ['post', 'job', 'profile', 'company', 'article', 'offer'].includes((replyingTo.entityType || '').toLowerCase()) ||
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
    Boolean(replyingTo.mediaUrl)
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

  const hasMessageText = Boolean(replyingTo.content && replyingTo.content.trim() && !isGenericMediaText && replyingTo.content.trim() !== replyingTo.mediaName);

  const senderLabel = replyingTo.isMe ? "You" : (replyingTo.senderName || "Unknown");

  // Frame 2610044: Reply Box Wrapper
  return (
    <div className="w-full h-auto min-h-[60px] self-stretch flex flex-row items-center justify-between px-3 py-2 gap-2 box-border border-b border-[var(--ds-border-subtle)]">
      {/* Frame 2610070: Message Box */}
      <div className="flex-1 min-w-0 min-h-[44px] flex flex-col items-start justify-center px-2 py-1.5 gap-1 bg-[var(--ds-surface-1)] rounded-[8px] box-border">
        {/* Sender Name */}
        <span className="w-full h-4 font-['DM_Sans'] font-medium text-xs leading-4 text-[var(--ds-accent)] truncate text-left flex items-center">
          {senderLabel}
        </span>

        {/* Condition 1: Post Card, Job Card, Profile Card */}
        {isCardAttachment ? (
          <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] flex items-center gap-1.5 truncate text-left">
            <Icon icon="solar:paperclip-linear" className="w-4 h-4 shrink-0 text-[var(--ds-text-secondary)]" />
            <span className="truncate">Attachment</span>
          </div>
        ) : isDocument ? (
          /* Condition 4: Document */
          (() => {
            const rawFileName = replyingTo.mediaName || (replyingTo.content && !['document', 'sent a document'].includes(contentStr) ? replyingTo.content : "Document.pdf");
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
        ) : (isImage || isVideo) && !hasMessageText && replyingTo.mediaUrl ? (
          /* Condition 3: Single visual media thumbnail only */
          <div className="flex flex-row items-end gap-1 w-auto max-w-[186px] h-[36px]">
            {isVideo ? (
              <div className="relative w-[54px] h-[36px] rounded-[8px] overflow-hidden shrink-0 bg-black/40">
                <video
                  src={`${replyingTo.mediaUrl}#t=0.001`}
                  preload="metadata"
                  className="w-[54px] h-[36px] object-cover pointer-events-none"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                  <Icon icon="solar:play-bold" className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            ) : (
              <img
                src={replyingTo.mediaUrl}
                alt=""
                className="w-[54px] h-[36px] rounded-[8px] object-cover shrink-0"
              />
            )}
          </div>
        ) : (isImage || isVideo) && hasMessageText ? (
          /* Condition 2: Image or video with message text */
          <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] flex items-center gap-1.5 truncate text-left">
            <Icon 
              icon={isVideo ? "solar:videocamera-linear" : "solar:gallery-linear"} 
              className="w-4 h-4 shrink-0 text-[var(--ds-text-secondary)]" 
            />
            <span className="truncate">{stripMentionSyntax(replyingTo.content)}</span>
          </div>
        ) : (
          /* Pure text message */
          <div className="w-full h-4 font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-primary)] flex items-center gap-1.5 truncate text-left">
            <span className="truncate">{stripMentionSyntax(replyingTo.content) || (replyingTo.mediaName || "Attachment")}</span>
          </div>
        )}
      </div>

      {/* Cancel Icon */}
      <button
        type="button"
        onClick={onCancel}
        className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer shrink-0 p-0"
        title="Cancel reply"
        aria-label="Cancel reply"
      >
        <CancelIcon className="w-5 h-5" size={20} />
      </button>
    </div>
  );
}
