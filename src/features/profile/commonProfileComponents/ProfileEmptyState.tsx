"use client";

import React from "react";
import { Icon } from "@iconify/react";

export interface ProfileEmptyStateProps {
  type: "post" | "experience" | "education";
  isOwnProfile: boolean;
  userName?: string; // for post public: "[name] hasn't posted"
  onCreateClick?: () => void; // for personal post create button
}

export function ProfileEmptyState({
  type,
  isOwnProfile,
  userName,
  onCreateClick,
}: ProfileEmptyStateProps) {
  // ── Post Empty State ─────────────────────────────────────────────────────────
  if (type === "post") {
    if (!isOwnProfile) {
      // Public post empty state
      return (
        <div className="flex flex-col justify-center items-center p-[10px] gap-4 w-[904px] h-[246.44px] bg-white shadow-[0px_0px_4px_rgba(99,102,241,0.05)] rounded-[24px] self-stretch ">
          {/* Content container */}
          <div className="flex flex-col justify-center items-center p-0 gap-4 w-[218px] ">
            {/* Image */}
            <img
              src="/images/emptyScreenImages/emptyPost.svg"
              alt="No posts yet"
              className="w-[218px] h-[162.44px] object-contain"
            />

            {/* Text container */}
            <div className="flex flex-col items-center px-[7px] py-0 gap-2 w-[204px] h-12">
              {/* Title */}
              <span className="w-[86px] h-6 font-[family-name:var(--font-poppins)] font-medium text-base leading-6 text-center text-black whitespace-nowrap">
                No activity
              </span>

              {/* Subtitle */}
              <span className=" h-4 font-[family-name:var(--font-poppins)] font-normal text-xs leading-4 text-center text-[#6B7280] whitespace-nowrap overflow-hidden text-ellipsis">
                <span className="font-medium">{userName || "User"}</span>
                {" hasn't posted anything yet"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Personal post empty state (isOwnProfile === true)
    return (
      <div className="flex flex-col justify-center items-center p-[10px] gap-4 w-[904px] h-[298.44px] bg-white shadow-[0px_0px_4px_rgba(99,102,241,0.05)] rounded-[24px] self-stretch ">
        {/* Content container */}
        <div className="flex flex-col items-center gap-4 w-[507px] ">
          {/* Image */}
          <img
            src="/images/emptyScreenImages/emptyPost.svg"
            alt="No posts yet"
            className="w-[218px] h-[162.44px] object-contain"
          />

          {/* Text container */}
          <div className="flex flex-col items-center p-0 gap-2 w-[507px] ">
            {/* Title */}
            <span className="w-[260px] h-5 font-[family-name:var(--font-poppins)] font-normal text-sm leading-5 text-center text-black whitespace-nowrap">
              Start building your professional story
            </span>

            {/* Subtitle */}
            <span className="w-[507px] h-4 font-[family-name:var(--font-poppins)] font-normal text-xs leading-4 text-center text-[#6B7280] whitespace-nowrap">
              Share projects, progress, ideas, or learning moments to grow your
              network presence.
            </span>
          </div>

          {/* Create button */}
          <button
            onClick={onCreateClick}
            className="flex flex-row justify-center items-center px-4 py-2 gap-[10px] w-[122px] h-10 bg-[#6366F1] rounded-[24px] border-none cursor-pointer"
          >
            <span className="font-[family-name:var(--font-poppins)] font-medium text-sm leading-5 text-white">
              Create
            </span>
            <Icon icon="ic:round-add" className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // ── Experience Empty State ───────────────────────────────────────────────────
  if (type === "experience") {
    return (
      <div className="flex flex-col justify-center items-center p-0 gap-4 w-[904px] h-[254.44px] bg-white shadow-[0px_0px_4px_rgba(99,102,241,0.05)] rounded-[24px] self-stretch   ">
        {/* Image */}
        <img
          src="/images/emptyScreenImages/emptyExp.svg"
          alt="No experience yet"
          className="w-[218px] h-[162.44px] object-contain"
        />

        {/* Text container */}
        <div className="flex flex-col items-center p-0 gap-2 w-[396px] h-11">
          {/* Title */}
          <span className="w-[170px] h-5 font-[family-name:var(--font-poppins)] font-normal text-sm leading-5 text-center text-black whitespace-nowrap">
            Every experience counts
          </span>

          {/* Subtitle */}
          <span className="w-[396px] h-4 font-[family-name:var(--font-poppins)] font-normal text-xs leading-4 text-center text-[#6B7280] whitespace-nowrap">
            Add internships, freelance work, projects, volunteering, or startups
          </span>
        </div>
      </div>
    );
  }

  // ── Education Empty State ────────────────────────────────────────────────────
  if (type === "education") {
    return (
      <div className="flex flex-col justify-center items-center p-4 gap-4 w-[904px] h-[254.44px] bg-white rounded-[24px] self-stretch ">
        {/* Center content container */}
        <div className="flex flex-col items-center p-0 gap-4 w-[427px] h-[222.44px]">
          {/* Image */}
          <img
            src="/images/emptyScreenImages/emptyEdu.svg"
            alt="No education yet"
            className="w-[218px] h-[162.44px] object-contain"
          />

          {/* Text container */}
          <div className="flex flex-col items-center p-0 gap-2 w-[427px] h-11">
            {/* Title */}
            <span className="w-[195px] h-5 font-[family-name:var(--font-poppins)] font-normal text-sm leading-5 text-center text-black whitespace-nowrap">
              Add your education journey
            </span>

            {/* Subtitle */}
            <span className="w-[427px] h-4 font-[family-name:var(--font-poppins)] font-normal text-xs leading-4 text-center text-[#6B7280] whitespace-nowrap">
              Showcase courses, certifications, colleges, bootcamps, or
              self-learning.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
