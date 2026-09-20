"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { CancelIcon, UploadIcon, ProjectDocIcon } from "@/components/icons";
import { toast } from "sonner";

// URL validation helper (supports www, http, https, domains with TLD)
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i;
  return urlPattern.test(trimmed);
};

// URL normalization helper (prepends https:// if protocol missing)
export const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

// ---------------------------------------------------------------------------
// Project Link Modal (Add & Edit modes)
// ---------------------------------------------------------------------------

export interface ProjectLinkModalProps {
  isOpen: boolean;
  mode: "add" | "edit";
  initialTitle?: string;
  initialUrl?: string;
  onClose: () => void;
  onConfirm: (title: string, url: string) => void;
  onDelete?: () => void;
}

export const ProjectLinkModal: React.FC<ProjectLinkModalProps> = ({
  isOpen,
  mode,
  initialTitle = "",
  initialUrl = "",
  onClose,
  onConfirm,
  onDelete,
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [url, setUrl] = useState(initialUrl);
  const [isUrlTouched, setIsUrlTouched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle || "");
      setUrl(initialUrl || "");
      setIsUrlTouched(false);
    }
  }, [isOpen, initialTitle, initialUrl]);

  if (!isOpen) return null;

  const isFormValid = Boolean(title.trim() && isValidUrl(url));

  const handleAction = () => {
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();

    if (!trimmedTitle) {
      toast.error("Please provide a title");
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      toast.error("Please enter a valid link (e.g. www.example.com or https://...)");
      return;
    }

    onConfirm(trimmedTitle, normalizeUrl(trimmedUrl));
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
    >
      {/* Main Box: Bottom sheet on mobile, 300px centered modal on desktop */}
      <div className="w-full sm:w-[300px] h-auto sm:h-[276px] rounded-t-[16px] sm:rounded-[16px] bg-[var(--ds-bg)] border-t sm:border border-[var(--ds-border)] p-[16px] sm:p-[12px] pb-8 sm:pb-[12px] flex flex-col items-center gap-[12px] shadow-2xl relative select-none animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
        {/* Mobile Grabber Handle */}
        <div className="w-9 h-1 rounded-full bg-[var(--ds-text-muted)] mx-auto mb-2 sm:hidden shrink-0" />

        {/* Frame 2609536: Cross Icon Row (w: 276px, h: 20px, justify-end, desktop only) */}
        <div className="w-full sm:w-[276px] h-[20px] hidden sm:flex flex-row justify-end items-center gap-[10px] flex-none order-0 self-stretch">
          <button
            type="button"
            onClick={onClose}
            className="w-[20px] h-[20px] flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none flex-none"
            aria-label="Cancel"
          >
            <CancelIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
          </button>
        </div>

        {/* Title: Link (h: 24px) */}
        <div className="h-[24px] flex items-center justify-center flex-none order-1">
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
            Link
          </span>
        </div>

        {/* Input 1: Title */}
        <div className="w-full sm:w-[276px] h-[62px] box-border flex flex-col justify-center items-start py-[8px] px-0 gap-[10px] border-b border-[var(--ds-border)] flex-none order-2 self-stretch">
          <label
            htmlFor="modal_link_title"
            className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-[var(--ds-text-secondary)]"
          >
            Title
          </label>
          <input
            id="modal_link_title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write a title"
            className="w-full bg-transparent font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] focus:outline-none"
          />
        </div>

        {/* Input 2: Link URL */}
        <div
          className={cn(
            "w-full sm:w-[276px] h-[62px] box-border flex flex-col justify-center items-start py-[8px] px-0 gap-[10px] border-b flex-none order-3 self-stretch transition-colors",
            url.trim() && !isValidUrl(url) && isUrlTouched
              ? "border-[var(--ds-error)]"
              : "border-[var(--ds-border)] focus-within:border-[var(--ds-text-secondary)]"
          )}
        >
          <div className="w-full flex items-center justify-between">
            <label
              htmlFor="modal_link_url"
              className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-[var(--ds-text-secondary)]"
            >
              Link
            </label>
            {url.trim() && !isValidUrl(url) && isUrlTouched && (
              <span className="font-['DM_Sans'] font-normal text-[10px] leading-[12px] text-[var(--ds-error)]">
                e.g. www.example.com
              </span>
            )}
          </div>
          <input
            id="modal_link_url"
            type="text"
            value={url}
            onBlur={() => {
              if (url.trim().length > 0) {
                setIsUrlTouched(true);
              }
            }}
            onChange={(e) => {
              setUrl(e.target.value);
              if (isUrlTouched && isValidUrl(e.target.value)) {
                setIsUrlTouched(false);
              }
            }}
            placeholder="Paste a link"
            className="w-full bg-transparent font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] focus:outline-none"
          />
        </div>

        {/* Buttons Row: Add/Cancel or Save/Delete */}
        <div className="flex flex-row items-center justify-center gap-[8px] h-[36px] flex-none order-4">
          <button
            type="button"
            onClick={handleAction}
            disabled={!isFormValid}
            className={cn(
              "w-[77px] h-[36px] px-[12px] py-[6px] rounded-full flex flex-row justify-center items-center gap-[10px] transition-all focus:outline-none flex-none",
              isFormValid
                ? "bg-[var(--ds-accent)] cursor-pointer hover:opacity-90 active:scale-95"
                : "bg-[var(--ds-surface-1)] cursor-not-allowed opacity-100"
            )}
          >
            <span
              className={cn(
                "font-['DM_Sans'] font-medium text-[16px] leading-[24px]",
                isFormValid ? "text-[var(--ds-text-primary)]" : "text-[var(--ds-text-muted)]"
              )}
            >
              {mode === "add" ? "Add" : "Save"}
            </span>
          </button>

          <button
            type="button"
            onClick={mode === "add" ? onClose : onDelete}
            className="w-[77px] h-[36px] px-[12px] py-[6px] rounded-full border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)] active:scale-95 flex flex-row justify-center items-center gap-[10px] transition-all cursor-pointer focus:outline-none flex-none"
          >
            <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
              {mode === "add" ? "Cancel" : "Delete"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Project Media Modal (Media / Document, Add & Edit modes)
// ---------------------------------------------------------------------------

export interface ProjectMediaModalData {
  mode: "add" | "edit";
  type: "image" | "document";
  id?: string;
  title: string;
  fileName?: string;
  fileUrl?: string;
  pendingFile?: File;
}

export interface ProjectMediaModalProps {
  modalData: ProjectMediaModalData | null;
  onClose: () => void;
  onConfirm: (data: {
    id?: string;
    mode: "add" | "edit";
    type: "image" | "document";
    title: string;
    fileName?: string;
    fileUrl?: string;
    pendingFile?: File;
  }) => void;
  onDelete?: (id: string) => void;
}

export const ProjectMediaModal: React.FC<ProjectMediaModalProps> = ({
  modalData,
  onClose,
  onConfirm,
  onDelete,
}) => {
  const [title, setTitle] = useState(modalData?.title || "");
  const [fileUrl, setFileUrl] = useState(modalData?.fileUrl || "");
  const [fileName, setFileName] = useState(modalData?.fileName || "");
  const [pendingFile, setPendingFile] = useState<File | undefined>(modalData?.pendingFile);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalData) {
      setTitle(modalData.title || "");
      setFileUrl(modalData.fileUrl || "");
      setFileName(modalData.fileName || "");
      setPendingFile(modalData.pendingFile);
    }
  }, [modalData]);

  if (!modalData) return null;

  const isFormValid = Boolean(title.trim() && (fileUrl || pendingFile));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const defaultTitle = modalData.type === "image" ? file.name.replace(/\.[^/.]+$/, "") : file.name;

    setFileUrl(previewUrl);
    setFileName(file.name);
    setPendingFile(file);
    if (!title.trim()) {
      setTitle(defaultTitle);
    }
    e.target.value = "";
  };

  const handleRemove = () => {
    setFileUrl("");
    setFileName("");
    setPendingFile(undefined);
  };

  const handleAction = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.error("Please provide a title");
      return;
    }
    if (!fileUrl && !pendingFile) {
      toast.error("Please select a file");
      return;
    }

    onConfirm({
      id: modalData.id,
      mode: modalData.mode,
      type: modalData.type,
      title: trimmedTitle,
      fileName: fileName || trimmedTitle,
      fileUrl: fileUrl,
      pendingFile: pendingFile,
    });
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-150"
    >
      {/* Hidden file picker for modal box click / double click */}
      <input
        ref={fileInputRef}
        type="file"
        accept={modalData.type === "image" ? "image/*" : ".pdf,.doc,.docx,.txt"}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Box: Bottom sheet on mobile, 300px centered modal on desktop */}
      <div className="w-full sm:w-[300px] rounded-t-[16px] sm:rounded-[16px] bg-[var(--ds-bg)] border-t sm:border border-[var(--ds-border)] p-[16px] sm:p-[12px] pb-8 sm:pb-[12px] flex flex-col items-center gap-[12px] shadow-2xl relative select-none animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
        {/* Mobile Grabber Handle */}
        <div className="w-9 h-1 rounded-full bg-[var(--ds-text-muted)] mx-auto mb-2 sm:hidden shrink-0" />

        {/* Frame 2609536: Cross Icon Row (w: 276px, h: 20px, justify-end, desktop only) */}
        <div className="w-full sm:w-[276px] h-[20px] hidden sm:flex flex-row justify-end items-center gap-[10px] flex-none order-0 self-stretch">
          <button
            type="button"
            onClick={onClose}
            className="w-[20px] h-[20px] flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-75 transition-opacity cursor-pointer focus:outline-none flex-none"
            aria-label="Cancel"
          >
            <CancelIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
          </button>
        </div>

        {/* Title: Media or Document (h: 24px) */}
        <div className="h-[24px] flex items-center justify-center flex-none order-1">
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
            {modalData.type === "image" ? "Media" : "Document"}
          </span>
        </div>

        {/* Input 1: Title */}
        <div className="w-full sm:w-[276px] h-[62px] box-border flex flex-col justify-center items-start py-[8px] px-0 gap-[10px] border-b border-[var(--ds-border)] flex-none order-2 self-stretch">
          <label
            htmlFor="media_modal_title"
            className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-[var(--ds-text-secondary)]"
          >
            Title
          </label>
          <input
            id="media_modal_title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Write a title"
            className="w-full bg-transparent font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] focus:outline-none"
          />
        </div>

        {/* Upload Area / Filled Area */}
        {fileUrl ? (
          /* Frame 2609700: Filled Box (w: 276px, gap: 12px) */
          <div className="w-full sm:w-[276px] flex flex-col items-center p-0 gap-[12px] flex-none order-3 self-stretch">
            {modalData.type === "image" ? (
              /* Avatar / Image (w: 276px, h: 120px, rounded: 16px) */
              <div
                onDoubleClick={() => fileInputRef.current?.click()}
                title="Double-click to change image"
                className="w-full sm:w-[276px] h-[120px] rounded-[16px] overflow-hidden bg-[var(--ds-border)] flex items-center justify-center cursor-pointer flex-none self-stretch"
              >
                <img src={fileUrl} alt={title} className="w-full h-full object-cover" />
              </div>
            ) : (
              /* Document Box (w: 276px, h: 120px, rounded: 16px, bg: var(--ds-border)) */
              <div
                onDoubleClick={() => fileInputRef.current?.click()}
                title="Double-click to change document"
                className="w-full sm:w-[276px] h-[120px] rounded-[16px] bg-[var(--ds-border)] flex flex-col justify-center items-center gap-[8px] cursor-pointer flex-none self-stretch"
              >
                <ProjectDocIcon className="w-10 h-10 text-[var(--ds-text-primary)] flex-none" />
                <span className="max-w-[240px] truncate font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-primary)] text-center">
                  {fileName || "Document"}
                </span>
              </div>
            )}

            {/* Remove Button (DM Sans 12px, var(--ds-error)) */}
            <button
              type="button"
              onClick={handleRemove}
              className="h-[16px] flex items-center justify-center font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-error)] no-underline cursor-pointer focus:outline-none flex-none order-1"
            >
              Remove
            </button>
          </div>
        ) : (
          /* Empty Upload Box (Avatar: w: 276px, h: 120px, bg: var(--ds-border), rounded: 16px) */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-[276px] h-[120px] bg-[var(--ds-border)] rounded-[16px] flex flex-col justify-center items-center gap-[8px] cursor-pointer hover:opacity-90 transition-opacity flex-none order-3 self-stretch"
          >
            <UploadIcon size={40} className="w-10 h-10 text-[var(--ds-text-primary)] flex-none" />
            <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-primary)] text-center">
              {modalData.type === "image" ? "Add media" : "PDF, WORD, TXT"}
            </span>
          </div>
        )}

        {/* Buttons Row: Add/Cancel or Save/Delete */}
        <div className="flex flex-row items-center justify-center gap-[8px] h-[36px] flex-none order-4">
          <button
            type="button"
            onClick={handleAction}
            disabled={!isFormValid}
            className={cn(
              "w-[77px] h-[36px] px-[12px] py-[6px] rounded-full flex flex-row justify-center items-center gap-[10px] transition-all focus:outline-none flex-none",
              isFormValid
                ? "bg-[var(--ds-accent)] cursor-pointer hover:opacity-90 active:scale-95"
                : "bg-[var(--ds-surface-1)] cursor-not-allowed opacity-100"
            )}
          >
            <span
              className={cn(
                "font-['DM_Sans'] font-medium text-[16px] leading-[24px]",
                isFormValid ? "text-[var(--ds-text-primary)]" : "text-[var(--ds-text-muted)]"
              )}
            >
              {modalData.mode === "add" ? "Add" : "Save"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (modalData.mode === "add") {
                onClose();
              } else if (modalData.id && onDelete) {
                onDelete(modalData.id);
              } else {
                onClose();
              }
            }}
            className="w-[77px] h-[36px] px-[12px] py-[6px] rounded-full border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)] active:scale-95 flex flex-row justify-center items-center gap-[10px] transition-all cursor-pointer focus:outline-none flex-none"
          >
            <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
              {modalData.mode === "add" ? "Cancel" : "Delete"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
