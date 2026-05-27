import React from 'react';
import { X } from 'lucide-react';

interface ReplyPreviewProps {
  replyingTo: {
    messageId: string;
    senderName: string;
    content: string;
  };
  onCancel: () => void;
}

export default function ReplyPreview({ replyingTo, onCancel }: ReplyPreviewProps) {
  const truncatedContent = replyingTo.content.length > 60
    ? replyingTo.content.substring(0, 60) + "..."
    : replyingTo.content;

  return (
    <div className="flex flex-col gap-[4px] w-full relative px-[16px] py-[12px] bg-[var(--primary-tint)] border border-[var(--border)] rounded-[16px] mb-1.5">
      <div className="flex justify-between items-center w-full">
        <span className="font-['Poppins'] font-semibold text-[13px] text-[var(--foreground)]">
          Reply to {replyingTo.senderName}
        </span>
        <button
          onClick={onCancel}
          className="text-[var(--foreground)] hover:bg-[var(--border)]/30 p-1 rounded-full transition-colors"
        >
          <X className="w-[18px] h-[18px]" strokeWidth={2} />
        </button>
      </div>
      <div className="font-['Poppins'] font-normal text-[13px] text-[var(--muted-foreground)] break-words">
        {truncatedContent}
      </div>
    </div>
  );
}
