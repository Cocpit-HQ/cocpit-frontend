"use client"

import React, { useState, useEffect } from "react";
import type { AIMessage } from "../../types/ai.types";
import { Icon } from "@iconify/react";
import GraphCard from "../cards/GraphCard";
import WebsiteMessageCard from "../cards/WebsiteMessageCard";
import InlineError from "./errors/InlineError";
import UnsupportedFileCard from "./UnsupportedFileCard";


interface AIMessageBubbleProps {
  message: AIMessage;
  isStreaming?: boolean;
  onEdit?: (messageId: string, newContent: string) => void;
  onOpenLunarPanel?: (
    title: string,
    mode?: string,
    selectedCompany?: string,
    companies?: Array<{ id: number; company: string }>
  ) => void;
  isGraphRelated?: boolean;
  graphType?: "graph" | "chart";
  graphTitle?: string;
  websiteResults?: Array<{ id: number; company: string }>;
  isJobRelated?: boolean;
  error?: string | null;
  onSend?: (content: string) => void;
  activeLunarMode?: string;
}

function UserRequestText({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const textRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkHeight = () => {
      if (textRef.current) {
        setShouldTruncate(textRef.current.scrollHeight > 360);
      }
    };
    checkHeight();
    window.addEventListener("resize", checkHeight);
    return () => window.removeEventListener("resize", checkHeight);
  }, [content]);

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        ref={textRef}
        className="scrollbar-hide"
        style={{
          width: "100%",
          maxHeight: isExpanded ? "none" : "360px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {content}
      </div>
      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "Poppins",
            fontSize: "14px",
            color: "#6366F1",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginTop: "8px",
            padding: 0,
            alignSelf: "flex-start",
          }}
        >
          {isExpanded ? (
            <>
              Show less
              <Icon icon="lucide:chevron-up" width={16} height={16} />
            </>
          ) : (
            "Show more"
          )}
        </button>
      )}
    </div>
  );
}

function UserErrorState() {
  return (
    <div 
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        padding: "0px",
        gap: "8px",
        height: "24px",
        marginTop: "8px",
        justifyContent: "flex-end",
      }}
    >
      <Icon
        icon="solar:info-circle-linear"
        width={20}
        height={20}
        style={{ color: "#FF6B6B" }}
      />
      <span
        style={{
          fontFamily: "Poppins",
          fontStyle: "normal",
          fontWeight: 400,
          fontSize: "16px",
          lineHeight: "24px",
          color: "#FF6B6B",
        }}
      >
        Couldn't send, try again
      </span>
    </div>
  );
}

