"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import ProjectHeader from "./ProjectHeader";
import ProjectEmptyState from "./ProjectEmptyState";
import CreateProjectDialog from "./CreateProjectDialog";
import RenameProjectDialog from "./RenameProjectDialog";
import ProjectActionsMenu from "./ProjectActionsMenu";
import ProjectDetailsPage, { initialChatsData } from "./ProjectDetailsPage";
import { PROJECT_ICONS, PROJECT_STRINGS } from "./project.constants";
import type { ProjectScreenProps, Project } from "./project.types";
import CocpitShareModel from "@/shared/commonComponents/cocpitsharemodel";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import { useIsMobile } from "@/hooks/use-mobile";

const getRelativeTimeString = (dateString: string) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    const date = new Date(dateString);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `Updated ${months[date.getMonth()].toLowerCase()} ${date.getDate()}`;
  }

  if (diffMins < 1) return "Updated just now";
  if (diffMins < 60) return `Updated ${diffMins}m ago`;
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  
  const date = new Date(dateString);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `Updated ${months[date.getMonth()].toLowerCase()} ${date.getDate()}`;
};

export default function ProjectScreen({
  onClose,
  onNewProjectClick,
  projects = [],
  onUpdateProjects,
}: ProjectScreenProps) {
  const isMobile = useIsMobile();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog/Modal states
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareProjectId, setShareProjectId] = useState<string | null>(null);

  const handleCreateProject = (name: string) => {
    setIsCreateOpen(false);

    // If project already exists, just open it
    const existing = projects.find(p => p.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (existing) {
      setSelectedProjectName(existing.name);
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      chats: name.trim().toLowerCase() === "projectchat" || name.trim().toLowerCase() === "project chat"
        ? initialChatsData(name)
        : [],
    };

    const nextProjects = [...projects, newProject];

    if (onUpdateProjects) {
      onUpdateProjects(nextProjects);
    }
    setSelectedProjectName(name.trim());
    if (onNewProjectClick) {
      onNewProjectClick();
    }
  };

  const handleRename = (newName: string) => {
    if (renameProjectId && onUpdateProjects) {
      const updated = projects.map(p =>
        p.id === renameProjectId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
      );
      onUpdateProjects(updated);
    }
    setIsRenameOpen(false);
    setRenameProjectId(null);
  };

  const handleTogglePin = (projectId: string) => {
    if (onUpdateProjects) {
      const updated = projects.map(p => {
        if (p.id === projectId) {
          const isPinnedNow = !p.pinned;
          return {
            ...p,
            pinned: isPinnedNow,
            pinnedAt: isPinnedNow ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });
      onUpdateProjects(updated);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteProjectId && onUpdateProjects) {
      const updated = projects.filter(p => p.id !== deleteProjectId);
      onUpdateProjects(updated);
    }
    setIsDeleteOpen(false);
    setDeleteProjectId(null);
  };

  // Sort and filter projects
  const sortedProjects = useMemo(() => {
    const pinned = projects.filter(p => p.pinned);
    const unpinned = projects.filter(p => !p.pinned);

    // Sort pinned: most recently pinned first
    pinned.sort((a, b) => {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      if (bTime !== aTime) return bTime - aTime;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    // Sort unpinned: latest updated first
    unpinned.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return [...pinned, ...unpinned];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return sortedProjects.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedProjects, searchQuery]);

  if (selectedProjectName) {
    return (
      <ProjectDetailsPage
        projectName={selectedProjectName}
        onClose={() => setSelectedProjectName(null)}
        projects={projects}
        onUpdateProjects={onUpdateProjects || (() => {})}
      />
    );
  }

  const shareProject = projects.find(p => p.id === shareProjectId);
  const renameProject = projects.find(p => p.id === renameProjectId);
  const deleteProject = projects.find(p => p.id === deleteProjectId);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "16px" : "16px 24px",
        gap: isMobile ? "16px" : "24px",
        position: isMobile ? "static" : "absolute",
        width: isMobile ? "100%" : "960px",
        height: isMobile ? "100%" : "calc(100% - 20px)",
        left: isMobile ? "auto" : "50%",
        transform: isMobile ? "none" : "translateX(-50%)",
        top: isMobile ? "auto" : "20px",
        background: "var(--background)",
        boxSizing: "border-box",
      }}
      className="project-screen-container h-full"
    >
      {/* Header Section */}
      <ProjectHeader onClose={onClose} />
 
      {/* Main Content Area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: isMobile ? "8px 0px" : "24px 0px",
          gap: "0px",
          width: isMobile ? "100%" : "912px",
          flex: 1,
          boxSizing: "border-box",
          minHeight: 0,
        }}
      >
        {/* Page Title Section & Search Input */}
        {isMobile ? (
          projects.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box", marginTop: "16px" }}>
              {/* Search Input Frame */}
              <div
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 16px",
                  gap: "10px",
                  width: "100%",
                  height: "40px",
                  border: "1px solid var(--border)",
                  borderRadius: "24px",
                }}
              >
                <input
                  type="text"
                  placeholder="Search project"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    width: "100%",
                    padding: 0,
                    fontFamily: "'Poppins', sans-serif",
                    fontStyle: "normal",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: "24px",
                    color: "var(--foreground)",
                  }}
                  className="placeholder-[var(--muted-foreground)]"
                />
                <Icon
                  icon="ph:magnifying-glass-light"
                  width="24"
                  height="24"
                  style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
                />
              </div>
 
              {/* New Project Button Frame */}
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "8px 16px",
                  gap: "10px",
                  width: "100%",
                  height: "40px",
                  background: "var(--primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "24px",
                  cursor: "pointer",
                  outline: "none",
                  whiteSpace: "nowrap",
                  marginTop: "12px",
                }}
                className="hover:opacity-90 transition-all"
              >
                <Icon
                  icon={PROJECT_ICONS.plus}
                  width="24"
                  height="24"
                  style={{ color: "var(--primary-foreground)" }}
                />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    fontSize: "14px",
                    lineHeight: "20px",
                    textAlign: "center",
                    color: "var(--primary-foreground)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {PROJECT_STRINGS.newProjectButton}
                </span>
              </button>
            </div>
          )
        ) : (
          <>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0px 8px",
                width: "912px",
                height: "56px",
                boxSizing: "border-box",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Poppins', sans-serif",
                  fontStyle: "normal",
                  fontWeight: 600,
                  fontSize: "48px",
                  lineHeight: "56px",
                  textTransform: "uppercase",
                  color: "var(--foreground)",
                }}
              >
                {PROJECT_STRINGS.title}
              </h1>
 
              {/* Search Input Frame */}
              {projects.length > 0 && (
                <div
                  style={{
                    boxSizing: "border-box",
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 16px",
                    gap: "10px",
                    width: "360px",
                    height: "40px",
                    border: "1px solid var(--border)",
                    borderRadius: "24px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search project"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      width: "100%",
                      padding: 0,
                      fontFamily: "'Poppins', sans-serif",
                      fontStyle: "normal",
                      fontWeight: 400,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "var(--foreground)",
                    }}
                    className="placeholder-[var(--muted-foreground)]"
                  />
                  <Icon
                    icon="ph:magnifying-glass-light"
                    width="24"
                    height="24"
                    style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
                  />
                </div>
              )}
            </div>
 
            {/* New Project Button Frame */}
            {projects.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "8px 16px",
                  gap: "10px",
                  width: "150px",
                  height: "40px",
                  background: "var(--primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "24px",
                  cursor: "pointer",
                  outline: "none",
                  whiteSpace: "nowrap",
                  marginTop: "16px",
                }}
                className="hover:opacity-90 transition-all"
              >
                <Icon
                  icon={PROJECT_ICONS.plus}
                  width="24"
                  height="24"
                  style={{ color: "var(--primary-foreground)" }}
                />
                <span
                  style={{
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    fontSize: "14px",
                    lineHeight: "20px",
                    textAlign: "center",
                    color: "var(--primary-foreground)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {PROJECT_STRINGS.newProjectButton}
                </span>
              </button>
            )}
          </>
        )}

        {/* Empty State Section or Project List Grid */}
        {projects.length === 0 ? (
          <ProjectEmptyState onNewProjectClick={() => setIsCreateOpen(true)} />
        ) : (
          /* Project List Container */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0px",
              gap: "16px",
              width: isMobile ? "100%" : "912px",
              flex: 1,
              overflowY: "auto",
              boxSizing: "border-box",
              marginTop: isMobile ? "16px" : "32px",
            }}
            className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {filteredProjects.map((project) => {
              const chatsCount = project.displayChatsCount !== undefined
                ? project.displayChatsCount
                : (project.chats || []).length;
              
              const updatedText = project.displayUpdatedTime !== undefined
                ? `Updated ${project.displayUpdatedTime}`
                : getRelativeTimeString(project.updatedAt);

              return (
                <ProjectListItemWrapper
                  key={project.id}
                  project={project}
                  chatsCount={chatsCount}
                  updatedText={updatedText}
                  onSelect={() => setSelectedProjectName(project.name)}
                  onTogglePin={() => handleTogglePin(project.id)}
                  onRename={() => {
                    setRenameProjectId(project.id);
                    setIsRenameOpen(true);
                  }}
                  onShare={() => {
                    setShareProjectId(project.id);
                    setIsShareOpen(true);
                  }}
                  onDelete={() => {
                    setDeleteProjectId(project.id);
                    setIsDeleteOpen(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Create Project Popup */}
      <CreateProjectDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateProject}
      />

      {/* Rename Project Dialog */}
      {isRenameOpen && renameProject && (
        <RenameProjectDialog
          isOpen={isRenameOpen}
          onClose={() => {
            setIsRenameOpen(false);
            setRenameProjectId(null);
          }}
          currentName={renameProject.name}
          onRename={handleRename}
        />
      )}

      {/* Share Modal */}
      {isShareOpen && shareProject && (
        <CocpitShareModel
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
            setShareProjectId(null);
          }}
          postId={shareProject.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteOpen && deleteProject && (
        <CocpitConfirmBox
          isOpen={isDeleteOpen}
          title={`Are you sure you want to delete "${deleteProject.name}"?`}
          message="This action cannot be undone. All chats in this project will be deleted."
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setIsDeleteOpen(false);
            setDeleteProjectId(null);
          }}
        />
      )}
    </div>
  );
}

/* Helper Component for Pinned State Hover & Layout stability */
interface ProjectListItemWrapperProps {
  project: Project;
  chatsCount: number;
  updatedText: string;
  onSelect: () => void;
  onTogglePin: () => void;
  onRename: () => void;
  onShare: () => void;
  onDelete: () => void;
}

function ProjectListItemWrapper({
  project,
  chatsCount,
  updatedText,
  onSelect,
  onTogglePin,
  onRename,
  onShare,
  onDelete,
}: ProjectListItemWrapperProps) {
  const isMobile = useIsMobile();
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onSelect}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0px",
        gap: "8px",
        width: isMobile ? "100%" : "912px",
        height: "94px",
        borderBottom: "1px solid var(--border)",
        boxSizing: "border-box",
        cursor: "pointer",
        position: "relative",
      }}
      className="hover:bg-[var(--primary-tint)] transition-all duration-200"
    >
      {/* Inner Row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          padding: "16px 8px",
          gap: "8px",
          width: isMobile ? "100%" : "912px",
          height: "86px",
          boxSizing: "border-box",
        }}
      >
        {/* Project Text Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "0px",
            gap: "8px",
            width: isMobile ? "calc(100% - 64px)" : "832px",
            height: "54px",
            flexGrow: 1,
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          {/* Project Title */}
          <span
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontStyle: "normal",
              fontWeight: 500,
              fontSize: "18px",
              lineHeight: "26px",
              color: "var(--foreground)",
              width: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={project.name}
          >
            {project.name}
          </span>
 
          {/* Metadata Row */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              padding: "0px",
              gap: "16px",
              width: "100%",
              height: "20px",
              boxSizing: "border-box",
            }}
          >
            {/* Chats Count */}
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                color: "var(--muted-foreground)",
              }}
            >
              {chatsCount} {chatsCount === 1 ? "chat" : "chats"}
            </span>
 
            {/* Updated Time */}
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
                color: "var(--muted-foreground)",
              }}
            >
              {updatedText}
            </span>
          </div>
        </div>
 
        {/* Right Actions Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            gap: "8px",
            paddingTop: "1px",
            boxSizing: "border-box",
          }}
          onClick={(e) => e.stopPropagation()} // stop selecting project
        >
          {/* Pin / Unpin Button */}
          <button
            type="button"
            onClick={onTogglePin}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              outline: "none",
              color: project.pinned ? "var(--foreground)" : "var(--muted-foreground)",
              opacity: (project.pinned || isHovered || isMenuOpen) ? 1 : 0,
              pointerEvents: (project.pinned || isHovered || isMenuOpen) ? "auto" : "none",
              transition: "opacity 0.2s ease-in-out",
            }}
            title={project.pinned ? "Unpin project" : "Pin project"}
            className="hover:text-[var(--primary)] transition-all"
          >
            <Icon
              icon={project.pinned ? "iconoir:pin-slash" : "iconoir:pin"}
              width="24"
              height="24"
            />
          </button>
 
          {/* Menu Dropdown Button */}
          <ProjectActionsMenu
            isPinned={!!project.pinned}
            onRename={onRename}
            onTogglePin={onTogglePin}
            onShare={onShare}
            onDelete={onDelete}
            onOpenChange={(open) => setIsMenuOpen(open)}
            triggerElement={
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "24px",
                  height: "24px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  outline: "none",
                  color: "var(--foreground)",
                }}
                title="Actions"
                className="hover:text-[var(--primary)] transition-colors"
              >
                <Icon icon="ph:dots-three-outline-vertical-light" width={24} height={24} />
              </button>
            }
          />
        </div>
      </div>
    </div>
  );
}
