"use client";

import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CompanyCardProps {
  id: number;
  company: string;
  isSelected?: boolean;
}

export default function CompanyCard({
  id,
  company,
  isSelected = false,
}: CompanyCardProps) {
  const isMobile = useIsMobile();

  // Exact dummy list content specified in requirements
  const bulletPoints = [
    "Why it’s relevant",
    "AI integrated INTO existing product",
    "doesn’t break the brand system",
    "contextual AI surfaces",
    "inline + expandable workflows",
    "floating assistance instead of separate chatbot feel",
  ];

  // Helper to get preview image path for Notion, Linear, and Cursor
  const getPreviewImage = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("notion")) {
      return "/assets/notion_preview.png";
    }
    if (lower.includes("linear") || lower.includes("cursor")) {
      return "/assets/linear_preview.png";
    }
    return "/assets/notion_preview.png";
  };

  const handleCompanyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const lower = company.toLowerCase();
    const url = lower.includes("notion")
      ? "https://notion.so"
      : lower.includes("cursor")
      ? "https://cursor.com"
      : lower.includes("linear")
      ? "https://linear.app"
      : `https://www.google.com/search?q=${encodeURIComponent(company)}`;
    window.open(url, "_blank");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "10px",
        width: isMobile ? "100%" : "341px",
        boxSizing: "border-box",
        fontFamily: "'Poppins', sans-serif",
      }}
      className={`transition-all duration-200 rounded-xl ${
        isSelected ? "bg-indigo-50/30 ring-1 ring-indigo-100 p-2 -m-2" : ""
      }`}
    >
      {/* 1. Company Title Row */}
      <div
        style={{
          fontFamily: "Poppins",
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "24px",
          color: "#000000",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <span>{id}.&nbsp;</span>
        <a
          href="#"
          onClick={handleCompanyClick}
          style={{
            textDecoration: "underline",
            color: "#000000",
            cursor: "pointer",
          }}
          className="hover:text-indigo-600 transition-colors"
        >
          {company}
        </a>
      </div>

      {/* 2. Website Preview Image */}
      <img
        src={getPreviewImage(company)}
        alt={`${company} preview`}
        style={{
          width: "100%",
          maxWidth: "341px",
          height: "auto",
          maxHeight: "214px",
          borderRadius: "12px",
          objectFit: "cover",
          border: "1px solid #E5E7EB",
          flexShrink: 0,
        }}
      />

      {/* 3. Description Section */}
      <div style={{ marginTop: "10px" }}>
        <ul
          style={{
            margin: 0,
            padding: 0,
            paddingLeft: "20px",
            listStyleType: "disc",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            fontFamily: "Poppins",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "24px",
            color: "#000000",
          }}
        >
          {bulletPoints.map((point, index) => (
            <li key={index} style={{ paddingLeft: "4px" }}>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
