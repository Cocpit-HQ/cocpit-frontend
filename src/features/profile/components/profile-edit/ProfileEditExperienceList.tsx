"use client";

import React from "react";
import { AddIcon, ProfileEditIcon } from "@/components/icons";
import type { Experience } from "@/types/entities";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import { ProfileExperienceEmptyState } from "../ProfileEmptyStates";

function formatMonthYear(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("MMM YYYY") : dateStr;
}

interface ProfileEditExperienceListProps {
  experiences: Experience[];
  onAddNew: () => void;
  onEditItem: (exp: Experience) => void;
}

export const ProfileEditExperienceList: React.FC<ProfileEditExperienceListProps> = ({
  experiences = [],
  onAddNew,
  onEditItem,
}) => {
  return (
    /* Frame 2609638: Main Box (w: 640px, gap: 16px, padding: 0px) */
    <div className="w-full max-w-full flex flex-col items-center p-0 gap-4 flex-none order-2 self-stretch flex-grow-0 animate-in fade-in duration-200">
      {/* Frame 2609752: First Title Box (w: 640px, h: 24px, px: 12px, justify-between) */}
      <div className="w-full max-w-full h-[24px] flex flex-row justify-between items-center px-0 gap-5 flex-none order-0 self-stretch flex-grow-0">
        {/* Frame 2609722: Left Title & Count Box (gap: 8px, h: 24px) */}
        <div className="flex flex-row items-center p-0 gap-2 h-[24px] flex-none order-0 flex-grow-0">
          {/* Experience Heading (DM Sans 16px Semibold, #FFECE6) */}
          <span className="font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-text-primary)] whitespace-nowrap flex-none order-0 flex-grow-0">
            Experience
          </span>

          {/* Ellipse 12: Dot Badge (4x4px, #726B67) */}
          <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)] flex-none order-1 flex-grow-0" />

          {/* Count Text (DM Sans 14px Regular, #B8ADA8) */}
          <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] whitespace-nowrap flex-none order-2 flex-grow-0">
            {experiences.length} {experiences.length === 1 ? "experience" : "experience"}
          </span>
        </div>

        {/* Plus Icon Button Right (Same as Skill) */}
        <button
          type="button"
          onClick={onAddNew}
          className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none focus:outline-none"
          title="Add Experience"
          aria-label="Add Experience"
        >
          <AddIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
        </button>
      </div>

      {/* List Container with 16px gap between items */}
      <div className="w-full max-w-full flex flex-col gap-4">
        {experiences.map((exp) => {
          const startDateStr = formatMonthYear(exp.start_date);
          const endDateStr = exp.is_current || !exp.end_date ? "Present" : formatMonthYear(exp.end_date);

          return (
            /* Frame 2608565: List Item Box (w: 640px, min-h: 104px, p: 8px 12px, gap: 12px, rounded: 8px, hover bg: #1A1A20) */
            <div
              key={exp.experience_id}
              className={cn(
                "min-h-[104px] flex flex-row justify-between items-start py-2 px-3 -mx-3 gap-3 rounded-[8px] transition-colors group bg-transparent hover:bg-[var(--ds-surface-1)]"
              )}
            >
              {/* Frame 2609612: Exp Details Box (gap: 4px) */}
              <div className="flex flex-col items-start p-0 gap-1 flex-1 min-w-0">
                {/* Role Title: DM Sans 16px Medium, #FFECE6 */}
                <span className="w-full font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] break-words block">
                  {exp.title}
                </span>

                {/* Frame 2608555: Org Name and Job Type Box (gap: 8px, h: 20px) */}
                <div className="flex flex-row items-center p-0 gap-2 h-[20px] max-w-full">
                  {/* Organization: DM Sans 14px Regular, #FFECE6 */}
                  <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] truncate block max-w-[200px] sm:max-w-[300px]">
                    {exp.company_name}
                  </span>

                  {exp.work_type && (
                    <>
                      {/* Dot Badge */}
                      <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)] flex-none order-1 flex-grow-0" />

                      {/* Job Type: DM Sans 14px Regular, #FFECE6 */}
                      <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-primary)] flex-none order-2 flex-grow-0">
                        {exp.work_type}
                      </span>
                    </>
                  )}
                </div>

                {/* Frame 2608563: Location Box (gap: 8px, h: 16px) */}
                <div className="flex flex-row items-center p-0 gap-2 h-[16px] flex-none order-2 flex-grow-0">
                  {/* Location Text: DM Sans 12px Regular, #B8ADA8 */}
                  {exp.location && (
                    <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex-none order-0 flex-grow-0">
                      {exp.location}
                    </span>
                  )}

                  {exp.location && exp.work_mode && (
                    <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)] flex-none order-1 flex-grow-0" />
                  )}

                  {/* Work Mode: DM Sans 12px Regular, #B8ADA8 */}
                  {exp.work_mode && (
                    <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex-none order-2 flex-grow-0">
                      {exp.work_mode}
                    </span>
                  )}
                </div>

                {/* Frame 2608554: Date Box (gap: 8px, h: 16px) */}
                <div className="flex flex-row items-center p-0 gap-2 h-[16px] flex-none order-3 flex-grow-0">
                  {/* Start Date: DM Sans 12px Regular, #B8ADA8 */}
                  {startDateStr && (
                    <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex-none order-0 flex-grow-0">
                      {startDateStr}
                    </span>
                  )}

                  {startDateStr && endDateStr && (
                    <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)] flex-none order-1 flex-grow-0" />
                  )}

                  {/* End Date / Present: DM Sans 12px Regular, #B8ADA8 */}
                  {endDateStr && (
                    <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex-none order-2 flex-grow-0">
                      {endDateStr}
                    </span>
                  )}
                </div>
              </div>

              {/* Edit Icon Right: 20x20px */}
              <button
                type="button"
                onClick={() => onEditItem(exp)}
                className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none order-1 flex-grow-0 focus:outline-none"
                aria-label="Edit role"
              >
                <ProfileEditIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
              </button>
            </div>
          );
        })}

        {experiences.length === 0 && (
          <ProfileExperienceEmptyState />
        )}
      </div>
    </div>
  );
};

export default ProfileEditExperienceList;
