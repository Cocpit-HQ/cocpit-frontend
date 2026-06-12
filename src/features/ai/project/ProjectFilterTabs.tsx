"use client";

import React from "react";

interface ProjectFilterTabsProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  tabs?: string[];
}

export default function ProjectFilterTabs({
  activeTab,
  onChangeTab,
  tabs = ["Chats", "Files", "Instructions"],
}: ProjectFilterTabsProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "0px",
        gap: "16px",
        width: "100%",
        flexWrap: "wrap",
        boxSizing: "border-box",
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChangeTab(tab)}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              padding: "8px 16px",
              height: "36px",
              background: isActive ? "#EEF2FF" : "#FFFFFF",
              border: isActive ? "1px solid #EEF2FF" : "1px solid #818CF8",
              borderRadius: "24px",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s ease",
            }}
            className="hover:opacity-90"
          >
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                lineHeight: "20px",
                color: isActive ? "#6366F1" : "#818CF8",
              }}
            >
              {tab}
            </span>
          </button>
        );
      })}
    </div>
  );
}
