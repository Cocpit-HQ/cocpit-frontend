"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`${isDownload ? "w-[800px]" : "w-[276px]"} h-[760px] flex items-center justify-center text-[#9CA3AF] font-sans`}>
        Loading charts...
      </div>
    );
  }

  // Common Card Styles
  const cardStyle = `box-border ${isDownload ? "w-full" : "w-[276px]"} h-[340px] bg-white rounded-xl shadow-[0_0_4px_rgba(99,102,241,0.16)] p-4 flex flex-col justify-between font-sans shrink-0`;
  const cardHeaderStyle = "flex justify-between items-center w-full";
  const cardTitleStyle = "text-[14px] font-semibold text-[#1F2937] m-0";
  const metricsContainerStyle = "flex flex-col gap-[6px] w-full border-t border-[#F3F4F6] pt-[10px]";
  const metricRowStyle = "flex justify-between text-[12px] text-[#4B5563]";

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
          <span className="text-[11px] text-[#6B7280]">H1 2026</span>
        </div>
        
        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Poppins" }} />
              <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 3, fill: "#6366F1" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Initial Target</span>
            <span className="font-semibold text-[#1F2937]">$1,000.00</span>
          </div>
          <div className={metricRowStyle}>
            <span>Peak Month</span>
            <span className="font-semibold text-[#1F2937]">$3,000.00</span>
          </div>
          <div className={metricRowStyle}>
            <span>Average Growth</span>
            <span className="font-semibold text-[#6366F1]">+25%</span>
          </div>
        </div>
      </div>

      {/* 2. BAR CHART: Weekly Performance (Matches Screenshot Design) */}
      <div className={cardStyle}>
        <div className="flex justify-between items-center w-full">
          <Icon icon="fluent:chevron-left-24-regular" width={16} height={16} className="text-[#9CA3AF] cursor-pointer" />
          <span className="text-[12px] font-semibold text-black">March 2023</span>
          <Icon icon="fluent:chevron-right-24-regular" width={16} height={16} className="text-[#9CA3AF] cursor-pointer" />
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#000000", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Poppins" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={8}>
                {barChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 4 ? "#F97316" : "#3B82F6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span className="font-medium text-black">Today</span>
            <span className="font-semibold text-black">$45.00</span>
          </div>
          <div className={metricRowStyle}>
            <span className="font-medium text-black">Best</span>
            <span className="font-semibold text-black">$90.00</span>
          </div>
          <div className={metricRowStyle}>
            <span className="font-medium text-black">Average</span>
            <span className="font-semibold text-black">$65.00</span>
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
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Poppins" }} />
              <Area type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Weekly Peak</span>
            <span className="font-semibold text-[#1F2937]">750 Users</span>
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
          <span className="text-[11px] text-[#6B7280]">Quarterly</span>
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiLineChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Poppins" }} />
              <Line type="monotone" dataKey="prodA" stroke="#6366F1" strokeWidth={2} dot={{ r: 2 }} name="Product A" />
              <Line type="monotone" dataKey="prodB" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 2 }} name="Product B" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Product A Q4</span>
            <span className="font-semibold text-[#6366F1]">$240k</span>
          </div>
          <div className={metricRowStyle}>
            <span>Product B Q4</span>
            <span className="font-semibold text-[#8B5CF6]">$210k</span>
          </div>
        </div>
      </div>

      {/* 5. STACKED BAR CHART: Traffic Sources */}
      <div className={cardStyle}>
        <div className={cardHeaderStyle}>
          <span className={cardTitleStyle}>Traffic Sources</span>
          <span className="text-[11px] text-[#6B7280]">Monthly</span>
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedBarData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Poppins" }} />
              <Bar dataKey="direct" stackId="a" fill="#6366F1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="referral" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Direct Total</span>
            <span className="font-semibold text-[#6366F1]">230k visits</span>
          </div>
          <div className={metricRowStyle}>
            <span>Referral Total</span>
            <span className="font-semibold text-[#8B5CF6]">149k visits</span>
          </div>
        </div>
      </div>

      {/* 6. HORIZONTAL BAR CHART: Channel Value */}
      <div className={cardStyle}>
        <div className={cardHeaderStyle}>
          <span className={cardTitleStyle}>Channel Value</span>
          <span className="text-[11px] text-[#6B7280]">Conversion</span>
        </div>

        <div className="w-full h-[160px] mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={horizontalBarData} layout="vertical" margin={{ top: 5, right: 5, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#4B5563" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip contentStyle={{ fontSize: 11, fontFamily: "Poppins" }} />
              <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className={metricRowStyle}>
            <span>Top Channel</span>
            <span className="font-semibold text-[#6366F1]">Search (800)</span>
          </div>
          <div className={metricRowStyle}>
            <span>Direct Conversions</span>
            <span className="font-semibold text-[#1F2937]">400</span>
          </div>
        </div>
      </div>
    </div>
  );
}
