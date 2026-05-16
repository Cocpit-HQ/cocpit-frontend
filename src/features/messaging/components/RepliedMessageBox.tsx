import React from 'react';
import { cn } from "@/lib/utils";

interface RepliedMessageBoxProps {
  senderName: string;
  content: string;
  isDeleted: boolean;
  isMe?: boolean;
  onClick?: () => void;
}

export default function RepliedMessageBox({ senderName, content, isDeleted, isMe = false, onClick }: RepliedMessageBoxProps) {
  return (
    <div 
      className={cn(
        "flex flex-col w-full rounded-[8px] px-[12px] py-[8px] mb-[8px] relative overflow-hidden",
        isMe ? "bg-white/20 hover:bg-white/30" : "bg-black/5 hover:bg-black/10",
        "cursor-pointer transition-colors"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Left thick white/grey line */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-[3px] rounded-full",
        isMe ? "bg-white" : "bg-[#6366F1]/50"
      )} style={{ margin: '4px 0 4px 6px', height: 'calc(100% - 8px)' }} />

      <div className="flex flex-col ml-[4px]">
        <span className={cn(
          "font-['Poppins'] font-semibold text-[13px] leading-[18px] truncate",
          isMe ? "text-[#FFFFFF]" : "text-[#000000]"
        )}>
          {senderName}
        </span>
        <span className={cn(
          "font-['Poppins'] font-normal text-[13px] leading-[18px] break-words line-clamp-2 mt-[2px]",
          isMe ? "text-[#FFFFFF]" : "text-[#6B7280]"
        )}>
          {isDeleted ? <i className="opacity-80">Original message was deleted</i> : content}
        </span>
      </div>
    </div>
  );
}
