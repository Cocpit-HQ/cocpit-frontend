"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CloseCrossIcon } from "@/components/icons";

export interface ViewMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl?: string | null;
  avatarUrl?: string | null;
  type?: "avatar" | "banner";
  alt?: string;
  shape?: "circle" | "square";
}

export function ViewMediaModal({
  isOpen,
  onClose,
  mediaUrl,
  avatarUrl,
  type = "avatar",
  alt,
  shape = "circle",
}: ViewMediaModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const activeUrl = mediaUrl || avatarUrl;

  if (!isOpen || !activeUrl || !mounted) return null;

  const content = (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center w-screen h-screen select-none bg-[#030303]"
    >
      {/* Cancel Cross Icon at top right: right: 16px on mobile (right-4), 40px on desktop (md:right-10); top: 40px (top-10) */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-10 right-4 md:right-10 w-5 h-5 flex items-center justify-center text-[#FFECE6] hover:opacity-80 transition-opacity z-20 cursor-pointer focus:outline-none"
        aria-label="Close full view"
      >
        <CloseCrossIcon className="w-5 h-5 fill-[#FFECE6]" />
      </button>

      {/* Conditional Media View */}
      {type === "avatar" ? (
        /* Profile Photo / Logo: 200px on mobile, 240px sm, 300px on desktop */
        <div
          onClick={(e) => e.stopPropagation()}
          className={`w-[200px] h-[200px] sm:w-[240px] sm:h-[240px] md:w-[300px] md:h-[300px] max-w-[calc(100vw-32px)] max-h-[calc(100vw-32px)] ${
            shape === "square" ? "rounded-2xl" : "rounded-full"
          } overflow-hidden flex items-center justify-center shadow-2xl z-10 bg-[var(--ds-surface-2)]`}
        >
          <img
            src={activeUrl}
            alt={alt || (shape === "square" ? "Organization logo" : "Profile photo")}
            className={`w-full h-full object-cover ${
              shape === "square" ? "rounded-2xl" : "rounded-full"
            } select-none pointer-events-none`}
          />
        </div>
      ) : (
        /* Frame 2609600 - Banner: full width 4:1 aspect ratio on mobile, 800px by 200px on desktop */
        <div 
          onClick={(e) => e.stopPropagation()}
          className="w-full md:w-[800px] h-auto md:h-[200px] aspect-[800/200] md:aspect-auto max-h-[80vh] rounded-[16px] overflow-hidden flex items-center justify-center shadow-2xl z-10 border border-[var(--ds-border)]"
        >
          <img
            src={activeUrl}
            alt={alt || "Banner"}
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}

export const ViewAvatarModal = ViewMediaModal;
export default ViewMediaModal;
