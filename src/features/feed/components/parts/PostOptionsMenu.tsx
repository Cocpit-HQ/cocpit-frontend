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

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${position.top}px`,
    right: `${position.right}px`,
    zIndex: 9999, // Ensure it sits on top of everything
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
      className="bg-[#222228] rounded-[8px] p-[12px] flex flex-col items-start gap-[16px] min-w-[107px] shadow-xl border border-[#2B2B36]"
    >
      {isMe ? (
        <>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); handleAction(onEdit); }}
              className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[#B8ADA8] hover:text-white transition-colors outline-none w-full text-left"
            >
              Edit post
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(onMakePrivate); }}
            className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[#B8ADA8] hover:text-white transition-colors outline-none w-full text-left"
          >
            Make private
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(onDelete); }}
            className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[#E5484D] hover:opacity-80 transition-opacity outline-none w-full text-left"
          >
            Delete post
          </button>
        </>
      ) : (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(onReport); }}
            className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[#B8ADA8] hover:text-white transition-colors outline-none w-full text-left"
          >
            Report post
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(onInterested); }}
            className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[#B8ADA8] hover:text-white transition-colors outline-none w-full text-left"
          >
            Interested
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleAction(onNotInterested); }}
            className="font-['DM_Sans'] text-[14px] leading-[20px] font-normal text-[#B8ADA8] hover:text-white transition-colors outline-none w-full text-left"
          >
            Not interested
          </button>
        </>
      )}
    </div>
  );

  return createPortal(menuContent, document.body);
};