export default function AIMessageBubble({
  message,
  isStreaming = false,
  onEdit,
  onOpenLunarPanel,
  isGraphRelated = false,
  graphType = "graph",
  graphTitle,
  websiteResults = [],
  isJobRelated = false,
  error,
  onSend,
  activeLunarMode,
}: AIMessageBubbleProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";

  const images = message.attachments?.filter(file => file.type.startsWith("image/")) || [];
  const docs = message.attachments?.filter(file => !file.type.startsWith("image/")) || [];

  const hasText = !!message.content.trim();
  const isCase1 = images.length === 2 && docs.length === 1;
  const isCase2 = images.length === 1 && docs.length === 2;
  const isSingleImageMessage = images.length === 1 && docs.length === 0;
  const isSingleDocMessage = images.length === 0 && docs.length === 1;
  const isThreeImagesMessage = images.length === 3 && docs.length === 0 && !hasText;
  const isImageAndDocsMessage = images.length === 1 && docs.length > 0 && !hasText && !isCase2;
  const isDocsOnlyMessage = images.length === 0 && docs.length > 0 && !hasText && !isSingleDocMessage;

  // Local state for AI Message Likes
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [activeJobTab, setActiveJobTab] = useState<"jobs" | "events" | "skills">("jobs");

  // Copy state
  const [copied, setCopied] = useState(false);

  // Edit state (User Message)
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(120, scrollHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [editText, isEditing]);

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // Retry/Repeat state (AI Message)
  const [localContent, setLocalContent] = useState(message.content);
  const [localStreaming, setLocalStreaming] = useState(false);

  useEffect(() => {
    setLocalContent(message.content);
  }, [message.content]);

  const handleLike = () => {
    setLiked(!liked);
    if (disliked) setDisliked(false);
  };

  const handleDislike = () => {
    setDisliked(!disliked);
    if (liked) setLiked(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const base64 = "JVBERi0xLjQKJVRyYXNoCjEgMCBvYmoKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvS2lkcyBbMyAwIFJdCiAgL0NvdW50IDEKPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KICAvUmVzb3VyY2VzIDw8CiAgICAvRm9udCA8PAogICAgICAvRjEgNCAwIFIKICAgID4+CiAgPj4KICAvQ29udGVudHMgNSAwIFIKPj4KZW5kb2JqCgo0IDAgb2JqCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKCjUgMCBvYmoKPDwKICAvTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMjQgVGYKMTAwIDcwMCBUZAooRHVtbXkgUERGIGZvciBDb2NwaXQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxOSAwMDAwMCBuIAowMDAwMDAwMDc3IDAwMDAwIG4gCjAwMDAwMDAxNDMgMDAwMDAgbiAKMDAwMDAwMDI3MSAwMDAwMCBuIAowMDAwMDAwMzU2IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MQolJUVPRgo=";
    const binary = atob(base64);
    const len = binary.length;
    const buffer = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      buffer[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([buffer], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  };

  const handleSave = () => {
    if (editText.trim()) {
      if (onEdit) {
        onEdit(message.id, editText.trim());
      } else {
        message.content = editText.trim();
        setLocalContent(editText.trim());
      }
      setIsEditing(false);
    }
  };

  const handleRetry = () => {
    setLocalStreaming(true);
    setLocalContent("");
    let currentIndex = 0;
    const textToStream = message.content || "Certainly! Let me re-evaluate that for you. I suggest looking into modular architecture patterns with custom hook wrappers for separation of concerns.";
    
    const stream = () => {
      if (currentIndex <= textToStream.length) {
        setLocalContent(textToStream.slice(0, currentIndex));
        currentIndex++;
        setTimeout(stream, 18);
      } else {
        setLocalStreaming(false);
      }
    };
    setTimeout(stream, 300);
  };

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-0`}>
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} w-full`}>
        {/* Bubble */}
        {isUser ? (
          <>
            {isEditing ? (
              /* User Edit Textarea Box */
              <>
                <div
                  className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    padding: "16px",
                    width: "912px",
                    maxWidth: "100%",
                    minHeight: "56px",
                    maxHeight: "192px",
                    height: "auto",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: editText.length === 4000 ? "1px solid #FF6B6B" : "none",
                    borderRadius: "24px",
                    boxSizing: "border-box",
                    overflowY: "auto",
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => {
                      if (e.target.value.length <= 4000) {
                        setEditText(e.target.value);
                      }
                    }}
                    onKeyDown={handleEditKeyDown}
                    maxLength={4000}
                    className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      resize: "none",
                      fontFamily: "Poppins",
                      fontStyle: "normal",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#000000",
                      padding: "0px",
                      margin: "0px",
                      flexGrow: 1,
                      overflowY: "auto",
                      boxSizing: "border-box",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0px",
                      gap: "16px",
                      width: "880px",
                      maxWidth: "100%",
                      height: "40px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div />
                    <div style={{ display: "flex", flexDirection: "row", gap: "16px" }}>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        style={{
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "8px 16px",
                          gap: "10px",
                          width: "82px",
                          height: "40px",
                          border: "1px solid #818CF8",
                          borderRadius: "24px",
                          background: "transparent",
                          color: "#818CF8",
                          fontFamily: "Poppins",
                          fontStyle: "normal",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "20px",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        style={{
                          boxSizing: "border-box",
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "center",
                          alignItems: "center",
                          padding: "8px 16px",
                          gap: "10px",
                          width: "67px",
                          height: "40px",
                          background: "#6366F1",
                          border: "1px solid #FFFFFF",
                          borderRadius: "24px",
                          color: "#FFFFFF",
                          fontFamily: "Poppins",
                          fontStyle: "normal",
                          fontWeight: 400,
                          fontSize: "14px",
                          lineHeight: "20px",
                          cursor: "pointer",
                        }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
                {editText.length === 4000 && (
                  <div
                    style={{
                      alignSelf: "flex-end",
                      width: "100%",
                      maxWidth: "912px",
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
              </>
            ) : isCase1 ? (
              /* CASE 1 — MESSAGE CONTAINS 2 IMAGES + 1 DOCUMENT */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "0px",
                  gap: "8px",
                  width: "912px",
                  maxWidth: "100%",
                  height: hasText ? "auto" : "212px",
                  boxSizing: "border-box",
                }}
              >
                {/* Attachment Container */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    gap: "4px",
                    width: "196px",
                    height: "148px",
                  }}
                >
                  {/* Images Row */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      padding: "0px",
                      gap: "4px",
                      width: "196px",
                      height: "96px",
                    }}
                  >
                    {images[0] && (
                      <img
                        src={images[0].url}
                        style={{
                          width: "96px",
                          height: "96px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        alt={images[0].name}
                        onClick={() => window.open(images[0].url, "_blank")}
                      />
                    )}
                    {images[1] && (
                      <img
                        src={images[1].url}
                        style={{
                          width: "96px",
                          height: "96px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        alt={images[1].name}
                        onClick={() => window.open(images[1].url, "_blank")}
                      />
                    )}
                  </div>
                  {/* Document Card */}
                  {docs[0] && (
                    docs[0].isUnsupported || docs[0].type === "application/unsupported" || docs[0].isTooLarge ? (
                      <UnsupportedFileCard
                        fileName={docs[0].name}
                        fileType={docs[0].type}
                        isTooLarge={docs[0].isTooLarge}
                        style={{ width: "196px", height: "48px" }}
                      />
                    ) : (
                      <div 
                        onClick={() => window.open(docs[0].url, "_blank")}
                        style={{ 
                          boxSizing: "border-box",
                          display: "flex", 
                          flexDirection: "row",
                          alignItems: "center", 
                          padding: "0px 8px", 
                          gap: "10px", 
                          width: "196px",
                          height: "48px",
                          border: "1px solid #E0E7FF",
                          borderRadius: "12px",
                          background: "#FFFFFF",
                          cursor: "pointer",
                        }}
                      >
                        <Icon icon="bi:file-earmark-pdf-fill" width={24} height={24} style={{ color: "#EF4444", flexShrink: 0 }} />
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {docs[0].name}
                          </span>
                          <span style={{ fontSize: "9px", color: "#9CA3AF" }}>
                            {docs[0].name.split('.').pop()?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Message Text */}
                {hasText && (
                  <div
                    className="p-4 break-words whitespace-pre-wrap"
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      borderRadius: "24px 24px 0px 24px",
                      fontFamily: "Poppins",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#000000",
                      width: "fit-content",
                      maxWidth: "70%",
                      boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      boxSizing: "border-box",
                    }}
                  >
                    <UserRequestText content={message.content} />
                  </div>
                )}

                {isError && <UserErrorState />}

                {/* Action Icons */}
                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ) : isCase2 ? (
              /* CASE 2 — MESSAGE CONTAINS 1 IMAGE + 2 DOCUMENTS */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "0px",
                  gap: "8px",
                  width: "912px",
                  maxWidth: "100%",
                  height: "auto",
                  boxSizing: "border-box",
                }}
              >
                {/* Attachment Wrapper Container */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    gap: "4px",
                    position: "relative",
                    width: "200px",
                    height: "300px",
                  }}
                >
                  {images[0] && (
                    <img
                      src={images[0].url}
                      style={{
                        width: "200px",
                        height: "200px",
                        borderRadius: "12px",
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                      alt={images[0].name}
                      onClick={() => window.open(images[0].url, "_blank")}
                    />
                  )}
                  {docs[0] && (
                    docs[0].isUnsupported || docs[0].type === "application/unsupported" || docs[0].isTooLarge ? (
                      <UnsupportedFileCard
                        fileName={docs[0].name}
                        fileType={docs[0].type}
                        isTooLarge={docs[0].isTooLarge}
                        style={{ width: "200px", height: "48px" }}
                      />
                    ) : (
                      <div 
                        onClick={() => window.open(docs[0].url, "_blank")}
                        style={{ 
                          boxSizing: "border-box",
                          display: "flex", 
                          flexDirection: "row",
                          alignItems: "center", 
                          padding: "0px 8px", 
                          gap: "10px", 
                          width: "200px",
                          height: "48px",
                          border: "1px solid #E0E7FF",
                          borderRadius: "12px",
                          background: "#FFFFFF",
                          cursor: "pointer",
                        }}
                      >
                        <Icon icon="bi:file-earmark-pdf-fill" width={24} height={24} style={{ color: "#EF4444", flexShrink: 0 }} />
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {docs[0].name}
                          </span>
                          <span style={{ fontSize: "9px", color: "#9CA3AF" }}>
                            {docs[0].name.split('.').pop()?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                  {docs[1] && (
                    docs[1].isUnsupported || docs[1].type === "application/unsupported" || docs[1].isTooLarge ? (
                      <UnsupportedFileCard
                        fileName={docs[1].name}
                        fileType={docs[1].type}
                        isTooLarge={docs[1].isTooLarge}
                        style={{ width: "200px", height: "48px" }}
                      />
                    ) : (
                      <div 
                        onClick={() => window.open(docs[1].url, "_blank")}
                        style={{ 
                          boxSizing: "border-box",
                          display: "flex", 
                          flexDirection: "row",
                          alignItems: "center", 
                          padding: "0px 8px", 
                          gap: "10px", 
                          width: "200px",
                          height: "48px",
                          border: "1px solid #E0E7FF",
                          borderRadius: "12px",
                          background: "#FFFFFF",
                          cursor: "pointer",
                        }}
                      >
                        <Icon icon="bi:file-earmark-pdf-fill" width={24} height={24} style={{ color: "#EF4444", flexShrink: 0 }} />
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {docs[1].name}
                          </span>
                          <span style={{ fontSize: "9px", color: "#9CA3AF" }}>
                            {docs[1].name.split('.').pop()?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Message Text */}
                {hasText && (
                  <div
                    className="p-4 break-words whitespace-pre-wrap"
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      borderRadius: "24px 24px 0px 24px",
                      fontFamily: "Poppins",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#000000",
                      width: "fit-content",
                      maxWidth: "70%",
                      boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      boxSizing: "border-box",
                    }}
                  >
                    <UserRequestText content={message.content} />
                  </div>
                )}

                {isError && <UserErrorState />}

                {/* Action Icons */}
                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ) : isSingleImageMessage ? (
              /* Message contains ONE IMAGE */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "0px",
                  gap: "8px",
                  width: "912px",
                  maxWidth: "100%",
                  height: hasText ? "auto" : "278px",
                  flex: "none",
                  order: 4,
                  alignSelf: "stretch",
                  flexGrow: 0,
                  boxSizing: "border-box",
                }}
              >
                {/* Image Display */}
                {images[0] && (
                  <img
                    src={images[0].url}
                    style={{
                      width: "234px",
                      height: "234px",
                      borderRadius: "12px",
                      objectFit: "cover",
                      cursor: "pointer",
                    }}
                    alt={images[0].name}
                    onClick={() => window.open(images[0].url, "_blank")}
                  />
                )}

                {/* Message Text */}
                {hasText && (
                  <div
                    className="p-4 break-words whitespace-pre-wrap"
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      borderRadius: "24px 24px 0px 24px",
                      fontFamily: "Poppins",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#000000",
                      width: "fit-content",
                      maxWidth: "70%",
                      boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      boxSizing: "border-box",
                    }}
                  >
                    <UserRequestText content={message.content} />
                  </div>
                )}

                {isError && <UserErrorState />}

                {/* Action Icons */}
                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ) : isSingleDocMessage ? (
              /* CASE — MESSAGE CONTAINS 1 DOCUMENT */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "0px",
                  gap: "8px",
                  width: "912px",
                  maxWidth: "100%",
                  height: "auto",
                  boxSizing: "border-box",
                }}
              >
                {/* PDF Card (200x48px) */}
                {docs[0] && (
                  docs[0].isUnsupported || docs[0].type === "application/unsupported" || docs[0].isTooLarge ? (
                    <UnsupportedFileCard
                      fileName={docs[0].name}
                      fileType={docs[0].type}
                      isTooLarge={docs[0].isTooLarge}
                      style={{ width: "200px", height: "48px" }}
                    />
                  ) : (
                    <div 
                      onClick={() => window.open(docs[0].url, "_blank")}
                      style={{ 
                        boxSizing: "border-box",
                        display: "flex", 
                        flexDirection: "row",
                        alignItems: "center", 
                        padding: "0px 8px", 
                        gap: "10px", 
                        width: "200px",
                        height: "48px",
                        border: "1px solid #E0E7FF",
                        borderRadius: "12px",
                        background: "#FFFFFF",
                        cursor: "pointer",
                      }}
                    >
                      <Icon icon="bi:file-earmark-pdf-fill" width={24} height={24} style={{ color: "#EF4444", flexShrink: 0 }} />
                      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {docs[0].name}
                        </span>
                        <span style={{ fontSize: "9px", color: "#9CA3AF" }}>
                          {docs[0].name.split('.').pop()?.toUpperCase() || "FILE"}
                        </span>
                      </div>
                    </div>
                  )
                )}

                {/* Message Text */}
                {hasText && (
                  <div
                    className="p-4 break-words whitespace-pre-wrap"
                    style={{
                      background: "rgba(99, 102, 241, 0.08)",
                      borderRadius: "24px 24px 0px 24px",
                      fontFamily: "Poppins",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#000000",
                      width: "fit-content",
                      maxWidth: "70%",
                      boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      boxSizing: "border-box",
                    }}
                  >
                    <UserRequestText content={message.content} />
                  </div>
                )}

                {isError && <UserErrorState />}

                {/* Action Icons */}
                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ) : isThreeImagesMessage ? (
              /* Message contains EXACTLY THREE IMAGES */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "0px",
                  gap: "8px",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    padding: "0px",
                    gap: "4px",
                    position: "relative",
                    width: "296px",
                    height: "96px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "row", gap: "4px", width: "100%", height: "100%" }}>
                    {images.map((file, idx) => (
                      <img
                        key={idx}
                        src={file.url}
                        style={{
                          width: "96px",
                          height: "96px",
                          borderRadius: "12px",
                          objectFit: "cover",
                          cursor: "pointer",
                        }}
                        alt={file.name}
                        onClick={() => window.open(file.url, "_blank")}
                      />
                    ))}
                  </div>
                </div>
                {isError && <UserErrorState />}

                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ) : isImageAndDocsMessage ? (
              /* Message contains 1 image and docs */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "0px",
                  gap: "8px",
                  boxSizing: "border-box",
                }}
              >
                <img
                  src={images[0].url}
                  style={{
                    width: "234px",
                    height: "234px",
                    borderRadius: "12px",
                    objectFit: "cover",
                  }}
                  alt={images[0].name}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  {docs.map((file, idx) => (
                    file.isUnsupported || file.type === "application/unsupported" || file.isTooLarge ? (
                      <UnsupportedFileCard
                        key={idx}
                        fileName={file.name}
                        fileType={file.type}
                        isTooLarge={file.isTooLarge}
                        style={{ width: "140px", height: "56px" }}
                      />
                    ) : (
                      <div 
                        key={idx} 
                        style={{ 
                          boxSizing: "border-box",
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
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </span>
                          <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                            {file.name.split('.').pop()?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {isError && <UserErrorState />}

                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ) : isDocsOnlyMessage ? (
              /* Message contains ONLY documents */
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  padding: "0px",
                  gap: "8px",
                  boxSizing: "border-box",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                  {docs.map((file, idx) => (
                    file.isUnsupported || file.type === "application/unsupported" || file.isTooLarge ? (
                      <UnsupportedFileCard
                        key={idx}
                        fileName={file.name}
                        fileType={file.type}
                        isTooLarge={file.isTooLarge}
                        style={{ width: "140px", height: "56px" }}
                      />
                    ) : (
                      <div 
                        key={idx} 
                        style={{ 
                          boxSizing: "border-box",
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
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {file.name}
                          </span>
                          <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                            {file.name.split('.').pop()?.toUpperCase() || "FILE"}
                          </span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
                {isError && <UserErrorState />}

                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      height: "36px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* User bubble: light bg, black text, border-radius 24px 24px 0px 24px, padding 16px, dynamic width */
              <>
                <div
                  className="p-4 break-words whitespace-pre-wrap"
                  style={{
                    background: "rgba(99, 102, 241, 0.08)",
                    borderRadius: "24px 24px 0px 24px",
                    fontFamily: "Poppins",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "#000000",
                    width: "fit-content",
                    maxWidth: "70%",
                    boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                    boxSizing: "border-box",
                  }}
                >
                  {message.attachments && message.attachments.length > 0 && (
                    <div 
                      style={{ 
                        display: "flex", 
                        flexDirection: "row", 
                        flexWrap: "wrap",
                        gap: "8px", 
                        marginBottom: "12px",
                        width: "100%"
                      }}
                    >
                      {message.attachments?.map((file, idx) => {
                        if (file.type.startsWith("image/")) {
                          const imgSize = images.length === 1 ? "96px" : "56px";
                          return (
                            <div 
                              key={idx} 
                              style={{ 
                                position: "relative",
                                width: imgSize, 
                                height: imgSize, 
                                borderRadius: "12px",
                                overflow: "hidden",
                              }}
                            >
                              <img src={file.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={file.name} />
                            </div>
                          );
                        } else if (file.isUnsupported || file.type === "application/unsupported" || file.isTooLarge) {
                          return (
                            <UnsupportedFileCard
                              key={idx}
                              fileName={file.name}
                              fileType={file.type}
                              isTooLarge={file.isTooLarge}
                              style={{ width: "140px", height: "56px" }}
                            />
                          );
                        } else {
                          return (
                            <div 
                              key={idx} 
                              style={{ 
                                boxSizing: "border-box",
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
                              <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: "12px", fontWeight: 600, color: "#1F2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {file.name}
                                </span>
                                <span style={{ fontSize: "10px", color: "#9CA3AF" }}>
                                  {file.name.split('.').pop()?.toUpperCase() || "FILE"}
                                </span>
                              </div>
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                  <UserRequestText content={message.content} />
                </div>

                {isError && <UserErrorState />}

                {/* Action icons row below user bubble: Copy & Edit */}
                {!isEditing && (
                  <div 
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleCopy}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                      title="Copy"
                    >
                      <Icon 
                        icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                        width={20} 
                        height={20} 
                        style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "36px",
                        height: "36px",
                        borderRadius: "24px",
                        background: "#FFFFFF",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0px 0px 4px rgba(99, 102, 241, 0.05)",
                      }}
                      title="Edit"
                    >
                      <Icon icon="tdesign:edit" width={20} height={20} style={{ color: "#6B7280" }} />
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <>
            {/* Assistant bubble: white bg, border-radius 12px 12px 12px 0px, padding 0px, full width */}
            <div
              className="order-0"
              style={{
                width: "100%",
                background: "#FFFFFF",
                borderRadius: "12px 12px 12px 0px",
                padding: "0px",
                fontFamily: "Poppins",
                fontWeight: 400,
                fontSize: "16px",
                lineHeight: "24px",
                color: "#000000",
                boxSizing: "border-box",
              }}
            >
              <div
                className={
                  (isStreaming || localStreaming)
                    ? "after:content-['|'] after:animate-pulse after:ml-0.5 after:text-[#6366F1]"
                    : ""
                }
                style={{
                  color: (!localContent && (isStreaming || localStreaming)) ? "#6B7280" : "#000000"
                }}
              >
                {(() => {
                  if (localContent === "Download PDF") {
                    return (
                      <span
                        onClick={handleDownloadPDF}
                        style={{
                          color: "#3B82F6",
                          textDecoration: "underline",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        Download PDF
                      </span>
                    );
                  }

                  const splitKeyword = "These two are probably the closest modern references";
                  if (websiteResults && websiteResults.length > 0 && localContent.includes(splitKeyword)) {
                    const splitIndex = localContent.indexOf(splitKeyword);
                    const part1 = localContent.slice(0, splitIndex).trim();
                    const part2 = localContent.slice(splitIndex).trim();

                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div className="whitespace-pre-wrap">{part1}</div>
                        
                        {/* Company Cards inline */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                            marginTop: "4px",
                            marginBottom: "4px",
                          }}
                        >
                          {websiteResults.map((result) => (
                            <WebsiteMessageCard
                              key={result.id}
                              company={result.company}
                              onClick={() => {
                                onOpenLunarPanel?.(
                                  result.company,
                                  "website",
                                  result.company,
                                  websiteResults
                                );
                              }}
                            />
                          ))}
                        </div>

                        <div className="whitespace-pre-wrap">{part2}</div>
                      </div>
                    );
                  }

                  const isSensitiveData = localContent.includes("Sensitive Data Detected!");
                  if (isSensitiveData) {
                    return (
                      <div className="self-stretch bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl inline-flex flex-col justify-center items-start gap-3 w-full">
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          <div className="w-auto inline-flex justify-center items-center gap-2">
                            <div className="size-6 relative overflow-hidden flex-shrink-0">
                              <div className="size-5 left-[2px] top-[2px] absolute rounded-full border-[1.5px] border-red-400" />
                              <div className="w-[1.5px] h-[5px] left-[11.25px] top-[11px] absolute bg-red-400" />
                              <div className="size-[2.5px] left-[10.75px] top-[7px] absolute rounded-full bg-red-400" />
                            </div>
                            <div className="justify-center text-red-400 text-base font-normal font-['Poppins'] leading-6">Sensitive data</div>
                          </div>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6">I couldn&apos;t find enough verifiable database records or uploaded project files to provide an accurate answer regarding this specific cross-border tax scenario</div>
                          <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6">To fix this, you can:</div>
                          <ul className="self-stretch flex flex-col justify-start items-start gap-2 text-black text-base font-normal font-['Poppins'] leading-6 list-disc pl-5">
                            <li>Upload your tax legal documents directly to this chat thread</li>
                            <li>Rephrase your question focusing on general global freelance rules</li>
                          </ul>
                        </div>
                      </div>
                    );
                  }

                  const isInsufficientInfo = localContent.includes("I couldn't find enough verifiable database records");
                  if (isInsufficientInfo) {
                    return (
                      <div className="self-stretch bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl inline-flex flex-col justify-center items-start gap-3 w-full">
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          <div className="w-auto inline-flex justify-center items-center gap-2">
                            <div className="size-6 relative overflow-hidden flex-shrink-0">
                              <div className="size-5 left-[2px] top-[2px] absolute rounded-full border-[1.5px] border-amber-400" />
                              <div className="w-[1.5px] h-[5px] left-[11.25px] top-[11px] absolute bg-amber-400" />
                              <div className="size-[2.5px] left-[10.75px] top-[7px] absolute rounded-full bg-amber-400" />
                            </div>
                            <div className="justify-center text-amber-400 text-base font-normal font-['Poppins'] leading-6">Insufficient Information</div>
                          </div>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6">I couldn&apos;t find enough verifiable database records or uploaded project files to provide an accurate answer regarding this specific cross-border tax scenario</div>
                          <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6">To fix this, you can:</div>
                          <ul className="self-stretch flex flex-col justify-start items-start gap-2 text-black text-base font-normal font-['Poppins'] leading-6 list-disc pl-5">
                            <li>Upload your tax legal documents directly to this chat thread</li>
                            <li>Rephrase your question focusing on general global freelance rules</li>
                          </ul>
                        </div>
                      </div>
                    );
                  }

                  const isCapabilities = localContent.includes("I cannot generate images, design graphics");
                  if (isCapabilities) {
                    return (
                      <div className="self-stretch bg-white rounded-tl-xl rounded-tr-xl rounded-br-xl inline-flex flex-col justify-center items-start gap-3 w-full">
                        <div className="self-stretch flex flex-col justify-start items-start gap-1">
                          <div className="w-auto inline-flex justify-center items-center gap-2">
                            <div className="size-6 relative overflow-hidden flex-shrink-0">
                              <div className="size-5 left-[2px] top-[2px] absolute rounded-full border-[1.5px] border-amber-400" />
                              <div className="w-[1.5px] h-[5px] left-[11.25px] top-[11px] absolute bg-amber-400" />
                              <div className="size-[2.5px] left-[10.75px] top-[7px] absolute rounded-full bg-amber-400" />
                            </div>
                            <div className="justify-center text-amber-400 text-base font-normal font-['Poppins'] leading-6">Assistant Capabilities</div>
                          </div>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6">I cannot generate images, design graphics, or automatically submit job applications for you.</div>
                          <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6">However, I can help you write a highly optimized text blueprint for your profile bio, or craft an exceptional cover letter tailored to that Senior Developer job!</div>
                        </div>
                        <div className="self-stretch flex flex-col justify-start items-start gap-2">
                          <div className="self-stretch justify-center text-black text-base font-normal font-['Poppins'] leading-6">What would you like me to do?</div>
                          <div className="w-auto inline-flex justify-start items-start gap-2.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => onSend?.("Optimize Profile Bio Text")}
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-3xl flex justify-center items-center gap-2.5 border-none cursor-pointer transition-all duration-200"
                            >
                              <span className="justify-center text-indigo-500 text-base font-normal font-['Poppins'] leading-6">Optimize Profile Bio Text</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onSend?.("Write Custom Cover Letter")}
                              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-3xl flex justify-center items-center gap-2.5 border-none cursor-pointer transition-all duration-200"
                            >
                              <span className="justify-center text-indigo-500 text-base font-normal font-['Poppins'] leading-6">Write Custom Cover Letter</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const isJobMessage = isJobRelated && localContent.includes("curated some tailored opportunities");

                  if (isJobMessage) {
                    const lines = localContent.split("\n").map(l => l.trim()).filter(Boolean);
                    const headerText = lines.find(l => l.includes("curated")) || "Based on your recent activity, I've curated some tailored opportunities.";
                    const rawBullets = lines.filter(l => l.startsWith("•") || l.startsWith("-") || l.startsWith("Found") || l.startsWith("Identified") || l.startsWith("Noticed"));
                    const displayBullets = rawBullets.length > 0
                      ? rawBullets.map(l => l.replace(/^[•\-\*\s]+/, ""))
                      : [
                          "Found 3 high-match roles in UI/UX Designing",
                          "Identified 1 upcoming networking event in your area",
                          "Noticed a new skill trend: React Server Components"
                        ];

                    const currentTab = (() => {
                      if (activeLunarMode === "job-list") return "jobs";
                      if (activeLunarMode === "pie") {
                        if (activeJobTab === "jobs") return "events";
                        return activeJobTab;
                      }
                      return null;
                    })();

                    return (
                      <div className="flex flex-col justify-start items-start gap-4 w-full">
                        {/* Header text */}
                        <div className="text-black text-base font-normal font-['Poppins'] leading-6">
                          {headerText}
                        </div>

                        {/* Chart Card */}
                        <div 
                          className="box-border bg-white rounded-2xl border border-[#EEF2FF] shadow-[0px_2px_4px_rgba(99,102,241,0.05)] flex flex-col justify-start items-center p-4 gap-4"
                          style={{
                            width: "276px",
                            height: "340px",
                          }}
                        >
                          {/* Card Header */}
                          <div className="w-full flex justify-between items-center px-1">
                            <button type="button" className="p-1 bg-transparent border-none cursor-pointer flex items-center justify-center text-zinc-400 hover:text-zinc-600">
                              <Icon icon="fluent:chevron-left-24-regular" width={16} height={16} />
                            </button>
                            <span className="text-zinc-800 text-xs font-bold leading-none font-['Poppins']">18 March 2023</span>
                            <button type="button" className="p-1 bg-transparent border-none cursor-pointer flex items-center justify-center text-zinc-400 hover:text-zinc-600">
                              <Icon icon="fluent:chevron-right-24-regular" width={16} height={16} />
                            </button>
                          </div>

                          {/* Donut Chart Container */}
                          <div className="relative w-[120px] h-[120px] flex items-center justify-center mt-1">
                            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                              {/* Blue: 60% */}
                              <circle
                                cx="60"
                                cy="60"
                                r="40"
                                fill="transparent"
                                stroke="#2563EB"
                                strokeWidth="18"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset="0"
                              />
                              {/* Peach: 20% */}
                              <circle
                                cx="60"
                                cy="60"
                                r="40"
                                fill="transparent"
                                stroke="#FCA5A5"
                                strokeWidth="18"
                                strokeDasharray={`${0.2 * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                                strokeDashoffset={`-${0.6 * 2 * Math.PI * 40}`}
                              />
                              {/* Orange: 20% */}
                              <circle
                                cx="60"
                                cy="60"
                                r="40"
                                fill="transparent"
                                stroke="#FB923C"
                                strokeWidth="18"
                                strokeDasharray={`${0.2 * 2 * Math.PI * 40} ${2 * Math.PI * 40}`}
                                strokeDashoffset={`-${0.8 * 2 * Math.PI * 40}`}
                              />
                            </svg>

                            {/* Percentage overlay labels */}
                            <div className="absolute inset-0 pointer-events-none">
                              {/* 60% Blue badge */}
                              <div style={{
                                position: 'absolute',
                                left: '80px',
                                top: '63px',
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#FFFFFF',
                                border: '1px solid #EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0px 2px 4px rgba(99, 102, 241, 0.1)',
                              }}>
                                <span className="text-black text-[9px] font-bold font-['Poppins']">60%</span>
                              </div>
                              {/* 20% Pink badge */}
                              <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '63px',
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#FFFFFF',
                                border: '1px solid #EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0px 2px 4px rgba(99, 102, 241, 0.1)',
                              }}>
                                <span className="text-black text-[9px] font-bold font-['Poppins']">20%</span>
                              </div>
                              {/* 20% Orange badge */}
                              <div style={{
                                position: 'absolute',
                                left: '26px',
                                top: '15px',
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: '#FFFFFF',
                                border: '1px solid #EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0px 2px 4px rgba(99, 102, 241, 0.1)',
                              }}>
                                <span className="text-black text-[9px] font-bold font-['Poppins']">20%</span>
                              </div>
                            </div>
                          </div>

                          {/* Legend list */}
                          <div className="w-full flex flex-col gap-2 border-t border-[#F3F4F6] pt-3 px-1 mt-1">
                            <div className="flex justify-between items-center w-full">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                                <span className="text-neutral-500 text-[12px] font-bold font-['Poppins']">Jobs</span>
                              </div>
                              <span className="text-neutral-700 text-[12px] font-bold font-['Poppins']">60%</span>
                            </div>
                            <div className="flex justify-between items-center w-full">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
                                <span className="text-neutral-500 text-[12px] font-bold font-['Poppins']">Events</span>
                              </div>
                              <span className="text-neutral-700 text-[12px] font-bold font-['Poppins']">20%</span>
                            </div>
                            <div className="flex justify-between items-center w-full">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                                <span className="text-neutral-500 text-[12px] font-bold font-['Poppins']">Skill</span>
                              </div>
                              <span className="text-neutral-700 text-[12px] font-bold font-['Poppins']">20%</span>
                            </div>
                          </div>
                        </div>

                        {/* Bullet points summary */}
                        <div className="flex flex-col gap-2 mt-1">
                          {displayBullets.map((bullet, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="text-black text-base">•</span>
                              <span className="text-black text-base font-normal font-['Poppins'] leading-6">{bullet}</span>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons row */}
                        <div className="flex flex-row gap-2.5 mt-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              onOpenLunarPanel?.("Lunnar panel", "job-list");
                              setActiveJobTab("jobs");
                            }}
                            className={`h-10 rounded-3xl flex justify-center items-center px-4 py-1.5 cursor-pointer transition-all duration-200 ${
                              currentTab === "jobs"
                                ? "bg-indigo-50 hover:bg-[#EEF2FF]/80 border-none"
                                : "bg-white hover:bg-zinc-50 border border-indigo-400"
                            }`}
                            style={currentTab === "jobs" ? { outline: "1px solid #EEF2FF" } : undefined}
                          >
                            <span className={currentTab === "jobs" ? "text-[#6366F1] text-sm font-semibold font-['Poppins'] leading-5" : "text-indigo-400 text-sm font-semibold font-['Poppins'] leading-5"}>Jobs list</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenLunarPanel?.("Lunnar panel", "pie");
                              setActiveJobTab("events");
                            }}
                            className={`h-10 rounded-3xl flex justify-center items-center px-4 py-1.5 cursor-pointer transition-all duration-200 ${
                              currentTab === "events"
                                ? "bg-indigo-50 hover:bg-[#EEF2FF]/80 border-none"
                                : "bg-white hover:bg-zinc-50 border border-indigo-400"
                            }`}
                            style={currentTab === "events" ? { outline: "1px solid #EEF2FF" } : undefined}
                          >
                            <span className={currentTab === "events" ? "text-[#6366F1] text-sm font-semibold font-['Poppins'] leading-5" : "text-indigo-400 text-sm font-semibold font-['Poppins'] leading-5"}>Events list</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onOpenLunarPanel?.("Lunnar panel", "pie");
                              setActiveJobTab("skills");
                            }}
                            className={`h-10 rounded-3xl flex justify-center items-center px-4 py-1.5 cursor-pointer transition-all duration-200 ${
                              currentTab === "skills"
                                ? "bg-indigo-50 hover:bg-[#EEF2FF]/80 border-none"
                                : "bg-white hover:bg-zinc-50 border border-indigo-400"
                            }`}
                            style={currentTab === "skills" ? { outline: "1px solid #EEF2FF" } : undefined}
                          >
                            <span className={currentTab === "skills" ? "text-[#6366F1] text-sm font-semibold font-['Poppins'] leading-5" : "text-indigo-400 text-sm font-semibold font-['Poppins'] leading-5"}>Skills list</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="whitespace-pre-wrap">
                      <div>
                        {localContent || ((isStreaming || localStreaming) ? "Thinking..." : "")}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {isGraphRelated && (
              <div className="order-1 w-full">
                <GraphCard
                  title={graphTitle || "Revenue Analysis"}
                  type={graphType}
                  onClick={() => onOpenLunarPanel?.(graphTitle || "Revenue Analysis", graphType === "chart" ? "pie" : "graph")}
                  isActive={(graphType === "graph" && activeLunarMode === "graph") || (graphType === "chart" && activeLunarMode === "pie")}
                />
              </div>
            )}

            {message.role === "assistant" && websiteResults && websiteResults.length > 0 && !localContent.includes("These two are probably the closest modern references") && (
              <div className="flex flex-col gap-[10px] mt-[10px] order-1">
                {websiteResults.map((result) => (
                  <WebsiteMessageCard
                    key={result.id}
                    company={result.company}
                    onClick={() => {
                      onOpenLunarPanel?.(
                        result.company,
                        "website",
                        result.company,
                        websiteResults
                      );
                    }}
                  />
                ))}
              </div>
            )}

            {/* Dedicated Error Message Component */}
            {isError && (
              <InlineError error={message.error || error} />
            )}


            {/* Action icons row below assistant bubble */}
            <div className="flex flex-row items-center gap-2 mt-2 order-3">
              <button
                type="button"
                onClick={handleLike}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "24px",
                  background: liked ? "#EEF2FF" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Like"
              >
                <Icon 
                  icon={liked ? "gravity-ui:thumbs-up-fill" : "gravity-ui:thumbs-up"} 
                  width={20} 
                  height={20} 
                  style={{ color: liked ? "#6366F1" : "#6B7280" }} 
                />
              </button>
              <button
                type="button"
                onClick={handleDislike}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "24px",
                  background: disliked ? "#EEF2FF" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Dislike"
              >
                <Icon 
                  icon={disliked ? "gravity-ui:thumbs-down-fill" : "gravity-ui:thumbs-down"} 
                  width={20} 
                  height={20} 
                  style={{ color: disliked ? "#6366F1" : "#6B7280" }} 
                />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "24px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Copy"
              >
                <Icon 
                  icon={copied ? "tabler:copy-filled" : "tabler:copy"} 
                  width={20} 
                  height={20} 
                  style={{ color: copied ? "#6366F1" : "#6B7280" }} 
                />
              </button>
              <button
                type="button"
                onClick={handleRetry}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "24px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                title="Retry"
              >
                <Icon icon="mage:reload" width={20} height={20} style={{ color: "#6B7280" }} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}