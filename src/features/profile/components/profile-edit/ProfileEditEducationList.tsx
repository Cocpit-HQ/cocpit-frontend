"use client";

import React from "react";
import { AddIcon, ProfileEditIcon } from "@/components/icons";
import type { Education } from "@/types/entities";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { ProfileEducationEmptyState } from "../ProfileEmptyStates";

function formatMonthYear(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("MMM YYYY") : dateStr;
}

interface ProfileEditEducationListProps {
  educations: Education[];
  onAddNew: () => void;
  onEditItem: (edu: Education) => void;
}

export const ProfileEditEducationList: React.FC<ProfileEditEducationListProps> = ({
  educations = [],
  onAddNew,
  onEditItem,
}) => {
  return (
    <div className="w-full max-w-full flex flex-col items-center p-0 gap-4 flex-none order-2 self-stretch flex-grow-0 animate-in fade-in duration-200">
      {/* First Title Box */}
      <div className="self-stretch px-0 inline-flex justify-between items-center h-[24px]">
        <div className="flex justify-start items-center gap-2">
          <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
            Education
          </span>

          <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)]" />

          <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)]">
            {educations.length} {educations.length === 1 ? "education" : "education"}
          </span>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          title="Add Education"
          aria-label="Add Education"
        >
          <AddIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
        </button>
      </div>

      {/* List Container */}
      <div className="w-full max-w-full flex flex-col gap-4">
        {educations.map((edu) => {
          const startDateStr = formatMonthYear(edu.start_date);
          const endDateStr = (edu as any).is_current || !edu.end_date ? "Present" : formatMonthYear(edu.end_date);

          return (
            <div
              key={edu.education_id}
              className={cn(
                "min-h-[64px] px-3 py-2 -mx-3 rounded-lg flex flex-row justify-between items-start gap-3 hover:bg-[var(--ds-surface-1)] transition-colors group flex-none order-1 self-stretch flex-grow-0"
              )}
            >
              <div className="flex flex-col justify-start items-start gap-1 flex-1 min-w-0">
                <span className="w-full font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] break-words block">
                  {edu.school_name}
                </span>

                <div className="flex flex-row items-center gap-2 max-w-full">
                  <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] truncate block max-w-[200px] sm:max-w-[300px]">
                    {edu.degree}
                  </span>

                  {edu.field_of_study && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)]" />
                      <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)]">
                        {edu.field_of_study}
                      </span>
                    </>
                  )}
                </div>

                {edu.location && (
                  <div className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)]">
                    {edu.location}
                  </div>
                )}

                <div className="flex flex-row items-center gap-2">
                  {startDateStr && (
                    <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)]">
                      {startDateStr}
                    </span>
                  )}

                  {startDateStr && endDateStr && (
                    <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)]" />
                  )}

                  {endDateStr && (
                    <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)]">
                      {endDateStr}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEditItem(edu)}
                className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer focus:outline-none shrink-0"
                aria-label="Edit education"
              >
                <ProfileEditIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
              </button>
            </div>
          );
        })}

        {educations.length === 0 && (
          <ProfileEducationEmptyState />
        )}
      </div>
    </div>
  );
};

export default ProfileEditEducationList;

