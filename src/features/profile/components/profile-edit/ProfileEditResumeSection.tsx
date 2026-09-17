"use client";

import React, { useRef } from "react";
import { toast } from "sonner";
import { useResumeMutations } from "@/hooks/use-my-profile";

interface ProfileEditResumeSectionProps {
  resumeInfo?: {
    name?: string | null;
    originalName?: string | null;
    url?: string | null;
    file_url?: string | null;
  } | null;
}

export const ProfileEditResumeSection: React.FC<ProfileEditResumeSectionProps> = ({
  resumeInfo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { upload, remove } = useResumeMutations();

  const resumeFileName =
    resumeInfo?.originalName ||
    resumeInfo?.name ||
    (resumeInfo?.url || resumeInfo?.file_url
      ? (resumeInfo.url || resumeInfo.file_url)!.split("/").pop()?.split("?")[0]
      : null) ||
    "Resume.pdf";

  const hasResume = Boolean(
    resumeInfo?.url || resumeInfo?.file_url || resumeInfo?.originalName || resumeInfo?.name
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only PDF files are allowed for resume upload.");
      return;
    }

    try {
      const fd = new FormData();
      fd.append("resume", file);
      await upload.mutateAsync(fd);
      toast.success("Resume uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload resume.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = async () => {
    try {
      await remove.mutateAsync();
      toast.success("Resume removed successfully!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to remove resume.");
    }
  };

  return (
    /* AboutSection: 800px width, flex column, gap 12px */
    <div className="w-[800px] max-w-full flex flex-col items-start gap-[12px]">
      {/* Resume Label */}
      <span className="font-['DM_Sans'] font-medium text-[12px] leading-[16px] text-[var(--ds-text-primary)]">
        Resume
      </span>

      {/* Frame row: gap 8px, height 20px */}
      <div className="flex flex-row items-center gap-[8px] h-[20px]">
        {hasResume ? (
          <>
            <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] truncate max-w-[320px]">
              {resumeFileName}
            </span>
            <span className="w-[4px] h-[4px] rounded-full bg-[var(--ds-text-muted)] shrink-0" />
            <button
              type="button"
              onClick={handleRemove}
              disabled={remove.isPending}
              className="font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-[var(--ds-error)] hover:underline cursor-pointer disabled:opacity-50 focus:outline-none"
            >
              {remove.isPending ? "Removing..." : "Remove"}
            </button>
          </>
        ) : (
          <>
            <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-muted)]">
              No resume uploaded
            </span>
            <span className="w-[4px] h-[4px] rounded-full bg-[var(--ds-text-muted)] shrink-0" />
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={upload.isPending}
              className="font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-[var(--ds-accent)] hover:underline cursor-pointer disabled:opacity-50 focus:outline-none"
            >
              {upload.isPending ? "Uploading..." : "Upload resume"}
            </button>
          </>
        )}

        {/* Hidden File Input for PDF only */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ProfileEditResumeSection;
