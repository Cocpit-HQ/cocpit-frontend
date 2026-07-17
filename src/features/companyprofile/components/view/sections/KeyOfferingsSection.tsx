
"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface KeyOfferingsSectionProps {
  keyOfferings?: { icon: string; content: string }[];
}

const DEFAULT_OFFERINGS = [
  "May offer exposure to emerging technologies",
  "Operates across multiple markets",
  "Focuses on innovation and growth",
  "Diverse project opportunities",
];

const OFFERING_ICONS = [
  "iconoir:rocket",
  "iconoir:globe",
  "lucide:trending-up",
  "lucide:folder-tree",
];

export default function KeyOfferingsSection({ keyOfferings }: KeyOfferingsSectionProps) {
  const offerings = keyOfferings && keyOfferings.length > 0 ? keyOfferings : DEFAULT_OFFERINGS;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0px",
        gap: "48px",
        width: "960px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="bg-white dark:bg-zinc-950 max-md:!w-full max-md:!h-auto max-md:!px-4 max-md:!mx-auto"
    >
      {/* Top Section: Key Offerings */}
      <div className="flex flex-col gap-6 w-full max-w-[920px]">
        <h2
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "24px",
            lineHeight: "32px",
          }}
          className="text-black dark:text-white"
        >
          Key offerings
        </h2>

        <div className="flex flex-row flex-wrap gap-x-[24px] gap-y-4 w-full">
          {offerings.map((offering, idx) => {
            const isObject = typeof offering === 'object' && offering !== null;
            const text = isObject ? (offering as any).content : offering as string;
            const iconStr = isObject && (offering as any).icon ? (offering as any).icon : OFFERING_ICONS[idx % OFFERING_ICONS.length];
            return (
              <div
                key={idx}
                style={{
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "8px 16px",
                  gap: "16px",
                  width: "448px",
                  height: "40px",
                  borderLeft: "3px solid #0D47A1",
                }}
                className="bg-[#EFF4FF] dark:bg-zinc-900/50 dark:border-blue-500 flex-none max-md:!w-full"
              >
                <Icon icon={iconStr} width="24" height="24" className="w-6 h-6 flex-none text-[#0D47A1] dark:text-blue-400" />
                <div className="flex flex-col items-start p-0 flex-1 overflow-hidden">
                  <span
                    style={{
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 500,
                      fontSize: "16px",
                      lineHeight: "16px",
                    }}
                    className="text-[#6B7280] dark:text-zinc-400 truncate w-full"
                  >
                    {text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Growth Trends */}
      <div className="flex flex-col gap-6 w-full max-w-[920px]">
        {/* Header */}
        <div className="flex flex-row justify-between items-start w-full">
          <div className="flex flex-col gap-1">
            <h2
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "40px",
                lineHeight: "48px",
                letterSpacing: "-0.02em"
              }}
              className="text-black dark:text-white"
            >
              Growth trends
            </h2>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "14px",
                lineHeight: "20px",
              }}
              className="text-[#6B7280] dark:text-zinc-400"
            >
              Hiring velocity over the last 6 months
            </span>
          </div>

          <div className="flex flex-row items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center">
              <Icon icon="lucide:arrow-up" className="w-4 h-4 text-[#22C55E]" strokeWidth={3} />
            </div>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "28px",
                lineHeight: "36px",
              }}
              className="text-[#22C55E]"
            >
              +5.2%
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative w-full h-[180px] mt-4">
          <svg
            style={{ position: "absolute", width: "100%", height: "120px", top: "0px" }}
            className="overflow-visible"
            viewBox="0 0 920 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E8F1FF" stopOpacity="1" />
                <stop offset="100%" stopColor="#E8F1FF" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path
              d="M 22,120 L 22,110 C 89,75 136,60 255,60 C 326,60 374,85 445,85 C 540,85 571,55 706,50 C 777,45 849,55 920,20 L 920,120 Z"
              fill="url(#growthGradient)"
            />
            <path
              d="M 22,110 C 89,75 136,60 255,60 C 326,60 374,85 445,85 C 540,85 571,55 706,50 C 777,45 849,55 920,20"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="4"
            />
            <circle cx="22" cy="110" r="5" fill="#3B82F6" />
            <circle cx="920" cy="20" r="5" fill="#3B82F6" />
          </svg>

          <div className="absolute top-[140px] left-0 w-full flex justify-between border-t border-gray-200 dark:border-zinc-800 pt-4">
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "10px",
                letterSpacing: "0.05em",
              }}
              className="text-[#6B7280] dark:text-zinc-500 uppercase"
            >
              JANUARY
            </span>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 600,
                fontSize: "10px",
                letterSpacing: "0.05em",
              }}
              className="text-[#6B7280] dark:text-zinc-500 uppercase"
            >
              JULY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
