"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from "recharts";
import { ArrowUpwardAltIcon } from "@/components/icons";

interface KeyOfferingsSectionProps {
  keyOfferings?: { icon?: string; content: string }[];
  employeeGrowth?: {
    percentage: string;
    growth_value: number;
    base_count: number;
    current_headcount: number;
    total_joins: number;
    max_y: number;
    y_ticks: number[];
    start_month: string;
    current_month: string;
    trend: {
      month_num: number;
      month: string;
      full_month: string;
      joins: number;
      departures: number;
      headcount: number;
    }[];
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ds-border bg-ds-surface-1 px-3 py-2 shadow-lg min-w-[100px]">
      <p className="text-[10px] font-medium text-ds-text-secondary mb-0.5">{label}</p>
      <span className="text-[12px] font-semibold text-ds-accent">
        {payload[0].value.toLocaleString()} employees
      </span>
    </div>
  );
}

export default function KeyOfferingsSection({ keyOfferings, employeeGrowth }: KeyOfferingsSectionProps) {
  const defaultOfferings = [
    { content: "May offer exposure to emerging technologies" },
    { content: "Operates across multiple markets" },
    { content: "Focuses on innovation and growth" },
    { content: "Diverse project opportunities" },
  ];
  const offerings = keyOfferings && keyOfferings.length > 0 ? keyOfferings : defaultOfferings;

  const chartData = useMemo(() => {
    if (employeeGrowth?.trend && Array.isArray(employeeGrowth.trend) && employeeGrowth.trend.length > 0) {
      return employeeGrowth.trend.map((item) => ({
        month: item.month,
        full_month: (item.full_month || item.month).toUpperCase(),
        headcount: Number(item.headcount) || 0,
      }));
    }
    return [
      { full_month: "JANUARY", headcount: 1.2 },
      { full_month: "FEBRUARY", headcount: 1.1 },
      { full_month: "MARCH", headcount: 0.9 },
      { full_month: "APRIL", headcount: 1.8 },
      { full_month: "MAY", headcount: 3.2 },
      { full_month: "JUNE", headcount: 2.9 },
      { full_month: "JULY", headcount: 3.5 },
    ];
  }, [employeeGrowth?.trend]);

  const percentageStr = employeeGrowth?.percentage || "+5.2%";

  // Split offerings into 2 columns of 2 items
  const col1 = offerings.slice(0, Math.ceil(offerings.length / 2));
  const col2 = offerings.slice(Math.ceil(offerings.length / 2));

  return (
    <div className="self-stretch pl-5 flex flex-col justify-start items-start gap-6 mt-2">
      {/* Key Offerings Header & Grid */}
      <div className="self-stretch flex flex-col justify-start items-start gap-3">
        <h2 className="justify-center text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
          Key offerings
        </h2>

        <div className="self-stretch grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col justify-start items-start gap-4 w-full">
            {col1.map((offering, idx) => {
              const text = typeof offering === "object" ? (offering as any).content : (offering as string);
              return (
                <div
                  key={idx}
                  className="self-stretch min-h-10 px-4 py-2 bg-ds-surface-1 border-l-[3px] border-ds-accent inline-flex justify-start items-center gap-4 rounded-r-md"
                >
                  <p className="flex-1 justify-center text-ds-text-secondary text-base font-normal font-['DM_Sans'] leading-6">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col justify-start items-start gap-4 w-full">
            {col2.map((offering, idx) => {
              const text = typeof offering === "object" ? (offering as any).content : (offering as string);
              return (
                <div
                  key={idx}
                  className="self-stretch min-h-10 px-4 py-2 bg-ds-surface-1 border-l-[3px] border-ds-accent inline-flex justify-start items-center gap-4 rounded-r-md"
                >
                  <p className="flex-1 justify-center text-ds-text-secondary text-base font-normal font-['DM_Sans'] leading-6">
                    {text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Growth Trends Chart */}
      <div className="w-full flex flex-col justify-start items-start gap-6 overflow-hidden pt-2">
        <div className="self-stretch inline-flex justify-between items-center">
          <div className="inline-flex flex-col justify-start items-start">
            <h3 className="self-stretch justify-center text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6">
              Growth trends
            </h3>
            <span className="self-stretch justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              Hiring velocity over the last 6 months
            </span>
          </div>

          <div className="flex justify-start items-center gap-2">
            <ArrowUpwardAltIcon size={24} className="w-6 h-6 text-ds-success shrink-0" aria-hidden="true" />
            <span className="justify-start text-ds-success text-[32px] font-bold font-['DM_Sans'] leading-[40px]">
              {percentageStr}
            </span>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-48 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrowthFigma" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ds-accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--ds-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} />
              <XAxis
                dataKey="full_month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--ds-text-secondary)", fontSize: 12, fontFamily: "DM Sans" }}
                interval="preserveStartEnd"
              />
              <Area
                type="monotone"
                dataKey="headcount"
                stroke="var(--ds-accent)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGrowthFigma)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
