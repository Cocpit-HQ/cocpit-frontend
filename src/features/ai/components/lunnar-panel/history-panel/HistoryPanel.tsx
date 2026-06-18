"use client";

import React, { useState } from "react";
import { initialHistoryData, HistoryItemType } from "./historyDummyData";
import HistoryList from "./HistoryList";
import HistoryMoveToProjectDialog from "./HistoryMoveToProjectDialog";
import RenameChatDialog from "../../../project/RenameChatDialog";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import { useIsMobile } from "@/hooks/use-mobile";

interface HistoryPanelProps {
  onClose: () => void;
  onShare: () => void;
  onSelectHistoryItem?: () => void;
}

export default function HistoryPanel({ onClose, onShare, onSelectHistoryItem }: HistoryPanelProps) {
  const isMobile = useIsMobile();

  // Use session/local state so changes are reflected interactively
  const [items, setItems] = useState<HistoryItemType[]>(initialHistoryData);
  const [selectedMoveItem, setSelectedMoveItem] = useState<HistoryItemType | null>(null);
  const [selectedRenameItem, setSelectedRenameItem] = useState<HistoryItemType | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Pin/Unpin Logic
  const handleTogglePin = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPinned: !item.isPinned } : item
      )
    );
  };

  // Rename Logic
  const handleRename = (id: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, title: newTitle } : item
      )
    );
  };

  const handleRenameClick = (item: HistoryItemType) => {
    setSelectedRenameItem(item);
  };

  // Share Action
  const handleShare = (item: HistoryItemType) => {
    // Reuse the existing project Share dialog callback
    onShare();
  };

  // Move To Project modal trigger
  const handleMoveToProject = (item: HistoryItemType) => {
    setSelectedMoveItem(item);
  };

  // Delete trigger
  const handleDeleteClick = (id: string) => {
    setDeleteItemId(id);
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (deleteItemId) {
      setItems((prev) => prev.filter((item) => item.id !== deleteItemId));
      setDeleteItemId(null);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "10px",
        width: isMobile ? "100%" : "284px",
        flexGrow: 1,
        minHeight: 0,
      }}
    >
      {/* 3. Section Heading */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px 8px",
          gap: "10px",
          width: isMobile ? "100%" : "284px",
          height: "20px",
          boxSizing: "border-box",
        }}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            lineHeight: "20px",
            color: "var(--foreground)",
          }}
        >
          History
        </span>
      </div>

      {/* 4. History List */}
      <HistoryList
        items={items}
        onTogglePin={handleTogglePin}
        onRename={handleRenameClick}
        onShare={handleShare}
        onMoveToProject={handleMoveToProject}
        onDelete={handleDeleteClick}
        onSelectHistoryItem={() => onSelectHistoryItem?.()}
      />

      {/* 11. Move to Project Dialog */}
      {selectedMoveItem && (
        <HistoryMoveToProjectDialog
          isOpen={!!selectedMoveItem}
          onClose={() => setSelectedMoveItem(null)}
          chatTitle={selectedMoveItem.title}
          onMove={(project) => {
            console.log(`Moved item ${selectedMoveItem.title} to ${project}`);
          }}
        />
      )}

      {/* Rename Chat Dialog */}
      {selectedRenameItem && (
        <RenameChatDialog
          isOpen={!!selectedRenameItem}
          onClose={() => setSelectedRenameItem(null)}
          currentName={selectedRenameItem.title}
          onRename={(newName) => handleRename(selectedRenameItem.id, newName)}
        />
      )}

      {/* 14. Delete Confirmation Box */}
      <CocpitConfirmBox
        isOpen={!!deleteItemId}
        title="Delete chat"
        message="Are you sure you want to delete this chat? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItemId(null)}
      />
    </div>
  );
}
