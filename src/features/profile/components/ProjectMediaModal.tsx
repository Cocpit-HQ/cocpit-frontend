"use client";

import React, { useState, useEffect, useRef } from "react";
import { ProjectMedia } from "@/types/entities";
import { X, Upload, FileText, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ProjectMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (media: ProjectMedia, isEdit: boolean) => void;
  onDelete?: (id: string) => void;
  mediaType: "link" | "image" | "document";
  initialData?: ProjectMedia | null;
}

export function ProjectMediaModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  mediaType,
  initialData,
}: ProjectMediaModalProps) {
  const isEditing = !!initialData;
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [pendingFile, setPendingFile] = useState<File | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || "");
        setUrl(initialData.url || "");
        setFileUrl(initialData.fileUrl || initialData.url || undefined);
        setFileName(initialData.fileName || initialData.title || undefined);
        setPendingFile(initialData.pendingFile);
      } else {
        setTitle("");
        setUrl("");
        setFileUrl(undefined);
        setFileName(undefined);
        setPendingFile(undefined);
      }
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    return () => {
      if (fileUrl && fileUrl.startsWith("blob:")) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const newFileUrl = URL.createObjectURL(file);
      setFileUrl(newFileUrl);
      setFileName(file.name);
      setPendingFile(file);
      if (!title.trim()) {
        const nameWithoutExt = file.name.split(".")[0];
        setTitle(nameWithoutExt);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const mediaItem: ProjectMedia = {
      id: initialData?.id || `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: mediaType,
      title: title.trim(),
      url: mediaType === "link" ? url.trim() : fileUrl || url.trim(),
      fileUrl,
      fileName,
      pendingFile,
    };

    onSave(mediaItem, isEditing);
    onClose();
  };

  const getTitlePlaceholder = () => {
    if (mediaType === "link") return "e.g. cocpit";
    if (mediaType === "image") return "e.g. cocpitbanner";
    return "e.g. cocpitdoc";
  };

  const inputStyles =
    "w-full bg-card border border-border placeholder:text-muted-foreground rounded-[16px] h-[48px] px-4 font-[family-name:var(--font-poppins)] text-[16px] leading-[24px] text-foreground focus:border-[#6366F1] focus-visible:outline-none transition-all shadow-none";
  const labelStyles =
    "block font-[family-name:var(--font-poppins)] font-normal text-[14px] leading-[20px] text-foreground mb-2";

  const isFormValid = title.trim().length > 0 && (mediaType === "link" ? url.trim().length > 0 : !!(fileUrl || url.trim()));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-90">
      <div className="w-full max-w-[500px] rounded-[24px] bg-card shadow-2xl relative flex flex-col overflow-hidden border border-border animate-in zoom-in-95 duration-200">
        {/* Top Close Row */}
        <div className="flex justify-end p-4 pb-0">
          <button
            onClick={onClose}
            type="button"
            className="text-[#FF6B6B] hover:bg-[#FF6B6B]/10 p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" strokeWidth={1} />
          </button>
        </div>

        {/* Header */}
        <div className="text-center px-6 pb-6">
          <h2 className="text-[18px] leading-[26px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
            {isEditing ? `Edit ${mediaType}` : `Add ${mediaType}`}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Title Input */}
          <div className="flex flex-col">
            <Label className={labelStyles}>Title</Label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={getTitlePlaceholder()}
              className={inputStyles}
            />
          </div>

          {/* Link Input */}
          {mediaType === "link" && (
            <div className="flex flex-col">
              <Label className={labelStyles}>Link</Label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. https://yourproject.com"
                className={inputStyles}
              />
            </div>
          )}

          {/* Image Upload/Preview */}
          {mediaType === "image" && (
            <div className="flex flex-col">
              <Label className={labelStyles}>Image</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {fileUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-[280px] max-h-[350px] mx-auto rounded-[16px] overflow-hidden border border-border relative group cursor-pointer bg-secondary flex items-center justify-center shadow-sm hover:opacity-95 transition-all"
                >
                  <img
                    src={fileUrl}
                    alt="Preview"
                    className="w-full max-h-[350px] object-contain block"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-sm">
                    Click to replace
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[180px] rounded-[16px] border-2 border-dashed border-border hover:border-[#6366F1] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground bg-secondary/30"
                >
                  <ImageIcon className="w-10 h-10 text-muted-foreground/70" />
                  <span className="text-sm font-medium">Click to choose an image</span>
                </div>
              )}
            </div>
          )}

          {/* Document Upload/Preview */}
          {mediaType === "document" && (
            <div className="flex flex-col">
              <Label className={labelStyles}>Document</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx"
                onChange={handleFileChange}
                className="hidden"
              />
              {fileUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-[200px] h-[240px] mx-auto rounded-[16px] border border-border bg-secondary flex flex-col items-center justify-center p-4 text-center cursor-pointer group hover:border-[#6366F1] transition-all relative overflow-hidden shadow-sm"
                >
                  {(fileName?.toLowerCase().endsWith(".pdf") || pendingFile?.type === "application/pdf") ? (
                    <>
                      <div className="absolute inset-0 w-full h-full p-2 pointer-events-none overflow-hidden">
                        <iframe
                          src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                          className="w-full h-full border-0 pointer-events-none select-none rounded-[8px]"
                          tabIndex={-1}
                          scrolling="no"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4">
                        <span className="text-xs font-medium max-w-full truncate px-2 mb-1">
                          {fileName || "document.pdf"}
                        </span>
                        <span className="text-[10px] font-medium">Click to replace</span>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Fallback mock thumbnail preview effect for non-PDF documents */}
                      <div className="w-16 h-20 bg-white dark:bg-card border border-border rounded shadow-md flex items-center justify-center mb-3 text-[#6366F1]">
                        <FileText className="w-8 h-8" />
                      </div>
                      <span className="text-xs font-medium text-foreground max-w-full truncate px-2">
                        {fileName || "document.pdf"}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-1">Click to replace</span>
                    </>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[160px] rounded-[16px] border-2 border-dashed border-border hover:border-[#6366F1] transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 text-muted-foreground bg-secondary/30"
                >
                  <FileText className="w-10 h-10 text-muted-foreground/70" />
                  <span className="text-sm font-medium">Click to upload document</span>
                  <span className="text-[11px] text-muted-foreground/70">PDF, Word, TXT supported</span>
                </div>
              )}
            </div>
          )}

          <div className="pb-2"></div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-center items-center gap-4 pt-6 pb-8 px-6 border-t border-border mt-auto bg-card">
          {isEditing && onDelete ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (initialData?.id) onDelete(initialData.id);
                onClose();
              }}
              className="h-10 px-8 rounded-full border-[#818CF8] text-[#818CF8] hover:bg-[#818CF8]/10 bg-transparent font-medium w-[142px] font-[family-name:var(--font-poppins)] cursor-pointer"
            >
              Delete
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-8 rounded-full border-[#818CF8] text-[#818CF8] hover:bg-[#818CF8]/10 bg-transparent font-medium w-[142px] font-[family-name:var(--font-poppins)] cursor-pointer"
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className="h-10 px-8 rounded-full bg-[#6366F1] text-white hover:bg-[#4F46E5] font-medium w-[142px] disabled:opacity-40 disabled:cursor-not-allowed font-[family-name:var(--font-poppins)] cursor-pointer shadow-sm"
          >
            {isEditing ? "Save" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
