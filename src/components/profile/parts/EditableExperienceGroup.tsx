"use client";

import React from "react";
import { Experience, ExperienceGroup } from "@/types/entities";
import { Icon } from "@iconify/react";

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
          <div className="flex flex-col gap-1">
            <h3 className="text-[16px] leading-[22px] font-semibold font-[family-name:var(--font-poppins)] text-[#111827]">
              {experience.title}
            </h3>

            {experience.description && (
              <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#374151] line-clamp-2">
                {experience.description}
              </p>
            )}

            <div className="flex flex-col gap-0.5">
              <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                {experience.company_name}
              </p>
              {experience.location && (
                <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                  {experience.location}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Metadata + Edit Button (Fixed 220px) */}
      <div className="flex items-start flex-shrink-0 w-[220px] ml-auto">
        <div className="flex flex-col items-end w-full">
          <div className="flex flex-col items-start p-0 gap-[8px] mx-auto w-[130px]">

            {/* Row 1: Date range */}
            <div className="flex flex-row items-center gap-[8px]">
              <span className="w-[60px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-[#6B7280] whitespace-nowrap flex-none">
                {formatDate(experience.start_date)}
              </span>
              <span className="w-[9px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-[#6B7280] flex-none">
                -
              </span>
              <span className="w-[75px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-[#6B7280] whitespace-nowrap flex-grow">
                {experience.end_date ? formatDate(experience.end_date) : 'Present'}
              </span>
            </div>

            {/* Row 2: Work type and mode */}
            <div className="flex flex-row items-center gap-[8px]">
              <span className="w-[60px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-[#6B7280] whitespace-nowrap flex-none">
                {experience.work_type || 'Full time'}
              </span>
              <span className="w-[9px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-[#6B7280] flex-none">
                -
              </span>
              <span className="w-[75px] h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-[#6B7280] whitespace-nowrap flex-grow">
                {experience.work_mode || 'Remote'}
              </span>
            </div>

          </div>
        </div>
        <div className="w-8 flex justify-end flex-shrink-0">
          {isFirst && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-secondary rounded-full transition-colors group mt-[-4px]"
              aria-label={`Edit ${experience.title}`}
            >
              <Icon
                icon="eva:edit-outline"
                className="w-[24px] h-[24px] text-[#6B7280] stroke-[1.5px] group-hover:text-[#111827] transition-colors"
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
  return (
    <div className="flex flex-col py-8">
      {group.experiences.map((exp, index) => (
        <React.Fragment key={exp.experience_id}>
          {index > 0 && (
            <div className="relative h-12 w-full">
              <div className="absolute left-[76px] top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center h-[24px] pointer-events-none">
                {/* The vertical line */}
                <div className="w-[1px] h-full bg-[#6B7280] relative">
                  {/* Top dot centered on the start of the line */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[4px] h-[4px] rounded-full bg-[#6B7280]" />
                  {/* Bottom dot centered on the end of the line */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[4px] h-[4px] rounded-full bg-[#6B7280]" />
                </div>
              </div>
            </div>
          )}
          <div className="w-full">
            <RoleRow
              experience={exp}
              onEdit={() => onEdit(exp)}
              isFirst={index === 0}
              logoUrl={group.logo_url}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
