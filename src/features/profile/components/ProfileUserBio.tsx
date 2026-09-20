"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProfileUserBioProps {
  fullName?: string;
  userName?: string;
  role?: string;
  location?: string;
  openTo?: string;
  availability?: string;
  workPreference?: string;
  website?: string;
  followersCount?: number | string;
  followingCount?: number | string;
  connectionsCount?: number | string;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  onOpenConnections?: () => void;
}

export const ProfileUserBio: React.FC<ProfileUserBioProps> = ({
  fullName,
  userName,
  role,
  location,
  openTo,
  availability,
  workPreference,
  website,
  followersCount = "0",
  followingCount = "0",
  connectionsCount = "0",
  onOpenFollowers,
  onOpenFollowing,
  onOpenConnections,
}) => {
  const formattedUsername = userName
    ? userName.startsWith("@")
      ? userName
      : `@${userName}`
    : "@user";

  // Normalize website URL
  const displayWebsite = website?.replace(/^https?:\/\/(www\.)?/, "").split('/')[0];
  const websiteHref = website
    ? website.startsWith("http://") || website.startsWith("https://")
      ? website
      : `https://${website}`
    : undefined;

  return (
    /* Frame 2609603: Main Parent Box (w: 800px, pl: 20px / px-4 mobile, gap: 16px) */
    <div className="w-full max-w-[800px] px-4 md:px-0 md:pl-5 flex flex-col items-start gap-4">
      {/* StatsRow: Auto layout (w: 780px, h: 44px, p: 12px, gap: 24px, justify-between, items-center, left: 20px) */}
      <div className="w-full max-w-[780px] h-[44px] p-3 flex flex-row items-center justify-between gap-6 self-stretch flex-none order-0 grow-0">
        {/* Following */}
        <button
          type="button"
          onClick={onOpenFollowing}
          disabled={!onOpenFollowing}
          className={cn(
            "flex-1 flex flex-row items-center justify-center gap-1.5 text-center text-[var(--ds-text-primary)] font-['DM_Sans']",
            onOpenFollowing ? "cursor-pointer hover:opacity-85 transition-opacity" : "cursor-default"
          )}
        >
          <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-center text-[var(--ds-text-primary)]">{followingCount}</span>
          <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-center text-[var(--ds-text-secondary)]">Following</span>
        </button>

        {/* Followers */}
        <button
          type="button"
          onClick={onOpenFollowers}
          disabled={!onOpenFollowers}
          className={cn(
            "flex-1 flex flex-row items-center justify-center gap-1.5 text-center text-[var(--ds-text-primary)] font-['DM_Sans']",
            onOpenFollowers ? "cursor-pointer hover:opacity-85 transition-opacity" : "cursor-default"
          )}
        >
          <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-center text-[var(--ds-text-primary)]">{followersCount}</span>
          <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-center text-[var(--ds-text-secondary)]">Followers</span>
        </button>

        {/* Connection */}
        <button
          type="button"
          onClick={onOpenConnections}
          disabled={!onOpenConnections}
          className={cn(
            "flex-1 flex flex-row items-center justify-center gap-1.5 text-center text-[var(--ds-text-primary)] font-['DM_Sans']",
            onOpenConnections ? "cursor-pointer hover:opacity-85 transition-opacity" : "cursor-default"
          )}
        >
          <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-center text-[var(--ds-text-primary)]">{connectionsCount}</span>
          <span className="font-['DM_Sans'] font-medium text-sm leading-5 text-center text-[var(--ds-text-secondary)]">Connection</span>
        </button>
      </div>

      {/* Frame 2609607: User Details Block (w: 780px, gap: 4px) */}
      <div className="w-full max-w-[780px] inline-flex flex-col justify-start items-start gap-1">
        {/* Name and Handle */}
        <div className="inline-flex justify-start items-center gap-2 flex-wrap">
          <h1 className="justify-start text-[var(--ds-text-primary)] text-xl md:text-2xl font-bold font-['DM_Sans'] leading-7 md:leading-8">
            {fullName || "User Name"}
          </h1>
          <span className="justify-start text-[var(--ds-text-secondary)] text-sm md:text-base font-normal font-['DM_Sans'] leading-5 md:leading-6">
            {formattedUsername}
          </span>
        </div>

        {/* Role */}
        {role && (
          <div className="justify-start text-[var(--ds-text-primary)] text-sm font-normal font-['DM_Sans'] leading-5">
            {role}
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="justify-start text-[var(--ds-text-primary)] text-sm font-normal font-['DM_Sans'] leading-5">
            {location}
          </div>
        )}

        {/* Work Preferences / Badges */}
        {(openTo || availability || workPreference) && (
          <div className="inline-flex justify-start items-center gap-2 flex-wrap">
            {openTo && (
              <span className="justify-start text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4">
                {openTo}
              </span>
            )}
            {openTo && availability && (
              <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full" />
            )}
            {availability && (
              <span className="justify-start text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4">
                {availability}
              </span>
            )}
            {(openTo || availability) && workPreference && (
              <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full" />
            )}
            {workPreference && (
              <span className="justify-start text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4">
                {workPreference}
              </span>
            )}
          </div>
        )}

        {/* Website */}
        {website && (
          <div className="max-w-full min-w-0 w-full">
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-website-link block truncate max-w-full justify-start text-[var(--ds-accent)] text-sm font-medium font-['DM_Sans'] leading-5 hover:underline cursor-pointer transition-colors"
            >
              {displayWebsite || website}
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileUserBio;

