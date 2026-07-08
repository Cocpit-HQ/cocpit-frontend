import React, { useState, useRef, useEffect } from 'react';
import { Repeat2 } from 'lucide-react';
import { Icon } from "@iconify/react";

export const RepostMenu = ({ onRepost, onRepostWithThoughts, shares, isReposted, isSharedPost }: { onRepost?: () => void, onRepostWithThoughts?: () => void, shares?: string | number, isReposted?: boolean, isSharedPost?: boolean }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Trigger button */}
      <button
        disabled={isSharedPost}
        onClick={(e) => {
          e.stopPropagation();
          if (isReposted) {
            onRepost?.();
          } else {
            setOpen(prev => !prev);
          }
        }}
        className={`flex h-[24px] flex-row items-center gap-[16px] group ${isSharedPost ? "opacity-50 cursor-not-allowed" : ""}`}
        aria-label="Repost"
        title="Repost"
      >
        <Icon icon="hugeicons:repost" className={`w-[24px] h-[24px] transition-colors ${isReposted ? "text-[#6366F1]" : "text-foreground group-hover:text-gray-600"}`} />
        <span className={`text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] ${isReposted ? "text-[#6366F1]" : "text-foreground"}`}>
          {shares}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-[235px] p-[8px] bg-white rounded-tl-[24px] rounded-tr-[0px] rounded-br-[24px] rounded-bl-[24px] border border-[#C7D2FE] z-50 animate-in fade-in slide-in-from-bottom-1 duration-100 shadow-sm flex flex-col items-center">
          <button
            onClick={() => { setOpen(false); onRepostWithThoughts?.(); }}
            className="w-[219px] h-[40px] flex flex-row items-center justify-between px-[16px] py-[8px] gap-[10px] rounded-[24px] hover:bg-gray-50 transition-colors"
          >
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#000000]">Repost with thoughts</span>
            <Icon icon="hugeicons:repost" className="w-[24px] h-[24px] text-black" style={{ strokeWidth: '1.5px' }} />
          </button>
          <button
            onClick={() => { setOpen(false); onRepost?.(); }}
            className="w-[219px] h-[40px] flex flex-row items-center justify-between px-[16px] py-[8px] gap-[10px] rounded-[24px] hover:bg-gray-50 transition-colors"
          >
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-center text-[#000000]">{isReposted ? "Undo repost" : "Repost"}</span>
            <Icon icon="hugeicons:repost" className="w-[24px] h-[24px] text-black" style={{ strokeWidth: '1.5px' }} />
          </button>
        </div>
      )}
    </div>
  );
};
