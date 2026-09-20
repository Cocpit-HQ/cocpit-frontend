"use client";

import React, { useState, useEffect } from "react";
import { ProfileEditEducationList } from "./ProfileEditEducationList";
import { ProfileEditEducationForm } from "./ProfileEditEducationForm";
import type { Education } from "@/types/entities";

interface ProfileEditEducationTabProps {
  educations: Education[];
  initialMode?: "list" | "form";
  selectedId?: string | null;
  onSubTitleChange?: (subtitle?: string) => void;
  onRegisterBackAction?: (fn: (() => void) | null) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProfileEditEducationTab: React.FC<ProfileEditEducationTabProps> = ({
  educations = [],
  initialMode = "list",
  selectedId = null,
  onSubTitleChange,
  onRegisterBackAction,
  onSuccess,
  onCancel,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "form">(() => {
    if (typeof window !== "undefined") {
      const savedMode = sessionStorage.getItem("profile_edit_edu_mode") as "list" | "form";
      if (savedMode) return savedMode;
    }
    return initialMode;
  });
  
  const [activeEduId, setActiveEduId] = useState<string | "new">(() => {
    if (typeof window !== "undefined") {
      const savedId = sessionStorage.getItem("profile_edit_edu_id");
      if (savedId) return savedId;
    }
    return selectedId || (initialMode === "form" ? "new" : "new");
  });
  const [hasVisitedList, setHasVisitedList] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("profile_edit_edu_has_visited");
      if (saved) return saved === "true";
    }
    return initialMode === "list";
  });

  useEffect(() => {
    if (initialMode === "form" && typeof window !== "undefined" && !sessionStorage.getItem("profile_edit_edu_mode")) {
      setViewMode("form");
      setActiveEduId(selectedId || "new");
      setHasVisitedList(false);
    } else if (typeof window !== "undefined" && !sessionStorage.getItem("profile_edit_edu_mode")) {
      setViewMode(initialMode);
      setHasVisitedList(initialMode === "list");
    }
  }, [initialMode, selectedId]);

  useEffect(() => {
    sessionStorage.setItem("profile_edit_edu_mode", viewMode);
    sessionStorage.setItem("profile_edit_edu_id", activeEduId);
    sessionStorage.setItem("profile_edit_edu_has_visited", String(hasVisitedList));
  }, [viewMode, activeEduId, hasVisitedList]);

  // Sync subtitle with parent
  useEffect(() => {
    if (viewMode === "form") {
      onSubTitleChange?.(activeEduId === "new" ? "Add education" : "Edit education");
    } else {
      onSubTitleChange?.(undefined);
    }
  }, [viewMode, activeEduId, onSubTitleChange]);

  useEffect(() => {
    if (viewMode === "list") {
      setHasVisitedList(true);
      onRegisterBackAction?.(null);
    }
  }, [viewMode, onRegisterBackAction]);

  const activeEducation =
    activeEduId === "new"
      ? null
      : educations.find((e) => e.education_id === activeEduId) || null;

  const handleAddNew = () => {
    setActiveEduId("new");
    setViewMode("form");
    setHasVisitedList(true);
  };

  const handleEditItem = (edu: Education) => {
    setActiveEduId(edu.education_id);
    setViewMode("form");
    setHasVisitedList(true);
  };

  const handleSaved = (id?: string) => {
    if (id) {
      setActiveEduId(id);
    }
    onSuccess?.();
    // Retain user on the form page
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
      <ProfileEditEducationList
        educations={educations}
        onAddNew={handleAddNew}
        onEditItem={handleEditItem}
      />
    );
  }

  return (
    <ProfileEditEducationForm
      allEducations={educations}
      initialEducation={activeEducation}
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

export default ProfileEditEducationTab;
