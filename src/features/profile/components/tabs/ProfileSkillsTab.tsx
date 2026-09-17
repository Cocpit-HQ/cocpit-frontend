"use client";

import React, { useState, useRef, useEffect } from "react";
import { SkillsBulbIcon, AddIcon } from "@/components/icons";
import type { SkillResponse } from "@/types/user";
import { ProfileSkillsErrorState } from "../ProfileEmptyStates";

interface ProfileSkillsTabProps {
  skills: SkillResponse[];
  isOwnProfile?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onAddSkills?: () => void;
  onEditSkills?: () => void;
}

export const ProfileSkillsTab: React.FC<ProfileSkillsTabProps> = ({
  skills = [],
  isOwnProfile = true,
  isError,
  onRetry,
  onAddSkills,
  onEditSkills,
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
          <div className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none">
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
          <div className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none">
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
        <div className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 flex-none">
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
            /* Chips: (h: 28px, py: 6px, px: 8px, gap: 8px, bg: #1A1A20, rounded-full) */
            <div
              key={skill.skill_id || idx}
              onClick={isOwnProfile && onEditSkills ? onEditSkills : undefined}
              className={`h-7 px-2 py-1.5 bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] rounded-[100px] inline-flex justify-center items-center gap-2 transition-colors select-none ${
                isOwnProfile && onEditSkills ? "cursor-pointer" : ""
              }`}
            >
              {/* Icon (16x16px) */}
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <SkillsBulbIcon className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" />
              </div>
              {/* Text (12px Regular, 16px LH, #FFECE6) */}
              <span className="text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4 whitespace-nowrap">
                {name}
              </span>
            </div>
          );
        })}
      </div>

      {/* View more / View less Button (12px Medium, #EC6229) */}
      {hasOverflow && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 hover:underline cursor-pointer transition-opacity"
        >
          {isExpanded ? "Show less" : "View more"}
        </button>
      )}
    </div>
  );
};

export default ProfileSkillsTab;
