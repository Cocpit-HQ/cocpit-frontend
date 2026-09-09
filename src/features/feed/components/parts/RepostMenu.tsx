import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@/components/icons";

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
        disabled={isSharedPost || isReposted}
        onClick={(e) => {
          e.stopPropagation();
          if (!isReposted) {
            setOpen(prev => !prev);
          }
        }}
        className={`flex h-[24px] flex-row items-center gap-[8px] group ${isSharedPost ? "opacity-50 cursor-not-allowed" : (isReposted ? "cursor-default" : "cursor-pointer")}`}
        aria-label="Repost"
        title="Repost"
      >
        <Icon name="repost" className={`w-[20px] h-[20px] transition-colors ${isReposted ? "text-ds-accent" : "text-ds-text-primary"}`} />
        <span className={`ds-text-small ${isReposted ? "text-ds-accent" : "text-ds-text-primary"}`}>
          {shares}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-[163px] bg-ds-surface-1 border border-ds-border rounded-[8px] z-50 animate-in fade-in slide-in-from-bottom-1 duration-100 shadow-sm flex flex-col overflow-hidden">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRepostWithThoughts?.(); }}
            className="w-full pt-[12px] pb-[8px] px-[12px] hover:bg-ds-surface-1 transition-colors text-left flex items-center"
          >
            <span className="ds-text-secondary text-ds-text-secondary whitespace-nowrap">Repost with thoughts</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRepost?.(); }}
            className="w-full pt-[8px] pb-[12px] px-[12px] hover:bg-ds-surface-1 transition-colors text-left flex items-center"
          >
            <span className="ds-text-secondary text-ds-text-secondary whitespace-nowrap">{isReposted ? "Undo repost" : "Repost"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
