"use client";

import React from "react";

interface WebsiteMessageCardProps {
  company: string;
  onClick: () => void;
}

export default function WebsiteMessageCard({ company, onClick }: WebsiteMessageCardProps) {
  const getLogoImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("notion")) return "/assets/notion_logo.png";
    if (lower.includes("cursor")) return "/assets/cursor_logo.png";
    return "/assets/company-placeholder.png";
  };

  return (
    <div
      onClick={onClick}
      style={{
        width: "133px",
        height: "56px",
        border: "1px solid #DADADA",
        borderRadius: "12px",
        padding: "6px 8px",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#FFFFFF",
        cursor: "pointer",
        boxSizing: "border-box",
      }}
      className="hover:bg-gray-50 transition-all duration-200"
    >
      {/* Left Image Placeholder */}
      <img
        src={getLogoImage(company)}
        alt={`${company} logo`}
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "8px",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
      {/* Right Content */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flexGrow: 1 }}>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#000000",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: "1.2",
          }}
        >
          {company}
        </span>
        <span
          style={{
            fontSize: "16px",
            fontWeight: 400,
            color: "#6B7280",
            lineHeight: "1.2",
          }}
        >
          Website
        </span>
      </div>
    </div>
  );
}
