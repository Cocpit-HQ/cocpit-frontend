"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { LeaveConfirmationModal } from "@/components/shared";
import { ProfileEditField } from "./ProfileEditField";
import { ProfileEditSearchableDropdown } from "./ProfileEditSearchableDropdown";
import { ProfileEditLocationInput } from "./ProfileEditLocationInput";
import { ProfileEditDatePicker } from "./ProfileEditDatePicker";
import { useEducationMutations } from "@/hooks/use-my-profile";
import { getEducationList } from "@/services/api/onboarding";
import type { Education } from "@/types/entities";
import { cn } from "@/lib/utils";

export interface EducationFormData {
  education_id?: string;
  school_name: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
}

const EMPTY_FORM: EducationFormData = {
  school_name: "",
  degree: "",
  field_of_study: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};

interface ProfileEditEducationFormProps {
  initialEducation?: Education | null;
  onBackToList: () => void;
  onAddNew: () => void;
  onSaved: (id?: string) => void;
  onDeleted: () => void;
  onRegisterBack?: (fn: () => void) => void;
  allEducations?: Education[];
}

export const ProfileEditEducationForm: React.FC<ProfileEditEducationFormProps> = ({
  initialEducation,
  onBackToList,
  onAddNew,
  onSaved,
  onDeleted,
  onRegisterBack,
  allEducations = [],
}) => {
  const eduMutations = useEducationMutations();
  const [formData, setFormData] = useState<EducationFormData>(EMPTY_FORM);
  const [initialSnapshot, setInitialSnapshot] = useState<EducationFormData | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  useEffect(() => {
    let initialData: EducationFormData;
    if (initialEducation) {
      initialData = {
        education_id: initialEducation.education_id,
        school_name: initialEducation.school_name || "",
        degree: initialEducation.degree || "",
        field_of_study: initialEducation.field_of_study || "",
        location: initialEducation.location || "",
        start_date: initialEducation.start_date || "",
        end_date: initialEducation.end_date || "",
        is_current: Boolean((initialEducation as any)?.is_current || !initialEducation.end_date),
        description: initialEducation.description || "",
      };
    } else {
      initialData = EMPTY_FORM;
    }

    if (typeof window !== "undefined") {
      const draftKey = `profile_draft_edu_${initialEducation?.education_id || "new"}`;
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          // Only use draft if it has the same ID or both are new
          if (parsed.education_id === initialData.education_id) {
            initialData = parsed;
          }
        } catch (e) {
          // ignore
        }
      }
    }

    setFormData(initialData);
    setInitialSnapshot(initialData);
  }, [initialEducation]);

  // Real-time date validation
  // Real-time date and duplicate validation
  useEffect(() => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors.end_date === "End date must be on or after start date") delete newErrors.end_date;

      if (!formData.is_current && formData.start_date && formData.end_date) {
        if (new Date(formData.end_date) < new Date(formData.start_date)) {
          newErrors.end_date = "End date must be on or after start date";
        }
      }
      return newErrors;
    });

    setWarnings((prev) => {
      const newWarnings = { ...prev };
      if (newWarnings.degree === "This degree from this school already exists on your profile") delete newWarnings.degree;
      if (newWarnings.school_name === "This degree from this school already exists on your profile") delete newWarnings.school_name;

      const degree = formData.degree.trim().toLowerCase();
      const school = formData.school_name.trim().toLowerCase();
      if (degree && school) {
        const isDuplicate = allEducations.some(
          (e) =>
            e.education_id !== formData.education_id &&
            e.degree?.toLowerCase().trim() === degree &&
            e.school_name?.toLowerCase().trim() === school
        );
        if (isDuplicate) {
          newWarnings.degree = "This degree from this school already exists on your profile";
          newWarnings.school_name = "This degree from this school already exists on your profile";
        }
      }
      return newWarnings;
    });
  }, [formData.start_date, formData.end_date, formData.is_current, formData.degree, formData.school_name, formData.education_id, allEducations]);

  useEffect(() => {
    if (typeof window !== "undefined" && formData) {
      const draftKey = `profile_draft_edu_${initialEducation?.education_id || "new"}`;
      sessionStorage.setItem(draftKey, JSON.stringify(formData));
    }
  }, [formData, initialEducation]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      const draftKey = `profile_draft_edu_${initialEducation?.education_id || "new"}`;
      sessionStorage.removeItem(draftKey);
    }
  }, [initialEducation]);

  const isEditing = Boolean(formData.education_id);

  // Backend API Loaders for Education dropdowns
  const loadSchools = useCallback(async (search: string) => {
    try {
      const res = await getEducationList(search, "", "");
      const raw = res.schools || [];
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      for (const s of raw) {
        const name = s.name?.trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          deduplicated.push(name);
        }
      }
      return deduplicated;
    } catch {
      return [];
    }
  }, []);

  const loadDegrees = useCallback(async (search: string) => {
    try {
      const res = await getEducationList("", search, "");
      const raw = res.degrees || [];
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      for (const d of raw) {
        const name = d?.trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          deduplicated.push(name);
        }
      }
      return deduplicated;
    } catch {
      return [];
    }
  }, []);

  const loadSpecializations = useCallback(async (search: string) => {
    try {
      const res = await getEducationList("", "", search);
      const raw = res.specializations || [];
      const seen = new Set<string>();
      const deduplicated: string[] = [];
      for (const sp of raw) {
        const name = sp?.trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          deduplicated.push(name);
        }
      }
      return deduplicated;
    } catch {
      return [];
    }
  }, []);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.school_name.trim()) {
      newErrors.school_name = "Please enter an institute name";
    }
    if (!formData.degree.trim()) {
      newErrors.degree = "Please enter your degree";
    }
    if (!formData.start_date) {
      newErrors.start_date = "Please select a start date";
    }
    if (!formData.is_current && !formData.end_date) {
      newErrors.end_date = "Please select an end date or check present";
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

    setIsSaving(true);
    try {
      const payload: any = {
        school_name: formData.school_name.trim(),
        degree: formData.degree.trim(),
        field_of_study: formData.field_of_study.trim() || null,
        location: formData.location.trim() || null,
        start_date: formData.start_date,
        end_date: formData.is_current ? null : formData.end_date || null,
        description: formData.description.trim() || null,
      };

      let savedId: string | undefined;

      if (isEditing && formData.education_id) {
        await eduMutations.update.mutateAsync({
          id: formData.education_id,
          payload,
        });
        toast.success("Education updated successfully");
        setInitialSnapshot({ ...formData });
        savedId = formData.education_id;
      } else {
        const res: any = await eduMutations.add.mutateAsync(payload);
        const newId = res?.education?.education_id || res?.education?.id || res?.data?.education_id || res?.data?.id;
        const updatedForm = { ...formData, ...(newId ? { education_id: newId } : {}) };
        if (newId) {
          setFormData(updatedForm);
          savedId = newId;
        }
        setInitialSnapshot(updatedForm);
        toast.success("Education added successfully");
      }
      clearDraft();
      onSaved(savedId);
    } catch (err: any) {
      console.error("Failed to save education:", err);
      toast.error(err?.response?.data?.message || "Failed to save education");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !formData.education_id) {
      clearDraft();
      onBackToList();
      return;
    }

    setIsDeleting(true);
    try {
      await eduMutations.remove.mutateAsync(formData.education_id);
      toast.success("Education deleted successfully");
      clearDraft();
      onDeleted();
    } catch (err: any) {
      console.error("Failed to delete education:", err);
      toast.error(err?.response?.data?.message || "Failed to delete education");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!initialSnapshot) return false;
    return (
      formData.school_name !== initialSnapshot.school_name ||
      formData.degree !== initialSnapshot.degree ||
      formData.field_of_study !== initialSnapshot.field_of_study ||
      formData.location !== initialSnapshot.location ||
      formData.start_date !== initialSnapshot.start_date ||
      formData.end_date !== initialSnapshot.end_date ||
      formData.is_current !== initialSnapshot.is_current ||
      formData.description !== initialSnapshot.description
    );
  }, [formData, initialSnapshot]);

  const isRequiredFilled = Boolean(
    formData.school_name.trim() &&
    formData.degree.trim() &&
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
    onRegisterBack?.(handleCancelClick);
  }, [onRegisterBack, handleCancelClick]);

  return (
    <div className="w-full max-w-full flex flex-col justify-start items-center gap-5 animate-in fade-in duration-200">
      {/* Form Fields Container */}
      <div className="self-stretch flex flex-col justify-start items-start gap-10">
        {/* Row 1: School or university & Program */}
        <div className="self-stretch flex flex-col sm:flex-row justify-start sm:items-center gap-5 sm:gap-10">
          <div className="w-full sm:w-72 flex-1">
            <ProfileEditSearchableDropdown
              id="edu_school"
              label="School or university"
              placeholder="Select"
              value={formData.school_name}
              loadOptions={loadSchools}
              error={errors.school_name}
              warning={warnings.school_name}
              onSelect={(val) => {
                setFormData((prev) => ({ ...prev, school_name: val }));
                setErrors((prev) => ({ ...prev, school_name: "" }));
                setWarnings((prev) => ({ ...prev, school_name: "" }));
              }}
              maxLength={255}
              maxLengthMessage="School/University cannot exceed 255 characters"
            />
          </div>
          <div className="w-full sm:w-72 flex-1">
            <ProfileEditSearchableDropdown
              id="edu_program"
              label="Program"
              placeholder="Select"
              value={formData.degree}
              loadOptions={loadDegrees}
              error={errors.degree}
              warning={warnings.degree}
              onSelect={(val) => {
                setFormData((prev) => ({ ...prev, degree: val }));
                setErrors((prev) => ({ ...prev, degree: "" }));
                setWarnings((prev) => ({ ...prev, degree: "" }));
              }}
            />
          </div>
        </div>

        {/* Row 2: Specialization & Location (640px width, 40px gap, 300px each) */}
        <div className="w-full flex flex-row items-center gap-[40px]">
          <div className="w-[300px] flex-none">
            <ProfileEditSearchableDropdown
              id="edu_specialization"
              label="Specialization"
              placeholder="Select"
              value={formData.field_of_study}
              loadOptions={loadSpecializations}
              onSelect={(val) => setFormData((prev) => ({ ...prev, field_of_study: val }))}
              labelClassName="w-[79px] h-[16px] text-center"
            />
          </div>
          <div className="w-[300px] flex-none">
            <ProfileEditLocationInput
              value={formData.location}
              onChange={(val) => setFormData((prev) => ({ ...prev, location: val }))}
              className="w-[300px]"
            />
          </div>
        </div>

        {/* Group 3: Start date & End date + Checkbox */}
        <div className="self-stretch flex flex-col justify-start items-start gap-5">
          <div className="self-stretch flex flex-col sm:flex-row justify-start sm:items-center gap-5 sm:gap-10">
            <div className={cn("w-full sm:w-72 flex-1")}>
              <ProfileEditDatePicker
                id="edu_start_date"
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
            {!formData.is_current ? (
              <div className="w-full sm:w-72 flex-1">
                <ProfileEditDatePicker
                  id="edu_end_date"
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
            ) : null}
          </div>

          {/* Checkbox: I currently study here */}
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
                "size-4 rounded-sm inline-flex items-center justify-center border transition-colors shrink-0",
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
              I currently study here
            </div>
          </div>
        </div>

        {/* Group 4: About */}
        <div className="self-stretch flex flex-col justify-start items-end gap-2">
          <ProfileEditField
            id="edu_about"
            label="About"
            isTextarea={true}
            maxLength={500}
            placeholder="Describe your work, impact, or achievements"
            value={formData.description}
            onChange={(val) => setFormData((prev) => ({ ...prev, description: val }))}
          />
          <div className="text-center justify-start text-[var(--ds-text-muted)] text-xs font-normal font-['DM_Sans'] leading-4">
            {formData.description.length}/500
          </div>
        </div>
      </div>

      {/* Action Buttons: Add/Save and Cancel/Delete */}
      <div className="inline-flex justify-center items-start gap-2 pt-2 pb-8">
        <button
          type="button"
          disabled={!canSubmit || isSaving}
          onClick={handleSave}
          className={cn(
            "w-20 px-3 py-1.5 rounded-[100px] flex justify-center items-center gap-2.5 transition-all focus:outline-none",
            !canSubmit || isSaving
              ? "bg-[var(--ds-surface-1)] text-[var(--ds-text-muted)] cursor-default opacity-90"
              : "bg-[var(--ds-accent)] text-white hover:opacity-90 active:scale-95 cursor-pointer shadow-md"
          )}
        >
          <div className="justify-start text-base font-medium font-['DM_Sans'] leading-6">
            {isSaving ? "Saving..." : isEditing ? "Save" : "Add"}
          </div>
        </button>

        <button
          type="button"
          disabled={isDeleting || isSaving}
          onClick={isEditing ? handleDelete : handleCancelClick}
          className="px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-95 flex justify-center items-center gap-2.5 transition-all cursor-pointer focus:outline-none disabled:opacity-50"
        >
          <div className="justify-start text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
            {isDeleting ? "Deleting..." : isEditing ? "Delete" : "Cancel"}
          </div>
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
    </div>
  );
};


