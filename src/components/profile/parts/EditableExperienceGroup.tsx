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
        <div className="flex justify-between items-start w-full gap-4">
          {/* Group 1: Logo + Middle Content */}
          <div className="flex gap-4 flex-1 min-w-0">
            {/* Logo Section */}
            <div className="flex-shrink-0 w-[56px] flex flex-col items-center">
              {isFirst ? (
                <div className="w-[56px] h-[56px] rounded-full overflow-hidden bg-card border border-border flex items-center justify-center shadow-sm">
                  <img
                    src={logoUrl || "/assets/company-placeholder.png"}
                    alt={experience.company_name}
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";
                    }}
                  />
                </div>
              ) : (
                <div className="w-[56px] h-full flex flex-col items-center">
                  <div className="w-1 h-full bg-[#E5E7EB] rounded-full opacity-50" />
                </div>
              )}
            </div>

            {/* Middle Section: Roles and Details */}
            <div className="flex-1 flex flex-col pt-1">
              <h3 className="text-[16px] leading-[22px] font-semibold font-[family-name:var(--font-poppins)] text-[#111827]">
                {experience.title}
              </h3>
              
              {experience.description && (
                <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#374151] mt-1 mb-2">
                  {experience.description}
                </p>
              )}
              
              <div className="flex flex-col gap-0.5">
                <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                  {experience.company_name}
                </p>
                {experience.location && (
                  <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                    {experience.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Group 2: Right Section (Dates + Work Type + Edit Icon) */}
          <div className="flex-shrink-0 w-[200px] flex items-start gap-4 justify-end pt-1">
            <div className="flex flex-col items-end text-right">
              <div className="text-[14px] leading-[22px] font-normal font-[family-name:var(--font-poppins)] text-[#111827]">
                {(() => {
                  const isInverted =
                    experience.end_date &&
                    new Date(experience.end_date) < new Date(experience.start_date);
                  return (
                    <div className={`flex items-center justify-end gap-1.5 whitespace-nowrap ${isInverted ? "text-red-500" : ""}`}>
                      <span>{formatDate(experience.start_date)}</span>
                      <span className="text-[#9CA3AF]">—</span>
                      <span>{experience.end_date ? formatDate(experience.end_date) : "Present"}</span>
                    </div>
                  );
                })()}
              </div>
              <div className="text-[13px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                {experience.work_type || "Full time"} — {experience.work_mode || "Remote"}
              </div>
            </div>

            {/* Edit Icon */}
            <div className="w-8 flex justify-end">
              {isFirst && (
                <button
                  onClick={onEdit}
                  className="p-1 hover:bg-secondary rounded-full transition-colors group mt-[-4px]"
                  aria-label={`Edit ${experience.title}`}
                >
                  <Icon
                    icon="eva:edit-outline"
                    className="w-[20px] h-[20px] text-[#9CA3AF] group-hover:text-[#111827] transition-colors"
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
    <div className="flex flex-col gap-12 py-8">
      {group.experiences.map((exp, index) => (
        <RoleRow
          key={exp.experience_id}
          experience={exp}
          onEdit={() => onEdit(exp)}
          isFirst={index === 0}
          logoUrl={group.logo_url}
        />
      ))}
    </div>
  );
}
