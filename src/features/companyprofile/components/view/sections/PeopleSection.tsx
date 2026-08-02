"use client";

import React from "react";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { useQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";
import AvatarStack from "../shared/AvatarStack";

interface PeopleSectionProps {
  data: CompanyProfileData;
  onViewMoreClick?: () => void;
}

export default function PeopleSection({ data, onViewMoreClick }: PeopleSectionProps) {
  const isEdu = data.entityType === "INSTITUTION";
  const { data: peopleData, isLoading } = useQuery({
    queryKey: ["orgPeople", data.id, "preview", isEdu],
    queryFn: () =>
      isEdu
        ? companyProfileService.getOrgAlumni(data.id, { page: 1, limit: 3 })
        : companyProfileService.getOrgPeople(data.id, { page: 1, limit: 3 }),
  });

  const rows: any[] = peopleData?.people || peopleData?.alumni || [];
  const connectionsTotal = peopleData?.meta?.connections_total || 0;
  const total = peopleData?.meta?.total || 0;

  // Rows arrive connected-first, so when there are mutual connections, only the
  // connected rows belong in the "Connections" pill — don't mix in suggestions.
  const isConnectionsMode = connectionsTotal > 0;
  const displayCount = isConnectionsMode ? connectionsTotal : total;
  const displayEmployees = (isConnectionsMode ? rows.filter((r: any) => r.is_connected) : rows)
    .slice(0, 3)
    .map((emp: any) => ({
      id: emp.user_id || emp.id || emp._id,
      name: emp.full_name || emp.name || "Unknown",
      avatar: emp.avatar_url || emp.avatar || emp.profile_image || "/images/companyonboarding/companyprofileDefault.jpg",
    }));

  if (!isLoading && displayEmployees.length === 0) {
    return null;
  }

  const pillLabel = isConnectionsMode ? "Connections" : "Suggestions";
  const firstName = displayEmployees[0]?.name;
  const otherCount = Math.max(displayCount - 1, 0);
  const verb = isEdu ? "studied here" : "works here";
  const pluralVerb = isEdu ? "studied here" : "work here";
  const bodyText =
    displayCount <= 1
      ? `${firstName} ${verb}`
      : `${firstName} and ${otherCount} other${otherCount === 1 ? "" : "s"} ${pluralVerb}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0px",
        gap: "16px",
        width: "960px",
        borderRadius: "24px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="bg-white dark:bg-zinc-950 max-md:!w-full max-md:!h-auto max-md:!px-4 max-md:!mx-auto"
    >
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
        <h2
          style={{
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
          {isEdu ? "Alumni" : "People"}
        </h2>
      </div>

      {isLoading ? (
        <span className="text-black dark:text-zinc-300 font-poppins text-base self-start">Loading...</span>
      ) : (
        <div className="w-full flex flex-col gap-4 max-md:!w-full">
          <div className="inline-flex items-center gap-3 self-start px-4 py-2.5 rounded-full border border-gray-200 dark:border-zinc-800">
            <AvatarStack people={displayEmployees} totalCount={displayCount} max={2} size={32} />
            <span className="font-poppins text-sm text-black dark:text-white">{bodyText}</span>
            <span className="font-poppins text-xs px-2 py-0.5 rounded-full bg-[#EFF4FF] dark:bg-zinc-800 text-[#1A73E8] dark:text-blue-300 font-medium">
              {pillLabel}
            </span>
          </div>
        </div>
      )}

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
