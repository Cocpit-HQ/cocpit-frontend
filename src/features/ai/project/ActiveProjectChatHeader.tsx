import React from "react";
import { Icon } from "@iconify/react";
import ProjectChatActionsMenu from "./ProjectChatActionsMenu";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActiveProjectChatHeaderProps {
  chatTitle: string;
  projectName: string;
  isPinned: boolean;
  onRename: () => void;
  onTogglePin: () => void;
  onRemoveFromProject: () => void;
  onShare: () => void;
  onDelete: () => void;
  onBack?: () => void;
}

export default function ActiveProjectChatHeader({
  chatTitle,
  projectName,
  isPinned,
  onRename,
  onTogglePin,
  onRemoveFromProject,
  onShare,
  onDelete,
  onBack,
}: ActiveProjectChatHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        boxSizing: "border-box",
        padding: "16px 16px 0px 16px", // 16px top, 16px left, 16px right
        width: "100%",
      }}
    >
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          background: "var(--background)",
          borderRadius: "24px",
          padding: "12px 16px",
        }}
      >
        {/* Left Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "16px",
            minWidth: 0,
            flex: 1,
          }}
        >
          {isMobile && onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                width: "40px",
                height: "40px",
                border: "1px solid var(--border)",
                borderRadius: "100px",
                background: "transparent",
                cursor: "pointer",
                padding: 0,
                outline: "none",
                flexShrink: 0,
              }}
              className="hover:bg-[var(--primary-tint)] transition-all"
              title="Back"
            >
              <Icon
                icon="lucide:chevron-left"
                width={20}
                height={20}
                style={{ color: "var(--foreground)" }}
              />
            </button>
          )}
 
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "2px",
              minWidth: 0,
            }}
          >
            {/* Chat Title */}
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "16px",
                lineHeight: "24px",
                color: "var(--foreground)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={chatTitle}
            >
              {chatTitle}
            </span>
 
            {/* Subtitle / Project Name */}
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "16px",
                color: "var(--muted-foreground)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {projectName}
            </span>
          </div>
        </div>
 
        {/* Right Content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <ProjectChatActionsMenu
            isPinned={isPinned}
            onRename={onRename}
            onTogglePin={onTogglePin}
            onRemoveFromProject={onRemoveFromProject}
            onShare={onShare}
            onDelete={onDelete}
            triggerElement={
              <button
                type="button"
                className="flex items-center justify-center w-10 h-10 rounded-[24px] bg-[var(--background)] border border-[var(--border)] cursor-pointer hover:bg-[var(--primary-tint)] transition-all duration-200 outline-none"
                style={{
                  boxShadow: "var(--card-shadow-inner)",
                }}
                title="Chat Actions"
              >
                <Icon
                  icon="ph:dots-three-outline-vertical-light"
                  width={24}
                  height={24}
                  className="text-[var(--foreground)] hover:text-[var(--primary)]"
                />
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
