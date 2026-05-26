import React from 'react';
import { cn } from "@/lib/utils";

interface RepliedMessageBoxProps {
  senderName: string;
  content: string;
  isDeleted: boolean;
  isSent: boolean;
  onClick?: () => void;
}

export default function RepliedMessageBox({ senderName, content, isDeleted, isSent, onClick }: RepliedMessageBoxProps) {
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
      <span className={cn(
        "w-full h-[16px] font-['Poppins'] font-normal text-[12px] leading-[16px] flex items-center flex-none order-1 flex-grow-0 truncate",
        isSent ? "text-[#FFFFFF]" : "text-[#6B7280]"
      )}>
        {isDeleted ? <i className="opacity-80">Original message was deleted</i> : content}
      </span>
    </div>
  );
}
