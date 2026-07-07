"use client";

import React from "react";
import { CompanyProfileData } from "../../../types/company-profile.types";

interface AboutSectionProps {
    data: CompanyProfileData;
    onViewMoreClick?: () => void;
}

export default function AboutSection({ data, onViewMoreClick }: AboutSectionProps) {
    return (
        <div className="flex flex-col w-full bg-white dark:bg-zinc-950 rounded-xl gap-[16px]">

            {/* About heading */}
            <h2 className="w-full font-semibold text-[24px] text-[#000000] dark:text-zinc-100">
                About
            </h2>

            {/* Description */}
            <p className="w-full font-normal text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400 line-clamp-3">
                {data.description}
            </p>

            {/* VerticalBorder - Quote callout */}
            <div className="flex flex-col items-start w-full py-[12px] px-[16px] bg-[#EFF4FF] dark:bg-zinc-900 border-l-4 border-[#0D47A1] dark:border-blue-500 rounded-r-md">
                <p className="w-full font-normal italic text-[16px] leading-[24px] text-[#6B7280] dark:text-zinc-400">
                    &ldquo;{data.slogan}&rdquo;
                </p>
            </div>

            {/* Container - Social link pills */}
            <div className="flex flex-row flex-wrap items-start w-full gap-[8px]">
                {data.socialLinks.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-row items-center px-[16px] py-[6px] gap-[4px] border border-[#1A73E8] rounded-full hover:bg-blue-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                        <span className="font-medium text-[14px] leading-[20px] text-[#1A73E8] dark:text-blue-400">
                            {link.label || link.platform}
                        </span>
                    </a>
                ))}
            </div>

            {/* Frame 2609084 - View more */}
            <div className="w-full flex justify-center">
                <button 
                    onClick={onViewMoreClick}
                    className="w-[86px] h-[20px] font-medium text-[16px] leading-[20px] text-center text-[#6B7280] dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 transition-colors"
                >
                    View more
                </button>
            </div>

        </div>
    );
}
