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
  const [viewMode, setViewMode] = useState<"list" | "form">(() => {
    if (typeof window !== "undefined") {
      const savedMode = sessionStorage.getItem("profile_edit_proj_mode") as "list" | "form";
      if (savedMode) return savedMode;
    }
    return initialMode;
  });
  
  const [activeProjId, setActiveProjId] = useState<string | "new">(() => {
    if (typeof window !== "undefined") {
      const savedId = sessionStorage.getItem("profile_edit_proj_id");
      if (savedId) return savedId;
    }
    return selectedId || (initialMode === "form" ? "new" : "new");
  });
  const [hasVisitedList, setHasVisitedList] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("profile_edit_proj_has_visited");
      if (saved) return saved === "true";
    }
    return initialMode === "list";
  });

  useEffect(() => {
    if (initialMode === "form" && typeof window !== "undefined" && !sessionStorage.getItem("profile_edit_proj_mode")) {
      setViewMode("form");
      setActiveProjId(selectedId || "new");
      setHasVisitedList(false);
    } else if (typeof window !== "undefined" && !sessionStorage.getItem("profile_edit_proj_mode")) {
      setViewMode(initialMode);
      setHasVisitedList(initialMode === "list");
    }
  }, [initialMode, selectedId]);

  useEffect(() => {
    sessionStorage.setItem("profile_edit_proj_mode", viewMode);
    sessionStorage.setItem("profile_edit_proj_id", activeProjId);
    sessionStorage.setItem("profile_edit_proj_has_visited", String(hasVisitedList));
  }, [viewMode, activeProjId, hasVisitedList]);

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
      setHasVisitedList(true);
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
    setHasVisitedList(true);
  };

  const handleEditItem = (proj: Project) => {
    setActiveProjId(proj.project_id);
    setViewMode("form");
    setHasVisitedList(true);
  };

  const handleSaved = (id?: string) => {
    if (id) {
      setActiveProjId(id);
    }
    onSuccess?.();
    if (!hasVisitedList) {
      onCancel?.();
    } else {
      setViewMode("list");
    }
  };

  const handleDeleted = () => {
    onSuccess?.();
    if (!hasVisitedList) {
      onCancel?.();
    } else {
      setViewMode("list");
    }
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
      onBackToList={() => {
        if (!hasVisitedList) {
          onCancel?.();
        } else {
          setViewMode("list");
        }
      }}
      onAddNew={handleAddNew}
      onSaved={handleSaved}
      onDeleted={handleDeleted}
      onRegisterBack={onRegisterBackAction}
    />
  );
};

export default ProfileEditProjectTab;
