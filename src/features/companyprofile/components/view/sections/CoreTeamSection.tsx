"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";

interface TeamMemberInfo {
  id?: string;
  user_id?: string;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  avatar?: string;
  role?: string;
  title?: string;
}

interface CoreTeamSectionProps {
  data: CompanyProfileData;
  isOwnProfile?: boolean;
}

export default function CoreTeamSection({ data, isOwnProfile = true }: CoreTeamSectionProps) {
  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["orgTeam", data.id],
    queryFn: () => companyProfileService.getOrgTeam(data.id),
  });

  const teamMembers = teamData?.data || data.coreTeam;

  // Don't render the section at all on public view (Global Company Profile)
  if (!isOwnProfile) {
    return null;
  }

  return (
    <div
      style={{
        width: "920px",
        height: "168px",
        padding: "0px",
        gap: "16px",
      }}
      className="flex flex-row items-start flex-none self-stretch dark:bg-transparent max-md:!flex-col max-md:!w-full max-md:!h-auto max-md:!px-0"
    >
      {/* Left Card: Core Team */}
      <div
        style={{
          width: "452px",
          height: "168px",
          padding: "16px 16px 16px 0px",
          gap: "16px",
          borderRadius: "24px",
        }}
        className="flex flex-col items-start flex-none self-stretch flex-grow bg-white dark:bg-zinc-950 max-md:!w-full max-md:!h-auto max-md:!px-0 max-md:!py-2"
      >
        {/* Frame 2609076 */}
        <div
          style={{ width: "420px", height: "32px", gap: "16px" }}
          className="flex flex-row justify-between items-center flex-none self-stretch max-md:!w-full max-md:!h-auto"
        >
          {/* Core Team Heading */}
          <h2
            style={{
              height: "32px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: "24px",
              lineHeight: "32px",
            }}
            className="flex items-center flex-none text-black dark:text-white"
          >
            Core Team
          </h2>

          {/* Frame 2609121: Manage button */}
          {isOwnProfile && (
            <Link
              href="/team"
              style={{ height: "32px", gap: "8px" }}
              className="flex flex-row items-center flex-none cursor-pointer hover:opacity-80 transition-opacity no-underline"
            >
              <span
                style={{
                  height: "32px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "32px",
                }}
                className="flex items-center flex-none text-black dark:text-zinc-300"
              >
                Manage
              </span>
              <ChevronRight size={24} className="text-black dark:text-zinc-300 flex-none max-md:!hidden" />
            </Link>
          )}
        </div>

        {/* Container for team members */}
        <div
          style={{ width: "420px", height: "84px", gap: "16px" }}
          className="flex flex-row items-start flex-none self-stretch max-md:!w-full max-md:!h-auto max-md:!flex-nowrap max-md:!justify-start max-md:!overflow-x-auto max-md:!pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {isLoadingTeam ? (
            <div className="flex items-center justify-center w-full h-full text-zinc-500 dark:text-zinc-400 text-sm ml-[25px]">
              Loading team...
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            teamMembers.map((member: TeamMemberInfo) => (
              <div
                key={member.id || member.user_id || member.name}
                style={{ width: "90px", height: "84px", gap: "8px" }}
                className="flex flex-col items-center flex-none max-md:!shrink-0"
              >
                {/* Ellipse 24 */}
                <div
                  style={{ width: "40px", height: "40px" }}
                  className="relative rounded-full overflow-hidden flex-none border border-[#E0E0E7] dark:border-zinc-800"
                >
                  <Image
                    src={member.avatar_url || member.avatarUrl || member.avatar || "/images/companyonboarding/companyprofileDefault.jpg"}
                    alt={member.full_name || member.name || "Team Member"}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Frame 2609075 */}
                <div
                  style={{ width: "90px", height: "36px", gap: "4px" }}
                  className="flex flex-col items-center flex-none self-stretch"
                >
                  <span
                    style={{
                      width: "90px",
                      height: "16px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      fontSize: "12px",
                      lineHeight: "16px",
                    }}
                    className="text-center flex-none self-stretch truncate text-black dark:text-white"
                  >
                    {member.full_name || member.name}
                  </span>
                  <span
                    style={{
                      height: "16px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      fontSize: "12px",
                      lineHeight: "16px",
                    }}
                    className="text-center flex-none truncate text-[#6B7280] dark:text-zinc-400"
                  >
                    {member.role || member.title || "Core Team"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-full text-zinc-500 dark:text-zinc-400 text-sm ml-[25px]">
              No core team members yet
            </div>
          )}
        </div>
      </div>

      {/* Right Card: Verification Status */}
      <div
        style={{
          width: "452px",
          height: "168px",
          padding: "16px",
          gap: "16px",
          background: "#1A73E8",
          borderRadius: "16px",
        }}
        className="flex flex-col items-start flex-none flex-grow relative overflow-hidden max-md:!hidden"
      >
        {/* Container (Header) */}
        <div
          style={{ width: "420px", height: "24px", gap: "8px" }}
          className="flex flex-row justify-between items-center flex-none self-stretch max-md:!w-full max-md:!h-auto"
        >
          {/* Frame 2609100 */}
          <div
            style={{ height: "24px", gap: "8px" }}
            className="flex flex-row items-center flex-none"
          >
            <ShieldCheck size={24} className="text-white flex-none" />
            <span
              style={{
                width: "151px",
                height: "24px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "16px",
                lineHeight: "24px",
                color: "#FFFFFF",
              }}
              className="flex items-center flex-none"
            >
              Verification Status
            </span>
          </div>

          {/* Verified Badge */}
          <div
            style={{
              width: "63px",
              height: "24px",
              padding: "4px 8px",
              background: "#DCFCE7",
              borderRadius: "9999px",
            }}
            className="flex flex-col justify-center items-center flex-none"
          >
            <span
              style={{
                width: "47px",
                height: "16px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "12px",
                lineHeight: "16px",
                color: "#22C55E",
              }}
              className="flex items-center flex-none"
            >
              Verified
            </span>
          </div>
        </div>

        {/* Support Text */}
        <p
          style={{
            width: "420px",
            height: "40px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 400,
            fontSize: "14px",
            lineHeight: "20px",
            color: "#FFFFFF",
          }}
          className="flex items-center flex-none self-stretch text-blue-50 max-md:!w-full max-md:!h-auto max-md:!mt-2 max-md:!mb-2"
        >
          Your profile is verified. Maintain updated documentation to preserve status.
        </p>

        {/* Manage Documents Button */}
        <button
          style={{
            width: "420px",
            height: "40px",
            padding: "8px 0px",
            borderRadius: "24px",
          }}
          className="flex flex-row justify-center items-center flex-none bg-white rounded-full transition-colors hover:bg-blue-50 active:bg-blue-100 max-md:!w-full max-md:!h-auto max-md:!py-2"
        >
          <span
            style={{
              width: "163px",
              height: "24px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 400,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#1A73E8",
            }}
            className="flex items-center justify-center text-center flex-none"
          >
            Manage Documents
          </span>
        </button>
      </div>
    </div>
  );
}
