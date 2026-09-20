'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface PostOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; right: number } | null;
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
}

export const PostOptionsMenu = ({
  isOpen,
  onClose,
  position,
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
}: PostOptionsMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    // Delay attaching to prevent immediate close if the click to open also triggers this
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { passive: true });
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !position || typeof document === 'undefined') {
    return null;
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const menuStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  } : {
    position: 'fixed',
    top: `${position.top}px`,
    right: `${position.right}px`,
    zIndex: 9999,
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
      className={`bg-ds-bg flex flex-col items-start shadow-xl border border-ds-border transition-transform ${isMobile ? 'w-full rounded-t-[20px] rounded-b-none p-[20px] gap-[20px] animate-in slide-in-from-bottom-full pb-[max(env(safe-area-inset-bottom),20px)]' : `${isMe ? 'w-[99px] h-[80px]' : 'w-[135px] h-auto'} rounded-[8px] p-[12px] gap-[16px]`}`}
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
