"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// Mock Data Definitions
const lineChartData = [
  { name: "Jan", value: 1200 },
  { name: "Feb", value: 1900 },
  { name: "Mar", value: 1500 },
  { name: "Apr", value: 2500 },
  { name: "May", value: 2200 },
  { name: "Jun", value: 3000 },
];

const barChartData = [
  { name: "10", value: 45 },
  { name: "11", value: 90 },
  { name: "12", value: 65 },
  { name: "13", value: 80 },
  { name: "14", value: 50 },
];

const areaChartData = [
  { name: "M", value: 200 },
  { name: "T", value: 450 },
  { name: "W", value: 300 },
  { name: "T", value: 750 },
  { name: "F", value: 500 },
  { name: "S", value: 650 },
  { name: "S", value: 600 },
];

const multiLineChartData = [
  { name: "Q1", prodA: 120, prodB: 90 },
  { name: "Q2", prodA: 180, prodB: 140 },
  { name: "Q3", prodA: 160, prodB: 200 },
  { name: "Q4", prodA: 240, prodB: 210 },
];

const stackedBarData = [
  { name: "Jan", direct: 40, referral: 24 },
  { name: "Feb", direct: 50, referral: 30 },
  { name: "Mar", direct: 60, referral: 45 },
  { name: "Apr", direct: 80, referral: 50 },
];

const horizontalBarData = [
  { name: "Direct", value: 400 },
  { name: "Search", value: 800 },
  { name: "Social", value: 550 },
  { name: "Referral", value: 200 },
];

