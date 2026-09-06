"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from "next-themes";

export interface EmojiPickerPosition {
  top: number;
  left: number;
}

interface EmojiPickerPortalProps {
  isOpen: boolean;
  position: EmojiPickerPosition | null;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  zIndex?: number;
}

function sanitizeSuggestedEmojis() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const raw = window.localStorage.getItem("epr_suggested");
    if (!raw) return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;

    const seenBases = new Set<string>();
    const cleaned = list.filter((item: any) => {
      const base =
        item?.original ||
        (item?.unified
          ? item.unified
              .split("-")
              .filter(
                (code: string) =>
                  !["1f3fb", "1f3fc", "1f3fd", "1f3fe", "1f3ff"].includes(
                    code.toLowerCase()
                  )
              )
              .join("-")
          : "");
      if (!base || seenBases.has(base)) return false;
      seenBases.add(base);
      return true;
    });

    if (cleaned.length !== list.length) {
      window.localStorage.setItem("epr_suggested", JSON.stringify(cleaned));
    }
  } catch {
    // ignore
  }
}

export function EmojiPickerPortal({
  isOpen,
  position,
  onClose,
  onEmojiSelect,
  zIndex = 200,
}: EmojiPickerPortalProps) {
  const { resolvedTheme } = useTheme();
  const pickerRef = useRef<HTMLDivElement>(null);

  if (typeof window !== "undefined" && isOpen) {
    sanitizeSuggestedEmojis();
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setTimeout(sanitizeSuggestedEmojis, 0);
    onEmojiSelect(emojiData.emoji);
  };

  useEffect(() => {
    if (!isOpen) return;
    sanitizeSuggestedEmojis();

    const picker = pickerRef.current;
    if (!picker) return;

    const stopScrollPropagation = (event: WheelEvent | TouchEvent) => {
      event.stopPropagation();
    };

    picker.addEventListener("wheel", stopScrollPropagation, { passive: true });
    picker.addEventListener("touchmove", stopScrollPropagation, { passive: true });

    return () => {
      picker.removeEventListener("wheel", stopScrollPropagation);
      picker.removeEventListener("touchmove", stopScrollPropagation);
    };
  }, [isOpen]);

  if (!isOpen || !position || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 cocpit-emoji-picker-backdrop"
        style={{ zIndex: zIndex - 1 }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        ref={pickerRef}
        className="fixed shadow-2xl rounded-2xl overflow-hidden cocpit-emoji-picker"
        style={{ top: position.top, left: position.left, zIndex }}
        onClick={(e) => e.stopPropagation()}
      >
        <style jsx global>{`
          body[data-scroll-locked] .cocpit-emoji-picker,
          body[data-scroll-locked] .cocpit-emoji-picker * {
            pointer-events: auto !important;
          }

          .cocpit-emoji-picker .EmojiPickerReact,
          .cocpit-emoji-picker .epr-main {
            max-height: 340px !important;
            height: 340px !important;
          }

          .cocpit-emoji-picker * {
            pointer-events: auto !important;
          }

          .cocpit-emoji-picker .epr-body {
            overflow-y: scroll !important;
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
          }

          .cocpit-emoji-picker .epr-category-nav {
            justify-content: flex-start !important;
            gap: 4px;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            overscroll-behavior: contain !important;
            -webkit-overflow-scrolling: touch !important;
            scrollbar-width: none;
          }

          .cocpit-emoji-picker .epr-cat-btn {
            flex: 0 0 auto !important;
          }

          .cocpit-emoji-picker .epr-category-nav::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <EmojiPicker
          onEmojiClick={handleEmojiClick}
          lazyLoadEmojis
          width={310}
          height={340}
          previewConfig={{ showPreview: false }}
          theme={resolvedTheme === "dark" ? Theme.DARK : Theme.LIGHT}
        />
      </div>
    </>,
    document.body
  );
}
