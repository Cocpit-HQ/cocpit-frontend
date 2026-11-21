import React from 'react';
import { CancelIcon } from '@/components/icons';
import RepliedMessageBox from './RepliedMessageBox';

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
    sharedProfile?: any;
    sharedPost?: any;
    poll?: any;
  };
  onCancel: () => void;
}

export default function ReplyPreview({ replyingTo, onCancel }: ReplyPreviewProps) {
  const senderLabel = replyingTo.isMe ? "You" : (replyingTo.senderName || "Unknown");

  return (
    <div className="w-full h-auto min-h-[60px] self-stretch flex flex-row items-center justify-between px-3 py-2 gap-2 box-border border-b border-[var(--ds-border-subtle)]">
      <div className="flex-1 min-w-0 min-h-[44px] flex flex-col items-start justify-center px-2 py-1.5 gap-1 bg-[var(--ds-surface-1)] rounded-[8px] box-border">
        <RepliedMessageBox
          senderName={senderLabel}
          content={replyingTo.content}
          isSent={replyingTo.isMe}
          mediaType={replyingTo.mediaType}
          mediaName={replyingTo.mediaName}
          mediaUrl={replyingTo.mediaUrl}
          sharedPostId={replyingTo.sharedPostId}
          sharedProfileId={replyingTo.sharedProfileId}
          sharedProfileType={replyingTo.sharedProfileType}
          entityType={replyingTo.entityType}
          entityId={replyingTo.entityId}
          isAttachment={replyingTo.isAttachment}
          sharedProfile={replyingTo.sharedProfile}
          sharedPost={replyingTo.sharedPost}
          poll={replyingTo.poll}
          hideWrapper
        />
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
