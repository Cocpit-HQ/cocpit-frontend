"use client";

import React from "react";
import { CompanyProfileData } from "../../../types/company-profile.types";

interface AboutSectionProps {
    data: CompanyProfileData;
}

export default function AboutSection({ data }: AboutSectionProps) {
    return (
        <div className="flex flex-col w-full bg-white dark:bg-zinc-950 rounded-xl pt-0 pr-6 pb-6 pl-0 gap-[16px]">

            {/* About heading */}
            <h2 className="w-[920px] h-[32px] font-semibold text-[24px] leading-[32px] flex items-center text-[#000000] dark:text-zinc-100">
                About
            </h2>

            {/* Description */}
            <p className="w-[920px] h-[48px] font-normal text-[16px] leading-[24px] flex items-center text-[#6B7280] dark:text-zinc-400">
                {data.description}
            </p>

            {/* VerticalBorder - Quote callout */}
            <div className="box-border flex flex-col items-start w-[920px] h-[40px] pt-[8px] pr-0 pb-[8px] pl-[12px] bg-[#EFF4FF] dark:bg-zinc-900 border-l-4 border-[#0D47A1] dark:border-blue-500">
                <p className="w-[400px] h-[24px] font-normal italic text-[16px] leading-[24px] flex items-center text-[#6B7280] dark:text-zinc-400">
                    &ldquo;{data.slogan}&rdquo;
                </p>
            </div>

            {/* Container - Social link pills */}
            <div className="flex flex-row items-start w-[920px] h-[34px] p-0 gap-[8px]">
                {data.socialLinks.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="box-border flex flex-row items-center px-[12px] py-[8px] gap-[4px] h-[34px] border border-[#1A73E8] rounded-[9999px] hover:bg-blue-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                        <span className="font-semibold text-[12px] leading-[16px] flex items-center text-[#1A73E8]">
                            {link.label}
                        </span>
                    </a>
                ))}
            </div>

            {/* Frame 2609084 - View more */}
            <div className="w-full flex justify-center">
                <button className="w-[86px] h-[20px] font-medium text-[16px] leading-[20px] text-center text-[#6B7280] dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors">
                    View more
                </button>
            </div>

        </div>
    );
}
