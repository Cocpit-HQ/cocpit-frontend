"use client";

import React from "react";
import { Experience, ExperienceGroup } from "@/types/entities";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { RoleSelectionPopup } from "./RoleSelectionPopup";

interface EditableExperienceGroupProps {
  group: ExperienceGroup;
  onEdit: (exp: Experience) => void;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

function RoleRow({
  experience,
  onEdit,
  isFirst,
  logoUrl,
}: {
  experience: Experience;
  onEdit: () => void;
  isFirst: boolean;
  logoUrl?: string | null;
}) {
  const [isDescExpanded, setIsDescExpanded] = React.useState(false);

  const isLongDescription = experience.description && experience.description.length > 160;

  const displayDescription = React.useMemo(() => {
    if (!experience.description) return "";
    if (isDescExpanded || !isLongDescription) return experience.description;
    
    const truncated = experience.description.slice(0, 160);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 50) {
      return truncated.slice(0, lastSpace);
    }
    return truncated;
  }, [experience.description, isDescExpanded, isLongDescription]);

  return (
    <div className="flex flex-col md:flex-row group relative w-full items-start justify-between gap-3 md:gap-6">
      {/* Left/Center Content: Logo + Info */}
      <div className="flex gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-[56px] flex flex-col items-center relative">
          {isFirst ? (
            <div className={cn(
              "flex flex-row justify-center items-center w-[56px] h-[40px] rounded-[24px] overflow-hidden flex-none",
              logoUrl ? "bg-white border border-[#E5E7EB]" : "bg-[#E0E7FF] px-[16px] py-[8px]"
            )}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={experience.company_name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";
                  }}
                />
              ) : (
                <Icon icon="hugeicons:job-search" className="w-6 h-6 text-primary" style={{ strokeWidth: '1.5px' }} />
              )}
            </div>
          ) : (
            <div className="w-[56px] h-[56px]" aria-hidden="true" />
          )}
        </div>
        {/* Middle Section: Roles and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex justify-between items-start w-full">
              <h3 className="text-[16px] leading-[22px] font-semibold font-[family-name:var(--font-poppins)] text-foreground mb-[8px]">
                {experience.title}
              </h3>
              {/* Edit button for mobile */}
              <div className="md:hidden flex-shrink-0">
                {isFirst && (
                  <button
                    onClick={onEdit}
                    className="p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
                    aria-label={`Edit ${experience.title}`}
                  >
                    <Icon
                      icon="eva:edit-outline"
                      className="w-[20px] h-[20px] stroke-[1.5px] transition-colors"
                    />
                  </button>
                )}
              </div>
            </div>

            {experience.description && (
              <p className="text-[12px] leading-[16px] tracking-normal font-normal font-[family-name:var(--font-poppins)] text-foreground mb-[10px] break-words">
                {displayDescription}
                {!isDescExpanded && isLongDescription && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescExpanded(true);
                    }}
                    className="text-muted-foreground hover:text-primary font-semibold transition-colors cursor-pointer ml-1 inline-flex items-center"
                  >
                    ... More
                  </button>
                )}
                {isDescExpanded && isLongDescription && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescExpanded(false);
                    }}
                    className="text-primary hover:underline ml-1 font-medium cursor-pointer inline-flex items-center"
                  >
                    See less
                  </button>
                )}
              </p>
            )}

            <div className="flex flex-col gap-[8px]">
              <p className="text-[12px] leading-[16px] tracking-normal  font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                {experience.company_name}
              </p>
              {experience.location && (
                <p className="text-[12px] leading-[16px] tracking-normal  font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                  {experience.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Metadata + Edit Button */}
      <div className="flex flex-row items-start justify-between md:justify-end flex-shrink-0 w-full md:w-[220px] gap-[12px] md:gap-[16px] md:ml-auto pl-[72px] md:pl-0 hidden md:flex">
        <div className="flex flex-col items-start p-0 gap-[8px] md:w-[130px]">

            {/* Row 1: Date range */}
            <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-x-[8px] gap-y-[4px]">
              <span className="md:w-[60px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                {formatDate(experience.start_date)}
              </span>
              <span className="md:w-[9px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-muted-foreground">
                -
              </span>
              <span className="md:w-[75px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                {experience.end_date ? formatDate(experience.end_date) : 'Present'}
              </span>
            </div>

            {/* Row 2: Work type and mode */}
            <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-x-[8px] gap-y-[4px]">
              <span className="md:w-[60px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                {experience.work_type || 'Full time'}
              </span>
              <span className="md:w-[9px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-muted-foreground">
                -
              </span>
              <span className="md:w-[75px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                {experience.work_mode || 'Remote'}
              </span>
            </div>

        </div>
        <div className="w-[32px] flex justify-end flex-shrink-0">
          {isFirst && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
              aria-label={`Edit ${experience.title}`}
            >
              <Icon
                icon="eva:edit-outline"
                className="w-[24px] h-[24px] stroke-[1.5px] transition-colors"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EditableExperienceGroup({
  group,
  onEdit,
}: EditableExperienceGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showRoleSelector, setShowRoleSelector] = React.useState(false);

  const hasMore = group.experiences.length > 2;
  const displayedExperiences = isExpanded ? group.experiences : group.experiences.slice(0, 2);

  return (
    <div className="flex flex-col py-4">
      {displayedExperiences.map((exp, index) => (
        <React.Fragment key={`${exp.experience_id}-${index}`}>
          {index > 0 && (
            <div className="relative h-12 w-full">
              <div className="absolute left-[76px] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center h-[24px] pointer-events-none">
                {/* The vertical line */}
                <div className="w-[1px] h-full bg-muted-foreground relative">
                  {/* Top dot centered on the start of the line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-[4px] rounded-full bg-muted-foreground" />
                  {/* Bottom dot centered on the end of the line */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[4px] h-[4px] rounded-full bg-muted-foreground" />
                </div>
              </div>
            </div>
          )}
          <div className="w-full">
            <RoleRow
              experience={exp}
              onEdit={() => {
                if (group.experiences.length === 1) {
                  onEdit(exp);
                } else {
                  setShowRoleSelector(true);
                }
              }}
              isFirst={index === 0}
              logoUrl={group.logo_url}
            />
          </div>
        </React.Fragment>
      ))}

      {hasMore && (
        <div className="flex pl-[72px] mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-[58px] h-[16px] flex items-center justify-center text-[12px] leading-[16px] font-medium text-[#6366F1] font-[family-name:var(--font-poppins)] transition-all flex-none"
          >
            {isExpanded ? "See less" : "See more"}
          </button>
        </div>
      )}

      {showRoleSelector && (
        <RoleSelectionPopup
          roles={group.experiences}
          logoUrl={group.logo_url}
          onSelect={(role) => {
            setShowRoleSelector(false);
            onEdit(role);
          }}
          onClose={() => setShowRoleSelector(false)}
        />
      )}
    </div>
  );
}
