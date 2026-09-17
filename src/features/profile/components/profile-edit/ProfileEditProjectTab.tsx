"use client";

import React, { useState, useEffect } from "react";
import { ProfileEditProjectList } from "./ProfileEditProjectList";
import { ProfileEditProjectForm } from "./ProfileEditProjectForm";
import type { Project } from "@/types/entities";

interface ProfileEditProjectTabProps {
  projects: Project[];
  initialMode?: "list" | "form";
  selectedId?: string | null;
  onSubTitleChange?: (subtitle?: string) => void;
  onRegisterBackAction?: (fn: (() => void) | null) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProfileEditProjectTab: React.FC<ProfileEditProjectTabProps> = ({
  projects = [],
  initialMode = "list",
  selectedId = null,
  onSubTitleChange,
  onRegisterBackAction,
  onSuccess,
  onCancel,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "form">(
    projects.length === 0 ? "form" : initialMode
  );
  const [activeProjId, setActiveProjId] = useState<string | "new">(
    selectedId || (initialMode === "form" ? "new" : "new")
  );

  useEffect(() => {
    if (initialMode === "form") {
      setViewMode("form");
      setActiveProjId(selectedId || "new");
    } else {
      setViewMode(projects.length === 0 ? "form" : "list");
    }
  }, [initialMode, selectedId, projects.length]);

  // Sync subtitle with parent
  useEffect(() => {
    if (viewMode === "form") {
      onSubTitleChange?.(activeProjId === "new" ? "Add project" : "Edit project");
    } else {
      onSubTitleChange?.(undefined);
    }
  }, [viewMode, activeProjId, onSubTitleChange]);

  useEffect(() => {
    if (viewMode === "list") {
      onRegisterBackAction?.(null);
    }
  }, [viewMode, onRegisterBackAction]);

  const activeProject =
    activeProjId === "new"
      ? null
      : projects.find((p) => p.project_id === activeProjId) || null;

  const handleAddNew = () => {
    setActiveProjId("new");
    setViewMode("form");
  };

  const handleEditItem = (proj: Project) => {
    setActiveProjId(proj.project_id);
    setViewMode("form");
  };

  const handleSaved = () => {
    onSuccess?.();
    // Retain user on the form page
  };

  const handleDeleted = () => {
    onSuccess?.();
    setViewMode("list");
  };

  if (viewMode === "list") {
    return (
      <ProfileEditProjectList
        projects={projects}
        onAddNew={handleAddNew}
        onEditItem={handleEditItem}
      />
    );
  }

  return (
    <ProfileEditProjectForm
      initialProject={activeProject}
      onBackToList={() => setViewMode("list")}
      onAddNew={handleAddNew}
      onSaved={handleSaved}
      onDeleted={handleDeleted}
      onRegisterBack={onRegisterBackAction}
    />
  );
};

export default ProfileEditProjectTab;
