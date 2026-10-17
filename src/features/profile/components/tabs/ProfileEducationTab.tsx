import React, { useState } from "react";
import { ProfileEditIcon, EduGraduationIcon } from "@/components/icons";
import type { Education } from "@/types/entities";
import { ProfileEducationEmptyState, ProfileEducationErrorState } from "../ProfileEmptyStates";

interface ProfileEducationTabProps {
  educations: Education[];
  isOwnProfile?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEditEducation?: (education: Education) => void;
  onAddEducation?: () => void;
}

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  try {
    // Parse year/month from the string directly to avoid UTC-to-local timezone
    // shift: new Date("YYYY-MM-DD") is treated as UTC midnight by the spec,
    // which causes month shifting for users in UTC-negative timezones.
    const parts = dateStr.split("T")[0].split("-").map(Number);
    const year = parts[0];
    const month = parts[1];
    if (!year || !month) return "";
    // Construct using local-time constructor — no UTC conversion
    const d = new Date(year, month - 1, 1);
    const monthStr = d.toLocaleDateString("en-US", { month: "short" }).replace(/\./g, "");
    return `${monthStr} ${year}`;
  } catch {
    return "";
  }
};

import { ExpandableText } from "@/hooks";

export const ProfileEducationTab: React.FC<ProfileEducationTabProps> = ({
  educations = [],
  isOwnProfile = true,
  isError,
  onRetry,
  onEditEducation,
  onAddEducation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isError) {
    return <ProfileEducationErrorState onRetry={onRetry} />;
  }

  if (!educations || educations.length === 0) {
    return <ProfileEducationEmptyState />;
  }

  const displayedEducations = isExpanded ? educations : educations.slice(0, 2);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex flex-col items-start gap-5">
        {displayedEducations.map((edu, idx) => {
          const startDateFormatted = formatDate(edu.start_date);
          const endDateFormatted = edu.end_date ? formatDate(edu.end_date) : "Present";

          return (
            <div key={edu.education_id || idx} className="w-full flex flex-row items-start gap-3">
              {/* Institution Icon / Placeholder (40x40px, rounded-[8px]) */}
              <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                <EduGraduationIcon className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0" />
              </div>

              {/* Education Details Column */}
              <div className="flex-1 flex flex-col items-start gap-3 min-w-0">
                <div className="w-full flex flex-row items-start justify-between gap-2">
                  <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                    {/* Institution Name */}
                    <div className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
                      {edu.school_name}
                    </div>

                    {/* Degree • Field of Study */}
                    {(edu.degree || edu.field_of_study) && (
                      <div className="flex flex-row items-center gap-2 flex-wrap text-sm font-normal font-['DM_Sans'] leading-5 text-[var(--ds-text-primary)]">
                        {edu.degree && <span>{edu.degree}</span>}
                        {edu.degree && edu.field_of_study && (
                          <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full shrink-0" />
                        )}
                        {edu.field_of_study && <span>{edu.field_of_study}</span>}
                      </div>
                    )}

                    {/* Location */}
                    {edu.location && (
                      <div className="text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4">
                        {edu.location}
                      </div>
                    )}

                    {/* Date Range */}
                    {(startDateFormatted || endDateFormatted) && (
                      <div className="flex flex-row items-center gap-2 flex-wrap text-xs font-normal font-['DM_Sans'] leading-4 text-[var(--ds-text-secondary)]">
                        <span>{startDateFormatted}</span>
                        <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full shrink-0" />
                        <span>{endDateFormatted}</span>
                      </div>
                    )}
                  </div>

                  {/* Edit Icon for Own Profile */}
                  {isOwnProfile && onEditEducation && (
                    <button
                      type="button"
                      onClick={() => onEditEducation(edu)}
                      className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
                      title="Edit education"
                    >
                      <ProfileEditIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
                    </button>
                  )}
                </div>

                {/* Description */}
                {edu.description && (
                  <ExpandableText text={edu.description} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {educations.length > 2 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-[60px] h-[16px] text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-2 grow-0 cursor-pointer hover:opacity-80 transition-opacity mt-2 self-center flex items-center justify-center p-0 outline-none"
        >
          {isExpanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
};

export default ProfileEducationTab;
