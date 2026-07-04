"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { CompanyProfileData } from "../../../types/company-profile.types";

interface AboutTabProps {
  data: CompanyProfileData;
}

export default function AboutTab({ data }: AboutTabProps) {
  return (
    <div className="flex flex-col w-full max-w-[920px] gap-[16px]">

      {/* ── Description Section ── */}
      <div className="flex flex-col gap-[8px] w-full">
        <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
          Description
        </h2>
        <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
          {data.description}
        </p>
      </div>

      {/* ── Slogan Section ── */}
      <div className="flex flex-col gap-[8px] w-full">
        <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
          Slogan
        </h2>
        <div className="flex flex-col justify-center w-full min-h-[40px] py-[8px] pl-[12px] pr-[8px] bg-[#EFF4FF] dark:bg-[#0D47A1]/20 border-l-[4px] border-[#0D47A1]">
          <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400 italic">
            &quot;{data.slogan}&quot;
          </p>
        </div>
      </div>

      {/* ── Grid Details Section ── */}
      <div className="grid grid-cols-2 gap-y-[16px] gap-x-[16px] w-full">

        {/* Website */}
        <div className="flex flex-col gap-[8px] py-[8px]">
          <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Website</h3>
          <a
            href={data.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="font-poppins font-normal text-[16px] leading-[24px] text-[#1A73E8] dark:text-[#1A73E8] hover:underline"
          >
            {data.websiteUrl}
          </a>
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-[8px] py-[8px]">
          <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Phone Number</h3>
          <a
            href={`tel:${data.phoneNumber}`}
            className="font-poppins font-normal text-[16px] leading-[24px] text-[#1A73E8] dark:text-[#1A73E8] hover:underline"
          >
            {data.phoneNumber || "+91 93493-99493"}
          </a>
        </div>

        {/* Industry */}
        <div className="flex flex-col gap-[8px] py-[8px]">
          <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Industry</h3>
          <span className="inline-flex items-center justify-center w-fit px-[16px] py-[8px] rounded-[24px] bg-[#EFF4FF] dark:bg-zinc-800 text-[#6B7280] dark:text-zinc-300 text-[14px] leading-[16px] font-normal font-poppins">
            {data.industry}
          </span>
        </div>

        {/* Headquarters */}
        <div className="flex flex-col gap-[8px] py-[8px]">
          <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Headquarters</h3>
          <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
            {data.location}
          </p>
        </div>

        {/* Organization size */}
        <div className="flex flex-col gap-[8px] py-[8px]">
          <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Organization size</h3>
          <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
            {data.employeeCount}
          </p>
        </div>

        {/* Founded */}
        <div className="flex flex-col gap-[8px] py-[8px]">
          <h3 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">Founded</h3>
          <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
            {data.founded || "2026"}
          </p>
        </div>

      </div>

      {/* ── Offices Section ── */}
      {data.offices && data.offices.length > 0 && (
        <div className="flex flex-col gap-[8px] w-full">
          <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
            Offices
          </h2>
          <div className="flex flex-col gap-[12px]">
            {data.offices.map((office, idx) => (
              <div key={idx} className="flex flex-row items-center gap-[10px]">
                <div className="flex items-center justify-center w-[24px] h-[24px]">
                  <Icon icon="hugeicons:location-05" className="w-[24px] h-[24px] text-[#6B7280] dark:text-zinc-400" />
                </div>
                <div className="flex flex-col gap-[4px]">
                  <span className="font-poppins font-semibold text-[16px] leading-[24px] text-[#000000] dark:text-zinc-100">
                    {office.city}
                  </span>
                  <span className="font-poppins font-normal text-[12px] leading-[16px] text-[#6B7280] dark:text-zinc-400">
                    {office.address}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Links Section ── */}
      <div className="flex flex-col gap-[8px] w-full">
        <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
          Links
        </h2>
        <div className="flex flex-wrap gap-[8px]">
          {data.socialLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="px-[16px] py-[6px] border border-[#1A73E8] rounded-full font-poppins text-[#1A73E8] dark:text-blue-400 text-[14px] leading-[20px] font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* ── Specialties Section ── */}
      {data.specialties && data.specialties.length > 0 && (
        <div className="flex flex-col gap-[8px] w-full">
          <h2 className="font-poppins font-medium text-[18px] leading-[27px] text-[#000000] dark:text-zinc-100">
            Specialties
          </h2>
          <p className="font-poppins font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
            {data.specialties.join(", ")}
          </p>
        </div>
      )}

    </div>
  );
}
