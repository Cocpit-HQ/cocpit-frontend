"use client";

import React from "react";
import { BusinessProfileData } from "../../types/business-profile.types";

interface KeyOfferingsAndTeamsSectionProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
  title?: string;
  onViewMoreClick?: () => void;
  onViewMoreTeamsClick?: () => void;
}

export default function KeyOfferingsAndTeamsSection({
  data,
  isOwnProfile = false,
  title,
  onViewMoreClick,
  onViewMoreTeamsClick,
}: KeyOfferingsAndTeamsSectionProps) {
  const isEdu =
    data.entityType === "INSTITUTION" ||
    (data as any)?.entity_type === "INSTITUTION" ||
    Boolean((data as any)?.institution_type) ||
    ["school", "college", "university", "coaching", "tuition", "higher education"].includes(((data as any)?.industry || "").toLowerCase().trim());
  const sectionTitle =
    title || (isOwnProfile ? "Teams" : isEdu ? "Alumni" : "People");
  const handleViewMore = onViewMoreClick || onViewMoreTeamsClick;

  const rawOfferings =
    data.keyOfferings && data.keyOfferings.length > 0
      ? data.keyOfferings
          .map((o) =>
            typeof o === "object"
              ? (o as any).content || (o as any).label || (o as any).title
              : String(o)
          )
          .filter(Boolean)
      : [];

  // Max 4 key offerings
  const offerings = rawOfferings.slice(0, 4);

  // Max 4 team members / people / alumni
  const teamMembers =
    data.coreTeam && data.coreTeam.length > 0
      ? data.coreTeam.slice(0, 4).map((m, idx) => ({
          id: m.id || `member-${idx}`,
          name: m.name,
          role: m.role || (isEdu ? "Alumni" : "Member"),
          avatarUrl: m.avatarUrl || "",
        }))
      : [];

  const hasOfferings = offerings.length > 0;
  const hasTeams = teamMembers.length > 0;
  const hasBoth = hasOfferings && hasTeams;

  // If neither key offerings nor teams are present, hide the section completely
  if (!hasOfferings && !hasTeams) {
    return null;
  }

  return (
    /* Outer container: 800px max, responsive padding and auto-layout */
    <div
      className={`w-full max-w-[800px] pl-5 pr-5 md:pr-0 flex flex-col ${
        hasBoth
          ? "md:flex-row md:items-center md:gap-10"
          : "items-start"
      } gap-8`}
    >
      {/* Left Column: Key offerings */}
      {hasOfferings && (
        <div className="flex-1 self-stretch flex flex-col justify-start items-start gap-4 min-w-0">
          <h2 className="self-stretch text-ds-text-primary ds-text-body-2">
            Key offerings
          </h2>

          <div className="flex flex-col gap-4 w-full">
            {offerings.map((offering, idx) => (
              <div
                key={idx}
                className="h-10 px-4 py-2 bg-ds-bg border-l-[3px] border-ds-accent inline-flex justify-start items-center gap-4 w-fit max-w-full"
              >
                <span className="text-ds-text-secondary ds-text-body truncate">
                  {offering}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vertical Divider: rendered only when both sections exist */}
      {hasBoth && (
        <div className="hidden md:block w-px self-stretch min-h-[296px] bg-ds-border shrink-0" />
      )}

      {/* Right Column: Teams */}
      {hasTeams && (
        <div className="flex-1 self-stretch flex flex-col justify-start items-start gap-5 min-w-0">
          {/* Members list block */}
          <div className="w-full max-w-[280px] sm:max-w-[320px] flex flex-col justify-start items-start gap-4 min-w-0">
            <h2 className="self-stretch text-ds-text-primary ds-text-body-2">
              {sectionTitle}
            </h2>

            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="w-full flex justify-start items-center gap-2.5 min-w-0"
              >
                {/* Member Avatar */}
                {member.avatarUrl ? (
                  <img
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-ds-border"
                    src={member.avatarUrl}
                    alt={member.name}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-ds-surface-2 border border-ds-border flex items-center justify-center ds-text-small-2 text-ds-text-primary shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Member Name & Role */}
                <div className="h-9 flex-1 flex flex-col justify-between items-start min-w-0 w-full overflow-hidden">
                  <div className="w-full text-ds-text-primary ds-text-body-2 truncate">
                    {member.name}
                  </div>
                  <div className="w-full text-ds-text-secondary ds-text-meta truncate">
                    {member.role}
                  </div>
                </div>
              </div>
            ))}

            {/* View more CTA centered at bottom of the team list */}
            <div className="w-full flex justify-center pt-1">
              <button
                type="button"
                aria-label={`View more ${sectionTitle.toLowerCase()}`}
                onClick={handleViewMore}
                className="text-ds-accent ds-text-small-1 hover:no-underline hover:opacity-85 transition-opacity cursor-pointer select-none"
              >
                View more
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


