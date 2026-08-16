import React from 'react';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';

interface ReplyPreviewProps {
  replyingTo: {
    messageId: string;
    senderName: string;
    content: string;
    isMe?: boolean;
    mediaType?: 'image' | 'video' | 'document' | string | null;
    mediaName?: string | null;
    mediaUrl?: string | null;
  };
  onCancel: () => void;
}

const getAttachmentIconAndLabel = (
  mediaType?: string | null,
  mediaName?: string | null,
  content?: string
) => {
  const typeStr = (mediaType || '').toLowerCase();
  const nameStr = (mediaName || '').toLowerCase();
  const contentStr = (content || '').toLowerCase();

  if (
    typeStr === 'video' ||
    nameStr.endsWith('.mp4') ||
    nameStr.endsWith('.mov') ||
    nameStr.endsWith('.webm') ||
    contentStr.includes('video') ||
    contentStr.endsWith('.mp4')
  ) {
    return {
      icon: "solar:videocamera-linear",
      defaultLabel: "Video",
    };
  }

  if (
    nameStr.endsWith('.pdf') ||
    contentStr.endsWith('.pdf') ||
    contentStr.includes('.pdf') ||
    (typeStr === 'document' && (nameStr.includes('pdf') || contentStr.includes('pdf')))
  ) {
    return {
      icon: "material-icon-theme:pdf",
      defaultLabel: "Document (PDF)",
    };
  }

  if (
    nameStr.endsWith('.doc') ||
    nameStr.endsWith('.docx') ||
    contentStr.endsWith('.doc') ||
    contentStr.endsWith('.docx')
  ) {
    return {
      icon: "selfhst:google-docs",
      defaultLabel: "Document (Word)",
    };
  }

  if (
    typeStr === 'document' ||
    contentStr.includes('document') ||
    contentStr.includes('attachment') ||
    contentStr === 'attachment' ||
    contentStr === 'sent a document'
  ) {
    return {
      icon: "solar:document-text-linear",
      defaultLabel: "Document",
    };
  }

  if (
    typeStr === 'image' ||
    nameStr.endsWith('.jpg') ||
    nameStr.endsWith('.jpeg') ||
    nameStr.endsWith('.png') ||
    nameStr.endsWith('.webp') ||
    contentStr.includes('photo') ||
    contentStr.includes('image') ||
    contentStr === 'sent a photo'
  ) {
    return {
      icon: "solar:gallery-linear",
      defaultLabel: "Photo",
    };
  }

  return null;
};

export default function ReplyPreview({ replyingTo, onCancel }: ReplyPreviewProps) {
  const attachment = getAttachmentIconAndLabel(
    replyingTo.mediaType,
    replyingTo.mediaName,
    replyingTo.content
  );

  const rawDisplayContent = replyingTo.content || replyingTo.mediaName || attachment?.defaultLabel || "Attachment";
  const truncatedContent = rawDisplayContent.length > 60
    ? rawDisplayContent.substring(0, 60) + "..."
    : rawDisplayContent;

  const replyHeader = replyingTo.isMe
    ? "Reply to your message"
    : `Reply to ${replyingTo.senderName || "message"}'s message`;

  return (
    <div className="flex flex-col gap-[4px] w-full relative px-[16px] py-[12px] bg-[var(--primary-tint)] border border-[var(--border)] rounded-[16px] mb-1.5">
      <div className="flex justify-between items-center w-full">
        <span className="font-['Poppins'] font-semibold text-[13px] text-[var(--foreground)]">
          {replyHeader}
        </span>
        <button
          onClick={onCancel}
          className="text-[var(--foreground)] hover:bg-[var(--border)]/30 p-1 rounded-full transition-colors"
        >
          <X className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </div>
      <div className="font-['Poppins'] font-normal text-[13px] text-[var(--muted-foreground)] flex items-center gap-1.5 break-words truncate">
        {attachment && (
          <Icon icon={attachment.icon} className="w-[15px] h-[15px] shrink-0" />
        )}
        <span className="truncate">{truncatedContent}</span>
      </div>
    </div>
  );
}
