"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { AddIcon } from "@/components/icons";
import { LeaveConfirmationModal } from "@/components/shared";
import { DeleteConfirmationModal } from "@/components/shared/DeleteConfirmationModal";
import { ProfileEditField } from "./ProfileEditField";
import { ProfileEditDropdown } from "./ProfileEditDropdown";
import { ProfileEditSearchableDropdown } from "./ProfileEditSearchableDropdown";
import { ProfileEditLocationInput } from "./ProfileEditLocationInput";
import { ProfileEditDatePicker } from "./ProfileEditDatePicker";
import { ProfileEditSkillsPicker } from "./ProfileEditSkillsPicker";
import { useExperienceMutations, useSkillMutations } from "@/hooks/use-my-profile";
import { getCompanyList } from "@/services/api/onboarding";
import type { Experience } from "@/types/entities";
import { cn } from "@/lib/utils";

const WORK_TYPES = ["Full time", "Part-time", "Internship", "Freelance", "Contract"];
const WORK_MODES = ["Remote", "Hybrid", "On-site"];

export interface ExperienceFormData {
  experience_id?: string;
  title: string;
  company_name: string;
  location: string;
  work_type: string;
  work_mode: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  skills: string[];
  description: string;
}

const EMPTY_FORM: ExperienceFormData = {
  title: "",
  company_name: "",
  location: "",
  work_type: "",
  work_mode: "",
  start_date: "",
  end_date: "",
  is_current: false,
  skills: [],
  description: "",
};

interface ProfileEditExperienceFormProps {
  initialExperience?: Experience | null;
  previousRoleTitle?: string;
  isInitialAdd?: boolean;
  isAddingNewRole?: boolean;
  onToggleAddNewRole?: (adding: boolean) => void;
  onBackToList: () => void;
  onAddNew?: () => void;
  onSaved: (id?: string) => void;
  onDeleted: () => void;
  onRegisterBack?: (fn: () => void) => void;
  onDisableAddRole?: (disabled: boolean) => void;
  allExperiences?: Experience[];
}

