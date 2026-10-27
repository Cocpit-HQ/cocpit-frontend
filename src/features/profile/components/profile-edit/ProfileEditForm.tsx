"use client";

import React, { useState, useEffect } from "react";
import { getProfileDropdowns } from "@/services/api/profile";
import { ProfileEditResumeSection } from "@/features/profile/components/profile-edit/ProfileEditResumeSection";
import { ProfileEditField } from "@/features/profile/components/profile-edit/ProfileEditField";
import { ProfileEditDropdown } from "@/features/profile/components/profile-edit/ProfileEditDropdown";
import { ProfileEditLocationInput } from "@/features/profile/components/profile-edit/ProfileEditLocationInput";
import { ProfileEditActions } from "@/features/profile/components/profile-edit/ProfileEditActions";

export interface ProfileFormData {
  name: string;
  account_name: string;
  headline: string;
  website: string;
  location: string;
  status: string;
  open_to: string;
  availability: string;
  work_preference: string;
  industry: string;
  about: string;
}

interface ProfileEditFormProps {
  formData: ProfileFormData;
  onChange: (field: keyof ProfileFormData, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  resumeInfo?: any;
  stagedResumeFile?: File | null;
  isResumeDeleted?: boolean;
  onSelectResume?: (file: File) => void;
  onRemoveResume?: () => void;
  isSaving?: boolean;
  hasChanges?: boolean;
  isUsernameAvailable?: boolean | null;
  isCheckingUsername?: boolean;
  availableIndustries?: { industry_name: string }[];
  errors?: Record<string, string>;
}

const FALLBACK_LOOKING_FOR_OPTIONS = [
  "Full-time",
  "Part-time",
  "Internship",
  "Freelance",
  "Connections",
];

const FALLBACK_AVAILABILITY_OPTIONS = [
  "Immediately",
  "Weekdays",
  "Weekends",
  "15 to 30 days",
  "Flexible",
  "On-demand",
];

const FALLBACK_WORK_SETUP_OPTIONS = ["Remote", "Hybrid", "On-site"];

const FALLBACK_STATUS_OPTIONS = [
  { id: "employed", label: "Employed" },
  { id: "self_employed", label: "Self employed" },
  { id: "student", label: "Student" },
  { id: "fresher", label: "Fresher" },
  { id: "intern", label: "Intern" },
  { id: "unemployed", label: "Unemployed" },
];

export const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  formData,
  onChange,
  onSave,
  onCancel,
  resumeInfo,
  stagedResumeFile,
  isResumeDeleted,
  onSelectResume,
  onRemoveResume,
  isSaving = false,
  hasChanges = false,
  isUsernameAvailable = true,
  isCheckingUsername = false,
  availableIndustries = [],
  errors = {},
}) => {
  const industryOptions = availableIndustries.map((ind) => ({
    id: ind.industry_name,
    label: ind.industry_name,
  }));

  const [dropdownOptions, setDropdownOptions] = useState<{
    status: { id: number; label: string }[];
    looking_for: { id: number; label: string }[];
    work_setup: { id: number; label: string }[];
    availability: { id: number; label: string }[];
  } | null>(null);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const response = await getProfileDropdowns();
        if (response.success) {
          setDropdownOptions(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch profile dropdowns", err);
      }
    };
    fetchDropdowns();
  }, []);

  const currentStatusOptions = dropdownOptions?.status
    ? dropdownOptions.status.map(s => ({ id: String(s.id), label: s.label }))
    : FALLBACK_STATUS_OPTIONS;

  const selectedStatusLabel =
    currentStatusOptions.find((s) => String(s.id) === String(formData.status))?.label ||
    formData.status ||
    "Select";

  return (
    /* Profile Tab Form Container */
    <div className="w-full max-w-[800px] flex flex-col items-center gap-[40px] mt-[40px]">
      {/* 1. Resume Section */}
      <ProfileEditResumeSection
        resumeInfo={resumeInfo}
        stagedResumeFile={stagedResumeFile}
        isResumeDeleted={isResumeDeleted}
        onSelectResume={onSelectResume}
        onRemoveResume={onRemoveResume}
        isSaving={isSaving}
      />

      {/* 2. Full Name & Username */}
      <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-[24px] sm:gap-[40px]">
        {/* Full Name */}
        <ProfileEditField
          id="full_name"
          label="Full name"
          value={formData.name}
          onChange={(val) => onChange("name", val)}
          maxLength={40}
          maxLengthMessage="Full name cannot exceed 40 characters"
          placeholder="Enter full name"
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
          error={errors.name}
        />

        {/* Username */}
        <ProfileEditField
          id="account_name"
          label="Username"
          prefix="@"
          value={formData.account_name}
          onChange={(val) => onChange("account_name", val)}
          formatValue={(val) =>
            val
              .replace(/^@/, "")
              .replace(/\s/g, "_")
              .replace(/[^a-zA-Z0-9_.]/g, "")
              .toLowerCase()
          }
          maxLength={25}
          maxLengthMessage="Username cannot exceed 25 characters"
          placeholder="Username"
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
          error={isUsernameAvailable === false ? "Username is taken" : errors.account_name}
          statusBadge={
            isCheckingUsername ? (
              <span className="text-[10px] text-[var(--ds-text-muted)] font-['DM_Sans']">
                Checking...
              </span>
            ) : isUsernameAvailable === false ? (
              <span className="text-[10px] text-[var(--ds-error)] font-['DM_Sans']">
                Taken
              </span>
            ) : null
          }
        />
      </div>

      {/* 3. Headline (Frame 2609639: 800px width, counter 0/120) */}
      <ProfileEditField
        id="headline"
        label="Headline"
        value={formData.headline}
        onChange={(val) => onChange("headline", val)}
        placeholder="Write a headline"
        maxLength={120}
        showCounter={true}
        className="w-full max-w-[800px]"
        labelClassName="w-[49px] text-center"
        error={errors.headline}
      />

      {/* 4. Link (800px width) */}
      <ProfileEditField
        id="link"
        label="Link"
        value={formData.website}
        onChange={(val) => onChange("website", val)}
        placeholder="Paste a link"
        maxLength={255}
        className="w-full max-w-[800px]"
        labelClassName="w-[23px] text-center"
      />

      {/* 5. Location & Status */}
      <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-[24px] sm:gap-[40px]">
        {/* Location Autocomplete Input */}
        <ProfileEditLocationInput
          value={formData.location}
          onChange={(val) => onChange("location", val)}
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
        />

        {/* Status Dropdown */}
        <ProfileEditDropdown
          label="Status"
          value={formData.status}
          displayValue={selectedStatusLabel}
          options={currentStatusOptions}
          onSelect={(val) => onChange("status", val)}
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
        />
      </div>

      {/* 6. Looking for & Availability */}
      <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-[24px] sm:gap-[40px]">
        <ProfileEditDropdown
          label="Looking for"
          value={formData.open_to}
          options={dropdownOptions?.looking_for?.map(o => o.label) ?? FALLBACK_LOOKING_FOR_OPTIONS}
          onSelect={(val) => onChange("open_to", val)}
          placeholder="Select"
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
        />

        <ProfileEditDropdown
          label="Availability"
          value={formData.availability}
          options={dropdownOptions?.availability?.map(o => o.label) ?? FALLBACK_AVAILABILITY_OPTIONS}
          onSelect={(val) => onChange("availability", val)}
          placeholder="Select"
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
        />
      </div>

      {/* 7. Work setup & Industry */}
      <div className="w-full flex flex-col sm:flex-row items-start justify-between gap-[24px] sm:gap-[40px]">
        <ProfileEditDropdown
          label="Work setup"
          value={formData.work_preference}
          options={dropdownOptions?.work_setup?.map(o => o.label) ?? FALLBACK_WORK_SETUP_OPTIONS}
          onSelect={(val) => onChange("work_preference", val)}
          placeholder="Select"
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
        />

        <ProfileEditDropdown
          label="Industry"
          value={formData.industry}
          options={industryOptions}
          onSelect={(val) => onChange("industry", val)}
          placeholder="Select"
          emptyText="No industries available"
          className="w-full sm:w-[380px] max-w-full sm:flex-1"
        />
      </div>

      {/* 8. About (Frame 2609640: 800px width, counter 0/2000) */}
      <ProfileEditField
        id="about"
        label="About"
        value={formData.about}
        onChange={(val) => onChange("about", val)}
        placeholder="Describe your work, impact, or achievements"
        isTextarea={true}
        rows={1}
        maxLength={2000}
        showCounter={true}
        className="w-full max-w-[800px]"
        labelClassName="w-[35px] text-center"
        error={errors.about}
      />

      {/* 9. Save & Cancel Action Buttons */}
      <ProfileEditActions
        onSave={onSave}
        onCancel={onCancel}
        isSaving={isSaving}
        disabled={
          !hasChanges ||
          isUsernameAvailable === false ||
          isCheckingUsername
        }
      />
    </div>
  );
};

export default ProfileEditForm;
