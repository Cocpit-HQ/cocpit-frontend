"use client"

import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import { useIsMobile } from "@/hooks/use-mobile";

interface MoreInfoPanelProps {
  onClose: () => void;
  onSend: (message: string) => void;
  options?: string[];
}

const DEFAULT_OPTIONS = [
  "App",
  "Website",
  "SaaS Product",
  "Landing Page",
  "Smart TV App"
];

export default function MoreInfoPanel({
  onClose,
  onSend,
  options = DEFAULT_OPTIONS
}: MoreInfoPanelProps) {
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customText, setCustomText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(120, Math.max(24, scrollHeight));
      textarea.style.height = `${newHeight}px`;
    }
  };

  // Pagination parameters
  const itemsPerPage = 3;
  const totalPages = Math.ceil(options.length / itemsPerPage);

  // Calculate the options for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, options.length);
  const visibleOptions = options.slice(startIndex, endIndex);

  // Handle clicking next page
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Handle clicking previous page
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Handle predefined option click
  const handleSelectOption = (option: string, absoluteIndex: number) => {
    setSelectedIndex(absoluteIndex);
    // Visual feedback delay
    setTimeout(() => {
      onSend(option);
      onClose();
    }, 200);
  };

  // Handle sending custom input
  const handleSendCustom = () => {
    if (customText.trim() === "") return;
    onSend(customText.trim());
    setCustomText("");
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendCustom();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 4000) {
      setCustomText(val);
      setTimeout(adjustHeight, 0);
    }
  };

  const isCustomActive = customText.trim() !== "";
  const displayPage = String(currentPage).padStart(2, "0");
  const displayTotalPages = String(totalPages).padStart(2, "0");

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "16px",
        gap: "16px",
        width: "100%",
        maxWidth: isMobile ? "100%" : "912px",
        minHeight: "280px",
        height: "auto",
        background: "#FFFFFF",
        border: "1px solid #E0E7FF",
        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
        borderRadius: "24px",
        fontFamily: "Poppins, sans-serif"
      }}
    >
      {/* HEADER ROW */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px",
          width: "100%",
          height: "40px"
        }}
      >
        <span
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "16px",
            fontWeight: 400,
            lineHeight: "24px",
            color: "#000000"
          }}
        >
          What are you building?
        </span>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "16px"
          }}
        >
          {/* PAGINATION SECTION */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              width: "115px",
              height: "40px"
            }}
          >
            {/* Previous Arrow */}
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              style={{
                background: "transparent",
                border: "none",
                cursor: currentPage === 1 ? "default" : "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: currentPage === 1 ? 0.3 : 1,
                transition: "opacity 0.2s ease"
              }}
            >
              <Icon
                icon="lucide:chevron-left"
                width="20"
                height="20"
                style={{ color: currentPage === 1 ? "#9CA3AF" : "#6366F1" }}
              />
            </button>

            {/* Page Counter */}
            <span
              style={{
                fontFamily: "Poppins, sans-serif",
                fontSize: "14px",
                fontWeight: 400,
                color: "#000000",
                userSelect: "none"
              }}
            >
              {displayPage}/{displayTotalPages}
            </span>

            {/* Next Arrow */}
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              style={{
                background: "transparent",
                border: "none",
                cursor: currentPage === totalPages ? "default" : "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: currentPage === totalPages ? 0.3 : 1,
                transition: "opacity 0.2s ease"
              }}
            >
              <Icon
                icon="lucide:chevron-right"
                width="20"
                height="20"
                style={{ color: currentPage === totalPages ? "#9CA3AF" : "#6366F1" }}
              />
            </button>
          </div>

          {/* CLOSE ICON */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "opacity 0.2s ease"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <Icon icon="ri:close-line" width="24" height="24" style={{ color: "#000000" }} />
          </button>
        </div>
      </div>

      {/* OPTIONS CONTAINER */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minHeight: "192px",
          height: "auto",
          position: "relative"
        }}
      >
        {/* Predefined Options List */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            opacity: isCustomActive ? 0.4 : 1,
            transition: "opacity 0.2s ease",
            pointerEvents: isCustomActive ? "none" : "auto"
          }}
        >
          {visibleOptions.map((option, idx) => {
            const absoluteIdx = startIndex + idx;
            const isSelected = selectedIndex === absoluteIdx;
            return (
              <div
                key={option}
                onClick={() => handleSelectOption(option, absoluteIdx)}
                style={{
                  height: "48px",
                  padding: "8px 16px",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: "12px",
                  background: isSelected ? "#EEF2FF" : "transparent",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "#F9FAFB";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                {/* Number Badge */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "16px",
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "16px",
                    fontWeight: 400,
                    color: isCustomActive ? "#9CA3AF" : "#6B7280"
                  }}
                >
                  {absoluteIdx + 1}
                </div>

                {/* Option Text */}
                <span
                  style={{
                    fontFamily: "Poppins, sans-serif",
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: isCustomActive ? "#9CA3AF" : "#000000"
                  }}
                >
                  {option}
                </span>
              </div>
            );
          })}
        </div>

        {/* CUSTOM INPUT ROW */}
        <div
          style={{
            minHeight: "48px",
            height: "auto",
            padding: "8px 16px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderRadius: "12px",
            background: isCustomActive ? "#EEF2FF" : "transparent",
            borderTop: isCustomActive ? "none" : "1px solid #EEF2FF",
            border: customText.length === 4000 ? "1px solid #FF6B6B" : undefined,
            transition: "all 0.2s ease",
            marginTop: "auto"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-end",
              flex: 1,
              minHeight: "32px",
              height: "auto"
            }}
          >
            {/* Left Icon (Pencil) */}
            <Icon
              icon="lucide:pencil"
              width="20"
              height="20"
              style={{
                marginRight: "16px",
                color: isCustomActive ? "#6366F1" : "#6B7280",
                marginBottom: "6px"
              }}
            />

            {/* Input Element */}
            <textarea
              ref={inputRef}
              value={customText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Something else"
              maxLength={4000}
              rows={1}
              className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontFamily: "Poppins, sans-serif",
                fontSize: "16px",
                lineHeight: "24px",
                color: isCustomActive ? "#000000" : "#6B7280",
                resize: "none",
                height: "24px",
                overflowY: "auto",
                boxSizing: "border-box",
                marginBottom: "4px"
              }}
            />
          </div>

          {/* Right Action */}
          <div style={{ alignSelf: "flex-end", marginBottom: "4px" }}>
            {isCustomActive ? (
              <button
                type="button"
                onClick={handleSendCustom}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px"
                }}
              >
                <Icon
                  icon="lucide:chevron-right"
                  width="24"
                  height="24"
                  style={{ color: "#6366F1" }}
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Poppins, sans-serif",
                  fontSize: "14px",
                  color: "#6366F1"
                }}
              >
                Skip
              </button>
            )}
          </div>
        </div>
        {customText.length === 4000 && (
          <div
            style={{
              alignSelf: "flex-end",
              color: "#FF6B6B",
              fontFamily: "Poppins",
              fontSize: "14px",
              marginTop: "4px",
              paddingRight: "16px"
            }}
          >
            4000/4000
          </div>
        )}
      </div>
    </div>
  );
}
