"use client";

import React from "react";
import Image from "next/image";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { useQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";

interface PeopleSectionProps {
  data: CompanyProfileData;
  onViewMoreClick?: () => void;
}

export default function PeopleSection({ data, onViewMoreClick }: PeopleSectionProps) {
  const isEdu = data.entityType === "INSTITUTE";
  const { data: peopleData, isLoading } = useQuery({
    queryKey: ["orgPeople", data.id, "preview", isEdu],
    queryFn: () =>
      isEdu
        ? companyProfileService.getOrgAlumni(data.id, { page: 1, limit: 1 })
        : companyProfileService.getOrgPeople(data.id, { page: 1, limit: 1 }),
  });

  const employeesList = (peopleData?.people || []).map((emp: any) => ({
    id: emp.user_id || emp.id || emp._id,
    name: emp.full_name || emp.name || "Unknown",
    role: emp.role_display || emp.title || emp.headline || emp.role || "Associate",
    avatar: emp.avatar_url || emp.avatar || emp.profile_image || "/images/companyonboarding/companyprofileDefault.jpg",
  }));
  const displayEmployees = employeesList.slice(0, 1);
  const totalCount = peopleData?.meta?.total || displayEmployees.length;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0px",
        gap: "16px",
        width: "960px",
        height: "192px",
        borderRadius: "24px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="bg-white dark:bg-zinc-950 max-md:!w-full max-md:!h-auto max-md:!px-4 max-md:!mx-auto"
    >
      {/* Frame 2609076: Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "32px",
          flex: "none",
          order: 0,
          alignSelf: "stretch",
          flexGrow: 0,
        }}
        className="max-md:!w-full max-md:!h-auto"
      >
        {/* People Title */}
        <h2
          style={{
            width: "83px",
            height: "32px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "24px",
            lineHeight: "32px",
            display: "flex",
            alignItems: "center",
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
          className="text-black dark:text-white"
        >
          People
        </h2>
      </div>

      {/* Frame 2609092: Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "76px",
          flex: "none",
          order: 1,
          alignSelf: "stretch",
          flexGrow: 0,
        }}
        className="max-md:!w-full max-md:!h-auto"
      >
        {/* Connections Count */}
        <span
          style={{
            height: "16px",
            fontFamily: "'Poppins', sans-serif",
            fontStyle: "normal",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "16px",
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
          className="text-black dark:text-zinc-300"
        >
          {isLoading ? "Loading..." : `${totalCount} Connections`}
        </span>

        {/* Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0px",
            gap: "16px",
            width: "920px",
            height: "44px",
            flex: "none",
            order: 1,
            alignSelf: "stretch",
            flexGrow: 0,
          }}
          className="max-md:!w-full max-md:!h-auto"
        >
          {displayEmployees.map((emp: any, idx: number) => (
            <div
              key={emp.id}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                padding: "0px",
                gap: "8px",
                width: "327px",
                height: "44px",
                flex: "none",
                order: idx,
                flexGrow: 0,
              }}
              className="max-md:!w-full"
            >
              {/* Avatar */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  position: "relative",
                  flex: "none",
                  order: 0,
                  flexGrow: 0,
                }}
              >
                <Image
                  src={emp.avatar}
                  alt={emp.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Info */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  padding: "0px",
                  gap: "8px",
                  width: "279px",
                  height: "44px",
                  flex: "none",
                  order: 1,
                  flexGrow: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    padding: "0px",
                    width: "279px",
                    height: "44px",
                    flex: "none",
                    order: 0,
                    flexGrow: 0,
                  }}
                >
                  {/* Name */}
                  <span
                    style={{
                      height: "24px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      fontSize: "16px",
                      lineHeight: "24px",
                      flex: "none",
                      order: 0,
                      flexGrow: 0,
                    }}
                    className="text-black dark:text-white truncate w-full"
                  >
                    {emp.name}
                  </span>

                  {/* Subtitle */}
                  <span
                    style={{
                      height: "20px",
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 400,
                      fontSize: "14px",
                      lineHeight: "20px",
                      flex: "none",
                      order: 1,
                      flexGrow: 0,
                    }}
                    className="text-[#6B7280] dark:text-zinc-400 truncate w-full"
                  >
                    {emp.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frame 2609084: View More Button */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px 0px",
          gap: "10px",
          width: "86px",
          height: "52px",
          flex: "none",
          order: 2,
          flexGrow: 0,
        }}
      >
        <button
          style={{
            width: "86px",
            height: "20px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 500,
            fontSize: "16px",
            lineHeight: "20px",
            textAlign: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            flex: "none",
            order: 0,
            flexGrow: 0,
          }}
          type="button"
          className="text-[#6B7280] hover:text-gray-900 dark:hover:text-zinc-200 transition-colors flex items-center justify-center flex-none"
          onClick={onViewMoreClick}
        >
          View more
        </button>
      </div>
    </div>
  );
}
