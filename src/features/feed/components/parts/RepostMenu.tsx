import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@/components/icons";

export const RepostMenu = ({ onRepost, onRepostWithThoughts, shares, isReposted, isRepostedWithThoughts, isSharedPost, hideRepostWithThoughts }: { onRepost?: () => void, onRepostWithThoughts?: () => void, shares?: string | number, isReposted?: boolean, isRepostedWithThoughts?: boolean, isSharedPost?: boolean, hideRepostWithThoughts?: boolean }) => {
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
        disabled={isRepostedWithThoughts}
        onClick={(e) => {
          e.stopPropagation();
          if (isReposted) {
            onRepost?.(); // Immediately undo
          } else {
            setOpen(prev => !prev);
          }
        }}
        className={`flex h-[24px] flex-row items-center gap-[8px] group ${isRepostedWithThoughts ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        aria-label="Repost"
        title={isRepostedWithThoughts ? "You've reposted with thoughts — delete that post to undo" : "Repost"}
      >
        <Icon name="repost" className={`w-[20px] h-[20px] transition-colors ${isReposted ? "text-ds-accent" : "text-ds-text-primary"}`} />
        <span className={`ds-text-small ${isReposted ? "text-ds-accent" : "text-ds-text-primary"}`}>
          {shares}
        </span>
      </button>

      {/* Dropdown */}
      {open && !isReposted && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-[163px] bg-ds-surface-2 border border-ds-border rounded-[8px] z-50 animate-in fade-in slide-in-from-bottom-1 duration-100 shadow-lg flex flex-col overflow-hidden">
          {!hideRepostWithThoughts && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onRepostWithThoughts?.(); }}
              className="w-full pt-[12px] pb-[8px] px-[12px] hover:bg-ds-surface-1 group transition-colors text-left flex items-center"
            >
              <span className="ds-text-secondary text-ds-text-secondary group-hover:text-ds-text-primary whitespace-nowrap">Repost with thoughts</span>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRepost?.(); }}
            className="w-full pt-[8px] pb-[12px] px-[12px] hover:bg-ds-surface-1 group transition-colors text-left flex items-center"
          >
            <span className="ds-text-secondary text-ds-text-secondary group-hover:text-ds-text-primary whitespace-nowrap">Repost</span>
          </button>
        </div>
      )}
    </div>
  );
};
