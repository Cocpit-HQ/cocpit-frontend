"use client";

import React from "react";
import { AddIcon, ProfileEditIcon } from "@/components/icons";
import type { Project } from "@/types/entities";

function formatProjectDate(month?: string | null, year?: string | null): string {
  if (!year && !month) return "";
  const MONTHS = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  let mFormatted = "";
  if (month) {
    const num = parseInt(month, 10);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      mFormatted = MONTHS[num - 1];
    } else {
      mFormatted = month.length > 3 ? month.slice(0, 3) : month;
    }
  }
  return [mFormatted, year].filter(Boolean).join(" ");
}

interface ProfileEditProjectListProps {
  projects: Project[];
  onAddNew: () => void;
  onEditItem: (proj: Project) => void;
}

export const ProfileEditProjectList: React.FC<ProfileEditProjectListProps> = ({
  projects = [],
  onAddNew,
  onEditItem,
}) => {
  return (
    /* Frame 2609638: Main Box (w: 640px, gap: 16px, padding: 0px) */
    <div className="w-[640px] max-w-full flex flex-col items-center p-0 gap-4 flex-none order-2 self-stretch flex-grow-0 animate-in fade-in duration-200">
      {/* Frame 2609752: First Title Box (w: 640px, h: 24px, px: 12px, justify-between) */}
      <div className="w-[640px] max-w-full h-[24px] flex flex-row justify-between items-center px-3 gap-5 flex-none order-0 self-stretch flex-grow-0">
        {/* Frame 2609722: Left Title & Count Box (gap: 8px, h: 24px) */}
        <div className="flex flex-row items-center p-0 gap-2 h-[24px] flex-none order-0 flex-grow-0">
          {/* Project Heading (DM Sans 16px Semibold, #FFECE6) */}
          <span className="font-['DM_Sans'] font-semibold text-[16px] leading-[24px] text-[var(--ds-text-primary)] flex-none order-0 flex-grow-0">
            Project
          </span>

          {/* Ellipse 12: Dot Badge (4x4px, #726B67) */}
          <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)] flex-none order-1 flex-grow-0" />

          {/* Count Text (DM Sans 14px Regular, #B8ADA8) */}
          <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-[var(--ds-text-secondary)] flex-none order-2 flex-grow-0">
            {projects.length} {projects.length === 1 ? "project" : "project"}
          </span>
        </div>

        {/* Plus Icon Button Right */}
        <button
          type="button"
          onClick={onAddNew}
          className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none focus:outline-none"
          title="Add Project"
          aria-label="Add Project"
        >
          <AddIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
        </button>
      </div>

      {/* List Container with 16px gap between items */}
      <div className="w-[640px] max-w-full flex flex-col gap-4 flex-none order-1 self-stretch flex-grow-0">
        {projects.map((proj) => {
          const startDateFormatted = formatProjectDate(proj.start_month, proj.start_year);
          const endDateFormatted = proj.is_current
            ? "Present"
            : formatProjectDate(proj.end_month, proj.end_year);

          return (
            /* Frame 2608627: Item Box (w: 640px, min-h: 64px, p: 8px 12px, gap: 12px, rounded: 8px) */
            <div
              key={proj.project_id}
              className="w-[640px] max-w-full min-h-[64px] px-3 py-2 rounded-lg flex flex-row justify-between items-start gap-3 hover:bg-[var(--ds-surface-1)] transition-colors group flex-none order-1 self-stretch flex-grow-0"
            >
              {/* Frame 2609618: Details Box (flex column, gap: 8px) */}
              <div className="flex flex-col items-start p-0 gap-2 flex-1 min-w-0 flex-none order-0 flex-grow-1">
                {/* Project Title (DM Sans 16px Medium, #FFECE6) */}
                <div className="text-left font-['DM_Sans'] font-medium text-[16px] leading-[24px] text-[var(--ds-text-primary)] truncate max-w-full flex-none order-0 flex-grow-0">
                  {proj.title}
                </div>

                {/* Frame 2608554: Date Range Box (flex row, gap: 8px, h: 16px) */}
                {(startDateFormatted || endDateFormatted) && (
                  <div className="h-[16px] flex flex-row items-center p-0 gap-2 flex-none order-1 flex-grow-0">
                    {startDateFormatted && (
                      <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex-none order-0 flex-grow-0">
                        {startDateFormatted}
                      </span>
                    )}
                    {startDateFormatted && endDateFormatted && (
                      <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)] flex-none order-1 flex-grow-0" />
                    )}
                    {endDateFormatted && (
                      <span className="font-['DM_Sans'] font-normal text-[12px] leading-[16px] text-[var(--ds-text-secondary)] flex-none order-2 flex-grow-0">
                        {endDateFormatted}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Edit Icon Button Right (20x20px) */}
              <button
                type="button"
                onClick={() => onEditItem(proj)}
                className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-none order-1 flex-grow-0 focus:outline-none shrink-0"
                aria-label="Edit project"
              >
                <ProfileEditIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
              </button>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="w-full py-12 flex flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm text-[var(--ds-text-secondary)] font-['DM_Sans']">
              No projects added yet. Click + to add your first project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileEditProjectList;

