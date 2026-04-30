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
    <div className="flex w-full items-start gap-4 sm:gap-6">
      {/* Logo Column */}
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
        ) : null}
      </div>

      {/* Content Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Connector Line above text for subsequent roles */}
        {!isFirst && (
          <div className="py-[12px] flex items-center pl-[2px]">
            <svg width="4" height="20" viewBox="0 0 4 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="2" cy="2" r="2" fill="#9CA3AF" />
              <line x1="2" y1="4" x2="2" y2="16" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="2" cy="18" r="2" fill="#9CA3AF" />
            </svg>
          </div>
        )}

        <div className="flex justify-between items-start w-full gap-4">
          {/* Left Text Content */}
          <div className="flex flex-col gap-2 flex-1 pr-4">
            <h3 className="text-[16px] leading-[22px] font-medium font-[family-name:var(--font-poppins)] text-[#111827]">
              {experience.title}
            </h3>
            
            {experience.description && (
              <p className="text-[13px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-[#374151]">
                {experience.description}
              </p>
            )}
            
            <div className="flex flex-col gap-0.5 mt-1">
              <p className="text-[13px] leading-[18px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                {experience.company_name}
              </p>
              {experience.location && (
                <p className="text-[13px] leading-[18px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                  {experience.location}
                </p>
              )}
            </div>
          </div>

          {/* Right Content: Dates, Types, Edit Icon */}
          <div className="flex items-start gap-4 flex-shrink-0 text-right mt-0.5">
            <div className="flex flex-col gap-1.5 text-[13px] leading-[18px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
              {(() => {
                const isInverted =
                  experience.end_date &&
                  new Date(experience.end_date) < new Date(experience.start_date);
                return (
                  <div className={`flex items-center justify-end gap-1.5 ${isInverted ? "text-red-500" : ""}`}>
                    {isInverted && (
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    )}
                    <span>{formatDate(experience.start_date)}</span>
                    <span>-</span>
                    <span className={!experience.end_date ? "text-[#374151]" : ""}>
                      {experience.end_date ? formatDate(experience.end_date) : "Present"}
                    </span>
                  </div>
                );
              })()}
              
              <div className="flex justify-end items-center gap-1.5">
                <span>{experience.work_type || "—"}</span>
                {experience.work_mode && (
                  <>
                    <span>-</span>
                    <span>{experience.work_mode}</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onEdit}
              className="flex-shrink-0 pt-0.5"
              aria-label={`Edit ${experience.title}`}
            >
              <Icon
                icon="eva:edit-outline"
                className="w-[20px] h-[20px] text-[#9CA3AF] hover:text-[#111827] transition-colors"
              />
            </button>
          </div>
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
    <div className="flex flex-col gap-0">
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
