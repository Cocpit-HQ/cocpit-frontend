"use client";

import React, { useState } from "react";
import { AddIcon } from "@/components/icons";
import { ProfileEditActions } from "@/features/profile/components/profile-edit/ProfileEditActions";
import { AddSkillsModal } from "@/features/profile/components/profile-edit/AddSkillsModal";
import { SkillChip } from "@/features/profile/components/SkillChip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileEditSkillsTabProps {
  skills: string[];
  onSave: (skills: string[]) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export const ProfileEditSkillsTab: React.FC<ProfileEditSkillsTabProps> = ({
  skills: initialSkills,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const [stagedSkills, setStagedSkills] = useState<string[]>(initialSkills || []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Sync if initial skills change from outside and user hasn't edited yet
  const initialSkillsKey = (initialSkills || []).join(",");
  const [lastInitialKey, setLastInitialKey] = useState(initialSkillsKey);
  if (initialSkillsKey !== lastInitialKey) {
    setLastInitialKey(initialSkillsKey);
    setStagedSkills(initialSkills || []);
  }

  const hasChanges =
    JSON.stringify(stagedSkills) !== JSON.stringify(initialSkills || []);

  const handleRemoveSkill = (skillToRemove: string) => {
    if (stagedSkills.length <= 3) {
      toast.info("Minimum 3 skills must be present");
      return;
    }
    setStagedSkills((prev) => prev.filter((s) => s !== skillToRemove));
  };

  const handleAddSkill = (newSkill: string) => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (stagedSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.info("Skill already added");
      return;
    }
    setStagedSkills((prev) => [...prev, trimmed]);
  };

  const handleSaveClick = async () => {
    if (stagedSkills.length < 3) {
      toast.error("Please select at least 3 skills");
      return;
    }
    await onSave(stagedSkills);
  };

  const isMinReached = stagedSkills.length <= 3;

  return (
    <div className="w-[800px] max-w-full flex flex-col items-start gap-[16px] pb-[60px]">
      {/* Frame 2609752: Header Row (800px width, 24px height, justify-between, left-aligned) */}
      <div className="w-full h-[24px] flex flex-row items-center justify-between">
        {/* Frame 2609722: Title & Count Group */}
        <div className="flex flex-row items-center gap-[8px]">
          {/* Title: "Skills" (DM Sans 16px Medium, #FFECE6, 38px x 24px) */}
          <span className="w-[38px] h-[24px] font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex-none grow-0">
            Skills
          </span>

          {/* Dot (4px x 4px, #726B67) */}
          <span className="w-[4px] h-[4px] rounded-full bg-[var(--ds-text-muted)] shrink-0" />

          {/* Skills count: "${stagedSkills.length} skills" (DM Sans 14px Regular, #B8ADA8) */}
          <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)]">
            {stagedSkills.length} {stagedSkills.length === 1 ? "skill" : "skills"}
          </span>
        </div>

        {/* Plus Add Button (20px x 20px) */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="w-[20px] h-[20px] flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer p-0"
          aria-label="Add skill"
        >
          <AddIcon className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
        </button>
      </div>

      {/* Frame 2609753: Chips Container (800px width, flex-wrap, 8px gap, left-aligned) */}
      <div className="w-full flex flex-row flex-wrap items-start gap-[8px]">
        {stagedSkills.map((skill) => (
          <SkillChip
            key={skill}
            name={skill}
            showBulbIcon={true}
            deletable={true}
            canDelete={() => {
              if (stagedSkills.length <= 3) {
                toast.info("Minimum 3 skills must be present");
                return false;
              }
              return true;
            }}
            title={isMinReached ? "Minimum 3 skills required" : `Click to remove ${skill}`}
            onDelete={(skillToRemove) => handleRemoveSkill(skillToRemove)}
          />
        ))}
      </div>

      {/* Action Buttons (Save & Cancel, horizontally centered under 800px) */}
      <div className="w-full flex justify-center mt-[40px]">
        <ProfileEditActions
          onSave={handleSaveClick}
          onCancel={onCancel}
          isSaving={isSaving}
          disabled={!hasChanges || stagedSkills.length < 3}
        />
      </div>

      {/* Add Skills Modal */}
      <AddSkillsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSkill={handleAddSkill}
        existingSkills={stagedSkills}
      />
    </div>
  );
};

export default ProfileEditSkillsTab;
