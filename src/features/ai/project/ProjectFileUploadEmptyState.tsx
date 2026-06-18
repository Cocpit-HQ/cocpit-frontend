"use client";

import React, { useRef } from "react";
import { Icon } from "@iconify/react";

interface ProjectFileUploadEmptyStateProps {
  onFilesSelected: (files: FileList) => void;
}

export default function ProjectFileUploadEmptyState({
  onFilesSelected,
}: ProjectFileUploadEmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value to allow uploading same file again if deleted
      e.target.value = "";
    }
  };

  return (
    <div
      onClick={handleContainerClick}
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        gap: "16px",
        width: "100%",
        maxWidth: "348px",
        height: "140px",
        border: "1px dashed var(--border)",
        borderRadius: "12px",
        cursor: "pointer",
        alignSelf: "center",
      }}
      className="hover:opacity-80 transition-opacity"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        style={{ display: "none" }}
      />
 
      {/* Upload Icon */}
      <Icon
        icon="iconoir:cloud-upload"
        width={40}
        height={40}
        style={{ color: "var(--muted-foreground)" }}
      />
 
      {/* Empty State Text Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          textAlign: "center",
        }}
      >
        {/* Title */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "16px",
            fontWeight: 500,
            lineHeight: "24px",
            color: "var(--foreground)",
          }}
        >
          Drop or upload documents
        </span>
 
        {/* Subtitle */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: "12px",
            fontWeight: 400,
            lineHeight: "16px",
            color: "var(--muted-foreground)",
            maxWidth: "300px",
          }}
        >
          Add files and sources to give context to your chats
        </span>
      </div>
    </div>
  );
}
