"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { PROJECT_ICONS, PROJECT_STRINGS } from "./project.constants";
import type { ProjectEmptyStateProps } from "./project.types";

export default function ProjectEmptyState({
  onNewProjectClick,
  title = PROJECT_STRINGS.emptyStatePrimary,
  description = PROJECT_STRINGS.emptyStateSecondary,
  icon = PROJECT_ICONS.project,
  buttonText = PROJECT_STRINGS.newProjectButton,
  buttonIcon = PROJECT_ICONS.plus,
}: ProjectEmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0px",
        gap: "16px",
        width: "100%",
        maxWidth: "912px",
        flex: 1, // Fill remaining space dynamically
        boxSizing: "border-box",
      }}
    >
      {/* Empty State Project Icon */}
      <Icon
        icon={icon}
        width="80"
        height="80"
        style={{ color: "#000000" }}
      />

      {/* Text Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0px",
          gap: "8px",
          width: "100%",
          maxWidth: "300px",
          height: "auto",
          boxSizing: "border-box",
        }}
      >
        {/* Primary Text */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "24px",
            textAlign: "center",
            color: "#000000",
            display: "block",
          }}
        >
          {title}
        </span>

        {/* Secondary Text */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "12px",
            lineHeight: "16px",
            textAlign: "center",
            color: "#6B7280",
            display: "block",
          }}
        >
          {description}
        </span>
      </div>

      {/* New Project Button */}
      <button
        type="button"
        onClick={onNewProjectClick}
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          padding: "0px 16px", // Use 0px top/bottom to allow perfect vertical centering inside 40px height
          gap: "10px",
          width: "150px",
          height: "40px",
          background: "#6366F1",
          border: "1px solid #FFFFFF",
          borderRadius: "24px",
          cursor: "pointer",
          outline: "none",
          whiteSpace: "nowrap",
        }}
        className="hover:opacity-90 transition-all"
      >
        {/* Plus Icon */}
        <Icon
          icon={buttonIcon}
          width="24"
          height="24"
          style={{ color: "#FFFFFF" }}
        />
        {/* Button Text */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
            textAlign: "center",
            color: "#FFFFFF",
            whiteSpace: "nowrap",
          }}
        >
          {buttonText}
        </span>
      </button>
    </div>
  );
}
