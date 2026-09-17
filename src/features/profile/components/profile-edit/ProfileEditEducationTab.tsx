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
  const [viewMode, setViewMode] = useState<"list" | "form">(
    educations.length === 0 ? "form" : initialMode
  );
  const [activeEduId, setActiveEduId] = useState<string | "new">(
    selectedId || (initialMode === "form" ? "new" : "new")
  );

  useEffect(() => {
    if (initialMode === "form") {
      setViewMode("form");
      setActiveEduId(selectedId || "new");
    } else {
      setViewMode(educations.length === 0 ? "form" : "list");
    }
  }, [initialMode, selectedId, educations.length]);

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
  };

  const handleEditItem = (edu: Education) => {
    setActiveEduId(edu.education_id);
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
      <ProfileEditEducationList
        educations={educations}
        onAddNew={handleAddNew}
        onEditItem={handleEditItem}
      />
    );
  }

  return (
    <ProfileEditEducationForm
      initialEducation={activeEducation}
      onBackToList={() => setViewMode("list")}
      onAddNew={handleAddNew}
      onSaved={handleSaved}
      onDeleted={handleDeleted}
      onRegisterBack={onRegisterBackAction}
    />
  );
};

export default ProfileEditEducationTab;