export default function LunarPanelGraphView({ isDownload = false }: { isDownload?: boolean }) {
  const [isMounted, setIsMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark" || theme === "navy";

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`${isDownload ? "w-[800px]" : "w-[276px]"} h-[760px] flex items-center justify-center text-[var(--muted-foreground)] font-sans`}>
        Loading charts...
      </div>
    );
  }

  // Common Card Styles
  const cardStyle = `box-border ${isDownload ? "w-full" : "w-[276px]"} h-[340px] bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-[var(--card-shadow-inner)] p-4 flex flex-col justify-between font-sans shrink-0`;
  const cardHeaderStyle = "flex justify-between items-center w-full";
  const cardTitleStyle = "text-[14px] font-semibold text-[var(--foreground)] m-0";
  const metricsContainerStyle = "flex flex-col gap-[6px] w-full border-t border-[var(--border)] pt-[10px]";
  const metricRowStyle = "flex justify-between text-[12px] text-[var(--muted-foreground)]";

  const primaryColor = isDark ? "var(--primary)" : "#6366F1";
  const secondaryColor = isDark ? "var(--primary-tint-foreground)" : "#8B5CF6";
  const orangeColor = isDark ? "#FB923C" : "#F97316";
  const blueColor = isDark ? "var(--primary)" : "#3B82F6";

  return (
    <div
      id={isDownload ? undefined : "lunar-panel-content"}
      className={`box-border ${
        isDownload 
          ? "w-full flex flex-col gap-6" 
          : "w-[276px] flex-1 min-h-0 flex flex-col gap-[10px] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden pb-4"
      }`}
    >
      {/* 1. LINE CHART: Revenue Growth */}
      <div className={cardStyle}>
        <div className={cardHeaderStyle}>
          <span className={cardTitleStyle}>Revenue Growth</span>
          <span className="text-[11px] text-[var(--muted-foreground)]">H1 2026</span>
        </div>
        
        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 11, fontFamily: "Poppins", backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} 
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={2.5} dot={{ r: 3, fill: primaryColor }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Initial Target</span>
            <span className="font-semibold text-[var(--foreground)]">$1,000.00</span>
          </div>
          <div className={metricRowStyle}>
            <span>Peak Month</span>
            <span className="font-semibold text-[var(--foreground)]">$3,000.00</span>
          </div>
          <div className={metricRowStyle}>
            <span>Average Growth</span>
            <span className="font-semibold text-[var(--primary)]">+25%</span>
          </div>
        </div>
      </div>

      {/* 2. BAR CHART: Weekly Performance (Matches Screenshot Design) */}
      <div className={cardStyle}>
        <div className="flex justify-between items-center w-full">
          <Icon icon="fluent:chevron-left-24-regular" width={16} height={16} className="text-[var(--muted-foreground)] cursor-pointer" />
          <span className="text-[12px] font-semibold text-[var(--foreground)]">March 2023</span>
          <Icon icon="fluent:chevron-right-24-regular" width={16} height={16} className="text-[var(--muted-foreground)] cursor-pointer" />
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--foreground)", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ fontSize: 11, fontFamily: "Poppins", backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} 
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={8}>
                {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 4 ? orangeColor : blueColor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span className="font-medium text-[var(--foreground)]">Today</span>
            <span className="font-semibold text-[var(--foreground)]">$45.00</span>
          </div>
          <div className={metricRowStyle}>
            <span className="font-medium text-[var(--foreground)]">Best</span>
            <span className="font-semibold text-[var(--foreground)]">$90.00</span>
          </div>
          <div className={metricRowStyle}>
            <span className="font-medium text-[var(--foreground)]">Average</span>
            <span className="font-semibold text-[var(--foreground)]">$65.00</span>
          </div>
        </div>
      </div>

      {/* 3. AREA CHART: Market Insights */}
      <div className={cardStyle}>
        <div className={cardHeaderStyle}>
          <span className={cardTitleStyle}>Market Insights</span>
          <span className="text-[11px] text-[#10B981] font-medium">Live Feed</span>
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 11, fontFamily: "Poppins", backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} 
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Area type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Weekly Peak</span>
            <span className="font-semibold text-[var(--foreground)]">750 Users</span>
          </div>
          <div className={metricRowStyle}>
            <span>Active Rate</span>
            <span className="font-semibold text-[#10B981]">88.4%</span>
          </div>
        </div>
      </div>

      {/* 4. MULTI LINE CHART: Product Comparison */}
      <div className={cardStyle}>
        <div className={cardHeaderStyle}>
          <span className={cardTitleStyle}>Product Comparison</span>
          <span className="text-[11px] text-[var(--muted-foreground)]">Quarterly</span>
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiLineChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 11, fontFamily: "Poppins", backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} 
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Line type="monotone" dataKey="prodA" stroke={primaryColor} strokeWidth={2} dot={{ r: 2 }} name="Product A" />
              <Line type="monotone" dataKey="prodB" stroke={secondaryColor} strokeWidth={2} dot={{ r: 2 }} name="Product B" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Product A Q4</span>
            <span className="font-semibold text-[var(--primary)]">$240k</span>
          </div>
          <div className={metricRowStyle}>
            <span>Product B Q4</span>
            <span className="font-semibold text-[var(--primary-tint-foreground)]">$210k</span>
          </div>
        </div>
      </div>

      {/* 5. STACKED BAR CHART: Traffic Sources */}
      <div className={cardStyle}>
        <div className={cardHeaderStyle}>
          <span className={cardTitleStyle}>Traffic Sources</span>
          <span className="text-[11px] text-[var(--muted-foreground)]">Monthly</span>
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedBarData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ fontSize: 11, fontFamily: "Poppins", backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} 
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Bar dataKey="direct" stackId="a" fill={primaryColor} radius={[0, 0, 0, 0]} />
              <Bar dataKey="referral" stackId="a" fill={secondaryColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Direct Total</span>
            <span className="font-semibold text-[var(--primary)]">230k visits</span>
          </div>
          <div className={metricRowStyle}>
            <span>Referral Total</span>
            <span className="font-semibold text-[var(--primary-tint-foreground)]">149k visits</span>
          </div>
        </div>
      </div>

      {/* 6. HORIZONTAL BAR CHART: Channel Value */}
      <div className={cardStyle}>
        <div className={cardHeaderStyle}>
          <span className={cardTitleStyle}>Channel Value</span>
          <span className="text-[11px] text-[var(--muted-foreground)]">Conversion</span>
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={horizontalBarData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip 
                contentStyle={{ fontSize: 11, fontFamily: "Poppins", backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)" }} 
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Bar dataKey="value" fill={primaryColor} radius={[0, 4, 4, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Top Channel</span>
            <span className="font-semibold text-[var(--primary)]">Search (800)</span>
          </div>
          <div className={metricRowStyle}>
            <span>Direct Conversions</span>
            <span className="font-semibold text-[var(--foreground)]">400</span>
          </div>
        </div>
      </div>
    </div>
  );
}
