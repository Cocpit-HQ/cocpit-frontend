"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import ProjectFilterTabs from "./ProjectFilterTabs";
import ProjectChatList from "./ProjectChatList";
import type { ProjectChat, ProjectFile } from "./project.types";
import ProjectFilesTab from "./ProjectFilesTab";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import ProjectInstructions from "./components/ProjectInstructions";
import ProjectHeader from "./ProjectHeader";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectSidebarProps {
  projectName: string;
  onClose?: () => void;
  chatCount?: number;
  onSearch?: (query: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  // Project Chat List Props
  chats: ProjectChat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onRenameChat: (id: string) => void;
  onTogglePinChat: (id: string) => void;
  onRemoveChat: (id: string) => void;
  onShareChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  instructions?: string;
  onSaveInstructions?: (instructions: string) => void;
}

export default function ProjectSidebar({
  projectName,
  onClose,
  chatCount = 0,
  onSearch,
  activeTab: externalActiveTab,
  onTabChange,
  chats,
  activeChatId,
  onSelectChat,
  onRenameChat,
  onTogglePinChat,
  onRemoveChat,
  onShareChat,
  onDeleteChat,
  instructions = "",
  onSaveInstructions,
}: ProjectSidebarProps) {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [internalActiveTab, setInternalActiveTab] = useState("Chats");
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileToDeleteId, setFileToDeleteId] = useState<string | null>(null);

  const handleUploadFiles = (fileList: FileList) => {
    const newFiles: ProjectFile[] = Array.from(fileList).map((file) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        type: isImage ? "image" : "document",
        uploadedAt: new Date(),
        size: file.size,
        url: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDeleteClick = (id: string) => {
    setFileToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteFile = () => {
    if (fileToDeleteId) {
      setFiles((prev) => {
        const fileToDelete = prev.find((f) => f.id === fileToDeleteId);
        if (fileToDelete?.url) {
          URL.revokeObjectURL(fileToDelete.url);
        }
        return prev.filter((f) => f.id !== fileToDeleteId);
      });
      setFileToDeleteId(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const handleTabChange = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  const handleSend = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  const computedChatCount = chats.length;

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: isMobile ? "0px" : "16px",
        gap: "16px",
        width: isMobile ? "100%" : "380px",
        minWidth: isMobile ? "100%" : "380px",
        background: "var(--background)",
        border: isMobile ? "none" : "1px solid var(--border)",
        borderRadius: isMobile ? "0px" : "24px",
        height: "100%",
        overflow: "hidden", // Prevent card content from bleeding
      }}
      className="project-sidebar-card"
    >
      {/* Mobile Top Header */}
      {isMobile && (
        <div style={{ flexShrink: 0, paddingBottom: "8px" }}>
          <ProjectHeader
            variant="details"
            title={projectName}
            onClose={onClose || (() => {})}
          />
        </div>
      )}
      {/* Top Search / Chat Action Bar */}
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "8px 16px",
          gap: "12px",
          width: "100%",
          height: "56px",
          background: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: "24px",
          boxShadow: "var(--card-shadow-inner)",
          flexShrink: 0,
        }}
      >
        {/* Search Input Area */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "8px", minWidth: 0 }}>
          <Icon 
            icon="ri:link" 
            width="24" 
            height="24" 
            style={{ color: "var(--muted-foreground)", flexShrink: 0 }} 
          />
          <input
            type="text"
            placeholder="Ask anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "20px",
              color: "var(--foreground)",
              width: "100%",
            }}
          />
        </div>
 
        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "40px",
            background: "var(--background)",
            borderRadius: "24px",
            border: "none",
            cursor: searchQuery.trim() ? "pointer" : "default",
            padding: 0,
            outline: "none",
            boxSizing: "border-box",
            flexShrink: 0,
          }}
          className="hover:bg-[var(--primary-tint)] transition-all"
          title="Send"
        >
          <Icon
            icon="lucide:send"
            width="24"
            height="24"
            style={{
              color: searchQuery.trim() ? "var(--primary)" : "var(--muted-foreground)",
            }}
          />
        </button>
      </div>
 
      {/* Filter Chip Section */}
      <div style={{ flexShrink: 0 }}>
        <ProjectFilterTabs
          activeTab={activeTab}
          onChangeTab={handleTabChange}
        />
      </div>
 
      {/* Chat Count */}
      {activeTab === "Chats" && (
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
            color: "var(--muted-foreground)",
            marginTop: "4px",
            flexShrink: 0,
          }}
        >
          {computedChatCount} {computedChatCount === 1 ? "chat" : "chats"}
        </div>
      )}
 
      {/* Files Section Title */}
      {activeTab === "Files" && (
        <div
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
            color: "var(--foreground)",
            marginTop: "4px",
            flexShrink: 0,
          }}
        >
          Add project source
        </div>
      )}
 
      {/* Empty Chat Message or Chat List */}
      {activeTab === "Chats" && (
        computedChatCount === 0 ? (
          <div
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: "12px",
              lineHeight: "16px",
              color: "var(--muted-foreground)",
              width: "100%",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
          >
            Start a chat to keep conversations organized and re-use project knowledge.
          </div>
        ) : (
          <div
            style={{
              marginTop: "16px",
              flex: 1,
              minHeight: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ProjectChatList
              chats={chats}
              activeChatId={activeChatId}
              onSelectChat={onSelectChat}
              onRenameChat={onRenameChat}
              onTogglePinChat={onTogglePinChat}
              onRemoveChat={onRemoveChat}
              onShareChat={onShareChat}
              onDeleteChat={onDeleteChat}
            />
          </div>
        )
      )}

      {/* Files Tab Content */}
      {activeTab === "Files" && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ProjectFilesTab
            files={files}
            onUploadFiles={handleUploadFiles}
            onDeleteFile={handleDeleteClick}
          />
        </div>
      )}

      {/* Instructions Tab Content */}
      {activeTab === "Instructions" && (
        <ProjectInstructions
          instructions={instructions}
          onSave={onSaveInstructions || (() => {})}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <CocpitConfirmBox
        isOpen={isDeleteConfirmOpen}
        title="Delete file"
        message="Are you sure you want to delete this file?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDeleteFile}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setFileToDeleteId(null);
        }}
      />
    </div>
  );
}
