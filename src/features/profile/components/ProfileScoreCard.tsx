"use client";

import { useMemo } from "react";
import type { ProfileScoreBreakdown } from "@/features/profile-score/types/profileScore.types";

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
export const ACTION_MAP: Record<string, { label: string; action: string }> = {
  basic_info: { label: "Complete basic info", action: "edit-profile" },
  skills: { label: "Add skills", action: "add-skills" },
  experience: { label: "Add experience", action: "add-experience" },
  projects: { label: "Add a project", action: "add-project" },
  education: { label: "Add education", action: "add-education" },
  profile_banner: { label: "Upload profile photo", action: "add-avatar" },
};

export interface ProfileScoreActionLink {
  label: string;
  action: string;
}

export function getProfileScoreActionLinks({
  breakdown,
  hasExperience = false,
  hasEducation = false,
  hasProjects = false,
  hasSkills = false,
  hasAvatar = false,
  hasCoverImage = false,
  hasBasicInfo = false,
}: {
  breakdown?: ProfileScoreBreakdown | null;
  hasExperience?: boolean;
  hasEducation?: boolean;
  hasProjects?: boolean;
  hasSkills?: boolean;
  hasAvatar?: boolean;
  hasCoverImage?: boolean;
  hasBasicInfo?: boolean;
}): ProfileScoreActionLink[] {
  const links: ProfileScoreActionLink[] = [];

  if (breakdown) {
    const categories = Object.entries(breakdown) as [keyof ProfileScoreBreakdown, ProfileScoreBreakdown[keyof ProfileScoreBreakdown]][];

    for (const [key, category] of categories) {
      if (category && category.earned < category.max) {
        if (key === "profile_banner") {
          if (!hasCoverImage) {
            links.push({ label: "Add banner", action: "add-cover" });
          }
          if (!hasAvatar) {
            links.push({ label: "Upload profile photo", action: "add-avatar" });
          }
        } else if (key === "experience") {
          if (!hasExperience) {
            links.push({ label: "Add experience", action: "add-experience" });
          }
        } else if (key === "education") {
          if (!hasEducation) {
            links.push({ label: "Add education", action: "add-education" });
          }
        } else if (key === "projects") {
          if (!hasProjects) {
            links.push({ label: "Add a project", action: "add-project" });
          }
        } else if (key === "skills") {
          if (!hasSkills) {
            links.push({ label: "Add skills", action: "add-skills" });
          }
        } else if (key === "basic_info") {
          if (!hasBasicInfo) {
            links.push({ label: "Complete basic info", action: "edit-profile" });
          }
        }
      }
    }
  }

  // Fallback if breakdown not provided or yielded 0 items while profile has missing items
  if (links.length === 0) {
    if (!hasCoverImage) {
      links.push({ label: "Add banner", action: "add-cover" });
    }
    if (!hasAvatar) {
      links.push({ label: "Upload profile photo", action: "add-avatar" });
    }
    if (!hasExperience) {
      links.push({ label: "Add experience", action: "add-experience" });
    }
    if (!hasEducation) {
      links.push({ label: "Add education", action: "add-education" });
    }
    if (!hasSkills) {
      links.push({ label: "Add skills", action: "add-skills" });
    }
    if (!hasProjects) {
      links.push({ label: "Add a project", action: "add-project" });
    }
    if (!hasBasicInfo) {
      links.push({ label: "Complete basic info", action: "edit-profile" });
    }
  }

  // Deduplicate by action
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.action)) return false;
    seen.add(link.action);
    return true;
  });
}

/**
 * Profile Score card displayed on the user's own profile page.
 * Shows a percentage score, animated progress bar, and action links
 * for incomplete profile sections.
 *
 * Hidden when the score reaches 100%.
 */
export function ProfileScoreCard({ score, breakdown, onActionClick, hasExperience, hasEducation, hasProjects, hasAvatar, hasCoverImage }: ProfileScoreCardProps) {
  // Don't render when profile is fully complete
  if (Math.round(score) >= 100) return null;

  // Derive action links from categories that haven't earned full points
  const actionLinks = useMemo(() => {
    return getProfileScoreActionLinks({
      breakdown,
      hasExperience,
      hasEducation,
      hasProjects,
      hasAvatar,
      hasCoverImage,
    });
  }, [breakdown, hasExperience, hasEducation, hasProjects, hasAvatar, hasCoverImage]);

  // Clamp score to 0–100 range for display
  const displayScore = Math.min(100, Math.max(0, Math.round(score)));

  return (
    <div className="flex flex-col gap-2 px-4 md:px-[34px] py-4">
      <div className="flex flex-col items-start gap-[16px] p-4 rounded-[24px] bg-[#F9FAFF]">
        {/* Score text */}
        <div className="flex flex-col items-start gap-1">
          <span className="text-[18px] font-medium text-black leading-[26px] font-['DM_Sans']">
            Profile score: {displayScore}%
          </span>
          <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] font-['DM_Sans']">
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
            <span className="text-[12px] font-normal text-[#6B7280] leading-[16px] font-['DM_Sans'] whitespace-nowrap">
              Strengthen your profile:
            </span>
            {actionLinks.map((link) => (
              <button
                key={link.action}
                type="button"
                onClick={() => onActionClick(link.action)}
                className="flex items-center gap-1 px-2 py-2 rounded-[6px] bg-[#EEF2FF] text-[12px] font-normal text-[#6B7280] leading-[16px] font-['DM_Sans'] text-center hover:bg-[#E0E7FF] cursor-pointer transition-colors"
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
