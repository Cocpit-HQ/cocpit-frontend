"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import type { ProjectFile } from "./project.types";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectFileItemProps {
  file: ProjectFile;
  onDelete: (id: string) => void;
}

export default function ProjectFileItem({ file, onDelete }: ProjectFileItemProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);

  // Helper to get formatted time ago
  const formatTimeAgo = (dateInput: Date | string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    }

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
  };

  const isDocument = file.type === "document";

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        boxSizing: "border-box",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px",
        gap: "16px",
        height: "56px",
        width: "100%",
        borderRadius: "12px",
        backgroundColor: isHovered ? "#EEF2FF" : "transparent",
        transition: "background-color 0.2s ease-in-out",
      }}
    >
      {/* Left Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          minWidth: 0,
          flex: 1,
        }}
      >
        {/* File Type Icon Container */}
        {isDocument ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              backgroundColor: "#EF5350",
              flexShrink: 0,
            }}
          >
            <Icon icon="bi:file-earmark-pdf-fill" width={20} height={20} style={{ color: "#FFFFFF" }} />
          </div>
        ) : (
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {file.url ? (
              <img
                src={file.url}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                alt={file.name}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#E0E7FF",
                }}
              >
                <Icon icon="solar:image-linear" width={20} height={20} style={{ color: "#6366F1" }} />
              </div>
            )}
          </div>
        )}

        {/* File Details */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "4px",
            minWidth: 0,
            flex: 1,
          }}
        >
          {/* File Name */}
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: "20px",
              color: "#000000",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={file.name}
          >
            {file.name}
          </span>

          {/* File Meta Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: "'Poppins', sans-serif",
              fontSize: "12px",
              fontWeight: 400,
              lineHeight: "16px",
              color: "#6B7280",
            }}
          >
            <span>{isDocument ? "Document" : "Image"}</span>
            <span
              style={{
                display: "inline-block",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#6B7280",
                margin: "0 8px",
              }}
            />
            <span>{formatTimeAgo(file.uploadedAt)}</span>
          </div>
        </div>
      </div>

      {/* Delete Icon (Show only on hover) */}
      <div
        style={{
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {(isMobile || isHovered) && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file.id);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              margin: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              outline: "none",
            }}
            title="Delete file"
          >
            <Icon icon="hugeicons:delete-02" width={24} height={24} style={{ color: "#FF6B6B" }} />
          </button>
        )}
      </div>
    </div>
  );
}
