"use client";

import React from "react";
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

const LOOKING_FOR_OPTIONS = [
  "Full-time",
  "Part-time",
  "Internship",
  "Freelance",
  "Connections",
];

const AVAILABILITY_OPTIONS = [
  "Immediately",
  "Weekdays",
  "Weekends",
  "15 to 30 days",
  "Flexible",
  "On-demand",
];

const WORK_SETUP_OPTIONS = ["Remote", "Hybrid", "On-site"];

const STATUS_OPTIONS = [
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

  const selectedStatusLabel =
    STATUS_OPTIONS.find((s) => s.id === formData.status)?.label ||
    formData.status ||
    "Select";

  return (
    /* Frame 2609638: Profile Tab Form Container (800px width, gap 40px) */
    <div className="w-[800px] max-w-full flex flex-col items-center gap-[40px] mt-[40px]">
      {/* 1. Resume Section */}
      <ProfileEditResumeSection
        resumeInfo={resumeInfo}
        stagedResumeFile={stagedResumeFile}
        isResumeDeleted={isResumeDeleted}
        onSelectResume={onSelectResume}
        onRemoveResume={onRemoveResume}
        isSaving={isSaving}
      />

      {/* 2. Full Name & Username (Frame 2609630: 800px width, 40px gap, 300px each) */}
      <div className="w-full flex flex-row items-center justify-between sm:justify-start gap-[40px]">
        {/* Full Name (300px width) */}
        <ProfileEditField
          id="full_name"
          label="Full name"
          value={formData.name}
          onChange={(val) => onChange("name", val)}
          maxLength={40}
          maxLengthMessage="Full name cannot exceed 40 characters"
          placeholder="Enter full name"
          className="w-[300px] max-w-full flex-none grow-0"
          labelClassName="w-[54px] text-center"
          error={errors.name}
        />

        {/* Username (300px width) */}
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
          className="w-[300px] max-w-full flex-none grow-0"
          labelClassName="w-[58px] text-center"
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

      {/* 5. Location & Status (Frame 2609636: 800px width, 40px gap, 380px each) */}
      <div className="w-full flex flex-row items-center justify-between sm:justify-start gap-[40px]">
        {/* Location Autocomplete Input (380px width) */}
        <ProfileEditLocationInput
          value={formData.location}
          onChange={(val) => onChange("location", val)}
          className="w-[380px] max-w-full flex-none grow-1"
        />

        {/* Status Dropdown (380px width) */}
        <ProfileEditDropdown
          label="Status"
          value={formData.status}
          displayValue={selectedStatusLabel}
          options={STATUS_OPTIONS}
          onSelect={(val) => onChange("status", val)}
          className="w-[380px] max-w-full flex-none grow-1"
          labelClassName="w-[37px] h-4 text-center"
        />
      </div>

      {/* 6. Looking for & Availability (800px width, 40px gap, 380px each) */}
      <div className="w-full flex flex-row items-center justify-between sm:justify-start gap-[40px]">
        <ProfileEditDropdown
          label="Looking for"
          value={formData.open_to}
          options={LOOKING_FOR_OPTIONS}
          onSelect={(val) => onChange("open_to", val)}
          placeholder="Select"
          className="w-[380px] max-w-full flex-none grow-1"
          labelClassName="w-[63px] h-4 text-center"
        />

        <ProfileEditDropdown
          label="Availability"
          value={formData.availability}
          options={AVAILABILITY_OPTIONS}
          onSelect={(val) => onChange("availability", val)}
          placeholder="Select"
          className="w-[380px] max-w-full flex-none grow-1"
          labelClassName="w-[62px] h-4 text-center"
        />
      </div>

      {/* 7. Work setup & Industry (800px width, 40px gap, 380px each) */}
      <div className="w-full flex flex-row items-center justify-between sm:justify-start gap-[40px]">
        <ProfileEditDropdown
          label="Work setup"
          value={formData.work_preference}
          options={WORK_SETUP_OPTIONS}
          onSelect={(val) => onChange("work_preference", val)}
          placeholder="Select"
          className="w-[380px] max-w-full flex-none grow-1"
          labelClassName="w-[65px] h-4 text-center"
        />

        <ProfileEditDropdown
          label="Industry"
          value={formData.industry}
          options={industryOptions}
          onSelect={(val) => onChange("industry", val)}
          placeholder="Select"
          emptyText="No industries available"
          className="w-[380px] max-w-full flex-none grow-1"
          labelClassName="w-[47px] h-4 text-center"
        />
      </div>

      {/* 8. About (Frame 2609640: 800px width, counter 0/500) */}
      <ProfileEditField
        id="about"
        label="About"
        value={formData.about}
        onChange={(val) => onChange("about", val)}
        placeholder="Describe your work, impact, or achievements"
        isTextarea={true}
        rows={1}
        maxLength={500}
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
