"use client";

import React, { useState, useRef, useEffect } from "react";
import { SkillsBulbIcon, AddIcon } from "@/components/icons";
import { SkillChip } from "../SkillChip";
import type { SkillResponse } from "@/types/user";
import { ProfileSkillsErrorState } from "../ProfileEmptyStates";
import { toast } from "sonner";

interface ProfileSkillsTabProps {
  skills: SkillResponse[];
  isOwnProfile?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onAddSkills?: () => void;
  onEditSkills?: () => void;
  onDeleteSkill?: (skillName: string) => void;
}

export const ProfileSkillsTab: React.FC<ProfileSkillsTabProps> = ({
  skills = [],
  isOwnProfile = true,
  isError,
  onRetry,
  onAddSkills,
  onEditSkills,
  onDeleteSkill,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // 2 lines of chips: 2 * 28px height + 20px gap = 76px
      const isOverflowing = containerRef.current.scrollHeight > 80;
      setHasOverflow(isOverflowing);
    }
  }, [skills]);

  if (isError) {
    return (
      <div className="w-full max-w-[800px] px-4 md:px-0 md:pl-5 flex flex-col items-center gap-5">
        <div className="w-full max-w-[780px] flex flex-row justify-between items-center gap-5">
          <div className="w-[40px] h-[24px] text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
            Skills
          </div>
          {isOwnProfile && onAddSkills && (
            <button
              type="button"
              onClick={onAddSkills}
              className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none"
              title="Add Skills"
            >
              <AddIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
            </button>
          )}
        </div>
        <ProfileSkillsErrorState onRetry={onRetry} />
      </div>
    );
  }

  if (!skills || skills.length === 0) {
    return (
      /* Frame 2609756: Main Skills Container (w: 800px, pl: 20px, gap: 20px) */
      <div className="w-full max-w-[800px] px-4 md:px-0 md:pl-5 flex flex-col items-center gap-5">
        {/* Frame 2609752: Title Box (w: 780px, h: 24px, justify-between) */}
        <div className="w-full max-w-[780px] flex flex-row justify-between items-center gap-5">
          <div className="w-[40px] h-[24px] text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
            Skills
          </div>
          {isOwnProfile && onAddSkills && (
            <button
              type="button"
              onClick={onAddSkills}
              className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none"
              title="Add Skills"
            >
              <AddIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
            </button>
          )}
        </div>

        <div className="w-full max-w-[780px] py-2 flex flex-col items-center justify-center text-center">
          <p className="text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] max-w-[360px]">
            {isOwnProfile
              ? "Add your top technical and professional skills to stand out."
              : "This user hasn't added any skills yet."}
          </p>
        </div>
      </div>
    );
  }

  return (
    /* Frame 2609756: Main Skills Container (w: 800px, pl: 20px, gap: 20px) */
    <div className="w-full max-w-[800px] px-4 md:px-0 md:pl-5 flex flex-col items-center gap-5">
      {/* Frame 2609752: Title Box (w: 780px, h: 24px, justify-between) */}
      <div className="w-full max-w-[780px] flex flex-row justify-between items-center gap-5">
        <div className="w-[40px] h-[24px] text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
          Skills
        </div>
        {isOwnProfile && onAddSkills && (
          <button
            type="button"
            onClick={onAddSkills}
            className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none"
            title="Add Skills"
          >
            <AddIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
          </button>
        )}
      </div>

      {/* Frame 2609486: Skills Chips Container (w: 780px, gap: 20px, 2-line max-h: 76px) */}
      <div
        ref={containerRef}
        className={`w-full max-w-[780px] flex flex-row flex-wrap items-start content-start gap-5 transition-all duration-300 ${
          !isExpanded ? "max-h-[76px] overflow-hidden" : "max-h-none"
        }`}
      >
        {skills.map((skill, idx) => {
          const name = typeof skill === "string" ? skill : skill.name || (skill as any).skill_name;
          return (
            <SkillChip
              key={skill.skill_id || idx}
              name={name}
              showBulbIcon={true}
              deletable={Boolean(isOwnProfile && onDeleteSkill)}
              canDelete={() => {
                if (skills.length <= 3) {
                  toast.info("Minimum 3 skills must be present");
                  return false;
                }
                return true;
              }}
              onDelete={onDeleteSkill ? () => onDeleteSkill(name) : undefined}
              onClick={isOwnProfile && onEditSkills ? onEditSkills : undefined}
            />
          );
        })}
      </div>

      {/* View more / View less Button (12px Medium, #EC6229) */}
      {hasOverflow && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-[60px] h-[16px] text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-2 grow-0 hover:underline cursor-pointer transition-opacity flex items-center justify-center p-0 outline-none"
        >
          {isExpanded ? "Show less" : "View more"}
        </button>
      )}
    </div>
  );
};

export default ProfileSkillsTab;
