"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "next-themes";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

// Donut Chart Data
const donutData = [
  { name: "Option A", value: 60 },
  { name: "Option B", value: 20 },
  { name: "Option C", value: 20 },
];

const DONUT_COLORS = ["#3B82F6", "#FCA5A5", "#F97316"]; // Blue, Pink, Orange

// Gauge Chart Data (70% filled, 30% empty)
const gaugeData = [
  { name: "Progress", value: 70 },
  { name: "Empty", value: 30 },
];

export default function LunarPanelChartView({ isDownload = false }: { isDownload?: boolean }) {
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

  const gaugeColors = isDark ? ["var(--primary)", "var(--border)"] : ["#3B82F6", "#E5E7EB"];

  // Common Card Styles
  const cardStyle = `box-border ${isDownload ? "w-full" : "w-[276px]"} h-[340px] bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-[var(--card-shadow-inner)] p-4 flex flex-col justify-between font-sans shrink-0`;
  const cardTitleStyle = "text-[14px] font-semibold text-[var(--foreground)] m-0";
  const metricsContainerStyle = "flex flex-col gap-[6px] w-full border-t border-[var(--border)] pt-[10px]";

  // Custom label renderer for Donut chart percentages inside slices
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g>
        <circle cx={x} cy={y} r="14" fill="var(--background)" stroke="var(--border)" strokeWidth="1" className="shadow-sm" />
        <text x={x} y={y} fill="var(--foreground)" textAnchor="middle" dominantBaseline="central" fontSize="9" fontWeight="bold">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  return (
    <div
      id={isDownload ? undefined : "lunar-panel-content"}
      className={`box-border ${
        isDownload 
          ? "w-full flex flex-col gap-6" 
          : "w-[276px] flex-1 min-h-0 flex flex-col gap-[10px] overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden pb-4"
      }`}
    >
      {/* 1. DONUT CHART: March 2023 */}
      <div className={cardStyle}>
        <div className="flex justify-between items-center w-full">
          <Icon icon="fluent:chevron-left-24-regular" width={16} height={16} className="text-[var(--muted-foreground)] cursor-pointer" />
          <span className="text-[12px] font-semibold text-[var(--foreground)]">March 2023</span>
          <Icon icon="fluent:chevron-right-24-regular" width={16} height={16} className="text-[var(--muted-foreground)] cursor-pointer" />
        </div>

        <div className="w-full h-[160px] mt-2 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={0}
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)" }}
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value: any) => [`${value}%`, "Value"]} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={metricsContainerStyle}>
          <div className="flex flex-col gap-2 w-full text-[12px]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                <span className="font-medium text-[var(--muted-foreground)]">Option A</span>
              </div>
              <span className="font-semibold text-[var(--foreground)]">60%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FCA5A5]" />
                <span className="font-medium text-[var(--muted-foreground)]">Option B</span>
              </div>
              <span className="font-semibold text-[var(--foreground)]">20%</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#F97316]" />
                <span className="font-medium text-[var(--muted-foreground)]">Option C</span>
              </div>
              <span className="font-semibold text-[var(--foreground)]">20%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GAUGE CHART: Monthly Income $5000 */}
      <div className={cardStyle}>
        <div className="flex justify-between items-center w-full">
          <span className="text-[14px] font-semibold text-[var(--foreground)] mx-auto">Monthly Income $5000</span>
        </div>

        <div className="w-full h-[160px] mt-2 relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="50%"
                startAngle={220}
                endAngle={-40}
                innerRadius={45}
                outerRadius={65}
                paddingAngle={0}
                dataKey="value"
              >
                {gaugeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={gaugeColors[index % gaugeColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)" }}
                itemStyle={{ color: "var(--foreground)" }}
                labelStyle={{ color: "var(--foreground)" }}
                formatter={(value: any, name: any) => [name === "Progress" ? "Spent" : "Left", `${value}%`]} 
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered User Icon */}
          <div className="absolute top-[48%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--primary-tint)] flex items-center justify-center border border-[var(--border)]">
            <Icon icon="fluent:person-24-filled" width={20} height={20} className="text-[var(--primary)]" />
          </div>
        </div>

        <div className={metricsContainerStyle}>
          <div className="flex justify-center items-center gap-6 text-[12px] pb-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--border)]" />
              <span className="text-[var(--muted-foreground)]">Spent <strong className="text-[var(--foreground)]">$5.6K</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--primary)]" />
              <span className="text-[var(--muted-foreground)]">Left <strong className="text-[var(--foreground)]">5.9K</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
