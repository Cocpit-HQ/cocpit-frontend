"use client";

import React from "react";

export interface ProfileStrengthenAction {
  id: string;
  label: string;
  onClick: () => void;
}

interface ProfileScoreSectionProps {
  score?: number;
  actions?: ProfileStrengthenAction[];
}

export const ProfileScoreSection: React.FC<ProfileScoreSectionProps> = ({
  score = 0,
  actions = [],
}) => {
  const clampedScore = Math.min(100, Math.max(0, Math.round(score)));

  if (clampedScore >= 100) return null;

  return (
    <div className="w-full max-w-[800px] px-5 py-3 rounded-[24px] border border-[var(--ds-border)] flex flex-col items-start gap-3 select-none">
      {/* Score Header & Description */}
      <div className="flex flex-col items-start gap-1">
        <div className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6">
          Profile score: {clampedScore}%
        </div>
        <div className="text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4">
          Complete your profile to unlock better career insights and opportunities.
        </div>
      </div>

      {/* Dynamic Progress Bar */}
      <div className="w-full flex flex-col items-start">
        <div className="w-full h-1.5 bg-[var(--ds-surface-1)] rounded-lg overflow-hidden border border-[var(--ds-border)]/50">
          <div
            className="h-1.5 bg-[var(--ds-accent)] rounded-lg transition-all duration-500 ease-out"
            style={{ width: `${clampedScore}%` }}
          />
        </div>
      </div>

      {/* Strengthen Profile Chips Row */}
      {actions.length > 0 && (
        <div className="w-full flex flex-row items-center gap-2 flex-wrap pt-1">
          <span className="text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4 whitespace-nowrap">
            Strengthen your profile:
          </span>
          {actions.map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="px-2 py-1.5 bg-[var(--ds-surface-1)] hover:bg-[var(--ds-surface-2)] active:scale-[0.98] rounded-[100px] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4 transition-all cursor-pointer border border-transparent hover:border-[var(--ds-border)]"
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileScoreSection;
