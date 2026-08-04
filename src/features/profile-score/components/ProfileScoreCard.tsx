"use client";

import { useMemo } from "react";
import type { ProfileScoreBreakdown } from "../types/profileScore.types";

interface ProfileScoreCardProps {
  score: number;
  breakdown: ProfileScoreBreakdown;
  onActionClick: (action: string) => void;
  hasExperience?: boolean;
  hasEducation?: boolean;
  hasProjects?: boolean;
  hasAvatar?: boolean;
  hasCoverImage?: boolean;
}

/** Maps a backend missing-category key to a user-friendly action label + action id */
const ACTION_MAP: Record<string, { label: string; action: string }> = {
  basic_info: { label: "Add basic info", action: "edit-profile" },
  skills: { label: "Add skills", action: "add-skills" },
  experience: { label: "Add experience", action: "add-experience" },
  projects: { label: "Add a project", action: "add-project" },
  education: { label: "Add education", action: "add-education" },
  profile_banner: { label: "Upload profile photo", action: "add-avatar" },
};

/**
 * Profile Score card displayed on the user's own profile page.
 * Shows a percentage score, animated progress bar, and action links
 * for incomplete profile sections.
 *
 * Hidden when the score reaches 100%.
 */
export function ProfileScoreCard({ score, breakdown, onActionClick, hasExperience, hasEducation, hasProjects, hasAvatar, hasCoverImage }: ProfileScoreCardProps) {
  // Don't render when profile is fully complete
  if (score >= 100) return null;

  // Derive action links from categories that haven't earned full points
  const actionLinks = useMemo(() => {
    const links: { label: string; action: string }[] = [];
    const categories = Object.entries(breakdown) as [keyof ProfileScoreBreakdown, ProfileScoreBreakdown[keyof ProfileScoreBreakdown]][];

    for (const [key, category] of categories) {
      if (category.earned < category.max && ACTION_MAP[key]) {
        if (key === 'experience' && hasExperience) continue;
        if (key === 'education' && hasEducation) continue;
        
        let { label, action } = ACTION_MAP[key];

        if (key === 'projects' && hasProjects) {
          label = "Update project";
        }

        if (key === 'profile_banner') {
          if (!hasAvatar) {
            links.push({ label: "Upload profile photo", action: "add-avatar" });
          }
          if (!hasCoverImage) {
            links.push({ label: "Upload cover photo", action: "add-cover" });
          }
          continue;
        }

        links.push({ label, action });
      }
    }

    return links;
  }, [breakdown, hasExperience, hasEducation, hasProjects, hasAvatar, hasCoverImage]);

  // Clamp score to 0–100 range for display
  const displayScore = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div className="flex flex-col gap-2 px-4 md:px-[34px] py-4">
      <div className="flex flex-col items-start gap-[16px] p-4 rounded-[24px] bg-[#F9FAFF]">
        {/* Score text */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-[18px] font-medium text-black leading-[26px] font-[family-name:var(--font-poppins)]">
            Profile score: {displayScore}%
          </span>
          <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] font-[family-name:var(--font-poppins)]">
            Complete your profile to unlock better career insights and opportunities.
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative w-full self-stretch h-[6px] bg-[#DADADA] rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700 ease-out bg-[#6366F1]"
            style={{ width: `${displayScore}%` }}
          />
        </div>

        {/* Action buttons */}
        {actionLinks.length > 0 && (
          <div className="flex flex-row items-center gap-2 flex-wrap self-stretch">
            <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] font-[family-name:var(--font-poppins)] whitespace-nowrap">
              Strengthen your profile:
            </span>
            {actionLinks.map((link) => (
              <button
                key={link.action}
                type="button"
                onClick={() => onActionClick(link.action)}
                className="flex items-center gap-1 px-2 py-2 rounded-[6px] bg-[#EEF2FF] text-[12px] font-normal text-[#6B7280] leading-[16px] font-[family-name:var(--font-poppins)] text-center hover:bg-[#E0E7FF] cursor-pointer transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
