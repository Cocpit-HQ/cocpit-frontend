"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { getSocialPlatformMeta, DEFAULT_SOCIAL_PLATFORM_ICON } from "../../../constants/socialPlatforms";
import { useQuery } from "@tanstack/react-query";
import { companyProfileService } from "../../../services/companyprofile.service";

interface AboutTabProps {
  data: CompanyProfileData;
}

export default function AboutTab({ data }: AboutTabProps) {
  const { data: aboutData, isLoading } = useQuery({
    queryKey: ["orgAbout", data.id],
    queryFn: () => companyProfileService.getOrgAbout(data.id),
  });

  const about = aboutData?.about || {};
  const description = about.description || data.description;
  const slogan = about.slogan || data.slogan;
  const websiteUrl = about.website || data.websiteUrl;
  const phoneNumber = about.phone || about.phoneNumber || data.phoneNumber;
  const industry = about.industry || data.industry;
  const location = about.location || data.location;
  const employeeCount = about.size || about.employeeCount || data.employeeCount;
  const founded = about.established_year || about.founded || data.founded;
  const offices = aboutData?.offices || data.offices || [];
  // specialties is [{specialty_id, name}] from backend
  const specialtiesRaw = aboutData?.specialties || data.specialties || [];
  const specialties = specialtiesRaw.map((s: any) => (typeof s === "string" ? s : s.name)).filter(Boolean);
  const socialLinks = aboutData?.links || data.socialLinks || [];

  if (isLoading) {
    return (
      <div className="flex w-full justify-center py-10">
        <span className="text-zinc-500">Loading about information...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-[920px] gap-[16px]">
      {/* ── Description Section ── */}
      {description && (
        <div className="flex flex-col gap-[8px] w-full">
          <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
            Description
          </h2>
          <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
            {description}
          </p>
        </div>
      )}

      {/* ── Slogan Section ── */}
      {slogan && (
        <div className="flex flex-col gap-[8px] w-full">
          <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
            Slogan
          </h2>
          <div className="flex flex-col justify-center w-full min-h-[40px] py-[8px] pl-[12px] pr-[8px] bg-[#EFF4FF] dark:bg-[#0D47A1]/20 border-l-[4px] border-[#0D47A1]">
            <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400 italic">
              &quot;{slogan}&quot;
            </p>
          </div>
        </div>
      )}

      {/* ── Grid Details Section ── */}
      <div className="grid grid-cols-2 gap-y-[16px] gap-x-[16px] w-full">
        {/* Website */}
        {websiteUrl && (
          <div className="flex flex-col gap-[8px] py-[8px]">
            <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Website</h3>
            <a
              href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
              target="_blank"
              rel="noreferrer"
              className="font-poppins font-normal text-[16px] leading-[24px] text-[#1A73E8] dark:text-[#1A73E8] hover:underline"
            >
              {websiteUrl}
            </a>
          </div>
        )}

        {/* Phone Number */}
        {phoneNumber && (
          <div className="flex flex-col gap-[8px] py-[8px]">
            <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Phone Number</h3>
            <a
              href={`tel:${phoneNumber}`}
              className="font-poppins font-normal text-[16px] leading-[24px] text-[#1A73E8] dark:text-[#1A73E8] hover:underline"
            >
              {phoneNumber}
            </a>
          </div>
        )}

        {/* Industry */}
        {industry && (
          <div className="flex flex-col gap-[8px] py-[8px]">
            <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Industry</h3>
            <span className="inline-flex items-center justify-center w-fit px-[16px] py-[8px] rounded-[24px] bg-[#EFF4FF] dark:bg-zinc-800 text-[#6B7280] dark:text-zinc-300 text-[14px] leading-[16px] font-normal font-poppins">
              {industry}
            </span>
          </div>
        )}

        {/* Headquarters */}
        {location && (
          <div className="flex flex-col gap-[8px] py-[8px]">
            <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Headquarters</h3>
            <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
              {location}
            </p>
          </div>
        )}

        {/* Organization size */}
        {employeeCount && (
          <div className="flex flex-col gap-[8px] py-[8px]">
            <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Organization size</h3>
            <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
              {employeeCount}
            </p>
          </div>
        )}

        {/* Founded */}
        {founded && (
          <div className="flex flex-col gap-[8px] py-[8px]">
            <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Founded</h3>
            <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
              {founded}
            </p>
          </div>
        )}
      </div>

      {/* ── Offices Section ── */}
      {offices && offices.length > 0 && (
        <div className="flex flex-col gap-[8px] w-full">
          <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
            Offices
          </h2>
          <div className="flex flex-col gap-[12px]">
            {offices.map((office: any, idx: number) => (
              <div key={idx} className="flex flex-col gap-[12px]">
                <div className="flex flex-row items-center gap-[10px]">
                  <div className="flex items-center justify-center w-[24px] h-[24px]">
                    <Icon icon="hugeicons:location-05" className="w-[24px] h-[24px] text-[#6B7280] dark:text-zinc-400" />
                  </div>
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-poppins font-semibold text-[16px] leading-[24px] text-[#000000] dark:text-zinc-100">
                      {office.city}
                    </span>
                    <span className="font-poppins font-normal text-[12px] leading-[16px] text-[#6B7280] dark:text-zinc-400">
                      {office.address ? `${office.address}, ${office.country}` : office.country}
                    </span>
                  </div>
                </div>
                
                {/* Interactive Google Map Preview */}
                {(office.city || office.country) && (
                  <div className="relative w-full h-[180px] bg-[#E5E9F0] dark:bg-[#111827] rounded-[24px] overflow-hidden border border-[#E0E0E7] dark:border-[#1C2840] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none flex items-center justify-center">
                    <iframe
                      width="100%"
                      height="100%"
                      className="border-0 relative z-0"
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent([office.address, office.city, office.country].filter(Boolean).join(', '))}&z=${office.city ? 12 : 5}&output=embed`}
                    />
                    <a
                      href={`https://maps.google.com/maps?q=${encodeURIComponent([office.address, office.city, office.country].filter(Boolean).join(', '))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-10 cursor-pointer"
                      aria-label="Open in Google Maps"
                    />
                    <div className="absolute bottom-3.5 px-3.5 py-1 bg-white/95 dark:bg-[#1C2840]/95 rounded-full shadow-sm text-center border border-slate-100 dark:border-[#1C2840]/50 flex items-center gap-1 select-none z-20 pointer-events-none">
                      <Icon icon="mynaui:map" className="w-3.5 h-3.5 text-slate-500 dark:text-[#A1A8B3]" />
                      <span className="text-[10px] font-poppins font-medium text-slate-600 dark:text-[#A1A8B3]">Map Preview</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Links Section ── */}
      {socialLinks && socialLinks.length > 0 && (
        <div className="flex flex-col gap-[8px] w-full">
          <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
            Links
          </h2>
          <div className="flex flex-wrap gap-[8px]">
            {socialLinks.map((link: any, idx: number) => {
              const meta = getSocialPlatformMeta(link.platform);
              const label = link.display_label || link.label || meta?.label || link.platform || "Social link";
              return (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  title={label}
                  aria-label={label}
                  className="flex items-center justify-center w-[36px] h-[36px] rounded-full text-[#1A73E8] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <Icon icon={meta?.icon || DEFAULT_SOCIAL_PLATFORM_ICON} className="w-[24px] h-[24px] shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Specialties Section ── */}
      {specialties && specialties.length > 0 && (
        <div className="flex flex-col gap-[8px] w-full">
          <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
            Specialties
          </h2>
          <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
            {specialties.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
