"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { PROJECT_ICONS, PROJECT_STRINGS } from "./project.constants";
import type { ProjectHeaderProps } from "./project.types";

export default function ProjectHeader({
  onClose,
  title = PROJECT_STRINGS.headerLabel,
  icon = PROJECT_ICONS.project,
  variant = "default",
}: ProjectHeaderProps) {
  if (variant === "details") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "16px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Back Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "48px",
            height: "48px",
            border: "1px solid #DADADA",
            borderRadius: "100px",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            background: "transparent",
            cursor: "pointer",
            padding: 0,
            outline: "none",
          }}
          className="hover:bg-[#F9FAFB] transition-all"
          title="Back to projects"
        >
          <Icon
            icon="lucide:chevron-left"
            width="24"
            height="24"
            style={{ color: "#000000" }}
          />
        </button>

        {/* Project Title Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "4px",
          }}
        >
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500,
              fontSize: "18px",
              lineHeight: "26px",
              color: "#000000",
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "20px",
              color: "#6B7280",
            }}
          >
            Project
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0px",
        gap: "8px",
        width: "100%",
        maxWidth: "912px",
        height: "40px",
        background: "#FFFFFF",
        borderRadius: "24px",
        boxSizing: "border-box",
      }}
    >
      {/* Left Header Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {/* Project Icon Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "8px",
            gap: "10px",
            width: "40px",
            height: "40px",
            background: "#FFFFFF",
            borderRadius: "24px",
            boxSizing: "border-box",
          }}
        >
          <Icon
            icon={icon}
            width="24"
            height="24"
            style={{ color: "#000000" }}
          />
        </div>

        {/* Project Label */}
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
            color: "#000000",
          }}
        >
          {title}
        </span>
      </div>

      {/* Right Header Action: Cross Button Container */}
      <button
        type="button"
        onClick={onClose}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "40px",
          height: "40px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 0,
          borderRadius: "24px",
          outline: "none",
        }}
        title="Close Project"
        className="hover:bg-[#F9FAFB] transition-all"
      >
        <Icon
          icon={PROJECT_ICONS.close}
          width="24"
          height="24"
          style={{ color: "#000000" }}
        />
      </button>
    </div>
  );
}
