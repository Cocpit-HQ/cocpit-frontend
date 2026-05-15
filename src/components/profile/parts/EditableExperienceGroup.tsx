"use client";

import React from "react";
import { Experience, ExperienceGroup } from "@/types/entities";
import { Icon } from "@iconify/react";
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
  return (
    <div className="flex group relative w-full items-start justify-between gap-6">
      {/* Left/Center Content: Logo + Info */}
      <div className="flex gap-4 flex-1 min-w-0">
        {/* Logo Section */}
        {/* <div className="flex-shrink-0 w-[56px] flex flex-col items-center relative">
          {isFirst ? (
            <div className={`w-[56px] h-[40px] rounded-[20px] overflow-hidden flex items-center justify-center ${logoUrl ? 'bg-transparent' : 'bg-[#EEF2FF]'}`}>
              <img
                src={logoUrl || "/assets/company-placeholder.png"}
                alt={experience.company_name}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";
                }}
              />
            </div>
          ) : (
            <div className="w-[56px] h-[56px]" aria-hidden="true" />
          )}
        </div> */}
        {/* <div className="flex-shrink-0 w-[56px] flex flex-col items-center relative">
          {isFirst ? (
            <div className="flex flex-row justify-center items-center border-[1px] border-[#E5E7EB] gap-[10px] w-[56px] h-[40px] rounded-[24px] overflow-hidden flex-none">
              <img
                src={logoUrl || "/assets/company-placeholder.png"}
                alt={experience.company_name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";
                }}
              />
            </div>
          ) : (
            <div className="w-[56px] h-[56px]" aria-hidden="true" />
          )}
        </div> */}
        <div className="flex-shrink-0 w-[56px] flex flex-col items-center relative">
          {isFirst ? (
            <div className="flex flex-row justify-center items-center w-[56px] h-[40px] rounded-[24px] overflow-hidden flex-none bg-white border border-[#E5E7EB]">
              <img
                src={logoUrl || "/assets/company-placeholder.png"}
                alt={experience.company_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";
                }}
              />
            </div>
          ) : (
            <div className="w-[56px] h-[56px]" aria-hidden="true" />
          )}
        </div>
        {/* Middle Section: Roles and Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h3 className="text-[16px] leading-[22px] font-semibold font-[family-name:var(--font-poppins)] text-foreground mb-[8px]">
              {experience.title}
            </h3>

            {experience.description && (
              <p className="text-[12px] leading-[16px] tracking-normal font-normal font-[family-name:var(--font-poppins)] text-foreground line-clamp-2 mb-[10px]">
                {experience.description}
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

      {/* Right Column: Metadata + Edit Button (Fixed 220px) */}
      <div className="flex flex-row items-start justify-end flex-shrink-0 w-[220px] gap-[16px] ml-auto">
        <div className="flex flex-col items-start p-0 gap-[8px] w-[130px]">

            {/* Row 1: Date range */}
            <div className="flex flex-row items-center gap-[8px]">
              <span className="w-[60px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap flex-none">
                {formatDate(experience.start_date)}
              </span>
              <span className="w-[9px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-muted-foreground flex-none">
                -
              </span>
              <span className="w-[75px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap flex-grow">
                {experience.end_date ? formatDate(experience.end_date) : 'Present'}
              </span>
            </div>

            {/* Row 2: Work type and mode */}
            <div className="flex flex-row items-center gap-[8px]">
              <span className="w-[60px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap flex-none">
                {experience.work_type || 'Full time'}
              </span>
              <span className="w-[9px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-muted-foreground flex-none">
                -
              </span>
              <span className="w-[75px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap flex-grow">
                {experience.work_mode || 'Remote'}
              </span>
            </div>

        </div>
        <div className="w-[32px] flex justify-end flex-shrink-0">
          {isFirst && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-secondary rounded-full transition-colors group mt-[-4px]"
              aria-label={`Edit ${experience.title}`}
            >
              <Icon
                icon="eva:edit-outline"
                className="w-[24px] h-[24px] text-muted-foreground stroke-[1.5px] group-hover:text-primary transition-colors"
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
