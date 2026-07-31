"use client";

import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

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



const OFFERING_ICONS = [
  "iconoir:rocket",
  "iconoir:globe",
  "lucide:trending-up",
  "lucide:folder-tree",
];

// Custom Tooltip for Hovering on Graph
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-lg min-w-[120px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <span className="text-sm font-semibold text-foreground text-blue-600 dark:text-blue-400">
        {payload[0].value.toLocaleString()} employees
      </span>
    </div>
  );
}

export default function KeyOfferingsSection({ keyOfferings, employeeGrowth }: KeyOfferingsSectionProps) {
  const offerings = keyOfferings || [];
  const hasOfferings = offerings.length > 0;

  // --- Growth Chart Calculations ---
  const yTicks = useMemo(() => {
    if (employeeGrowth?.y_ticks && Array.isArray(employeeGrowth.y_ticks) && employeeGrowth.y_ticks.length > 0) {
      return [...employeeGrowth.y_ticks].reverse(); // Recharts YAxis ticks order from 0 to max
    }
    return [0, 5];
  }, [employeeGrowth?.y_ticks]);

  const chartData = useMemo(() => {
    if (employeeGrowth?.trend && Array.isArray(employeeGrowth.trend) && employeeGrowth.trend.length > 0) {
      return employeeGrowth.trend.map(item => ({
        month: item.month,
        full_month: (item.full_month || item.month).toUpperCase(),
        headcount: Number(item.headcount) || 0
      }));
    }
    return [
      { month: "Jan", full_month: "JANUARY", headcount: 0 },
      { month: "Jul", full_month: "JULY", headcount: 0 }
    ];
  }, [employeeGrowth?.trend]);

  const percentageStr = employeeGrowth?.percentage || "+0.0%";
  const isNegative = percentageStr.startsWith("-");

  const startMonthLabel = (employeeGrowth?.start_month || "JANUARY").toUpperCase();
  const currentMonthLabel = (employeeGrowth?.current_month || "JULY").toUpperCase();

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
      {hasOfferings && (
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
            const text = isObject ? (offering as any).content : (offering as string);
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
                  width: offerings.length === 3 && idx === 2 ? "100%" : "448px",
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
      )}

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
              Hiring velocity YTD ({startMonthLabel} – {currentMonthLabel})
            </span>
          </div>

          <div className="flex flex-row items-center gap-2 mt-2">
            <div className={`w-6 h-6 rounded-full ${isNegative ? 'bg-red-500/10' : 'bg-green-500/10'} flex items-center justify-center`}>
              <Icon
                icon={isNegative ? "lucide:arrow-down" : "lucide:arrow-up"}
                className={`w-4 h-4 ${isNegative ? 'text-red-500' : 'text-[#22C55E]'}`}
                strokeWidth={3}
              />
            </div>
            <span
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "28px",
                lineHeight: "36px",
              }}
              className={isNegative ? "text-red-500" : "text-[#22C55E]"}
            >
              {percentageStr}
            </span>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="h-[180px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="orgGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              
              <XAxis
                dataKey="full_month"
                tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                ticks={yTicks}
                domain={[0, yTicks[yTicks.length - 1]]}
                tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border)' }} />

              <Area
                type="monotone"
                dataKey="headcount"
                stroke="#3B82F6"
                strokeWidth={3.5}
                fill="url(#orgGrowthGrad)"
                dot={{ r: 4, fill: '#3B82F6', stroke: '#3B82F6' }}
                activeDot={{ r: 6, fill: '#3B82F6', stroke: 'var(--card)', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
