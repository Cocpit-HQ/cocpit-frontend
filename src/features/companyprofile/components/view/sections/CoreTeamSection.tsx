"use client";

import React from "react";
import Image from "next/image";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { ShieldCheck, ChevronRight } from "lucide-react";

interface CoreTeamSectionProps {
  data: CompanyProfileData;
}

export default function CoreTeamSection({ data }: CoreTeamSectionProps) {
  // Use mock data matching the Figma spec if names/roles don't exist
  const members = [
    { name: "Emma", role: "HR", avatarUrl: data.coreTeam[0]?.avatarUrl || "/placeholder-avatar1.jpg" },
    { name: "James", role: "Manager", avatarUrl: data.coreTeam[1]?.avatarUrl || "/placeholder-avatar2.jpg" },
    { name: "Sophia", role: "SMM", avatarUrl: data.coreTeam[2]?.avatarUrl || "/placeholder-avatar3.jpg" },
    { name: "Michael", role: "Content manager", avatarUrl: data.coreTeam[3]?.avatarUrl || "/placeholder-avatar4.jpg" }
  ];

  return (
    <div
      style={{
        width: "920px",
        height: "168px",
        padding: "0px",
        gap: "16px",
      }}
      className="flex flex-row items-start flex-none self-stretch dark:bg-transparent"
    >
      {/* Left Card: Core Team */}
      <div
        style={{
          width: "452px",
          height: "168px",
          padding: "16px 16px 16px 0px",
          gap: "16px",
          background: "#FFFFFF",
          borderRadius: "24px",
        }}
        className="flex flex-col items-start flex-none self-stretch flex-grow dark:bg-zinc-950"
      >
        {/* Frame 2609076 */}
        <div
          style={{ width: "420px", height: "32px", gap: "16px" }}
          className="flex flex-row justify-between items-center flex-none self-stretch"
        >
          {/* Core Team Heading */}
          <h2
            style={{
              height: "32px",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: "24px",
              lineHeight: "32px",
              color: "#000000",
            }}
            className="flex items-center flex-none dark:text-white"
          >
            Core Team
          </h2>

          {/* Frame 2609121: Manage button */}
          <button
            style={{ height: "32px", gap: "8px" }}
            className="flex flex-row items-center flex-none cursor-pointer hover:opacity-80 transition-opacity"
          >
            <span
              style={{
                height: "32px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "32px",
                color: "#000000",
              }}
              className="flex items-center flex-none dark:text-zinc-300"
            >
              Manage
            </span>
            <ChevronRight size={24} className="text-black dark:text-zinc-300 flex-none" />
          </button>
        </div>

        {/* Container for team members */}
        <div
          style={{ width: "420px", height: "84px", gap: "16px", marginLeft: "-25px" }}
          className="flex flex-row items-start flex-none self-stretch"
        >
          {members.map((member, index) => (
            <div
              key={index}
              style={{ width: "90px", height: "84px", gap: "8px" }}
              className="flex flex-col items-center flex-none"
            >
              {/* Ellipse 24 */}
              <div
                style={{ width: "40px", height: "40px" }}
                className="relative rounded-full overflow-hidden flex-none border border-[#E0E0E7] dark:border-zinc-800"
              >
                <Image
                  src={member.avatarUrl}
                  alt={member.name}
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
                    color: "#000000",
                  }}
                  className="text-center flex-none self-stretch truncate dark:text-white"
                >
                  {member.name}
                </span>
                <span
                  style={{
                    height: "16px",
                    fontFamily: "'Poppins', sans-serif",
                    fontWeight: 400,
                    fontSize: "12px",
                    lineHeight: "16px",
                    color: "#6B7280",
                  }}
                  className="text-center flex-none truncate dark:text-zinc-400"
                >
                  {member.role}
                </span>
              </div>
            </div>
          ))}
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
        className="flex flex-col items-start flex-none flex-grow relative overflow-hidden"
      >
        {/* Container (Header) */}
        <div
          style={{ width: "420px", height: "24px", gap: "8px" }}
          className="flex flex-row justify-between items-center flex-none self-stretch"
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
          className="flex items-center flex-none self-stretch text-blue-50"
        >
          Your profile is verified. Maintain updated documentation to preserve status.
        </p>

        {/* Manage Documents Button */}
        <button
          style={{
            width: "420px",
            height: "40px",
            padding: "8px 0px",
            background: "#FFFFFF",
            borderRadius: "24px",
          }}
          className="flex flex-row justify-center items-center flex-none self-stretch hover:bg-blue-50 transition-colors cursor-pointer"
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
