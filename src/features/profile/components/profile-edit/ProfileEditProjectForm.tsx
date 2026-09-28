"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Plus, ExternalLink } from "lucide-react";
import { ProfileEditIcon, ProjectDocIcon } from "@/components/icons";
import { LeaveConfirmationModal } from "@/components/shared";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { toast } from "sonner";
import { ProfileEditField } from "./ProfileEditField";
import { ProfileEditDatePicker } from "./ProfileEditDatePicker";
import { ProfileEditSkillsPicker } from "./ProfileEditSkillsPicker";
import {
  ProjectLinkModal,
  ProjectMediaModal,
  type ProjectMediaModalData,
} from "./ProfileEditProjectModals";
import { useProjectMutations } from "@/hooks/use-my-profile";
import { uploadProjectMedia } from "@/services/api/profile";
import type { Project, ProjectMedia } from "@/types/entities";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

export interface ProjectFormData {
  project_id?: string;
  title: string;
  organization: string;
  details: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  skills: string[];
  media: ProjectMedia[];
  role: string;
  team_size: string;
  role_description: string;
}

const EMPTY_FORM: ProjectFormData = {
  title: "",
  organization: "",
  details: "",
  start_date: "",
  end_date: "",
  is_current: false,
  skills: [],
  media: [],
  role: "",
  team_size: "",
  role_description: "",
};

interface ProfileEditProjectFormProps {
  initialProject?: Project | null;
  onBackToList: () => void;
  onAddNew: () => void;
  onSaved: (id?: string) => void;
  onDeleted: () => void;
  onRegisterBack?: (fn: () => void) => void;
}

