import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@/components/icons";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";

export const RepostMenu = ({ onRepost, onRepostWithThoughts, shares, isReposted, isRepostedWithThoughts, isSharedPost, hideRepostWithThoughts }: { onRepost?: () => void, onRepostWithThoughts?: () => void, shares?: string | number, isReposted?: boolean, isRepostedWithThoughts?: boolean, isSharedPost?: boolean, hideRepostWithThoughts?: boolean }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    // Only add outside click listener on desktop since Drawer handles its own overlay
    if (!isMobile) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!open || isMobile) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [open, isMobile]);

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
        className={`flex h-[24px] flex-row items-center gap-[8px] group ${isRepostedWithThoughts ? "opacity-50 cursor-default" : "cursor-pointer"}`}
        aria-label="Repost"
        title={isRepostedWithThoughts ? "You've reposted with thoughts — delete that post to undo" : "Repost"}
      >
        <Icon name="repost" className={`w-[20px] h-[20px] transition-colors ${isReposted && !isRepostedWithThoughts ? "text-ds-accent" : "text-ds-text-primary"}`} />
        <span className={`ds-text-small ${isReposted && !isRepostedWithThoughts ? "text-ds-accent" : "text-ds-text-primary"}`}>
          {shares}
        </span>
      </button>

      {/* Desktop Dropdown */}
      {!isMobile && open && !isReposted && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-[163px] bg-ds-surface-2 border border-ds-border rounded-[8px] z-50 animate-in fade-in slide-in-from-bottom-1 duration-100 shadow-lg flex flex-col overflow-hidden">
          {!hideRepostWithThoughts && (
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onRepostWithThoughts?.(); }}
              className="w-full pt-[12px] pb-[8px] px-[12px] hover:bg-ds-surface-1 group transition-colors text-left flex items-center cursor-pointer"
            >
              <span className="ds-text-secondary text-ds-text-secondary group-hover:text-ds-text-primary whitespace-nowrap">Repost with thoughts</span>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRepost?.(); }}
            className="w-full pt-[8px] pb-[12px] px-[12px] hover:bg-ds-surface-1 group transition-colors text-left flex items-center cursor-pointer"
          >
            <span className="ds-text-secondary text-ds-text-secondary group-hover:text-ds-text-primary whitespace-nowrap">Repost</span>
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && !isReposted && (
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" />
            <Drawer.Content className="bg-[var(--ds-surface-1)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-4 pb-8 pt-3">
              <Drawer.Title className="sr-only">Repost Options</Drawer.Title>
              <Drawer.Description className="sr-only">Choose how you want to repost</Drawer.Description>
              
              {/* Drag Handle */}
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border)] mb-4" />

              {/* Actions */}
              <div className="flex flex-col gap-1 w-full">
                {!hideRepostWithThoughts && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpen(false); onRepostWithThoughts?.(); }}
                    className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                  >
                    Repost with thoughts
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpen(false); onRepost?.(); }}
                  className="w-full text-left py-3 px-3 rounded-xl text-base font-normal text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:bg-[var(--ds-surface-2)] transition-colors cursor-pointer"
                >
                  Repost
                </button>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </div>
  );
};
