"use client";

import React, { useState, useEffect } from "react";
import { ProfileEditExperienceList } from "./ProfileEditExperienceList";
import { ProfileEditExperienceForm } from "./ProfileEditExperienceForm";
import type { Experience } from "@/types/entities";
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<"list" | "form">(() => {
    if (typeof window !== "undefined") {
      const savedMode = sessionStorage.getItem("profile_edit_exp_mode") as "list" | "form";
      if (savedMode) return savedMode;
    }
    return experiences.length === 0 ? "form" : initialMode;
  });
  
  const [activeExpId, setActiveExpId] = useState<string | "new">(() => {
    if (typeof window !== "undefined") {
      const savedId = sessionStorage.getItem("profile_edit_exp_id");
      if (savedId) return savedId;
    }
    return selectedId || (initialMode === "form" ? "new" : "new");
  });
  const [isAddingNewRole, setIsAddingNewRole] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("profile_edit_exp_adding_role") === "true";
    }
    return false;
  });
  const [hasVisitedList, setHasVisitedList] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("profile_edit_exp_has_visited");
      if (saved) return saved === "true";
    }
    return initialMode === "list" && experiences.length > 0;
  });
  const [disableAddRole, setDisableAddRole] = useState(false);

  useEffect(() => {
    if (initialMode === "form" && typeof window !== "undefined" && !sessionStorage.getItem("profile_edit_exp_mode")) {
      setViewMode("form");
      setActiveExpId(selectedId || "new");
      setIsAddingNewRole(false);
      setHasVisitedList(false);
    } else if (typeof window !== "undefined" && !sessionStorage.getItem("profile_edit_exp_mode")) {
      const mode = experiences.length === 0 ? "form" : "list";
      setViewMode(mode);
      setIsAddingNewRole(false);
      setHasVisitedList(mode === "list");
    }
  }, [initialMode, selectedId, experiences.length]);

  useEffect(() => {
    sessionStorage.setItem("profile_edit_exp_mode", viewMode);
    sessionStorage.setItem("profile_edit_exp_id", activeExpId);
    sessionStorage.setItem("profile_edit_exp_adding_role", String(isAddingNewRole));
    sessionStorage.setItem("profile_edit_exp_has_visited", String(hasVisitedList));
  }, [viewMode, activeExpId, isAddingNewRole, hasVisitedList]);

  // Sync subtitle with parent
  useEffect(() => {
    if (viewMode === "form") {
      if (isAddingNewRole) {
        onSubTitleChange?.("Add new role");
      } else if (activeExpId === "new" || experiences.length === 0) {
        onSubTitleChange?.("Add experience");
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
          disabled={disableAddRole}
          onClick={() => {
            setIsAddingNewRole(true);
          }}
          className={cn(
            "h-[36px] min-w-[149px] px-[12px] py-[6px] rounded-[100px] border border-[var(--ds-border)] transition-all text-[16px] font-medium font-['DM_Sans'] leading-[24px] flex flex-row items-center justify-center gap-[10px] shrink-0 whitespace-nowrap focus:outline-none",
            disableAddRole
              ? "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-50"
              : "hover:bg-[var(--ds-surface-1)] active:scale-95 text-[var(--ds-text-primary)] cursor-pointer"
          )}
        >
          <AddIcon className={cn("w-4 h-4 shrink-0", disableAddRole ? "text-[var(--ds-text-muted)]" : "text-[var(--ds-text-primary)]")} />
          <span className={cn("font-['DM_Sans'] font-medium text-[16px] leading-[24px] whitespace-nowrap", disableAddRole ? "text-[var(--ds-text-muted)]" : "text-[var(--ds-text-primary)]")}>
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
  }, [viewMode, isAddingNewRole, activeExperience, disableAddRole, onHeaderActionChange]);

  const handleAddNew = () => {
    setActiveExpId("new");
    setIsAddingNewRole(false);
    setViewMode("form");
    setHasVisitedList(true);
  };

  const handleEditItem = (exp: Experience) => {
    setActiveExpId(exp.experience_id);
    setIsAddingNewRole(false);
    setViewMode("form");
    setHasVisitedList(true);
  };

  useEffect(() => {
    if (viewMode === "list") {
      setHasVisitedList(true);
      onRegisterBackAction?.(null);
    }
  }, [viewMode, onRegisterBackAction]);

  const handleSaved = (id?: string) => {
    if (id) {
      setActiveExpId(id);
    }
    setIsAddingNewRole(false);
    onSuccess?.();
    // Retain user on the form page as required
  };

  const handleDeleted = () => {
    setIsAddingNewRole(false);
    onSuccess?.();
    if (!hasVisitedList) {
      onCancel?.();
    } else if (experiences.length <= 1) {
      setViewMode("form");
      setActiveExpId("new");
    } else {
      setViewMode("list");
    }
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
        if (experiences.length === 0) {
          onCancel?.();
          return;
        }
        if (isAddingNewRole) {
          setIsAddingNewRole(false);
        } else {
          if (!hasVisitedList) {
            onCancel?.();
          } else {
            setViewMode("list");
          }
        }
      }}
      onAddNew={handleAddNew}
      onSaved={handleSaved}
      onDeleted={handleDeleted}
      onRegisterBack={onRegisterBackAction}
      onDisableAddRole={(disabled) => setDisableAddRole(disabled)}
    />
  );
};

export default ProfileEditExperienceTab;