export const ProfileEditProjectForm: React.FC<ProfileEditProjectFormProps> = ({
  initialProject,
  onBackToList,
  onAddNew,
  onSaved,
  onDeleted,
  onRegisterBack,
}) => {
  const projMutations = useProjectMutations();
  const [formData, setFormData] = useState<ProjectFormData>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState<ProjectFormData | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Link dialog state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectMedia | null>(null);

  // Media Modal (image / document) state
  const [mediaModal, setMediaModal] = useState<ProjectMediaModalData | null>(null);

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let initialData: ProjectFormData;
    if (initialProject) {
      const startStr = initialProject.start_year
        ? `${initialProject.start_year}-${initialProject.start_month || "01"}-01`
        : "";
      const endStr = initialProject.end_year
        ? `${initialProject.end_year}-${initialProject.end_month || "01"}-01`
        : "";

      initialData = {
        project_id: initialProject.project_id,
        title: initialProject.title || "",
        organization: initialProject.organization || "",
        details: initialProject.details || "",
        start_date: startStr,
        end_date: endStr,
        is_current: initialProject.is_current || false,
        skills: initialProject.skills || [],
        media: initialProject.media || [],
        role: initialProject.role || "",
        team_size: initialProject.team_size || "",
        role_description: initialProject.role_description || "",
      };
    } else {
      initialData = EMPTY_FORM;
    }

    if (typeof window !== "undefined") {
      const draftKey = `profile_draft_proj_${initialProject?.project_id || "new"}`;
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Only use draft if it has the same ID or both are new
          if (parsed.project_id === initialData.project_id) {
            initialData = parsed;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    setFormData(initialData);
    setInitialSnapshot(initialData);
  }, [initialProject]);

  useEffect(() => {
    if (typeof window !== "undefined" && formData) {
      const draftKey = `profile_draft_proj_${initialProject?.project_id || "new"}`;
      // Clean out pendingFiles before storing since File objects can't be stringified properly
      const safeData = {
        ...formData,
        media: formData.media.map(({ pendingFile, ...rest }) => rest)
      };
      sessionStorage.setItem(draftKey, JSON.stringify(safeData));
    }
  }, [formData, initialProject]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      const draftKey = `profile_draft_proj_${initialProject?.project_id || "new"}`;
      sessionStorage.removeItem(draftKey);
    }
  }, [initialProject]);

  const isEditing = Boolean(formData.project_id);
  const hasLink = formData.media.some((item) => item.type === "link");


  // Handle File Selected for Media / Documents (Store locally, deferred upload on project save)
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "document") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    const defaultTitle = type === "image" ? file.name.replace(/\.[^/.]+$/, "") : file.name;

    if (mediaModal) {
      setMediaModal((prev) =>
        prev
          ? {
            ...prev,
            fileName: file.name,
            fileUrl: previewUrl,
            pendingFile: file,
            title: prev.title.trim() ? prev.title : defaultTitle,
          }
          : null
      );
    } else {
      if (formData.media.length >= 5) {
        toast.error("You can add a maximum of 5 media items");
        e.target.value = "";
        return;
      }
      setMediaModal({
        mode: "add",
        type: type,
        title: defaultTitle,
        fileName: file.name,
        fileUrl: previewUrl,
        pendingFile: file,
      });
    }
    e.target.value = "";
  };

  const handleRemoveMedia = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((m) => m.id !== id),
    }));
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Please enter a project title";
    }
    if (!formData.organization.trim()) {
      newErrors.organization = "Please enter an organization name";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Please select a start date";
    }
    if (!formData.is_current && !formData.end_date) {
      newErrors.end_date = "Please select an end date or mark project as ongoing";
    }
    if (!formData.is_current && formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date = "End date must be on or after start date";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (formData.media.length > 5) {
      toast.error("You can add a maximum of 5 media items");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload any pending files that were selected locally
      const uploadedMedia = await Promise.all(
        formData.media.map(async (item) => {
          if (item.pendingFile) {
            try {
              const res = await uploadProjectMedia(item.pendingFile);
              return {
                id: item.id,
                type: item.type,
                title: item.title,
                url: res.url || res.fileUrl || item.url,
                fileUrl: res.fileUrl || res.url || item.fileUrl,
                fileName: res.fileName || item.fileName,
              };
            } catch (err) {
              console.error("Failed to upload pending media:", err);
              return {
                id: item.id,
                type: item.type,
                title: item.title,
                url: item.url,
                fileUrl: item.fileUrl,
                fileName: item.fileName,
              };
            }
          }
          return {
            id: item.id,
            type: item.type,
            title: item.title,
            url: item.url,
            fileUrl: item.fileUrl,
            fileName: item.fileName,
          };
        })
      );

      const parsedStart = formData.start_date ? dayjs(formData.start_date) : null;
      const parsedEnd = formData.end_date ? dayjs(formData.end_date) : null;

      const payload: Partial<Project> = {
        title: formData.title.trim(),
        organization: formData.organization.trim(),
        details: formData.details.trim() || undefined,
        start_month: parsedStart?.isValid() ? String(parsedStart.month() + 1).padStart(2, "0") : "01",
        start_year: parsedStart?.isValid() ? String(parsedStart.year()) : String(new Date().getFullYear()),
        end_month: formData.is_current ? undefined : parsedEnd?.isValid() ? String(parsedEnd.month() + 1).padStart(2, "0") : undefined,
        end_year: formData.is_current ? undefined : parsedEnd?.isValid() ? String(parsedEnd.year()) : undefined,
        is_current: formData.is_current,
        skills: formData.skills,
        media: uploadedMedia,
        role: formData.role.trim() || undefined,
        team_size: formData.team_size.trim() || undefined,
        role_description: formData.role_description.trim() || undefined,
      };

      let savedId: string | undefined;

      if (isEditing && formData.project_id) {
        await projMutations.update.mutateAsync({
          id: formData.project_id,
          payload,
        });
        toast.success("Project updated successfully");
        setInitialSnapshot({ ...formData });
        savedId = formData.project_id;
      } else {
        const res: any = await projMutations.add.mutateAsync(payload);
        const newId = res?.project?.project_id || res?.project?.id || res?.data?.project_id || res?.data?.id;
        const updatedForm = { ...formData, ...(newId ? { project_id: newId } : {}) };
        if (newId) {
          setFormData(updatedForm);
          savedId = newId;
        }
        setInitialSnapshot(updatedForm);
        toast.success("Project added successfully");
      }
      clearDraft();
      onSaved(savedId);
    } catch (err: any) {
      console.error("Failed to save project:", err);
      toast.error(err?.response?.data?.message || "Failed to save project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !formData.project_id) {
      clearDraft();
      onBackToList();
      return;
    }

    setIsDeleting(true);
    try {
      await projMutations.remove.mutateAsync(formData.project_id);
      toast.success("Project deleted successfully");
      setShowDeleteModal(false);
      clearDraft();
      onDeleted();
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      toast.error(err?.response?.data?.message || "Failed to delete project");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    return (
      formData.title !== initialSnapshot.title ||
      formData.organization !== initialSnapshot.organization ||
      formData.details !== initialSnapshot.details ||
      formData.start_date !== initialSnapshot.start_date ||
      formData.end_date !== initialSnapshot.end_date ||
      formData.is_current !== initialSnapshot.is_current ||
      formData.role !== initialSnapshot.role ||
      formData.team_size !== initialSnapshot.team_size ||
      formData.role_description !== initialSnapshot.role_description ||
      JSON.stringify(formData.skills) !== JSON.stringify(initialSnapshot.skills) ||
      JSON.stringify(formData.media) !== JSON.stringify(initialSnapshot.media)
    );
  }, [formData, initialSnapshot]);

  const isRequiredFilled = Boolean(
    formData.title.trim() &&
    formData.organization.trim() &&
    formData.start_date &&
    (formData.is_current || Boolean(formData.end_date))
  );

  const canSubmit = isEditing
    ? hasChanges && isRequiredFilled && !isSaving && !isDeleting
    : isRequiredFilled && !isSaving && !isDeleting;

  const handleCancelClick = useCallback(() => {
    if (hasChanges) {
      setShowLeaveModal(true);
    } else {
      clearDraft();
      onBackToList();
    }
  }, [hasChanges, clearDraft, onBackToList]);

  useEffect(() => {
    const fn = () => handleCancelClick();
    (fn as any).hasChanges = hasChanges;
    onRegisterBack?.(fn);
  }, [onRegisterBack, handleCancelClick, hasChanges]);

  const mediaSectionRef = useRef<HTMLDivElement>(null);

  const isAllThreeAdded = Boolean(
    formData.media &&
    formData.media.length > 0 &&
    formData.role?.trim() &&
    formData.team_size?.trim()
  );

  return (
    <div className="w-full max-w-full inline-flex flex-col justify-start items-center gap-5 animate-in fade-in duration-200">
      {/* Strengthen your profile banner (Edit mode) */}
      {isEditing && !isAllThreeAdded && (
        <div className="w-full max-w-full min-h-[40px] px-[12px] py-[6px] bg-[var(--ds-surface-2)] rounded-[8px] flex flex-row items-center gap-[8px] shrink-0 self-stretch overflow-x-auto scrollbar-hide">
          <div className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex items-center shrink-0">
            Strengthen your profile:
          </div>

          {/* Button 1: Media (choose 1) */}
          <button
            type="button"
            onClick={() => mediaSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="h-[28px] px-[8px] py-[6px] rounded-[16px] flex flex-row items-center gap-[4px] bg-transparent hover:opacity-80 transition-opacity cursor-pointer focus:outline-none shrink-0"
          >
            <span
              className={cn(
                "font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-center transition-colors",
                formData.media && formData.media.length > 0
                  ? "text-[var(--ds-accent)]"
                  : "text-[var(--ds-text-primary)]"
              )}
            >
              Media (choose 1)
            </span>
          </button>

          {/* Button 2: Role in project */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("proj_role");
              el?.focus();
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="h-[28px] px-[8px] py-[6px] rounded-[16px] flex flex-row items-center gap-[4px] bg-transparent hover:opacity-80 transition-opacity cursor-pointer focus:outline-none shrink-0"
          >
            <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-center text-[var(--ds-text-primary)] transition-colors">
              Role in project
            </span>
          </button>

          {/* Button 3: Team */}
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("proj_team_size");
              el?.focus();
              el?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="h-[28px] px-[8px] py-[6px] rounded-[16px] flex flex-row items-center gap-[4px] bg-transparent hover:opacity-80 transition-opacity cursor-pointer focus:outline-none shrink-0"
          >
            <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-center text-[var(--ds-text-primary)] transition-colors">
              Team
            </span>
          </button>
        </div>
      )}

      {/* Main Form Fields Container (Frame 2609638) */}
      <div className="self-stretch flex flex-col justify-start items-start gap-10">
        {/* Row 1: Project title & Created for (Frame 2609661) */}
        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-5 sm:gap-10">
          <div className="w-full sm:w-[300px] flex-1 inline-flex flex-col justify-start items-end gap-2">
            <ProfileEditField
              id="proj_title"
              label="Project title"
              placeholder="e.g. Website Redesign"
              value={formData.title}
              maxLength={255}
              maxLengthMessage="Project title cannot exceed 255 characters"
              showCounter={true}
              error={errors.title}
              onChange={(val) => {
                setFormData((prev) => ({ ...prev, title: val }));
                setErrors((prev) => ({ ...prev, title: "" }));
              }}
            />
          </div>
          <div className="w-full sm:w-[300px] flex-1 inline-flex flex-col justify-start items-end gap-2">
            <ProfileEditField
              id="proj_org"
              label="Created for"
              placeholder="e.g. Acme Inc."
              value={formData.organization}
              maxLength={255}
              showCounter={true}
              error={errors.organization}
              onChange={(val) => {
                setFormData((prev) => ({ ...prev, organization: val }));
                setErrors((prev) => ({ ...prev, organization: "" }));
              }}
            />
          </div>
        </div>

        {/* Row 2: Project details (Frame 2609662) */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <ProfileEditField
            id="proj_details"
            label="Project details"
            isTextarea={true}
            maxLength={500}
            showCounter={true}
            placeholder="Briefly describe the project and its goals"
            value={formData.details}
            onChange={(val) => setFormData((prev) => ({ ...prev, details: val }))}
          />
        </div>

        {/* Row 3: Start date & End date + Checkbox (Frame 2609658) */}
        <div className="self-stretch flex flex-col justify-start items-start gap-5">
          <div className="self-stretch flex flex-col sm:flex-row justify-start sm:items-center gap-5 sm:gap-10">
            <div className="w-full sm:w-[300px] flex-1">
              <ProfileEditDatePicker
                id="proj_start_date"
                label="Start date"
                value={formData.start_date}
                placeholder="Select"
                error={errors.start_date}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, start_date: val }));
                  setErrors((prev) => ({ ...prev, start_date: "" }));
                }}
              />
            </div>
            {!formData.is_current && (
              <div className="w-full sm:w-[300px] flex-1">
                <ProfileEditDatePicker
                  id="proj_end_date"
                  label="End date"
                  value={formData.end_date}
                  placeholder="Select"
                  error={errors.end_date}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, end_date: val }));
                    setErrors((prev) => ({ ...prev, end_date: "" }));
                  }}
                />
              </div>
            )}
          </div>

          {/* Checkbox (16x16, 4px rounded, 8px gap) */}
          <div
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                is_current: !prev.is_current,
                end_date: !prev.is_current ? "" : prev.end_date,
              }))
            }
            className="inline-flex justify-start items-center gap-2 cursor-pointer select-none group focus:outline-none"
            role="checkbox"
            aria-checked={formData.is_current}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-[4px] inline-flex items-center justify-center border transition-colors shrink-0",
                formData.is_current
                  ? "bg-[var(--ds-accent)] border-[var(--ds-accent)]"
                  : "bg-[var(--ds-surface-1)] border-[var(--ds-border)] group-hover:border-[var(--ds-text-secondary)]"
              )}
            >
              {formData.is_current && (
                <svg className="w-3 h-3 stroke-white stroke-[2.5]" viewBox="0 0 24 24" fill="none">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="justify-start text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
              I&apos;m currently working on this project
            </div>
          </div>
        </div>

        {/* Row 4: Skills used (Dropdown + Selected Tag Pills) */}
        <div className="self-stretch flex flex-col justify-start items-start gap-5">
          <ProfileEditSkillsPicker
            label="Skills used"
            placeholder="Search and add skills (e.g. Figma, Project Management)"
            selectedSkills={formData.skills}
            onChange={(skills) => setFormData((prev) => ({ ...prev, skills }))}
          />
        </div>

        {/* Row 5: Media (Max 5) (Frame 2609691 & Frame 2609664) */}
        <div ref={mediaSectionRef} className="self-stretch flex flex-col justify-center items-start gap-2.5">
          {/* Media Header (Frame 2609691) */}
          <div className="inline-flex justify-start items-start gap-2.5">
            <div className="justify-start text-[var(--ds-text-secondary)] text-xs font-bold font-['DM_Sans'] leading-4">
              Media
            </div>
            <div className="justify-start text-[var(--ds-text-secondary)] text-xs font-bold font-['DM_Sans'] leading-4">
              (Max 5)
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={mediaInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelected(e, "image")}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFileSelected(e, "document")}
          />

          {/* Media Action Pills (Frame 2609664) */}
          <div className="flex flex-row items-center p-0 gap-[10px] min-h-[36px] h-auto flex-wrap">
            <button
              type="button"
              disabled={hasLink || formData.media.length >= 5}
              onClick={() => {
                if (formData.media.length >= 5) {
                  toast.error("You can add a maximum of 5 media items");
                  return;
                }
                setIsLinkModalOpen(true);
              }}
              className={cn(
                "w-[111px] h-[36px] px-[12px] py-[6px] rounded-[100px] border border-[var(--ds-border)] flex flex-row justify-center items-center gap-[10px] flex-none order-0 grow-0 transition-all focus:outline-none",
                hasLink || formData.media.length >= 5
                  ? "opacity-40 cursor-default"
                  : "hover:bg-[var(--ds-surface-1)] active:scale-95 cursor-pointer"
              )}
            >
              <Plus className="size-4 text-[var(--ds-text-primary)] shrink-0" />
              <span className="justify-start text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 whitespace-nowrap">
                Add link
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (formData.media.length >= 5) {
                  toast.error("You can add a maximum of 5 media items");
                  return;
                }
                mediaInputRef.current?.click();
              }}
              className="h-[36px] px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-95 flex justify-center items-center gap-[10px] transition-all cursor-pointer focus:outline-none shrink-0"
            >
              <Plus className="size-4 text-[var(--ds-text-primary)] shrink-0" />
              <span className="justify-start text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
                Add media
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (formData.media.length >= 5) {
                  toast.error("You can add a maximum of 5 media items");
                  return;
                }
                docInputRef.current?.click();
              }}
              className="h-[36px] px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-95 flex justify-center items-center gap-[10px] transition-all cursor-pointer focus:outline-none shrink-0"
            >
              <Plus className="size-4 text-[var(--ds-text-primary)] shrink-0" />
              <span className="justify-start text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
                Add document
              </span>
            </button>
          </div>

          {/* Render Attached Media Items */}
          {formData.media.length > 0 && (
            <div className="self-stretch flex flex-col gap-2.5 pt-2">
              {formData.media.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.type === "link") {
                      setEditingLink(item);
                    } else {
                      setMediaModal({
                        mode: "edit",
                        type: item.type as "image" | "document",
                        id: item.id,
                        title: item.title,
                        fileName: item.fileName,
                        fileUrl: item.url || item.fileUrl,
                        pendingFile: item.pendingFile,
                      });
                    }
                  }}
                  className="self-stretch inline-flex justify-between items-center py-1 hover:bg-[var(--ds-surface-1)]/40 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="flex justify-start items-center gap-2.5 min-w-0">
                    {/* Media Thumbnail (w-20 h-10 bg-[var(--ds-surface-1)] rounded-lg) */}
                    <div className="w-20 h-10 bg-[var(--ds-surface-1)] border border-[var(--ds-border)] rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                      {item.type === "image" && (item.url || item.fileUrl) ? (
                        <img
                          src={item.url || item.fileUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : item.type === "document" ? (
                        <ProjectDocIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
                      ) : (
                        <ExternalLink className="size-5 text-[var(--ds-text-primary)]" />
                      )}
                    </div>

                    <div className="inline-flex flex-col justify-center items-start gap-0.5 min-w-0">
                      <div className="text-left justify-start text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4 truncate max-w-[340px]">
                        {item.title || item.fileName || item.url}
                      </div>
                      <div className="text-left justify-start text-[var(--ds-text-muted)] text-[10px] font-normal font-['DM_Sans'] leading-3 capitalize">
                        {item.type === "image" ? "Media" : item.type === "document" ? "Document" : "Link"}
                      </div>
                    </div>
                  </div>

                  {/* Edit Pencil Icon Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.type === "link") {
                        setEditingLink(item);
                      } else {
                        setMediaModal({
                          mode: "edit",
                          type: item.type as "image" | "document",
                          id: item.id,
                          title: item.title,
                          fileName: item.fileName,
                          fileUrl: item.url || item.fileUrl,
                          pendingFile: item.pendingFile,
                        });
                      }
                    }}
                    className="size-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
                    aria-label="Edit media item"
                  >
                    <ProfileEditIcon className="size-5 text-[var(--ds-text-primary)]" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 6: Role in project & Team size (Frame 2609663) */}
        <div className="self-stretch flex flex-col sm:flex-row justify-start items-start gap-5 sm:gap-10">
          <div className="w-full sm:w-[300px] flex-1 inline-flex flex-col justify-start items-end gap-2">
            <ProfileEditField
              id="proj_role"
              label="Role in project"
              placeholder="e.g. Lead Product Designer"
              maxLength={100}
              value={formData.role}
              onChange={(val) => setFormData((prev) => ({ ...prev, role: val }))}
            />
          </div>
          <div className="w-full sm:w-[300px] flex-1 inline-flex flex-col justify-start items-end gap-2">
            <ProfileEditField
              id="proj_team_size"
              label="Team size"
              placeholder="e.g. 5"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              value={formData.team_size}
              onChange={(val) => {
                const numericOnly = val.replace(/\D/g, "");
                setFormData((prev) => ({ ...prev, team_size: numericOnly }));
              }}
            />
          </div>
        </div>

        {/* Row 7: Role description (Frame 2609640) */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <ProfileEditField
            id="proj_role_description"
            label="Role description"
            isTextarea={true}
            maxLength={500}
            showCounter={true}
            placeholder="Describe your responsibilities and contributions"
            value={formData.role_description}
            onChange={(val) => setFormData((prev) => ({ ...prev, role_description: val }))}
          />
        </div>
      </div>

      {/* Action Buttons: Add/Save and Cancel/Delete */}
      <div className="inline-flex justify-center items-start gap-2 pt-2 pb-8">
        {isEditing ? (
          <>
            <button
              type="button"
              disabled={!canSubmit || isSaving || isDeleting}
              onClick={handleSave}
              className={cn(
                "min-w-[80px] px-4 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-all focus:outline-none",
                !canSubmit || isSaving || isDeleting
                  ? "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-80"
                  : "bg-[var(--ds-accent)] text-[var(--ds-text-primary)] hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
              )}
            >
              <div className="justify-start text-base font-medium font-['DM_Sans'] leading-6">
                {isSaving ? "Saving..." : "Save"}
              </div>
            </button>

            <button
              type="button"
              disabled={isDeleting || isSaving}
              onClick={() => setShowDeleteModal(true)}
              className="min-w-[80px] px-4 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-95 flex justify-center items-center gap-2.5 transition-all cursor-pointer focus:outline-none disabled:opacity-50"
            >
              <div className="justify-start text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
                {isDeleting ? "Deleting..." : "Delete"}
              </div>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={!canSubmit || isSaving}
              onClick={handleSave}
              className={cn(
                "min-w-[80px] px-4 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-all focus:outline-none",
                !canSubmit || isSaving
                  ? "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-80"
                  : "bg-[var(--ds-accent)] text-[var(--ds-text-primary)] hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
              )}
            >
              <div className="justify-start text-base font-medium font-['DM_Sans'] leading-6">
                {isSaving ? "Adding..." : "Add"}
              </div>
            </button>

            <button
              type="button"
              onClick={handleCancelClick}
              className="min-w-[80px] px-4 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-95 flex justify-center items-center gap-2.5 transition-all cursor-pointer focus:outline-none"
            >
              <div className="justify-start text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
                Cancel
              </div>
            </button>
          </>
        )}
      </div>

      {/* Discard Confirmation Modal */}
      <LeaveConfirmationModal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave without saving?"
        description="Your changes will be lost"
        confirmText="Stay"
        cancelText="Leave"
        onConfirm={() => {
          clearDraft();
          setShowLeaveModal(false);
          onBackToList();
        }}
      />

      {/* Add Link Modal */}
      <ProjectLinkModal
        isOpen={isLinkModalOpen}
        mode="add"
        onClose={() => setIsLinkModalOpen(false)}
        onConfirm={(title, url) => {
          if (formData.media.some((item) => item.type === "link")) {
            toast.error("You can add only 1 link");
            return;
          }
          if (formData.media.length >= 5) {
            toast.error("You can add a maximum of 5 media items");
            return;
          }
          const newLink: ProjectMedia = {
            id:
              typeof crypto !== "undefined" && crypto.randomUUID
                ? crypto.randomUUID()
                : String(Date.now()),
            type: "link",
            title,
            url,
          };
          setFormData((prev) => ({
            ...prev,
            media: [...prev.media, newLink],
          }));
          setIsLinkModalOpen(false);
          toast.success("Link added to project");
        }}
      />

      {/* Edit Link Modal */}
      <ProjectLinkModal
        isOpen={Boolean(editingLink)}
        mode="edit"
        initialTitle={editingLink?.title}
        initialUrl={editingLink?.url}
        onClose={() => setEditingLink(null)}
        onConfirm={(title, url) => {
          if (editingLink) {
            setFormData((prev) => ({
              ...prev,
              media: prev.media.map((m) =>
                m.id === editingLink.id ? { ...m, title, url } : m
              ),
            }));
            setEditingLink(null);
            toast.success("Link updated");
          }
        }}
        onDelete={() => {
          if (editingLink) {
            handleRemoveMedia(editingLink.id);
            setEditingLink(null);
          }
        }}
      />

      {/* Media / Document Modal */}
      <ProjectMediaModal
        modalData={mediaModal}
        onClose={() => setMediaModal(null)}
        onConfirm={(data) => {
          if (data.mode === "add") {
            if (formData.media.length >= 5) {
              toast.error("You can add a maximum of 5 media items");
              return;
            }
            const newItem: ProjectMedia = {
              id:
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : String(Date.now()),
              type: data.type,
              title: data.title,
              fileName: data.fileName,
              url: data.fileUrl,
              fileUrl: data.fileUrl,
              pendingFile: data.pendingFile,
            };
            setFormData((prev) => ({
              ...prev,
              media: [...prev.media, newItem],
            }));
            toast.success(`${data.type === "image" ? "Media" : "Document"} added to project`);
          } else {
            setFormData((prev) => ({
              ...prev,
              media: prev.media.map((m) => {
                if (m.id === data.id) {
                  return {
                    ...m,
                    title: data.title,
                    fileName: data.fileName || m.fileName,
                    url: data.fileUrl || m.url,
                    fileUrl: data.fileUrl || m.fileUrl,
                    pendingFile: data.pendingFile || m.pendingFile,
                  };
                }
                return m;
              }),
            }));
            toast.success(`${data.type === "image" ? "Media" : "Document"} updated`);
          }
          setMediaModal(null);
        }}
        onDelete={(id) => {
          handleRemoveMedia(id);
          setMediaModal(null);
        }}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ProfileEditProjectForm;


