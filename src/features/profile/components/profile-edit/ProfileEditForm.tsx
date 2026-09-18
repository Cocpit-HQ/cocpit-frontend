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
          placeholder="Enter full name"
          className="w-[300px] max-w-full"
        />

        {/* Username (300px width) */}
        <ProfileEditField
          id="account_name"
          label="Username"
          prefix="@"
          value={formData.account_name}
          onChange={(val) => onChange("account_name", val.replace(/^@/, "").trim())}
          placeholder="Username"
          className="w-[300px] max-w-full"
          isError={isUsernameAvailable === false}
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

      {/* 3. Headline (Frame 2609639: 800px width, counter 0/100) */}
      <ProfileEditField
        id="headline"
        label="Headline"
        value={formData.headline}
        onChange={(val) => onChange("headline", val)}
        placeholder="Write a headline"
        maxLength={100}
        showCounter={true}
        className="w-full"
      />

      {/* 4. Link (800px width) */}
      <ProfileEditField
        id="link"
        label="Link"
        value={formData.website}
        onChange={(val) => onChange("website", val)}
        placeholder="Paste a link"
        maxLength={255}
        className="w-full"
      />

      {/* 5. Location & Status (Frame 2609636: 800px width, 40px gap, 300px each) */}
      <div className="w-full flex flex-row items-center justify-between sm:justify-start gap-[40px]">
        {/* Location Autocomplete Input (300px width) */}
        <ProfileEditLocationInput
          value={formData.location}
          onChange={(val) => onChange("location", val)}
          className="w-[300px] max-w-full"
        />

        {/* Status Dropdown (300px width) */}
        <ProfileEditDropdown
          label="Status"
          value={formData.status}
          displayValue={selectedStatusLabel}
          options={STATUS_OPTIONS}
          onSelect={(val) => onChange("status", val)}
          className="w-[300px] max-w-full"
        />
      </div>

      {/* 6. Looking for & Availability (800px width, 40px gap, 300px each) */}
      <div className="w-full flex flex-row items-center justify-between sm:justify-start gap-[40px]">
        <ProfileEditDropdown
          label="Looking for"
          value={formData.open_to}
          options={LOOKING_FOR_OPTIONS}
          onSelect={(val) => onChange("open_to", val)}
          placeholder="Select"
          className="w-[300px] max-w-full"
        />

        <ProfileEditDropdown
          label="Availability"
          value={formData.availability}
          options={AVAILABILITY_OPTIONS}
          onSelect={(val) => onChange("availability", val)}
          placeholder="Select"
          className="w-[300px] max-w-full"
        />
      </div>

      {/* 7. Work setup & Industry (800px width, 40px gap, 300px each) */}
      <div className="w-full flex flex-row items-center justify-between sm:justify-start gap-[40px]">
        <ProfileEditDropdown
          label="Work setup"
          value={formData.work_preference}
          options={WORK_SETUP_OPTIONS}
          onSelect={(val) => onChange("work_preference", val)}
          placeholder="Select"
          className="w-[300px] max-w-full"
        />

        <ProfileEditDropdown
          label="Industry"
          value={formData.industry}
          options={industryOptions}
          onSelect={(val) => onChange("industry", val)}
          placeholder="Select"
          emptyText="No industries available"
          className="w-[300px] max-w-full"
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
        className="w-full"
      />

      {/* 9. Save & Cancel Action Buttons */}
      <ProfileEditActions
        onSave={onSave}
        onCancel={onCancel}
        isSaving={isSaving}
        disabled={
          !hasChanges ||
          isUsernameAvailable === false ||
          isCheckingUsername ||
          !formData.name?.trim() ||
          formData.name.trim().length < 3 ||
          (Boolean(formData.account_name) && !/^[a-z0-9_.]{3,20}$/.test(formData.account_name))
        }
      />
    </div>
  );
};

export default ProfileEditForm;
