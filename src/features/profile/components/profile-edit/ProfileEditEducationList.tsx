"use client";

import React from "react";
import { AddIcon, ProfileEditIcon } from "@/components/icons";
import type { Education } from "@/types/entities";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";

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
    <div className="w-[640px] max-w-full flex flex-col items-center p-0 gap-4 flex-none order-2 self-stretch flex-grow-0 animate-in fade-in duration-200">
      {/* First Title Box */}
      <div className="self-stretch px-3 inline-flex justify-between items-center h-[24px]">
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
      <div className="w-[640px] max-w-full flex flex-col gap-4">
        {educations.map((edu) => {
          const startDateStr = formatMonthYear(edu.start_date);
          const endDateStr = (edu as any).is_current || !edu.end_date ? "Present" : formatMonthYear(edu.end_date);

          return (
            <div
              key={edu.education_id}
              className={cn(
                "self-stretch px-3 py-2 rounded-lg inline-flex justify-between items-start transition-colors group bg-transparent hover:bg-[var(--ds-surface-1)]"
              )}
            >
              <div className="flex flex-col justify-start items-start gap-1">
                <span className="font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)]">
                  {edu.school_name}
                </span>

                <div className="flex flex-row items-center gap-2">
                  <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)]">
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
          <div className="w-full py-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex items-center justify-center text-[var(--ds-text-secondary)]">
              <AddIcon className="w-6 h-6 text-[var(--ds-text-secondary)]" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-[16px] font-semibold text-[var(--ds-text-primary)] font-['DM_Sans'] leading-[24px]">
                No education added yet
              </h3>
              <p className="text-[14px] text-[var(--ds-text-secondary)] font-['DM_Sans'] leading-[20px] max-w-sm">
                Add your school, degree, and field of study to complete your profile.
              </p>
            </div>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-2 px-4 py-1.5 rounded-[100px] bg-[var(--ds-accent)] text-[#030303] text-[16px] font-medium font-['DM_Sans'] leading-[24px] hover:opacity-90 active:scale-95 transition-all cursor-pointer focus:outline-none"
            >
              Add education
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileEditEducationList;

