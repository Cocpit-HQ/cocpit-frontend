"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons";

export interface DownloadProfileScreenProps {
  isOpen?: boolean;
  onClose: () => void;
  pdfUrl: string;
}

export const DownloadProfileScreen: React.FC<DownloadProfileScreenProps> = ({
  isOpen = true,
  onClose,
  pdfUrl,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while open
  useEffect(() => {
    if (isOpen && mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, mounted]);

  // Support Escape key to close
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

  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100] min-h-screen w-full bg-[var(--ds-bg)] flex flex-col items-center animate-in fade-in-90 duration-200">
      {/* Top Right Controls */}
      <div className="fixed top-[40px] right-[40px] z-[10000] flex items-center gap-4">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close download profile"
          className="w-[36px] h-[36px] flex items-center justify-center bg-[var(--ds-surface-2)] rounded-full text-[var(--ds-text-primary)] hover:opacity-75 active:scale-95 transition-all cursor-pointer focus:outline-none shadow-lg"
        >
          <CloseIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
        </button>
      </div>

      {/* Full Screen Container for PDF Viewer */}
      <div className="w-full h-full relative overflow-hidden">
        <iframe 
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
          className="w-full h-full border-none"
          title="Resume Preview"
        />
      </div>
    </div>
  );

  if (mounted && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
};

export default DownloadProfileScreen;
