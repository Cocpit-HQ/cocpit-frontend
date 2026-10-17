"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CloseCrossIcon,
  ProjectDownloadIcon,
  ArrowFrontIcon,
  ArrowLeftIcon,
} from "@/components/icons";
import type { ProjectMedia } from "@/types/entities";

export interface ProjectDocPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ProjectMedia[];
  initialIndex?: number;
}

export function ProjectDocPreviewModal({
  isOpen,
  onClose,
  documents = [],
  initialIndex = 0,
}: ProjectDocPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(
        initialIndex >= 0 && initialIndex < documents.length ? initialIndex : 0
      );
    }
  }, [isOpen, initialIndex, documents.length]);

  const hasMultiple = documents.length > 1;
  const hasNext = currentIndex < documents.length - 1;
  const hasPrev = currentIndex > 0;

  const handleNext = () => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (hasPrev) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onClose]);

  if (!isOpen || documents.length === 0 || !mounted) return null;

  const currentDoc = documents[currentIndex];
  const docUrl = currentDoc?.url || currentDoc?.fileUrl || "";
  const isImage =
    currentDoc?.type === "image" ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(docUrl);

  const getMediaName = () => {
    if (currentDoc?.fileName) return currentDoc.fileName;
    if (currentDoc?.title) {
      if (currentDoc.title.includes(".")) return currentDoc.title;
      return isImage ? `${currentDoc.title}.png` : `${currentDoc.title}.pdf`;
    }
    if (docUrl) {
      try {
        const parts = docUrl.split("/");
        const last = parts[parts.length - 1]?.split("?")[0];
        if (last) return decodeURIComponent(last);
      } catch {}
    }
    return isImage ? "image.png" : "xyz.pdf";
  };

  const docTitle = getMediaName();
  
  const isOfficeDoc = /\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(docUrl) || /\.(doc|docx|ppt|pptx|xls|xlsx)$/i.test(docTitle);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!docUrl) return;

    try {
      const response = await fetch(docUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = docTitle;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback
      const link = document.createElement("a");
      link.href = docUrl;
      link.download = docTitle;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[100] w-screen h-screen select-none bg-[#030303] flex items-center justify-center"
      style={{ background: "#030303" }}
    >
      {/* Scoped scrollbar styling using newGlobal.css design tokens */}
      <style>{`
        .project-media-scroll {
          overflow: auto;
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
          transition: scrollbar-color 200ms ease;
        }
        .project-media-scroll:hover {
          scrollbar-color: #2C2C33 transparent;
        }
        .project-media-scroll::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .project-media-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .project-media-scroll::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 9999px;
          transition: background-color 200ms ease;
        }
        .project-media-scroll:hover::-webkit-scrollbar-thumb {
          background-color: #2C2C33;
        }
        .project-media-scroll:hover::-webkit-scrollbar-thumb:hover {
          background-color: #726B67;
        }
      `}</style>

      {/* Frame 2609838: Top-Left title and download icon: left-4 top-10 on mobile, left-10 top-10 on desktop */}
      <div className="absolute top-10 left-4 md:left-10 flex flex-row items-center gap-3 z-20">
        <span className="font-['DM_Sans'] font-medium text-base leading-6 text-[#FFECE6] max-w-[200px] sm:max-w-md truncate">
          {docTitle}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          className="w-5 h-5 flex-none flex items-center justify-center text-[#FFECE6] hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          title={`Download ${isImage ? "image" : "document"}`}
          aria-label={`Download ${isImage ? "image" : "document"}`}
        >
          <ProjectDownloadIcon className="w-5 h-5 fill-[#FFECE6]" />
        </button>
      </div>

      {/* Cancel Cross Icon at top right: right: 16px on mobile (right-4), 40px on desktop (md:right-10); top: 40px (top-10) */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-10 right-4 md:right-10 w-5 h-5 flex items-center justify-center text-[#FFECE6] hover:opacity-80 transition-opacity z-20 cursor-pointer focus:outline-none"
        aria-label="Close preview"
      >
        <CloseCrossIcon className="w-5 h-5 fill-[#FFECE6]" />
      </button>

      {/* Center Media & Navigation */}
      <div className="relative flex items-center justify-center">
        {/* Left Arrow Icon: 24px left on mobile, 40px on desktop */}
        {hasMultiple && hasPrev && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute right-[calc(100%+24px)] md:right-[calc(100%+40px)] top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#FFECE6] hover:opacity-80 transition-opacity z-20 cursor-pointer focus:outline-none"
            aria-label="Previous media"
          >
            <ArrowLeftIcon className="w-5 h-5 fill-[#FFECE6]" />
          </button>
        )}

        {/* image 27: Center document / image preview box (exact 482px x 620px on desktop, proportional 482/620 aspect on mobile) */}
        <div className="w-[calc(100vw-136px)] sm:w-[380px] md:w-[482px] aspect-[482/620] md:aspect-auto md:h-[620px] max-h-[calc(100vh-160px)] bg-white rounded-sm overflow-hidden flex items-center justify-center shadow-2xl z-10 project-media-scroll">
          {isImage ? (
            <img
              src={docUrl}
              alt={docTitle}
              className="max-w-full max-h-full object-contain bg-white select-none pointer-events-none"
            />
          ) : (
            <iframe
              src={
                isOfficeDoc
                  ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(docUrl)}`
                  : `${docUrl}#toolbar=0&navpanes=0`
              }
              className="w-full h-full border-0 bg-white"
              title={docTitle}
            />
          )}
        </div>

        {/* Arrow front / Right Arrow Icon: 24px right on mobile, 40px on desktop */}
        {hasMultiple && hasNext && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute left-[calc(100%+24px)] md:left-[calc(100%+40px)] top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-[#FFECE6] hover:opacity-80 transition-opacity z-20 cursor-pointer focus:outline-none"
            aria-label="Next media"
          >
            <ArrowFrontIcon className="w-5 h-5 fill-[#FFECE6]" />
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default ProjectDocPreviewModal;
