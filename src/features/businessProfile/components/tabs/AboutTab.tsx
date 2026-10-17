"use client";

import React, { useState } from "react";
import { BusinessProfileData } from "../../types/business-profile.types";
import { getSocialPlatformMeta, DEFAULT_SOCIAL_PLATFORM_ICON } from "../../constants/socialPlatforms";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import InteractiveLocationMap from "@/features/company-onboarding/components/InteractiveLocationMap";

const formatDisplayUrl = (url: string | undefined): string => {
  if (!url) return "";
  try {
    const formatted = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
    return new URL(formatted).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
};

interface AboutTabProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
}

export default function AboutTab({ data }: AboutTabProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const orgSlug = data.slug || data.id;
  const { data: aboutData, isLoading } = useQuery({
    queryKey: ["orgAbout", orgSlug],
    queryFn: () => businessProfileService.getOrgAbout(orgSlug),
    enabled: Boolean(orgSlug),
  });

  const about = aboutData?.about || {};

  // ── Part 1: Description & Slogan (No dummy fallbacks) ──
  const description = (about.description || data.description || "").trim();
  const slogan = (about.slogan || data.slogan || "").trim();

  // ── Part 2: Specialties ──
  const specialtiesRaw = aboutData?.specialties || data.specialties || [];
  const specialtiesList = Array.isArray(specialtiesRaw)
    ? specialtiesRaw.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean)
    : [];
  const specialtiesText = specialtiesList.join(", ");

  // ── Part 2: Row 1 (Website & Phone number) ──
  const websiteUrl = (about.website || data.websiteUrl || "").trim();

  const isMobileShow = aboutData
    ? (about.isMobileShow ?? about.is_mobile_show ?? true)
    : (data.isMobileShow ?? true);
  const rawPhone = aboutData ? (about.phone || about.phoneNumber || null) : (data.phoneNumber || null);
  const phoneNumber = isMobileShow && rawPhone ? String(rawPhone).trim() : "";

  // ── Part 2: Row 2 (Industry & Headquarter) ──
  const formatIndustryType = (ind?: string | null) => {
    if (!ind) return "";
    return ind
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };
  const isEdu =
    about.entity_type === "INSTITUTION" ||
    data.entityType === "INSTITUTION" ||
    Boolean(about.institution_type || (data as any)?.institution_type) ||
    ["school", "college", "university", "coaching", "tuition", "higher education"].includes(((about.industry || data.industry) || "").toLowerCase().trim());
  const rawIndustry = (isEdu ? (about.institution_type || about.industry) : about.industry) || data.industry;
  const industry = formatIndustryType(rawIndustry);

  const location = (about.location || about.headquarter || data.location || about.city || "").trim();

  // ── Part 2: Row 3 (Organization size & Founded) ──
  const rawSize = about.size || about.employeeCount || data.employeeCount;
  const employeeCount = rawSize
    ? `${rawSize}${String(rawSize).toLowerCase().includes("member") ? "" : " Members"}`
    : "";

  const rawFounded = about.established_year || about.founded || data.founded;
  const founded = rawFounded ? String(rawFounded).trim() : "";

  // ── Part 2: Social Links (Only real links) ──
  const rawSocialLinks = aboutData?.links || data.socialLinks || [];
  const socialLinks = Array.isArray(rawSocialLinks)
    ? rawSocialLinks.filter((l: any) => Boolean(l?.url && l.url.trim() && l.url !== "#"))
    : [];

  // ── Part 2: Offices (Only real offices) ──
  const rawOffices = aboutData?.offices || data.offices || [];
  const offices = Array.isArray(rawOffices)
    ? rawOffices.filter((o: any) => Boolean(o && (o.city || o.address || o.name || o.country)))
    : [];

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-10">
        <span className="text-ds-text-secondary text-sm font-['DM_Sans']">
          Loading about information...
        </span>
      </div>
    );
  }

  const hasPart1 = Boolean(description || slogan);
  const hasSpecialties = Boolean(specialtiesText);
  const hasRow1 = Boolean(websiteUrl || phoneNumber);
  const hasRow2 = Boolean(industry || location);
  const hasRow3 = Boolean(employeeCount || founded);
  const hasSocial = socialLinks.length > 0;
  const hasOffices = offices.length > 0;
  const hasPart2 = hasSpecialties || hasRow1 || hasRow2 || hasRow3 || hasSocial || hasOffices;

  // If nothing is present in About at all, show clean empty state
  if (!hasPart1 && !hasPart2) {
    return (
      <div className="w-full max-w-[800px] px-4 sm:pl-5 sm:pr-0 py-16 flex flex-col items-center justify-center gap-3 font-['DM_Sans'] text-center">
        <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center">
          <Icon icon="lucide:info" className="w-6 h-6 text-ds-text-secondary" />
        </div>
        <div className="text-ds-text-primary text-base font-semibold leading-6">
          No about information provided yet
        </div>
      </div>
    );
  }

  // Description truncation threshold for mobile "See more"
  const isLongDescription = description.length > 180;

  return (
    <div className="w-full max-w-[800px] px-4 sm:px-5 flex flex-col items-start gap-4 sm:gap-5 pb-16 font-['DM_Sans']">
      {/* ══════════════════════════════════════════════════════
          PART 1: Description & Slogan
          ══════════════════════════════════════════════════════ */}
      {hasPart1 && (
        <div className="w-full max-w-[780px] flex flex-col items-start gap-4 sm:gap-5">
          {/* Description */}
          {description && (
            <div className="w-full max-w-[780px] flex flex-col items-start gap-2 sm:gap-3">
              <h2 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
                Description
              </h2>
              <div className="w-full max-w-[780px]">
                <p
                  className={`w-full max-w-[780px] text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5 whitespace-pre-line break-words [overflow-wrap:anywhere] ${
                    !isDescriptionExpanded && isLongDescription ? "line-clamp-4 sm:line-clamp-none" : ""
                  }`}
                >
                  {description}
                </p>
                {isLongDescription && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="sm:hidden text-ds-accent text-sm font-normal font-['DM_Sans'] leading-5 mt-0.5 hover:underline cursor-pointer bg-transparent border-0 p-0"
                  >
                    {isDescriptionExpanded ? "See less" : "See more"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Slogan */}
          {slogan && (
            <div className="w-full max-w-[780px] flex flex-col items-start gap-2 sm:gap-3">
              <h2 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
                Slogan
              </h2>
              <div className="w-full max-w-[780px] min-h-[40px] py-2 pl-3 border-l-4 border-ds-accent flex flex-col justify-center">
                <p className="text-ds-text-secondary text-sm sm:text-base font-normal sm:italic font-['DM_Sans'] sm:font-['Poppins'] leading-6 break-words [overflow-wrap:anywhere]">
                  &quot;{slogan}&quot;
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PART 2: Specialties, Details Grid, Social, Offices
          ══════════════════════════════════════════════════════ */}
      {hasPart2 && (
        <div className="w-full max-w-[780px] flex flex-col items-start gap-4 sm:gap-5">
          {/* Specialties */}
          {hasSpecialties && (
            <div className="w-full max-w-[780px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
              <span className="text-ds-text-primary text-sm font-medium font-['DM_Sans'] leading-5">
                Specialties
              </span>
              <p className="w-full max-w-[780px] text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 break-words [overflow-wrap:anywhere]">
                {specialtiesText}
              </p>
            </div>
          )}

          {/* Website & Phone number row */}
          {hasRow1 && (
            <div className="w-full max-w-[780px] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10">
              {websiteUrl && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Website
                  </span>
                  <a
                    href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-website-link text-[var(--ds-accent)] !text-[var(--ds-accent)] text-sm font-normal font-['DM_Sans'] leading-5 truncate max-w-full hover:no-underline hover:opacity-85 transition-opacity"
                  >
                    {websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                  </a>
                </div>
              )}

              {phoneNumber && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Phone number
                  </span>
                  <a
                    href={`tel:${phoneNumber}`}
                    className="profile-website-link text-[var(--ds-accent)] !text-[var(--ds-accent)] text-sm font-normal font-['DM_Sans'] leading-5 truncate max-w-full hover:no-underline hover:opacity-85 transition-opacity"
                  >
                    {phoneNumber}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Industry & Headquarter row */}
          {hasRow2 && (
            <div className="w-full max-w-[780px] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10">
              {industry && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Industry
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 truncate max-w-full">
                    {industry}
                  </span>
                </div>
              )}

              {location && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Headquarter
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 truncate max-w-full">
                    {location}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Organization size & Founded row */}
          {hasRow3 && (
            <div className="w-full max-w-[780px] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10">
              {employeeCount && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Organization size
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 truncate max-w-full">
                    {employeeCount}
                  </span>
                </div>
              )}

              {founded && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Founded
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 truncate max-w-full">
                    {founded}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Social links */}
          {hasSocial && (
            <div className="w-full max-w-[780px] flex flex-col items-start gap-2.5 sm:gap-3">
              <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                Social links
              </span>
              <div className="w-full max-w-[780px] h-5 flex flex-row items-center gap-4">
                {socialLinks.map((link: any, idx: number) => {
                  const meta = getSocialPlatformMeta(link.platform);
                  const iconName = meta.icon;
                  const label = link.display_label || link.label || meta.label;

                  return (
                    <a
                      key={idx}
                      href={link.url?.startsWith("http") ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noreferrer"
                      title={label}
                      aria-label={label}
                      className="w-5 h-5 flex items-center justify-center text-ds-text-primary hover:text-ds-accent transition-colors"
                    >
                      <Icon icon={iconName} className="w-5 h-5 shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Offices */}
          {hasOffices && (
            <div className="w-full max-w-[780px] flex flex-col items-start py-1 sm:py-2 gap-2">
              <h2 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
                Offices
              </h2>

              {offices.map((office: any, idx: number) => {
                const cityLabel = office.city || office.name || "";
                const isHQ = Boolean(office.is_headquarters);
                const fullAddress =
                  [office.address, office.city, office.country].filter(Boolean).join(", ");

                return (
                  <div key={office.id || idx} className="w-full flex flex-col items-start gap-2 sm:gap-3">
                    <div className="w-full max-w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2">
                      {cityLabel && (
                        <span className="text-ds-text-primary text-sm font-medium font-['DM_Sans'] leading-5">
                          {cityLabel}{isHQ ? " HQ" : ""}
                        </span>
                      )}
                      {fullAddress && (
                        <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                          {fullAddress}
                        </span>
                      )}
                    </div>

                    <InteractiveLocationMap
                      locationAddress={fullAddress || cityLabel}
                      latitude={office.latitude ? Number(office.latitude) : null}
                      longitude={office.longitude ? Number(office.longitude) : null}
                      readOnly={true}
                      className="w-full max-w-[780px] h-[88px] sm:h-[191px] rounded-2xl"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
