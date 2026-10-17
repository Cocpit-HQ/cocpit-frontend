import React from 'react';
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";

interface RepliedMessageBoxProps {
  senderName: string;
  content: string;
  isDeleted: boolean;
  isSent: boolean;
  mediaType?: 'image' | 'video' | 'document' | string | null;
  mediaName?: string | null;
  mediaUrl?: string | null;
  onClick?: () => void;
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

export default function RepliedMessageBox({
  senderName,
  content,
  isDeleted,
  isSent,
  mediaType,
  mediaName,
  mediaUrl,
  onClick,
}: RepliedMessageBoxProps) {
  const attachment = !isDeleted ? getAttachmentIconAndLabel(mediaType, mediaName, content) : null;
  const displayContent = isDeleted
    ? "Original message was deleted"
    : (content && content.toLowerCase() !== 'attachment' ? content : (mediaName || attachment?.defaultLabel || "Attachment"));

  return (
    <div 
      className={cn(
        "box-border flex flex-col items-start p-[12px] gap-[4px] w-full rounded-[6px] border-l-[2px] cursor-pointer transition-colors flex-none order-0 flex-grow-0",
        isSent ? "bg-[#818CF8] border-l-[#EEF2FF]" : "bg-[#E0E7FF] border-l-[#C7D2FE]"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span className={cn(
        "font-['Poppins'] font-medium text-[12px] leading-[16px] flex-none order-0 truncate w-full",
        isSent ? "text-[#FFFFFF]" : "text-[#6366F1]"
      )}>
        {senderName}
      </span>
      <div className={cn(
        "w-full font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center gap-1.5 flex-none order-1 flex-grow-0 truncate",
        isSent ? "text-[#FFFFFF]" : "text-[#6B7280]"
      )}>
        {attachment && (
          <Icon icon={attachment.icon} className="w-[16px] h-[16px] shrink-0" />
        )}
        <span className="truncate">
          {isDeleted ? <i className="opacity-80">{displayContent}</i> : displayContent}
        </span>
      </div>
    </div>
  );
}
