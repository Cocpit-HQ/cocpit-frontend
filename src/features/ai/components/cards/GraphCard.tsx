"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface GraphCardProps {
  title: string;
  type?: "graph" | "chart";
  onClick: () => void;
  isActive?: boolean;
}

export default function GraphCard({ title, type = "graph", onClick, isActive = false }: GraphCardProps) {
  const isChart = type === "chart";

  return (
    <div
      onClick={onClick}
      className={`box-border flex flex-row items-center px-2 gap-2 w-[228px] h-[56px] rounded-xl cursor-pointer mt-2 select-none transition-all duration-200 ${
        isActive
          ? "border border-[#6366F1] bg-[#EEF2FF]/30 shadow-[0_2px_4px_rgba(99,102,241,0.1)]"
          : "border border-[#DADADA] bg-white hover:border-[#6366F1] hover:shadow-[0_2px_4px_rgba(99,102,241,0.1)]"
      }`}
    >
      {/* Icon/Illustration Container (40x40) */}
      <div className="w-[40px] h-[40px] rounded-lg bg-[#EEF2FF] flex items-center justify-center shrink-0">
        {isChart ? (
          <Icon icon="flat-color-icons:pie-chart" width="24" height="24" />
        ) : (
          <Icon icon="streamline-plump-color:graphic-template-website-ui-flat" width="24" height="24" />
        )}
      </div>

      {/* Title & Subtitle */}
      <div className="flex flex-col justify-center min-w-0 flex-1 font-sans">
        <div className="text-[14px] font-semibold text-[#1F2937] truncate leading-tight">
          {title}
        </div>
        <div className="text-[12px] font-normal text-[#6B7280] leading-tight mt-[2px]">
          {isChart ? "Chart" : "Graph"}
        </div>
      </div>
    </div>
  );
}
