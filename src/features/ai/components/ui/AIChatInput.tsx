"use client"

import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import type { AIAttachment } from "../../types/ai.types";
import { toast } from "sonner";
import UnsupportedFileCard from "./UnsupportedFileCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface AIChatInputProps {
  onSend: (message: string, attachments?: AIAttachment[]) => void;
  disabled?: boolean;
  placeholder?: string;
  isEmptyState?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}

export default function AIChatInput({
  onSend,
  disabled = false,
  placeholder,
  isEmptyState = false,
  isStreaming = false,
  onStop,
}: AIChatInputProps) {
  const isMobile = useIsMobile();
  const [text, setText] = useState("");
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (disabled || (!text.trim() && attachedFiles.length === 0)) return;

    const contentLower = text.toLowerCase();
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

    onSend(text.trim(), attachedFiles);
    setText("");
    setAttachedFiles([]);
    setShowLimitError(false);
    setShowPrivateForkBanner(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px";
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
      setText(val);
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

  const hasErrorAttachments = attachedFiles.some(file => file.isUnsupported || file.isTooLarge);
  const isSendDisabled = disabled || hasErrorAttachments || (!text.trim() && attachedFiles.length === 0);
  const defaultPlaceholder = placeholder || (isEmptyState ? "Ask anything" : "Ask me, I’m ready");

  const hasAttachments = attachedFiles.length > 0;
  const isSingleImage = attachedFiles.length === 1 && attachedFiles[0].type.startsWith("image/");
  const isThreeImages = attachedFiles.length === 3 && attachedFiles.every(file => file.type.startsWith("image/"));
  const isLimitReached = text.length === 4000;

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
    <div className={`w-full flex flex-col items-center bg-transparent shrink-0 ${isMobile ? "px-4 py-2" : "py-4"}`} style={{ boxSizing: "border-box" }}>
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
            maxWidth: isMobile ? "100%" : (isEmptyState ? "600px" : "912px"),
            height: isMobile ? "auto" : "56px",
            minHeight: isMobile ? "56px" : undefined,
            background: "#FFFFFF",
            border: "1px solid #6366F1",
            boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
            borderRadius: "24px",
            flex: "none",
            order: 0,
            flexGrow: 0,
            marginBottom: "8px",
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
              height: isMobile ? "auto" : "40px",
              minHeight: isMobile ? "40px" : undefined,
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
            maxWidth: isMobile ? "100%" : (isEmptyState ? "600px" : "912px"),
            height: isMobile ? "auto" : "40px",
            minHeight: isMobile ? "40px" : undefined,
            background: "#FFFFFF",
            border: "1px solid #FF6B6B",
            boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
            borderRadius: "24px",
            flex: "none",
            order: 0,
            flexGrow: 0,
            marginBottom: "8px",
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
            maxWidth: isMobile ? "100%" : (isEmptyState ? "600px" : "912px"),
            background: "#FFFFFF",
            boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
            borderRadius: "24px",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
            <div className={`text-amber-400 text-base font-normal font-['Poppins'] leading-6 flex-1 pr-4 ${isMobile ? "text-left" : ""}`}>
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
      {/* Input Capsule Container */}
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "stretch",
          padding: "8px 16px",
          width: "100%",
          maxWidth: isMobile ? "100%" : (isEmptyState ? "600px" : "912px"),
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
        }}
      >
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

        {/* Text Input Row */}
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
                width={24} 
                height={24} 
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

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={disabled ? "Please wait..." : defaultPlaceholder}
              disabled={disabled}
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
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 16px",
                gap: "10px",
                width: "56px",
                height: "40px",
                background: "#EEF2FF",
                borderRadius: "24px",
                flex: "none",
                order: 1,
                flexGrow: 0,
                marginRight: "0px",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Stop"
            >
              <div className="size-6 relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                <div className="size-2.5 bg-indigo-500 rounded-[2px]" style={{ width: "10px", height: "10px" }} />
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={isSendDisabled}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "8px 16px",
                gap: "10px",
                width: "56px",
                height: "40px",
                background: isSendDisabled ? "#FFFFFF" : "#EEF2FF",
                borderRadius: "24px",
                flex: "none",
                order: 1,
                flexGrow: 0,
                marginRight: "0px",
                border: "none",
                cursor: isSendDisabled ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
              }}
              title="Send"
            >
              <Icon 
                icon="lucide:send" 
                width="24" 
                height="24" 
                style={{
                  color: isSendDisabled ? "#6B7280" : "#6366F1",
                }}
              />
            </button>
          )}
        </div>
      </div>
      {/* Character limit counter */}
      {isLimitReached && (
        <div
          style={{
            alignSelf: "flex-end",
            width: "100%",
            maxWidth: isMobile ? "100%" : (isEmptyState ? "600px" : "912px"),
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
    </div>
  );
}