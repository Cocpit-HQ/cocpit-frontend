"use client";

import React, { useState, useEffect } from "react";
import { ProfileEditExperienceList } from "./ProfileEditExperienceList";
import { ProfileEditExperienceForm } from "./ProfileEditExperienceForm";
import type { Experience } from "@/types/entities";

import { AddIcon } from "@/components/icons";

interface ProfileEditExperienceTabProps {
  experiences: Experience[];
  initialMode?: "list" | "form";
  selectedId?: string | null;
  onSubTitleChange?: (subtitle?: string) => void;
  onHeaderActionChange?: (action: React.ReactNode | null) => void;
  onRegisterBackAction?: (fn: (() => void) | null) => void;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProfileEditExperienceTab: React.FC<ProfileEditExperienceTabProps> = ({
  experiences = [],
  initialMode = "list",
  selectedId = null,
  onSubTitleChange,
  onHeaderActionChange,
  onRegisterBackAction,
  onSuccess,
  onCancel,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "form">(
    experiences.length === 0 ? "form" : initialMode
  );
  const [activeExpId, setActiveExpId] = useState<string | "new">(
    selectedId || (initialMode === "form" ? "new" : "new")
  );
  const [isAddingNewRole, setIsAddingNewRole] = useState(false);

  useEffect(() => {
    if (initialMode === "form") {
      setViewMode("form");
      setActiveExpId(selectedId || "new");
      setIsAddingNewRole(false);
    } else {
      setViewMode(experiences.length === 0 ? "form" : "list");
      setIsAddingNewRole(false);
    }
  }, [initialMode, selectedId, experiences.length]);

  // Sync subtitle with parent
  useEffect(() => {
    if (viewMode === "form") {
      if (experiences.length === 0) {
        onSubTitleChange?.("Add experience");
      } else if (isAddingNewRole && activeExpId === "new") {
        onSubTitleChange?.("Add new role");
      } else {
        onSubTitleChange?.("Edit experience");
      }
    } else {
      onSubTitleChange?.(undefined);
    }
  }, [viewMode, activeExpId, isAddingNewRole, experiences.length, onSubTitleChange]);

  const activeExperience =
    activeExpId === "new"
      ? null
      : experiences.find((e) => e.experience_id === activeExpId) || null;

  // Sync Header Action (+ Add new role in the same row as user name)
  useEffect(() => {
    if (viewMode === "form" && !isAddingNewRole && activeExperience) {
      onHeaderActionChange?.(
        <button
          type="button"
          onClick={() => {
            setIsAddingNewRole(true);
          }}
          className="h-[36px] min-w-[149px] px-[12px] py-[6px] rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-95 transition-all text-[var(--ds-text-primary)] text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex flex-row items-center justify-center gap-[10px] cursor-pointer focus:outline-none shrink-0 whitespace-nowrap"
        >
          <AddIcon className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" />
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] whitespace-nowrap">
            Add new role
          </span>
        </button>
      );
    } else {
      onHeaderActionChange?.(null);
    }
    return () => {
      onHeaderActionChange?.(null);
    };
  }, [viewMode, isAddingNewRole, activeExperience, onHeaderActionChange]);

  const handleAddNew = () => {
    setActiveExpId("new");
    setIsAddingNewRole(false);
    setViewMode("form");
  };

  const handleEditItem = (exp: Experience) => {
    setActiveExpId(exp.experience_id);
    setIsAddingNewRole(false);
    setViewMode("form");
  };

  useEffect(() => {
    if (viewMode === "list") {
      onRegisterBackAction?.(null);
    }
  }, [viewMode, onRegisterBackAction]);

  const handleSaved = () => {
    onSuccess?.();
    // Retain user on the form page as required
  };

  const handleDeleted = () => {
    setIsAddingNewRole(false);
    onSuccess?.();
    setViewMode("list");
  };

  if (viewMode === "list") {
    return (
      <ProfileEditExperienceList
        experiences={experiences}
        onAddNew={handleAddNew}
        onEditItem={handleEditItem}
      />
    );
  }

  const previousRoleTitle =
    activeExperience?.title || experiences[0]?.title || undefined;

  return (
    <ProfileEditExperienceForm
      initialExperience={activeExperience}
      previousRoleTitle={previousRoleTitle}
      isInitialAdd={experiences.length === 0}
      isAddingNewRole={isAddingNewRole}
      onToggleAddNewRole={(adding) => setIsAddingNewRole(adding)}
      onBackToList={() => {
        if (isAddingNewRole) {
          setIsAddingNewRole(false);
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

export default ProfileEditExperienceTab;
