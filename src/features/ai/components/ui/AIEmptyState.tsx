"use client"

import React, { useState, useRef } from "react";
import type { AISuggestion, AIAttachment } from "../../types/ai.types";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import UnsupportedFileCard from "./UnsupportedFileCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface AIEmptyStateProps {
  suggestions: AISuggestion[];
  onSuggestionClick: (prompt: string, attachments?: AIAttachment[]) => void;
  isLoading?: boolean;
  onOpenHistory?: () => void;
  isHistoryOpen?: boolean;
  onOpenProject?: () => void;
  hideHeaderActions?: boolean;
}

const FIXED_LINKS = [
  "Find skill gaps",
  "Suggest connections",
  "Career trajectory",
];

export default function AIEmptyState({
  suggestions,
  onSuggestionClick,
  isLoading = false,
  onOpenHistory,
  isHistoryOpen = false,
  onOpenProject,
  hideHeaderActions = false,
}: AIEmptyStateProps) {
  const isMobile = useIsMobile();
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AIAttachment[]>([]);
  const [showLimitError, setShowLimitError] = useState(false);
  const [showPrivateForkBanner, setShowPrivateForkBanner] = useState(false);
  const [showRechargeBanner, setShowRechargeBanner] = useState(() => {
    if (typeof window !== "undefined") {
      return !!(window as any).MOCK_TOKEN_LIMIT;
    }
    return false;
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(120, Math.max(24, scrollHeight));
      textarea.style.height = `${newHeight}px`;
    }
  };

  const handleCloseRecharge = () => {
    setShowRechargeBanner(false);
    if (typeof window !== "undefined") {
      (window as any).MOCK_TOKEN_LIMIT = false;
    }
  };

  const handleRechargeClick = () => {
    toast("Feature is in progress");
  };

  const handleSend = () => {
    if ((inputValue.trim() || attachedFiles.length > 0) && !isLoading) {
      const contentLower = inputValue.toLowerCase();
      const isTokenLimitTrigger = ["token", "tokens", "recharge", "limit reached", "out of tokens"].some(kw =>
        contentLower.includes(kw)
      );

      if (isTokenLimitTrigger) {
        if (typeof window !== "undefined") {
          (window as any).MOCK_TOKEN_LIMIT = true;
        }
        setShowRechargeBanner(true);
        setShowLimitError(false);
        return;
      }

      const isPrivateTrigger =
        contentLower.includes("fork") ||
        contentLower.includes("private session") ||
        contentLower.includes("sarah") ||
        contentLower.includes("private thread") ||
        attachedFiles.length > 0;

      if (isPrivateTrigger && !showPrivateForkBanner) {
        setShowPrivateForkBanner(true);
        return;
      }

      onSuggestionClick(inputValue.trim(), attachedFiles);
      setInputValue("");
      setAttachedFiles([]);
      setShowLimitError(false);
      setShowPrivateForkBanner(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = "24px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 4000) {
      setInputValue(val);
      setTimeout(adjustHeight, 0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (attachedFiles.length >= 3) {
      setShowLimitError(true);
      e.target.value = "";
      return;
    }

    const mappedFiles = selectedFiles.map(file => {
      const name = file.name.toLowerCase();
      const isSupportedImage = file.type.startsWith("image/");
      const isSupportedPdf = file.type === "application/pdf" || name.endsWith(".pdf");
      const isSupportedDoc = file.type === "application/msword" || 
                             file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
                             name.endsWith(".doc") || 
                             name.endsWith(".docx");
      
      const isUnsupported = !(isSupportedImage || isSupportedPdf || isSupportedDoc);
      const isTooLarge = file.size > 25 * 1024 * 1024 || name.includes("oversized") || name.includes("large") || name.includes("25mb");
      
      return {
        name: file.name,
        url: URL.createObjectURL(file),
        type: isUnsupported ? "application/unsupported" : file.type,
        isUnsupported: isUnsupported ? true : undefined,
        isTooLarge: isTooLarge ? true : undefined,
      };
    });

    const totalFiles = [...attachedFiles, ...mappedFiles];

    if (totalFiles.length > 3) {
      setShowLimitError(true);
      setAttachedFiles(totalFiles.slice(0, 3));
    } else {
      setAttachedFiles(totalFiles);
      if (totalFiles.length < 3) {
        setShowLimitError(false);
      }
    }

    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      if (updated.length < 3) {
        setShowLimitError(false);
      }
      return updated;
    });
  };

  const handleChipClick = (label: string) => {
    setInputValue(label);
    setTimeout(adjustHeight, 0);
  };

  const hasErrorAttachments = attachedFiles.some(file => file.isUnsupported || file.isTooLarge);
  const isSendActive = (inputValue.trim() || attachedFiles.length > 0) && !isLoading && !hasErrorAttachments;

  const hasAttachments = attachedFiles.length > 0;
  const isSingleImage = attachedFiles.length === 1 && attachedFiles[0].type.startsWith("image/");
  const isThreeImages = attachedFiles.length === 3 && attachedFiles.every(file => file.type.startsWith("image/"));
  const isLimitReached = inputValue.length === 4000;

  const attachmentContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    padding: "0px",
    gap: "8px",
    width: "100%",
    boxSizing: "border-box",
    ...(isSingleImage ? {
      height: "120px",
    } : isThreeImages ? {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "4px",
      position: "relative",
      width: "296px",
      height: "96px",
    } : {
      height: "56px",
    })
  };

  return (
    <div className="flex flex-col items-center h-full w-full bg-white px-0">
      {/* Top controls row */}
      {!hideHeaderActions && (
        <div style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: isMobile ? "flex-end" : "space-between",
          alignItems: "center",
          padding: isMobile ? "0px 16px" : "0px",
          gap: "8px",
          width: "100%",
          maxWidth: isMobile ? "100%" : "912px",
          height: "40px",
          background: "#FFFFFF",
          borderRadius: "24px",
          alignSelf: "stretch",
          flexGrow: 0,
          marginTop: isMobile ? "12px" : "36px",
        }}>
          {/* LEFT side — Fullscreen icon button */}
          {!isMobile && (
            <button
              type="button"
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
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon icon="mingcute:fullscreen-line" width="24" height="24" style={{ color: "#000000" }} />
            </button>
          )}

          {/* RIGHT side — Frame 2608917 */}
          <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0px",
            gap: "8px",
            width: isMobile ? "auto" : "201px",
            height: "40px",
          }}>
            {/* History button */}
            <button
              type="button"
              onClick={onOpenHistory}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: isMobile ? "center" : "flex-start",
                padding: "8px",
                gap: isMobile ? "0px" : "8px",
                width: isMobile ? "40px" : "96px",
                height: "40px",
                background: isHistoryOpen ? "#EEF2FF" : "#FFFFFF",
                borderRadius: "24px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon 
                icon="carbon:recently-viewed" 
                width="24" 
                height="24" 
                style={{ marginRight: isMobile ? "0px" : "8px", color: isHistoryOpen ? "#6366F1" : "#000000" }} 
              />
              {!isMobile && (
                <span style={{
                  width: "48px",
                  height: "20px",
                  fontFamily: "Poppins",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  textAlign: "center",
                  color: isHistoryOpen ? "#6366F1" : "#000000",
                }}>
                  History
                </span>
              )}
            </button>

            {/* Project button */}
            <button
              type="button"
              onClick={onOpenProject}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: isMobile ? "center" : "flex-start",
                padding: "8px",
                gap: isMobile ? "0px" : "8px",
                width: isMobile ? "40px" : "97px",
                height: "40px",
                background: "#FFFFFF",
                borderRadius: "24px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon 
                icon="codicon:github-project" 
                width="24" 
                height="24" 
                style={{ marginRight: isMobile ? "0px" : "8px", color: "#000000" }} 
              />
              {!isMobile && (
                <span style={{
                  width: "49px",
                  height: "20px",
                  fontFamily: "Poppins",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  textAlign: "center",
                  color: "#000000",
                }}>
                  Project
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Centered content area */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {/* AI Icon + Name row */}
        <div style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "8px",
        }}>
          <img
            src="/assets/AI 2.svg"
            alt="AI"
            style={{
              width: "40px",
              height: "40px",
              flex: "none",
              order: 0,
              flexGrow: 0,
            }}
          />
          <span style={{
            width: "61px",
            height: "24px",
            fontFamily: "Poppins",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "24px",
            color: "#000000",
            flex: "none",
            order: 1,
            flexGrow: 0,
          }}>
            Cyphex
          </span>
        </div>

        {/* Heading Text */}
        <h2 style={{
          width: isMobile ? "100%" : "238px",
          height: "26px",
          fontFamily: "Poppins",
          fontWeight: 500,
          fontSize: "18px",
          lineHeight: "26px",
          textAlign: "center",
          color: "#000000",
          flex: "none",
          order: 1,
          flexGrow: 0,
          marginTop: "8px",
        }}>
          How can I help you today?
        </h2>

        {/* Input box section */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: isMobile ? "0px 16px" : "0px",
          gap: "16px",
          width: "100%",
          maxWidth: isMobile ? "100%" : "600px",
          height: "auto",
          flex: "none",
          order: 1,
          flexGrow: 0,
          marginTop: "32px",
        }}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "100%",
            alignItems: "center"
          }}>
            {showRechargeBanner ? (
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "8px 16px",
                  gap: "16px",
                  width: "100%",
                  maxWidth: isMobile ? "100%" : "600px",
                  height: "56px",
                  background: "#FFFFFF",
                  border: "1px solid #6366F1",
                  boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                  borderRadius: "24px",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0px",
                    gap: "10px",
                  width: "100%",
                  height: "auto",
                  minHeight: "40px",
                    flex: "none",
                    order: 0,
                    alignSelf: "stretch",
                    flexGrow: 0,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", flexGrow: 1, minWidth: 0 }}>
                    <span
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "auto",
                        minHeight: "24px",
                        fontFamily: "'Poppins'",
                        fontStyle: "normal",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "20px",
                        display: "flex",
                        alignItems: "center",
                        color: "#6366F1",
                        flex: "none",
                        order: 0,
                        flexGrow: 1,
                        whiteSpace: isMobile ? "normal" : "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      Session ended due to token limit. Recharge or buy more tokens to proceed
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={handleRechargeClick}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "8px 16px",
                        gap: "10px",
                        width: "110px",
                        height: "40px",
                        background: "#6366F1",
                        borderRadius: "24px",
                        border: "none",
                        cursor: "pointer",
                        flex: "none",
                        order: 1,
                        flexGrow: 0,
                      }}
                    >
                      <span
                        style={{
                          width: "78px",
                          height: "24px",
                          fontFamily: "'Poppins'",
                          fontStyle: "normal",
                          fontWeight: 500,
                          fontSize: "16px",
                          lineHeight: "24px",
                          textAlign: "center",
                          color: "#FFFFFF",
                          flex: "none",
                          order: 0,
                          flexGrow: 0,
                        }}
                      >
                        Recharge
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseRecharge}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "24px",
                        height: "24px",
                        flex: "none",
                        order: 2,
                        flexGrow: 0,
                      }}
                    >
                      <Icon icon="ri:close-line" width="24" height="24" style={{ color: "#6366F1" }} />
                    </button>
                  </div>
                </div>
              </div>
            ) : showLimitError ? (
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  padding: "8px 16px",
                  gap: "16px",
                  width: "100%",
                  maxWidth: isMobile ? "100%" : "600px",
                  height: "auto",
                  minHeight: "40px",
                  background: "#FFFFFF",
                  border: "1px solid #FF6B6B",
                  boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                  borderRadius: "24px",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0px",
                    gap: "10px",
                    width: "100%",
                    height: "24px",
                    flex: "none",
                    order: 0,
                    alignSelf: "stretch",
                    flexGrow: 0,
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px" }}>
                    <Icon
                      icon="solar:info-circle-linear"
                      style={{
                        width: "24px",
                        height: "24px",
                        color: "#FF6B6B",
                        flex: "none",
                        order: 0,
                        flexGrow: 0,
                      }}
                    />
                    <span
                      style={{
                        width: "100%",
                        maxWidth: "100%",
                        height: "auto",
                        minHeight: "24px",
                        fontFamily: "'Poppins'",
                        fontStyle: "normal",
                        fontWeight: 400,
                        fontSize: "14px",
                        lineHeight: "20px",
                        display: "flex",
                        alignItems: "center",
                        color: "#FF6B6B",
                        flex: "none",
                        order: 1,
                        flexGrow: 1,
                        whiteSpace: isMobile ? "normal" : "nowrap",
                      }}
                    >
                      Attachment Limit: You can only upload up to 3 files per prompt.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLimitError(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon icon="ri:close-line" width="24" height="24" style={{ color: "#FF6B6B" }} />
                  </button>
                </div>
              </div>
            ) : null}

            {showPrivateForkBanner && (
              <div
                className="outline outline-1 outline-offset-[-1px] outline-amber-400"
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "8px 16px",
                  width: "100%",
                  maxWidth: isMobile ? "100%" : "600px",
                  background: "#FFFFFF",
                  boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                  borderRadius: "24px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <div className="text-amber-400 text-base font-normal font-['Poppins'] leading-6 flex-1 pr-4 text-left">
                    Replying or uploading documents here will fork this thread into a private session. Sarah will not see your prompts or files.
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPrivateForkBanner(false)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "24px",
                      height: "24px",
                      flexShrink: 0,
                    }}
                  >
                    <Icon icon="ri:close-line" width="24" height="24" className="text-amber-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Input box */}
            <div style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "stretch",
              padding: "8px 16px",
            width: "100%",
            maxWidth: isMobile ? "100%" : "600px",
            background: "#FFFFFF",
            border: isLimitReached 
              ? "1px solid #FF6B6B" 
              : isFocused 
              ? "1px solid #6366F1" 
              : "1px solid #E0E7FF",
            boxShadow: isLimitReached
              ? "0px 0px 8px rgba(255, 107, 107, 0.15)"
              : isFocused 
              ? "0px 0px 8px rgba(99, 102, 241, 0.15)" 
              : "0px 0px 4px rgba(99, 102, 241, 0.05)",
            borderRadius: "24px",
            alignSelf: "stretch",
            transition: "all 0.3s ease",
            gap: "8px",
            ...(hasAttachments ? (
              isSingleImage ? {
                height: "auto",
              } : isThreeImages ? {
                height: "auto",
              } : {
                height: "120px",
              }
            ) : {
              minHeight: "56px",
              height: "auto",
            })
          }}>
            {/* Attachment Previews */}
            {hasAttachments && (
              <div style={attachmentContainerStyle}>
                {isThreeImages ? (
                  <div style={{ display: "flex", flexDirection: "row", gap: "4px", width: "100%", height: "100%" }}>
                    {attachedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          width: "96px",
                          height: "96px",
                          borderRadius: "12px",
                          overflow: "hidden",
                        }}
                      >
                        <img src={file.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
                        <button 
                          type="button" 
                          onClick={() => removeFile(idx)} 
                          style={{ 
                            position: "absolute",
                            width: "24px",
                            height: "24px",
                            top: "3px",
                            right: "3px",
                            background: "#FFFFFF",
                            borderRadius: "100px",
                            border: "none",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0px",
                          }}
                        >
                          <Icon icon="solar:close-circle-bold" width={16} height={16} style={{ color: "#EF4444" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  attachedFiles.map((file, idx) => {
                    if (file.isUnsupported || file.type === "application/unsupported" || file.isTooLarge) {
                      return (
                        <UnsupportedFileCard
                          key={idx}
                          fileName={file.name}
                          fileType={file.type}
                          isTooLarge={file.isTooLarge}
                          onRemove={() => removeFile(idx)}
                        />
                      );
                    }
                    if (file.type.startsWith("image/")) {
                      const size = isSingleImage ? "120px" : "56px";
                      return (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            width: size,
                            height: size,
                            borderRadius: "12px",
                            overflow: "hidden",
                          }}
                        >
                          <img src={file.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="preview" />
                          <button 
                            type="button" 
                            onClick={() => removeFile(idx)} 
                            style={{ 
                              position: "absolute",
                              width: "24px",
                              height: "24px",
                              top: "3px",
                              right: "3px",
                              background: "#FFFFFF",
                              borderRadius: "100px",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0px",
                            }}
                          >
                            <Icon icon="solar:close-circle-bold" width={16} height={16} style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={idx}
                          style={{
                            boxSizing: "border-box",
                            position: "relative",
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            padding: "8px",
                            gap: "8px",
                            width: "140px",
                            height: "56px",
                            background: "#FFFFFF",
                            border: "1px solid #DADADA",
                            borderRadius: "12px",
                          }}
                        >
                          <Icon icon="bi:file-earmark-pdf-fill" width={24} height={24} style={{ color: "#EF4444", flexShrink: 0 }} />
                          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, paddingRight: "16px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                              {file.name.split('.').pop()?.toUpperCase() || "FILE"}
                            </span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeFile(idx)} 
                            style={{ 
                              position: "absolute",
                              width: "24px",
                              height: "24px",
                              top: "3px",
                              right: "3px",
                              background: "#FFFFFF",
                              borderRadius: "100px",
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: "0px",
                            }}
                          >
                            <Icon icon="ri:close-line" width={16} height={16} style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      );
                    }
                  })
                )}
              </div>
            )}

            {/* Input elements row */}
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", width: "100%", minHeight: "40px", height: "auto" }}>
              <div style={{ display: "flex", flex: 1, alignItems: "flex-end", gap: "16px", minHeight: "40px", height: "auto" }}>
                {/* Link button trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "8px",
                  }}
                  title="Attach files"
                >
                  <Icon 
                    icon="ri:link" 
                    width="24" 
                    height="24" 
                    style={{
                      flex: "none",
                      order: 0,
                      flexGrow: 0,
                      color: "#6B7280",
                    }} 
                  />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.exe"
                  style={{ display: "none" }}
                />

                {/* Input field */}
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask anything"
                  disabled={isLoading}
                  maxLength={4000}
                  rows={1}
                  className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{
                    flexGrow: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "Poppins",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#000000",
                    resize: "none",
                    height: "24px",
                    overflowY: "auto",
                    boxSizing: "border-box",
                    marginBottom: "8px",
                  }}
                />
              </div>

              {/* Send button frame */}
              <button
                type="button"
                onClick={handleSend}
                disabled={!isSendActive}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "8px 16px",
                  gap: "10px",
                  width: "56px",
                  height: "40px",
                  background: isSendActive ? "#EEF2FF" : "#FFFFFF",
                  borderRadius: "24px",
                  flex: "none",
                  order: 1,
                  flexGrow: 0,
                  marginRight: "0px",
                  border: "none",
                  cursor: isSendActive ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
                title="Send"
              >
                <Icon 
                  icon="lucide:send" 
                  width="24" 
                  height="24" 
                  style={{
                    color: isSendActive ? "#6366F1" : "#6B7280",
                  }}
                />
              </button>
            </div>
          </div>
        </div>
          {/* Character limit counter */}
          {isLimitReached && (
            <div
              style={{
                alignSelf: "flex-end",
                width: "100%",
                maxWidth: isMobile ? "100%" : "600px",
                textAlign: "right",
                color: "#FF6B6B",
                fontFamily: "Poppins",
                fontSize: "14px",
                marginTop: "4px",
                paddingRight: "16px",
              }}
            >
              4000/4000
            </div>
          )}

          {/* Suggestion Chips */}
          <div 
            className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              padding: isMobile ? "0px 16px" : "0px",
              gap: "16px",
              width: "100%",
              maxWidth: isMobile ? "100%" : "600px",
              height: "32px",
              flex: "none",
              order: 1,
              flexGrow: 0,
              justifyContent: isMobile ? "flex-start" : "center",
              overflowX: isMobile ? "auto" : "visible",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}>
            {FIXED_LINKS.map((label) => (
              <button
                key={label}
                type="button"
                disabled={isLoading}
                onClick={() => handleChipClick(label)}
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "8px 16px",
                  gap: "10px",
                  height: "32px",
                  width: "fit-content",
                  background: "#FFFFFF",
                  border: "1px solid #EEF2FF",
                  borderRadius: "24px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{
                  fontFamily: "Poppins",
                  fontWeight: 400,
                  fontSize: "12px",
                  color: "#000000",
                  whiteSpace: "nowrap",
                }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
