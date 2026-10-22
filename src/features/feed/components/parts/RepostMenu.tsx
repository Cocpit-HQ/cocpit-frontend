import React, { useState, useRef, useEffect } from 'react';
import { Icon } from "@/components/icons";
import { Drawer } from "vaul";
import { useIsMobile } from "@/hooks/use-mobile";

export const RepostMenu = ({
  onRepost,
  onRepostWithThoughts,
  shares,
  isReposted,
  isRepostedWithThoughts,
  isSharedPost,
  hideRepostWithThoughts
}: {
  onRepost?: () => void;
  onRepostWithThoughts?: () => void;
  shares?: string | number;
  isReposted?: boolean;
  isRepostedWithThoughts?: boolean;
  isSharedPost?: boolean;
  hideRepostWithThoughts?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Close when any other menu in the app opens
  useEffect(() => {
    const handleClose = () => setOpen(false);
    document.addEventListener('closeAllPostMenus', handleClose);
    return () => document.removeEventListener('closeAllPostMenus', handleClose);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (!isMobile) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!open || isMobile) return;
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const topBoundary = 100; // Top header occlusion boundary
      if (rect.bottom <= topBoundary || rect.top >= window.innerHeight) {
        setOpen(false);
      }
    };
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
            if (open) {
              setOpen(false);
            } else {
              document.dispatchEvent(new CustomEvent('closeAllPostMenus'));
              setOpen(true);
            }
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
        <div
          style={{
            backgroundColor: 'var(--ds-bg)',
            borderColor: 'var(--ds-border)',
            width: '165px',
            minWidth: '165px',
            zIndex: 30,
          }}
          className="box-border absolute bottom-[calc(100%+6px)] left-0 w-[165px] min-w-[165px] p-[12px] gap-[16px] !bg-[var(--ds-bg)] border border-ds-border rounded-[8px] z-30 animate-in fade-in slide-in-from-bottom-1 duration-100 shadow-xl flex flex-col items-start font-dmsans"
        >
          {!hideRepostWithThoughts && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setOpen(false); onRepostWithThoughts?.(); }}
              className="w-full h-[20px] p-0 m-0 border-none bg-transparent hover:bg-transparent text-left flex items-center cursor-pointer outline-none group"
            >
              <span className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-ds-text-secondary group-hover:text-ds-text-primary whitespace-nowrap transition-colors">
                Repost with thoughts
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onRepost?.(); }}
            className="w-full h-[20px] p-0 m-0 border-none bg-transparent hover:bg-transparent text-left flex items-center cursor-pointer outline-none group"
          >
            <span className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-ds-text-secondary group-hover:text-ds-text-primary whitespace-nowrap transition-colors">
              Repost
            </span>
          </button>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && !isReposted && (
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" onClick={() => setOpen(false)} />
            <Drawer.Content className="bg-[var(--ds-bg)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-4 pb-8 pt-3">
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
