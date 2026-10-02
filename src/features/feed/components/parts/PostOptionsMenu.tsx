'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    };

    const updatePositionAndCheckVisibility = () => {
      if (!menuRef.current) return;

      let top = position?.top ?? 0;
      let right = position?.right ?? 0;

      if (triggerRef?.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        top = rect.bottom + 6;
        right = window.innerWidth - rect.right;
      }

      const menuHeight = menuRef.current.offsetHeight || 150;

      // Close only when scrolled completely outside the viewport
      if (top + menuHeight <= 0 || top >= window.innerHeight) {
        onClose();
        return;
      }

      if (!isMobile) {
        menuRef.current.style.top = `${top}px`;
        menuRef.current.style.right = `${right}px`;
      }
    };

    const handleScrollOrResize = (e: Event) => {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      updatePositionAndCheckVisibility();
    };

    const handleCloseMenus = () => {
      onClose();
    };

    // Delay attaching to prevent immediate close if the click to open also triggers this
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      document.addEventListener('closeAllPostMenus', handleCloseMenus as EventListener);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('closeAllPostMenus', handleCloseMenus as EventListener);
    };
  }, [isOpen, onClose, position, triggerRef, isMobile]);

  if (!isOpen || !position || typeof document === 'undefined') {
    return null;
  }

  const effectiveZIndex = zIndex ?? (isMobile ? 60 : 35);

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
  );

  return createPortal(menuContent, document.body);
};
