'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MobileSafeBackdrop } from '@/components/shared/MobileSafeBackdrop';

interface PostOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; right: number } | null;
  triggerRef?: React.RefObject<HTMLElement | null>;
  isMe: boolean;
  onEdit?: () => void;
  onMakePrivate?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onInterested?: () => void;
  onNotInterested?: () => void;
  isMentioned?: boolean;
  onRemoveMention?: () => void;
  isReported?: boolean;
  isPollPost?: boolean;
  visibility?: string;
  zIndex?: number;
}

export const PostOptionsMenu = ({
  isOpen,
  onClose,
  position,
  triggerRef,
  isMe,
  onEdit,
  onMakePrivate,
  onDelete,
  onReport,
  onInterested,
  onNotInterested,
  isMentioned,
  onRemoveMention,
  isReported,
  isPollPost,
  visibility,
  zIndex,
}: PostOptionsMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  useEffect(() => {
    if (!isOpen) return;

    // Dispatch event to close any other open menus
    document.dispatchEvent(new CustomEvent('closeAllPostMenus'));

    const updatePositionAndCheckVisibility = () => {
      if (!menuRef.current) return;

      // Top boundary matches the fixed top header area (approx 90px)
      const topBoundary = 90;
      let top = position?.top ?? 0;
      let right = position?.right ?? 0;

      if (triggerRef?.current) {
        if (!document.body.contains(triggerRef.current)) {
          onClose();
          return;
        }

        const rect = triggerRef.current.getBoundingClientRect();

        // Close if the trigger has scrolled behind the top header/boundary or past the bottom of the screen
        if (rect.bottom <= topBoundary || rect.top >= window.innerHeight) {
          onClose();
          return;
        }

        top = rect.bottom + 6;
        right = window.innerWidth - rect.right;
      }

      // Close if the menu itself would scroll into the top boundary or beyond the bottom
      if (top <= topBoundary || top >= window.innerHeight) {
        onClose();
        return;
      }

      if (!isMobile) {
        menuRef.current.style.top = `${top}px`;
        menuRef.current.style.right = `${right}px`;
      }
    };

    const handleScroll = (e: Event) => {
      const target = e.target;
      if (target instanceof Node && menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      updatePositionAndCheckVisibility();
    };

    const handleResize = () => {
      // Automatically close menu when screen is resized to prevent orphaned/misaligned menus across responsive breakpoints
      onClose();
    };

    const handleCloseMenus = () => {
      onClose();
    };

    // Delay attaching to prevent immediate close if opening triggers a micro-scroll
    const timer = setTimeout(() => {
      window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
      window.addEventListener('resize', handleResize);
      document.addEventListener('closeAllPostMenus', handleCloseMenus as EventListener);
    }, 0);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('closeAllPostMenus', handleCloseMenus as EventListener);
    };
  }, [isOpen, onClose, position, triggerRef, isMobile]);

  if (!isOpen || !position || typeof document === 'undefined') {
    return null;
  }

  const effectiveZIndex = zIndex ?? 100;

  const menuStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: effectiveZIndex,
  } : {
    position: 'fixed',
    top: `${position.top}px`,
    right: `${position.right}px`,
    zIndex: effectiveZIndex,
  };

  const handleAction = (action?: () => void) => {
    if (action) {
      action();
    }
    onClose();
  };

  const menuContent = (
    <>
      {/* Invisible backdrop to capture outside clicks and prevent them from triggering elements underneath */}
      <MobileSafeBackdrop
        onClose={onClose}
        className="fixed inset-0"
        style={{ zIndex: effectiveZIndex - 1 }}
      />
      <div
        ref={menuRef}
        style={menuStyle}
        className={`bg-ds-bg flex flex-col items-start shadow-xl border border-ds-border transition-transform ${isMobile ? 'w-full rounded-t-[20px] rounded-b-none p-[20px] gap-[20px] animate-in slide-in-from-bottom-full pb-[max(env(safe-area-inset-bottom),20px)]' : `${isMe ? 'w-[99px]' : 'w-[135px]'} h-auto rounded-[8px] p-[12px] gap-[16px]`}`}
        onClick={(e) => e.stopPropagation()}
      >
        {isMobile && (
          <div className="w-full flex justify-center mb-2">
            <div className="w-[40px] h-[4px] bg-ds-border rounded-full" />
          </div>
        )}
        {isMe ? (
          <>
            {onEdit && !isPollPost && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAction(onEdit); }}
                className="ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none w-full text-left whitespace-nowrap p-0 m-0 border-none leading-[20px] h-[20px]"
              >
                Edit post
              </button>
            )}
            {/*
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(onMakePrivate); }}
            className="ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none w-full text-left"
          >
            {visibility === 'private' ? 'Make public' : 'Make private'}
          </button>
          */}
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(onDelete); }}
              className="ds-text-secondary text-[var(--ds-error)] hover:opacity-80 transition-opacity outline-none w-full text-left whitespace-nowrap p-0 m-0 border-none leading-[20px] h-[20px]"
            >
              Delete post
            </button>
          </>
        ) : (
          <>
            {/* Show the disabled 'Reported' text if the post was already reported this session */}
            {isReported ? (
              <button
                disabled
                className="ds-text-secondary text-ds-text-muted outline-none w-full text-left whitespace-nowrap p-0 m-0 border-none leading-[20px] h-[20px] cursor-default"
              >
                Reported
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); handleAction(onReport); }}
                className="ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none w-full text-left whitespace-nowrap p-0 m-0 border-none leading-[20px] h-[20px]"
              >
                Report post
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(onInterested); }}
              className="ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none w-full text-left whitespace-nowrap p-0 m-0 border-none leading-[20px] h-[20px]"
            >
              Interested
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(onNotInterested); }}
              className="ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none w-full text-left whitespace-nowrap p-0 m-0 border-none leading-[20px] h-[20px]"
            >
              Not interested
            </button>
            {isMentioned && (
              <button
                onClick={(e) => { e.stopPropagation(); handleAction(onRemoveMention); }}
                className="ds-text-secondary text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none w-full text-left whitespace-nowrap p-0 m-0 border-none leading-[20px] h-[20px]"
              >
                Remove mention
              </button>
            )}
          </>
        )}
      </div>
    </>
  );

  return createPortal(menuContent, document.body);
};
