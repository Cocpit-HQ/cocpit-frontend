"use client";

import React from "react";
import { BusinessProfileData } from "../../types/business-profile.types";
import { Icon, SVG_ICONS } from "@/components/icons";

interface AboutSectionProps {
  data: BusinessProfileData;
  onViewMoreClick?: () => void;
}

export default function AboutSection({ data }: AboutSectionProps) {
  const description = data.description || data.tagline || "";

  // Only render social links that actually exist for this profile with valid URL
  const socialLinks =
    data.socialLinks && data.socialLinks.length > 0
      ? data.socialLinks
          .filter((link) => Boolean(link.url && link.url.trim() && link.url !== "#"))
          .map((link) => {
            const raw = (link.platform || "website").toLowerCase().trim();
            const platform = raw === "twitter" ? "x" : raw;
            const iconName = platform in SVG_ICONS ? platform : "website";
            return {
              platform,
              iconName: iconName as any,
              label: link.label || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Website"),
              url: link.url.startsWith("http") ? link.url : `https://${link.url}`,
            };
          })
      : [];

  if (!description && socialLinks.length === 0) {
    return null;
  }

  return (
    /* AboutSection: width: 800px; padding: 0 20px; gap: 12px; */
    <div className="w-full max-w-[800px] px-5 flex flex-col justify-start items-start gap-3 min-w-0">
      {/* About: 16px / 24px LH, Semibold 600, color #FFECE6 */}
      <h2 className="w-full text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
        About
      </h2>

      {/* Frame 2609672: width: 780px; gap: 20px; */}
      <div className="w-full max-w-[780px] flex flex-col justify-start items-start gap-5 min-w-0">
        {/* Description: 14px / 20px LH, Regular 400, color #B8ADA8 */}
        {description && (
          <p className="w-full max-w-[780px] text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
            {description}
          </p>
        )}

        {/* Container: social icons row (gap: 16px, height: 20px) - ONLY shown for available links */}
        {socialLinks.length > 0 && (
          <div className="w-full max-w-[780px] h-5 inline-flex flex-row items-center gap-4">
            {socialLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                title={link.label}
                aria-label={link.label}
                className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer shrink-0"
              >
                <Icon name={link.iconName} size={20} className="w-5 h-5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
