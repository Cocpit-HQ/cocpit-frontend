"use client";

import React, { useState, useMemo } from "react";
import { BusinessProfileData } from "../../types/business-profile.types";
import { Icon, SVG_ICONS, GoogleIcon } from "@/components/icons";
import { ExternalLink, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import InteractiveLocationMap from "@/features/company-onboarding/components/InteractiveLocationMap";
import { toast } from "@/shared/commonComponents/GlobalToast";

const getGoogleMapsUrl = (
  locationQuery?: string,
  latitude?: number | string | null,
  longitude?: number | string | null,
  customUrl?: string
): string | null => {
  if (customUrl && (customUrl.startsWith("http://") || customUrl.startsWith("https://"))) {
    return customUrl;
  }
  const hasCoords =
    latitude != null &&
    longitude != null &&
    !isNaN(Number(latitude)) &&
    !isNaN(Number(longitude)) &&
    Number(latitude) !== 0 &&
    Number(longitude) !== 0;

  const query =
    (locationQuery && locationQuery.trim()) ||
    (hasCoords ? `${latitude},${longitude}` : "");

  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

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

export default function AboutTab({ data, isOwnProfile }: AboutTabProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
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

  // ── Email ──
  const email = (about.email || (aboutData as any)?.email || data.email || "").trim();

  const handleCopyEmail = () => {
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmail(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // ── Part 2: Row 1 (Website & Phone number) ──
  const websiteUrl = (about.website || data.websiteUrl || "").trim();

  // Phone number hidden per requirement
  // const isMobileShow = aboutData
  //   ? (about.isMobileShow ?? about.is_mobile_show ?? true)
  //   : (data.isMobileShow ?? true);
  // const rawPhone = aboutData ? (about.phone || about.phoneNumber || null) : (data.phoneNumber || null);
  // const phoneNumber = isMobileShow && rawPhone ? String(rawPhone).trim() : "";
  const phoneNumber = "";

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

  const location = (about.location_formatted || about.location || about.headquarter || data.location || about.city || "").trim();
  const anyData = data as any;
  const hqLat = about.latitude != null ? Number(about.latitude) : (anyData.latitude != null ? Number(anyData.latitude) : null);
  const hqLng = about.longitude != null ? Number(about.longitude) : (anyData.longitude != null ? Number(anyData.longitude) : null);
  const hqMapUrl = getGoogleMapsUrl(location, hqLat, hqLng, about.mapUrl || about.map_url || anyData.mapUrl);

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
    ? rawSocialLinks
        .filter((link: any) => Boolean(link?.url && link.url.trim() && link.url !== "#"))
        .map((link: any) => {
          const raw = (link.platform || "website").toLowerCase().trim();
          const platform = raw === "twitter" ? "x" : raw;
          const iconName = platform in SVG_ICONS ? platform : "website";
          return {
            platform,
            iconName: iconName as any,
            label: link.display_label || link.label || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Website"),
            url: link.url.startsWith("http") ? link.url : `https://${link.url}`,
          };
        })
  : [];

  // ── Part 2: Offices (Only real offices) ──
  const rawOffices = aboutData?.offices || data.offices || [];
  const offices = Array.isArray(rawOffices)
    ? rawOffices.filter((o: any) => Boolean(o && (o.city || o.address || o.name || o.country)))
    : [];

  const officeRows = useMemo(() => {
    const rows: any[][] = [];
    for (let i = 0; i < offices.length; i += 2) {
      rows.push(offices.slice(i, i + 2));
    }
    return rows;
  }, [offices]);

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
  const hasEmail = Boolean(email);
  const hasRow1 = Boolean(industry || employeeCount);
  const hasRow2 = Boolean(founded || websiteUrl);
  const hasHeadquarter = Boolean(location);
  const hasSocial = socialLinks.length > 0;
  const hasOffices = offices.length > 0;
  const hasPart2 = hasSpecialties || hasEmail || hasRow1 || hasRow2 || hasHeadquarter || hasSocial || hasOffices;

  // If nothing is present in About at all, show clean empty state
  if (!hasPart1 && !hasPart2) {
    return (
      <div className="w-full max-w-[800px] px-4 sm:pl-5 sm:pr-0 py-16 flex flex-col items-center justify-center gap-3 font-['DM_Sans'] text-center">
        <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center">
          <Icon name="info" size={20} className="w-6 h-6 text-ds-text-secondary" />
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
    <div className="w-full max-w-[800px] px-4 sm:px-0 flex flex-col items-start gap-4 sm:gap-5 pb-16 font-['DM_Sans']">
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

          {/* Email */}
          {email && (
            <div className="w-full max-w-[780px] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10">
              <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                  Email
                </span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="group inline-flex items-center gap-2 text-[var(--ds-accent)] !text-[var(--ds-accent)] text-sm font-normal font-['DM_Sans'] leading-5 max-w-full hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-0 p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)] rounded-sm"
                  title={copiedEmail ? "Copied!" : "Click to copy email"}
                  aria-label={`Copy email address ${email}`}
                >
                  <span className="break-all">{email}</span>
                  {copiedEmail && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--ds-success)] font-medium shrink-0 animate-in fade-in duration-200">
                      <Check className="w-3.5 h-3.5 text-[var(--ds-success)]" />
                      <span>Copied!</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Row 1: Industry & Organization size */}
          {hasRow1 && (
            <div className="w-full max-w-[780px] flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10">
              {industry && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Industry
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 break-words [overflow-wrap:anywhere]">
                    {industry}
                  </span>
                </div>
              )}

              {employeeCount && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Organization size
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 break-words [overflow-wrap:anywhere]">
                    {employeeCount}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Row 2: Founded & Website */}
          {hasRow2 && (
            <div className="w-full max-w-[780px] flex flex-col sm:flex-row items-start sm:items-start gap-4 sm:gap-10">
              {founded && (
                <div className="w-full sm:w-[300px] shrink-0 flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Founded
                  </span>
                  <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 break-words [overflow-wrap:anywhere]">
                    {founded}
                  </span>
                </div>
              )}

              {websiteUrl && (
                <div className="w-full sm:w-[300px] flex flex-col justify-center items-start py-1 sm:py-2 gap-1.5 sm:gap-2.5">
                  <span className="text-ds-text-primary text-sm font-semibold font-['DM_Sans'] leading-5">
                    Website
                  </span>
                  <a
                    href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-website-link text-[var(--ds-accent)] !text-[var(--ds-accent)] text-sm font-normal font-['DM_Sans'] leading-5 break-all max-w-full hover:no-underline hover:opacity-85 transition-opacity"
                  >
                    {formatDisplayUrl(websiteUrl)}
                  </a>
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
              <div className="w-full max-w-[780px] min-h-[20px] flex flex-row items-center gap-4 flex-wrap">
                {socialLinks.map((link: any, idx: number) => {
                  const isCocpit = link.iconName === "cocpit" || link.platform === "cocpit";
                  const iconSize = isCocpit ? 16 : 20;
                  const iconClass = isCocpit ? "w-4 h-4" : "w-5 h-5";

                  return (
                    <a
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      title={link.label}
                      aria-label={link.label}
                      className="w-5 h-5 flex-none shrink-0 flex items-center justify-center text-ds-text-primary hover:opacity-80 transition-opacity cursor-pointer"
                    >
                      <Icon
                        name={link.iconName}
                        size={iconSize}
                        stroke={isCocpit ? "#FFECE6" : undefined}
                        className={`${iconClass} flex-none shrink-0 ${isCocpit ? "text-[#FFECE6]" : ""}`}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Headquarter */}
          {hasHeadquarter && (
            <div className="w-full max-w-[780px] flex flex-col items-start py-1 sm:py-2 gap-2 sm:gap-2.5">
              <h2 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
                Headquarter
              </h2>

              <div className="w-full flex flex-col justify-center items-start gap-1">
                <span className="text-ds-text-primary text-sm font-medium font-['DM_Sans'] leading-5">
                  Location
                </span>
                <span className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 break-words [overflow-wrap:anywhere]">
                  {location}
                </span>
              </div>

              <div className="relative w-full sm:w-[780px] max-w-[780px] h-[191px] rounded-2xl overflow-hidden group">
                <InteractiveLocationMap
                  locationAddress={location}
                  latitude={hqLat}
                  longitude={hqLng}
                  readOnly={true}
                  className="!w-full !h-full !rounded-2xl !border-0"
                />

                {hqMapUrl && (
                  <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-30 pointer-events-auto">
                    <a
                      href={hqMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open in Google Maps"
                      aria-label={`Open ${location} in Google Maps`}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-ds-surface-1/90 hover:bg-ds-surface-2 active:scale-95 backdrop-blur-md border border-ds-border shadow-md flex items-center gap-1.5 transition-all hover:scale-[1.02] text-xs font-medium font-['DM_Sans'] text-ds-text-primary cursor-pointer no-underline"
                    >
                      <GoogleIcon size={14} className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">Open in Google Maps</span>
                      <span className="sm:hidden">Open Maps</span>
                      <ExternalLink className="w-3 h-3 text-ds-text-muted shrink-0" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Offices */}
          {hasOffices && (
            <div className="w-full sm:w-[780px] max-w-[780px] flex flex-col items-start py-1 sm:py-2 gap-3 sm:gap-4">
              <h2 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
                Offices ({offices.length})
              </h2>

              <div className="w-full sm:w-[780px] max-w-[780px] flex flex-col gap-4 sm:gap-5">
                {officeRows.map((row, rowIndex) => (
                  <div
                    key={`office-row-${rowIndex}`}
                    className="w-full sm:w-[780px] max-w-[780px] grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4 sm:gap-y-5"
                  >
                    {row.map((office: any, idx: number) => {
                      const rawCity = office.city || office.name || "";
                      const isHQ = Boolean(office.is_headquarters);
                      const fullAddress =
                        [office.address, office.city, office.country].filter(Boolean).join(", ");
                      const mapUrl = getGoogleMapsUrl(
                        fullAddress || rawCity,
                        office.latitude,
                        office.longitude,
                        office.mapUrl || office.map_url
                      );
                      const displayTitle = rawCity
                        ? (rawCity.toLowerCase().includes("office") ? rawCity : `${rawCity} Office`)
                        : "Office";

                      return (
                        <div
                          key={office.id || office.office_id || `${rowIndex}-${idx}`}
                          className="w-full md:w-[384px] md:max-w-[384px] flex flex-col justify-between gap-2"
                        >
                          <div className="w-full flex flex-col justify-start items-start gap-1">
                            <span className="text-ds-text-primary text-sm font-medium font-['DM_Sans'] leading-5">
                              {displayTitle}{isHQ ? " (HQ)" : ""}
                            </span>
                            {fullAddress && (
                              <span
                                title={fullAddress}
                                className="text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5 break-words [overflow-wrap:anywhere] line-clamp-2"
                              >
                                {fullAddress}
                              </span>
                            )}
                          </div>

                          <div className="relative w-full md:w-[384px] h-[94px] rounded-2xl overflow-hidden group mt-auto">
                            <InteractiveLocationMap
                              locationAddress={fullAddress || rawCity}
                              latitude={office.latitude ? Number(office.latitude) : null}
                              longitude={office.longitude ? Number(office.longitude) : null}
                              readOnly={true}
                              className="!w-full !h-full !rounded-2xl !border-0"
                            />

                            {mapUrl && (
                              <div className="absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 z-30 pointer-events-auto">
                                <a
                                  href={mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open in Google Maps"
                                  aria-label={`Open ${rawCity || fullAddress || "office location"} in Google Maps`}
                                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-ds-surface-1/90 hover:bg-ds-surface-2 active:scale-95 backdrop-blur-md border border-ds-border shadow-md flex items-center gap-1 transition-all hover:scale-[1.02] text-[11px] sm:text-xs font-medium font-['DM_Sans'] text-ds-text-primary cursor-pointer no-underline"
                                >
                                  <GoogleIcon size={12} className="w-3 h-3 shrink-0" />
                                  <span className="hidden sm:inline">Open in Maps</span>
                                  <span className="sm:hidden">Maps</span>
                                  <ExternalLink className="w-2.5 h-2.5 text-ds-text-muted shrink-0" />
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
