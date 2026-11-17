"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaDetailItem {
  url: string;
  type: "image" | "video" | "document" | string;
  name?: string | null;
}

export interface MediaDetailViewerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaDetailItem[];
  initialIndex?: number;
}

export default function MediaDetailViewer({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
}: MediaDetailViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync index on open or initialIndex change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, items.length - 1)));
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, initialIndex, items.length]);

  const currentMedia = items[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === items.length - 1;

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        if (!isFirst) handlePrev();
      } else if (e.key === "ArrowRight") {
        if (!isLast) handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFirst, isLast, handlePrev, handleNext, onClose]);

  if (!isOpen || !currentMedia || !mounted) return null;

  const isVideo =
    currentMedia.type === "video" ||
    (currentMedia.type && currentMedia.type.startsWith("video/")) ||
    /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(currentMedia.url || "");

  const isDocument =
    currentMedia.type === "document" ||
    currentMedia.type === "file" ||
    (currentMedia.type && currentMedia.type.startsWith("application/")) ||
    /\.(doc|docx|pdf|xls|xlsx|ppt|pptx|txt|csv|zip|rar)$/i.test(
      currentMedia.name || currentMedia.url || ""
    );

  const rawName = currentMedia.name || "";
  const isWordDoc =
    rawName.toLowerCase().endsWith(".doc") ||
    rawName.toLowerCase().endsWith(".docx");

  const displayName = isDocument
    ? rawName || "document.pdf"
    : "Download";

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(currentMedia.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      const fallbackExt = isVideo ? "mp4" : isDocument ? "pdf" : "jpg";
      const filename = rawName.includes(".")
        ? rawName
        : `${rawName || "download"}.${fallbackExt}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
    } catch {
      window.open(currentMedia.url, "_blank");
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center select-none overflow-hidden animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top-Left Action: "Download" or Document File Name */}
      <button
        type="button"
        onClick={handleDownload}
        className="absolute left-6 top-6 md:left-10 md:top-10 flex items-center gap-3 cursor-pointer group bg-transparent border-none p-0 outline-none z-30"
        title="Download"
      >
        <span className="font-['DM_Sans'] text-base font-medium leading-6 text-[var(--ds-text-primary)] group-hover:opacity-80 transition-opacity truncate max-w-[280px] md:max-w-md">
          {displayName}
        </span>
        <Download className="w-5 h-5 text-[var(--ds-text-primary)] stroke-[2] group-hover:scale-110 transition-transform shrink-0" />
      </button>

      {/* Top-Right Action: Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 md:right-10 md:top-10 flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-[var(--ds-text-primary)] transition-all cursor-pointer bg-transparent border-none outline-none z-30"
        title="Close (Esc)"
      >
        <X className="w-5 h-5 text-[var(--ds-text-primary)] stroke-[2]" />
      </button>

      {/* Left Chevron (when multiple items) - Inactive / Disabled at start */}
      {items.length > 1 && (
        <button
          type="button"
          disabled={isFirst}
          onClick={(e) => {
            e.stopPropagation();
            if (!isFirst) handlePrev();
          }}
          className={cn(
            "absolute left-4 md:left-8 lg:left-14 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--ds-text-primary)] transition-all z-30 bg-transparent border-none outline-none",
            isFirst
              ? "opacity-20 cursor-not-allowed pointer-events-none"
              : "opacity-80 hover:opacity-100 hover:bg-white/10 cursor-pointer"
          )}
          title={isFirst ? undefined : "Previous (Left arrow)"}
        >
          <ChevronLeft className="w-6 h-6 text-[var(--ds-text-primary)] stroke-[2]" />
        </button>
      )}

      {/* Center Media Content Container */}
      <div
        className="relative flex items-center justify-center max-w-[calc(100vw-80px)] max-h-[calc(100vh-140px)] md:max-w-[calc(100vw-180px)] md:max-h-[calc(100vh-160px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {isDocument ? (
          <div className="w-[85vw] max-w-4xl h-[78vh] rounded-[16px] overflow-hidden bg-white shadow-2xl">
            <iframe
              src={
                isWordDoc
                  ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(currentMedia.url)}`
                  : `${currentMedia.url}${currentMedia.url.includes('#') ? '&' : '#'}toolbar=0&navpanes=0`
              }
              className="w-full h-full border-none"
              title={displayName}
            />
          </div>
        ) : isVideo ? (
          <video
            key={currentMedia.url}
            src={currentMedia.url}
            controls
            autoPlay
            className="max-w-[calc(100vw-80px)] max-h-[calc(100vh-140px)] md:max-w-[calc(100vw-180px)] md:max-h-[calc(100vh-160px)] w-auto h-auto rounded-[16px] object-contain shadow-2xl bg-black"
          />
        ) : (
          <img
            key={currentMedia.url}
            src={currentMedia.url}
            alt={currentMedia.name || "Preview"}
            className="max-w-[calc(100vw-80px)] max-h-[calc(100vh-140px)] md:max-w-[calc(100vw-180px)] md:max-h-[calc(100vh-160px)] w-auto h-auto rounded-[16px] object-contain shadow-2xl transition-all duration-200"
            draggable={false}
          />
        )}
      </div>

      {/* Right Chevron (when multiple items) - Inactive / Disabled at end */}
      {items.length > 1 && (
        <button
          type="button"
          disabled={isLast}
          onClick={(e) => {
            e.stopPropagation();
            if (!isLast) handleNext();
          }}
          className={cn(
            "absolute right-4 md:right-8 lg:right-14 top-1/2 -translate-y-1/2 p-2 rounded-full text-[var(--ds-text-primary)] transition-all z-30 bg-transparent border-none outline-none",
            isLast
              ? "opacity-20 cursor-not-allowed pointer-events-none"
              : "opacity-80 hover:opacity-100 hover:bg-white/10 cursor-pointer"
          )}
          title={isLast ? undefined : "Next (Right arrow)"}
        >
          <ChevronRight className="w-6 h-6 text-[var(--ds-text-primary)] stroke-[2]" />
        </button>
      )}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
}