const extractSkills = (exp: any): string[] => {
  if (!exp) return [];
  const rawSkills =
    exp.skills ??
    exp.experience_skills ??
    exp.skills_used ??
    exp.skill_names ??
    exp.skillsUsed ??
    [];

  if (Array.isArray(rawSkills)) {
    return rawSkills
      .map((s: any) => {
        if (typeof s === "string") return s.trim();
        if (typeof s === "object" && s !== null) {
          return (s.name || s.skill_name || s.label || s.title || s.skill || "").trim();
        }
        return "";
      })
      .filter((s: string) => s.length > 0);
  }

  if (typeof rawSkills === "string") {
    try {
      const parsed = JSON.parse(rawSkills);
      if (Array.isArray(parsed)) {
        return extractSkills({ skills: parsed });
      }
    } catch {
      return rawSkills.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }

  return [];
};

export const ProfileEditExperienceForm: React.FC<ProfileEditExperienceFormProps> = ({
  initialExperience,
  previousRoleTitle,
  isInitialAdd = false,
  isAddingNewRole = false,
  onToggleAddNewRole,
  onBackToList,
  onAddNew,
  onSaved,
  onDeleted,
  onRegisterBack,
  onDisableAddRole,
  allExperiences = [],
}) => {
  const expMutations = useExperienceMutations();
  const skillMutations = useSkillMutations();
  const [formData, setFormData] = useState<ExperienceFormData>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState<ExperienceFormData | null>(null);
  const [endCurrentRole, setEndCurrentRole] = useState(true);
  const [initialEndCurrentRole, setInitialEndCurrentRole] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let initialData: ExperienceFormData;
    let initialEnd = false;

    if (isAddingNewRole && initialExperience) {
      initialData = {
        title: "",
        company_name: initialExperience.company_name || "",
        location: initialExperience.location || "",
        work_type: "",
        work_mode: "",
        start_date: "",
        end_date: "",
        is_current: false,
        skills: [],
        description: "",
      };
      initialEnd = false;
    } else if (initialExperience) {
      initialData = {
        experience_id: initialExperience.experience_id || (initialExperience as any).id,
        title: initialExperience.title || "",
        company_name: initialExperience.company_name || "",
        location: initialExperience.location || "",
        work_type: initialExperience.work_type || "",
        work_mode: initialExperience.work_mode || "",
        start_date: initialExperience.start_date || "",
        end_date: initialExperience.end_date || "",
        is_current: initialExperience.is_current ?? false,
        skills: extractSkills(initialExperience),
        description: initialExperience.description || "",
      };
      initialEnd = false;
    } else {
      initialData = EMPTY_FORM;
      initialEnd = false;
    }

    if (typeof window !== "undefined") {
      const draftKey = `profile_draft_exp_${initialExperience?.experience_id || "new"}`;
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Only use draft if it has the same ID or both are new
          if (parsed.experience_id === initialData.experience_id) {
            initialData = parsed;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    setFormData(initialData);
    setInitialSnapshot(initialData);
    setEndCurrentRole(initialEnd);
    setInitialEndCurrentRole(initialEnd);
  }, [initialExperience, isAddingNewRole]);

  // Real-time date and conflict validation
  useEffect(() => {
    setErrors((prev) => {
      const newErrors = { ...prev };

      // Clear previous validation errors from this hook
      if (newErrors.start_date === "Date cannot be in the future" || newErrors.start_date === "The new role's start date cannot be before the current role's start date.") delete newErrors.start_date;
      if (newErrors.end_date === "End date must be on or after start date" || newErrors.end_date === "Date cannot be in the future") delete newErrors.end_date;
      if (newErrors.title === "This role already exists on your profile") delete newErrors.title;
      if (newErrors.company_name === "This role already exists on your profile") delete newErrors.company_name;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = formData.start_date ? new Date(formData.start_date) : null;
      const end = formData.end_date ? new Date(formData.end_date) : null;

      // 1. Future date check
      if (start && start > today) {
        newErrors.start_date = "Date cannot be in the future";
      }
      if (!formData.is_current && end && end > today) {
        newErrors.end_date = "Date cannot be in the future";
      }

      // 2. Start vs End date check
      if (!formData.is_current && start && end && end < start) {
        newErrors.end_date = "End date must be on or after start date";
      }

      // 3. Duplicate Role Check
      const title = formData.title.trim().toLowerCase();
      const rawCompany = formData.company_name.trim() || (isAddingNewRole && initialExperience ? initialExperience.company_name : "");
      const company = (rawCompany || "").toLowerCase();
      if (title && company) {
        const isDuplicate = allExperiences.some(
          (e) =>
            e.experience_id !== formData.experience_id &&
            e.title?.toLowerCase().trim() === title &&
            e.company_name?.toLowerCase().trim() === company
        );
        if (isDuplicate) {
          newErrors.title = "This role already exists on your profile";
          newErrors.company_name = "This role already exists on your profile";
        }
      }

      // 4. Sequential Roles Check
      if (isAddingNewRole && endCurrentRole && start && initialExperience?.start_date) {
        const oldStart = new Date(initialExperience.start_date);
        oldStart.setHours(0, 0, 0, 0);
        if (start < oldStart) {
          newErrors.start_date = "The new role's start date cannot be before the current role's start date.";
        }
      }

      return newErrors;
    });
  }, [
    formData.start_date,
    formData.end_date,
    formData.is_current,
    formData.work_type,
    formData.work_mode,
    formData.title,
    formData.company_name,
    formData.experience_id,
    allExperiences,
    isAddingNewRole,
    endCurrentRole,
    initialExperience,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined" && formData) {
      const draftKey = `profile_draft_exp_${initialExperience?.experience_id || "new"}`;
      sessionStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, initialExperience]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      const draftKey = `profile_draft_exp_${initialExperience?.experience_id || "new"}`;
      sessionStorage.removeItem(draftKey);
    }
  }, [initialExperience]);

  const isEditing = Boolean(
    !isInitialAdd &&
    !isAddingNewRole &&
    (formData.experience_id || initialExperience?.experience_id || (initialExperience as any)?.id)
  );

  // Backend API Loaders for Role and Organization
  const loadRoles = useCallback(async (search: string) => {
    try {
      const res = await getCompanyList("", search);
      const raw = res.titles || [];
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      for (const title of raw) {
        const trimmed = title?.trim();
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          deduplicated.push(trimmed);
        }
      }
      return deduplicated;
    } catch {
      return [];
    }
  }, []);

  const loadCompanies = useCallback(async (search: string) => {
    try {
      const res = await getCompanyList(search, "");
      const raw = res.companies || [];
      const seen = new Set<string>();
      const deduplicated: { id: string; label: string }[] = [];
      for (const c of raw) {
        const name = c.name?.trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          deduplicated.push({ id: name, label: name });
        }
      }
      return deduplicated;
    } catch {
      return [];
    }
  }, []);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Please enter a role title";
    }
    const company = formData.company_name.trim() || initialExperience?.company_name || "";
    if (!company) {
      newErrors.company_name = "Please enter an organization name";
    }
    if (!formData.work_type) {
      newErrors.work_type = "Please select a work type";
    }
    if (!formData.work_mode) {
      newErrors.work_mode = "Please select a work mode";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Please select a start date";
    }
    if (!formData.is_current && !formData.end_date) {
      newErrors.end_date = "Please select an end date or check present";
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = formData.start_date ? new Date(formData.start_date) : null;
    const end = formData.end_date ? new Date(formData.end_date) : null;

    if (start && start > today) {
      newErrors.start_date = "Date cannot be in the future";
    }
    if (!formData.is_current && end && end > today) {
      newErrors.end_date = "Date cannot be in the future";
    }

    if (!formData.is_current && formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        newErrors.end_date = "End date must be on or after start date";
      }
    }

    if (isAddingNewRole && endCurrentRole && start && initialExperience?.start_date) {
      const oldStart = new Date(initialExperience.start_date);
      oldStart.setHours(0, 0, 0, 0);
      if (start < oldStart) {
        newErrors.start_date = "The new role's start date cannot be before the current role's start date.";
      }
    }


    const titleLower = formData.title.trim().toLowerCase();
    const companyLower = company.trim().toLowerCase();
    if (titleLower && companyLower) {
      const isDuplicate = allExperiences.some(
        (e) =>
          e.experience_id !== formData.experience_id &&
          e.title?.toLowerCase().trim() === titleLower &&
          e.company_name?.toLowerCase().trim() === companyLower
      );
      if (isDuplicate) {
        newErrors.title = "This role already exists on your profile";
        newErrors.company_name = "This role already exists on your profile";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        company_name: company,
        org_id: (initialExperience as any)?.org_id || null,
        location: formData.location.trim() || null,
        work_type: formData.work_type || null,
        work_mode: formData.work_mode || null,
        start_date: formData.start_date,
        end_date: formData.is_current ? null : formData.end_date || null,
        is_current: formData.is_current,
        description: formData.description.trim() || null,
        skills: formData.skills,
        ...(isAddingNewRole && initialExperience
          ? {
            end_current_role: endCurrentRole,
            end_current_role_id: initialExperience.experience_id,
          }
          : {}),
      };

      let savedId: string | undefined;

      if (isEditing && formData.experience_id) {
        await expMutations.update.mutateAsync({
          id: formData.experience_id,
          payload,
        });
        toast.success("Experience updated successfully");
        setInitialSnapshot({ ...formData });
        savedId = formData.experience_id;
      } else {
        const res: any = await expMutations.add.mutateAsync(payload);
        const newId = res?.experience?.experience_id || res?.experience?.id || res?.data?.experience_id || res?.data?.id;
        const updatedForm = { ...formData, ...(newId ? { experience_id: newId } : {}) };
        if (newId) {
          setFormData(updatedForm);
          savedId = newId;
        }
        setInitialSnapshot(updatedForm);
        toast.success(isAddingNewRole ? "New role added successfully" : "Experience added successfully");
      }

      // Persist skills to profile if any were selected
      if (formData.skills && formData.skills.length > 0) {
        try {
          await skillMutations.add.mutateAsync({ name: formData.skills });
        } catch {
          // ignore duplicate skill add errors
        }
      }

      clearDraft();
      onSaved(savedId);
    } catch (err: any) {
      console.error("Failed to save experience:", err);
      toast.error(err?.response?.data?.message || "Failed to save experience");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const expId = formData.experience_id || initialExperience?.experience_id || (initialExperience as any)?.id;
    if (!isEditing || !expId) {
      clearDraft();
      onBackToList();
      return;
    }

    setIsDeleting(true);
    try {
      await expMutations.remove.mutateAsync(expId);
      toast.success("Experience deleted successfully");
      setShowDeleteModal(false);
      clearDraft();
      onDeleted();
      onBackToList();
    } catch (err: any) {
      console.error("Failed to delete experience:", err);
      toast.error(err?.response?.data?.message || "Failed to delete experience");
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    const formFieldsChanged =
      formData.title !== initialSnapshot.title ||
      formData.company_name !== initialSnapshot.company_name ||
      formData.location !== initialSnapshot.location ||
      formData.work_type !== initialSnapshot.work_type ||
      formData.work_mode !== initialSnapshot.work_mode ||
      formData.start_date !== initialSnapshot.start_date ||
      formData.end_date !== initialSnapshot.end_date ||
      formData.is_current !== initialSnapshot.is_current ||
      formData.description !== initialSnapshot.description ||
      JSON.stringify(formData.skills) !== JSON.stringify(initialSnapshot.skills);
    const endRoleChanged = isAddingNewRole && endCurrentRole !== initialEndCurrentRole;
    return formFieldsChanged || endRoleChanged;
  }, [formData, initialSnapshot, isAddingNewRole, endCurrentRole, initialEndCurrentRole]);

  const hasCompany = Boolean(formData.company_name.trim() || initialExperience?.company_name || previousRoleTitle);
  const isRequiredFilled = Boolean(
    formData.title.trim() &&
    (hasCompany || isAddingNewRole) &&
    formData.start_date &&
    (formData.is_current || Boolean(formData.end_date))
  );

  const hasNoErrors = Object.values(errors).filter(Boolean).length === 0;

  const canSubmit = isEditing
    ? hasChanges && isRequiredFilled && hasNoErrors && !isSaving && !isDeleting
    : isRequiredFilled && hasNoErrors && !isSaving && !isDeleting;

  const currentRoleName = initialExperience?.title || previousRoleTitle || "";

  useEffect(() => {
    // Disable adding a new role if the form has unsaved changes, is currently saving/deleting, or lacks required fields like company
    const disabled = hasChanges || isSaving || isDeleting || !hasCompany || !isRequiredFilled;
    onDisableAddRole?.(disabled);
  }, [hasChanges, isSaving, isDeleting, hasCompany, isRequiredFilled, onDisableAddRole]);

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

  return (
    <div className="w-full max-w-[640px] flex flex-col items-center gap-[40px] p-0 animate-in fade-in duration-200">
      {/* Form Fields Container (640px width, gap 40px) */}
      <div className="w-full flex flex-col items-start gap-[40px] p-0">
        {/* Row 1: Role / New role & Organization / Location */}
        {isAddingNewRole ? (
          /* Add New Role Layout: New role + Location in Row 1 */
          <div className="w-full flex flex-row items-start gap-[40px]">
            <div className="w-[300px] flex-none flex flex-col gap-2.5">
              <ProfileEditSearchableDropdown
                id="exp_new_role"
                label="New role"
                placeholder="Select"
                value={formData.title}
                loadOptions={loadRoles}
                error={errors.title}
                onSelect={(val) => {
                  setFormData((prev) => ({ ...prev, title: val }));
                  setErrors((prev) => ({ ...prev, title: "" }));
                }}
                maxLength={100}
                maxLengthMessage="Role cannot exceed 100 characters"
                labelClassName="w-[49px] h-[16px] text-center"
              />

              {/* Checkbox: End current role as "RoleName" */}
              {currentRoleName && (
                <div
                  onClick={() => setEndCurrentRole((prev) => !prev)}
                  className="inline-flex justify-start items-center gap-2 cursor-pointer select-none group focus:outline-none pt-1"
                  role="checkbox"
                  aria-checked={endCurrentRole}
                >
                  <div
                    className={cn(
                      "size-4 rounded-sm inline-flex items-center justify-center border transition-colors shrink-0",
                      endCurrentRole
                        ? "bg-[var(--ds-accent)] border-[var(--ds-accent)]"
                        : "bg-[var(--ds-surface-1)] border-[var(--ds-border)] group-hover:border-[var(--ds-text-secondary)]"
                    )}
                  >
                    {endCurrentRole && (
                      <svg className="w-3 h-3 stroke-white stroke-[2.5]" viewBox="0 0 24 24" fill="none">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="justify-start text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
                    End current role as &quot;{currentRoleName}&quot;
                  </div>
                </div>
              )}
            </div>

            <div className="w-[300px] flex-none">
              <ProfileEditLocationInput
                value={formData.location}
                onChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
                className="w-[300px]"
              />
            </div>
          </div>
        ) : (
          /* Standard Edit/Add Layout: Role + Organization in Row 1 */
          <>
            <div className="w-full flex flex-row items-center gap-[40px]">
              <div className="w-[300px] flex-none">
                <ProfileEditSearchableDropdown
                  id="exp_role"
                  label="Role"
                  placeholder="Select"
                  value={formData.title}
                  loadOptions={loadRoles}
                  error={errors.title}
                  onSelect={(val) => {
                    setFormData((prev) => ({ ...prev, title: val }));
                    setErrors((prev) => ({ ...prev, title: "" }));
                  }}
                  maxLength={100}
                  maxLengthMessage="Role cannot exceed 100 characters"
                  labelClassName="w-[24px] h-[16px] text-center"
                />
              </div>
              <div className="w-[300px] flex-none">
                <ProfileEditSearchableDropdown
                  id="exp_org"
                  label="Organization"
                  placeholder="Select"
                  value={formData.company_name}
                  loadOptions={loadCompanies}
                  error={errors.company_name}
                  onSelect={(val) => {
                    setFormData((prev) => ({ ...prev, company_name: val }));
                    setErrors((prev) => ({ ...prev, company_name: "" }));
                  }}
                  labelClassName="w-[72px] h-[16px] text-center"
                />
              </div>
            </div>

            {/* Row 2: Location (Full Width: 640px) */}
            <div className="w-full max-w-[640px]">
              <ProfileEditLocationInput
                value={formData.location}
                onChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
                className="w-full max-w-[640px]"
              />
            </div>
          </>
        )}

        {/* Row 3: Work type & Work mode (640px width, 40px gap, 300px each) */}
        <div className="w-full flex flex-row items-center gap-[40px]">
          <div className="w-[300px] flex-none">
            <ProfileEditDropdown
              label="Work type"
              value={formData.work_type}
              options={WORK_TYPES}
              placeholder="Select"
              error={errors.work_type}
              onSelect={(val) => {
                setFormData((prev) => ({ ...prev, work_type: val }));
                setErrors((prev) => ({ ...prev, work_type: "" }));
              }}
              labelClassName="w-[59px] h-[16px] text-center"
            />
          </div>
          <div className="w-[300px] flex-none">
            <ProfileEditDropdown
              label="Work mode"
              value={formData.work_mode}
              options={WORK_MODES}
              placeholder="Select"
              error={errors.work_mode}
              onSelect={(val) => {
                setFormData((prev) => ({ ...prev, work_mode: val }));
                setErrors((prev) => ({ ...prev, work_mode: "" }));
              }}
              labelClassName="w-[66px] h-[16px] text-center"
            />
          </div>
        </div>

        {/* Row 4: Date Section (640px width, 20px vertical gap) */}
        <div className="w-full max-w-[640px] flex flex-col items-start gap-[20px] p-0">
          <div className="w-full flex flex-row items-center gap-[40px]">
            <div className="w-[300px] flex-none">
              <ProfileEditDatePicker
                id="exp_start_date"
                label="Start date"
                value={formData.start_date}
                placeholder="Select"
                error={errors.start_date}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, start_date: val }));
                  setErrors((prev) => ({ ...prev, start_date: "" }));
                }}
                labelClassName="w-[57px] h-[16px] text-center"
              />
            </div>
            {!formData.is_current ? (
              <div className="w-[300px] flex-none">
                <ProfileEditDatePicker
                  id="exp_end_date"
                  label="End date"
                  value={formData.end_date}
                  placeholder="Select"
                  error={errors.end_date}
                  onChange={(val) => {
                    setFormData((prev) => ({ ...prev, end_date: val }));
                    setErrors((prev) => ({ ...prev, end_date: "" }));
                  }}
                  labelClassName="w-[51px] h-[16px] text-center"
                />
              </div>
            ) : (
              <div className="w-[300px] flex-none" />
            )}
          </div>

          {/* Checkbox: I currently work here */}
          <div
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                is_current: !prev.is_current,
                end_date: !prev.is_current ? "" : prev.end_date,
              }))
            }
            className="flex flex-row items-center gap-[8px] h-[16px] cursor-pointer select-none group focus:outline-none"
            role="checkbox"
            aria-checked={formData.is_current}
          >
            <div
              className={cn(
                "w-[16px] h-[16px] rounded-[4px] inline-flex items-center justify-center border transition-colors shrink-0",
                formData.is_current
                  ? "bg-[var(--ds-accent)] border-[var(--ds-accent)]"
                  : "bg-transparent border-[var(--ds-border)] group-hover:border-[var(--ds-text-secondary)]"
              )}
            >
              {formData.is_current && (
                <svg className="w-3 h-3 stroke-white stroke-[2.5]" viewBox="0 0 24 24" fill="none">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className="w-[114px] h-[16px] font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-primary)]">
              I currently work here
            </span>
          </div>
        </div>

        {/* Row 5: Skills used (640px full width) */}
        {!isAddingNewRole && (
          <div className="w-full max-w-[640px]">
            <ProfileEditSkillsPicker
              label="Skills used"
              placeholder="Search and add skills (e.g. Figma, Project Management)"
              selectedSkills={formData.skills}
              onChange={(skills) => setFormData((prev) => ({ ...prev, skills }))}
              labelClassName="w-[60px] h-[16px] text-center"
            />
          </div>
        )}

        {/* Row 6: About (640px full width, counter 0/500) */}
        <ProfileEditField
          id="exp_about"
          label="About"
          isTextarea={true}
          rows={1}
          maxLength={500}
          showCounter={true}
          placeholder="Describe your work, impact, or achievements"
          value={formData.description}
          onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
          className="w-full max-w-[640px]"
          labelClassName="w-[35px] h-[16px] text-center"
        />
      </div>

      {/* Buttons: Add/Save and Cancel (Centered) */}
      <div className="w-full flex flex-row items-center justify-center gap-[8px] h-[36px] pt-[20px] pb-[60px]">
        <button
          type="button"
          disabled={!canSubmit || isSaving || isDeleting}
          onClick={handleSave}
          className={cn(
            "w-[77px] h-[36px] px-[12px] py-[6px] rounded-full font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center justify-center transition-all focus:outline-none",
            !canSubmit || isSaving || isDeleting
              ? "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-90"
              : "bg-[var(--ds-accent)] text-white hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
          )}
        >
          {isSaving ? "..." : isEditing ? "Save" : "Add"}
        </button>

        <button
          type="button"
          disabled={isDeleting || isSaving}
          onClick={isEditing ? () => setShowDeleteModal(true) : handleCancelClick}
          className="w-[77px] h-[36px] px-[12px] py-[6px] rounded-full border border-[var(--ds-border)] bg-transparent hover:bg-[var(--ds-surface-1)] text-[var(--ds-text-primary)] font-['DM_Sans'] font-medium text-[16px] leading-[24px] flex items-center justify-center transition-all cursor-pointer focus:outline-none disabled:opacity-50"
        >
          {isDeleting ? "..." : isEditing ? "Delete" : "Cancel"}
        </button>
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

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Experience"
        description="Are you sure you want to delete this experience? This action cannot be undone."
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default ProfileEditExperienceForm;
