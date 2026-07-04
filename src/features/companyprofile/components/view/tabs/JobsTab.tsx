"use client";

import React from "react";
import Image from "next/image";
import { CompanyProfileData } from "../../../types/company-profile.types";

interface JobsTabProps {
  data: CompanyProfileData;
  isOwnProfile?: boolean;
}

export default function JobsTab({ data, isOwnProfile = false }: JobsTabProps) {
  const jobs = [
    { id: "1", title: "UI/UX Designer", posted: "Posted 2 hours ago" },
    { id: "2", title: "Marketing Lead", posted: "Posted 3 weeks ago" },
  ];

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 w-full bg-white dark:bg-zinc-950 rounded-2xl">
        <div className="relative w-64 h-48 mb-6">
          <Image
            src="/images/companyonboarding/EmptyViewOfJobTab.png"
            alt="No Jobs"
            fill
            className="object-contain"
            unoptimized
          />
        </div>
        <h3 className="font-poppins font-semibold text-lg text-black dark:text-white mb-1">
          No Jobs
        </h3>
        <p className="font-poppins text-sm text-gray-500 dark:text-zinc-400 text-center mb-4">
          {data.name} hasn't posted jobs yet
        </p>
        {isOwnProfile && (
          <button className="h-10 px-6 bg-[#1A73E8] hover:bg-blue-700 text-white rounded-full font-semibold text-[14px] transition-colors cursor-pointer flex items-center justify-center">
            Post jobs
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0px",
        gap: "16px",
        width: "960px",
        background: "#FFFFFF",
        borderRadius: "12px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="dark:bg-zinc-950"
    >
      {jobs.map((job) => (
        <div
          key={job.id}
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            padding: "16px 0px",
            gap: "16px",
            width: "920px",
            height: "80px",
            background: "#FFFFFF",
            borderRadius: "12px",
            flex: "none",
            alignSelf: "stretch",
            flexGrow: 0,
          }}
          className="dark:bg-zinc-950"
        >
          {/* Frame 2609064 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0px",
              gap: "8px",
              width: "920px",
              height: "48px",
              flex: "none",
              flexGrow: 1,
            }}
          >
            {/* Job Title */}
            <h3
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "16px",
                lineHeight: "24px",
                textTransform: "capitalize",
                color: "#000000",
                flex: "none",
                flexGrow: 0,
              }}
              className="dark:text-white"
            >
              {job.title}
            </h3>

            {/* Posted Info */}
            <span
              style={{
                width: "920px",
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "16px",
                color: "#6B7280",
                flex: "none",
                alignSelf: "stretch",
                flexGrow: 0,
              }}
              className="dark:text-zinc-400"
            >
              {job.posted}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
