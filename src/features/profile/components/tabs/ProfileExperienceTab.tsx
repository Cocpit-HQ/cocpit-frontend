import React, { useState } from "react";
import { ProfileEditIcon, OrgBuildingIcon, SkillsBulbIcon } from "@/components/icons";
import type { Experience } from "@/types/entities";
import { ProfileExperienceEmptyState, ProfileExperienceErrorState } from "../ProfileEmptyStates";

interface ProfileExperienceTabProps {
  experiences: Experience[];
  isOwnProfile?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEditExperience?: (experience: Experience, isNestedGroup: boolean) => void;
  onAddExperience?: () => void;
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

interface CompanyGroup {
  companyName: string;
  companyLogo?: string | null;
  logo_url?: string | null;
  items: Experience[];
}

import { ExpandableText } from "@/hooks";

export const ProfileExperienceTab: React.FC<ProfileExperienceTabProps> = ({
  experiences = [],
  isOwnProfile = true,
  isError,
  onRetry,
  onEditExperience,
  onAddExperience,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedCompanyRoles, setExpandedCompanyRoles] = useState<Record<string, boolean>>({});
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});

  const toggleCompanyRoles = (companyKey: string) => {
    setExpandedCompanyRoles((prev) => ({ ...prev, [companyKey]: !prev[companyKey] }));
  };

  const toggleSkills = (id: string) => {
    setExpandedSkills((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Group consecutive experiences belonging to the same company
  const companyGroups = React.useMemo(() => {
    const groups: CompanyGroup[] = [];
    let currentGroup: CompanyGroup | null = null;

    experiences.forEach((exp) => {
      const rawName = exp.company_name?.trim() || "Unknown Company";
      const normalizedName = rawName.toLowerCase();
      const orgId = (exp as any).org_id;
      const logo = exp.company_logo || (exp as any).company_logo_url || (exp as any).logo_url || (exp as any).logo;

      // Adjacency check based purely on the normalized company name, 
      // matching the visual representation the user sees.
      const isSameGroup = currentGroup && (currentGroup as any).normalizedName === normalizedName;

      if (isSameGroup) {
        currentGroup!.items.push(exp);
        if (!currentGroup!.companyLogo && logo) {
          currentGroup!.companyLogo = logo;
          currentGroup!.logo_url = logo;
        }
      } else {
        currentGroup = {
          companyName: rawName,
          companyLogo: logo,
          logo_url: logo,
          items: [exp],
        } as CompanyGroup;
        (currentGroup as any).orgId = orgId;
        (currentGroup as any).normalizedName = normalizedName;
        groups.push(currentGroup);
      }
    });
    return groups;
  }, [experiences]);

  if (isError) {
    return <ProfileExperienceErrorState onRetry={onRetry} />;
  }

  if (!experiences || experiences.length === 0) {
    return <ProfileExperienceEmptyState />;
  }

  // Show 2 companies by default, expand all on View more
  const displayedGroups = isExpanded ? companyGroups : companyGroups.slice(0, 2);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex flex-col items-start gap-5">
        {displayedGroups.map((group, gIdx) => {
          const groupKey = group.companyName.toLowerCase() || `${gIdx}`;
          const isGroupExpanded = !!expandedCompanyRoles[groupKey];
          const hasMultipleRoles = group.items.length > 1;
          const visibleRoles = isGroupExpanded ? group.items : group.items.slice(0, 1);

          return (
            <div key={gIdx} className="w-full flex flex-row items-start gap-3">
              {/* Frame 2608516: Company Logo (40x40px, rounded-[8px]) */}
              <div className="w-10 h-10 rounded-[8px] overflow-hidden flex items-center justify-center flex-shrink-0 bg-[var(--ds-surface-1)]">
                {group.companyLogo ? (
                  <img
                    src={group.companyLogo}
                    alt={group.companyName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <OrgBuildingIcon className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0" />
                )}
              </div>

              {/* Company Roles Content Column */}
              <div className="flex-1 flex flex-col items-start gap-3 min-w-0">
                {visibleRoles.map((exp, idx) => {
                  const isCurrent = exp.is_current || !exp.end_date;
                  const startDateFormatted = formatDate(exp.start_date);
                  const endDateFormatted = isCurrent ? "Present" : formatDate(exp.end_date);
                  const isLastVisibleRole = idx === visibleRoles.length - 1;

                  return (
                    <React.Fragment key={exp.experience_id || `${gIdx}-${idx}`}>
                      {/* Individual Role Entry */}
                      <div className="w-full flex flex-col items-start gap-3">
                        <div className="w-full flex flex-row items-start justify-between gap-2">
                          <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                            {/* Role Title */}
                            <div className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
                              {exp.title}
                            </div>

                            {/* Company • Employment Type */}
                            <div className="flex flex-row items-center gap-2 flex-wrap text-sm font-normal font-['DM_Sans'] leading-5 text-[var(--ds-text-primary)]">
                              <span>{group.companyName}</span>
                              {exp.work_type && (
                                <>
                                  <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full shrink-0" />
                                  <span>{exp.work_type}</span>
                                </>
                              )}
                            </div>

                            {/* Location • Work Mode */}
                            {(exp.location || exp.work_mode) && (
                              <div className="flex flex-row items-center gap-2 flex-wrap text-xs font-normal font-['DM_Sans'] leading-4 text-[var(--ds-text-secondary)]">
                                {exp.location && <span>{exp.location}</span>}
                                {exp.location && exp.work_mode && (
                                  <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full shrink-0" />
                                )}
                                {exp.work_mode && <span>{exp.work_mode}</span>}
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

                          {/* Edit Icon for Group (Top Level Only) */}
                          {isOwnProfile && onEditExperience && idx === 0 && (
                            <button
                              type="button"
                              onClick={() => onEditExperience(exp, hasMultipleRoles)}
                              className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
                              title="Edit experience group"
                            >
                              <ProfileEditIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
                            </button>
                          )}
                        </div>

                        {/* Description */}
                        {exp.description && (
                          <ExpandableText text={exp.description} />
                        )}

                        {/* Skills Used */}
                        {exp.skills && exp.skills.length > 0 && (() => {
                          const skills = exp.skills;
                          const expId = exp.experience_id || `${gIdx}-${idx}`;
                          const isSkillsExpanded = expandedSkills[expId];
                          const visibleSkills = isSkillsExpanded ? skills : skills.slice(0, 2);
                          const remainingCount = skills.length - 2;

                          return (
                            <div className="flex flex-row items-center gap-2 flex-wrap">
                              <SkillsBulbIcon className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" />
                              {visibleSkills.map((sk: any, sIdx: number) => {
                                const skName = typeof sk === "string" ? sk : sk.name || sk.skill_name;
                                return (
                                  <React.Fragment key={sIdx}>
                                    <span className="text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
                                      {skName}
                                    </span>
                                    {sIdx < visibleSkills.length - 1 && (
                                      <span className="text-[var(--ds-text-muted)] text-xs font-normal font-['DM_Sans'] leading-4">
                                        |
                                      </span>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                              {remainingCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => toggleSkills(expId)}
                                  className="flex flex-row items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                  <div className="w-7 h-0 border-t border-[var(--ds-accent)] flex-none" />
                                  <span className="text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4">
                                    {isSkillsExpanded ? "Show less" : `+${remainingCount} more`}
                                  </span>
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Vertical Connector with 4x4px Ellipse Badges between roles in the same company */}
                      {!isLastVisibleRole && (
                        <div className="h-6 px-1 flex items-center justify-start my-1 flex-none">
                          <svg
                            width="4"
                            height="24"
                            viewBox="0 0 4 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="text-[var(--ds-text-muted)] shrink-0"
                          >
                            <circle cx="2" cy="2" r="2" fill="currentColor" />
                            <line x1="2" y1="2" x2="2" y2="22" stroke="currentColor" strokeWidth="1" />
                            <circle cx="2" cy="22" r="2" fill="currentColor" />
                          </svg>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Multiple roles in company View more / View less button */}
                {hasMultipleRoles && (
                  <button
                    type="button"
                    onClick={() => toggleCompanyRoles(groupKey)}
                    className="flex flex-row items-center gap-1 h-4 self-stretch flex-none cursor-pointer hover:opacity-80 transition-opacity mt-3"
                  >
                    <div className="w-[30px] h-0 border-t border-[var(--ds-accent)] flex-none order-0" />
                    <span className="text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-1">
                      {isGroupExpanded ? "View less" : "View more"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {companyGroups.length > 2 && (
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

export default ProfileExperienceTab;
