"use client";

import React, { useId, useMemo } from "react";
import { ArrowUpwardAltIcon } from "@/components/icons";
import { EmployeeGrowthData } from "../../types/business-profile.types";

interface GrowthTrendsSectionProps {
  growthPercentage?: string;
  employeeGrowth?: EmployeeGrowthData;
  subtitle?: string;
  orgId?: string;
  orgName?: string;
}

export default function GrowthTrendsSection({
  growthPercentage,
  employeeGrowth,
  subtitle = "Hiring velocity over the last 6 months",
}: GrowthTrendsSectionProps) {
  const gradientId = useId();

  // Check if real growth data exists from backend
  const hasGrowthData = Boolean(
    (growthPercentage && typeof growthPercentage === "string" && growthPercentage.trim().length > 0) ||
    (employeeGrowth?.percentage && typeof employeeGrowth.percentage === "string" && employeeGrowth.percentage.trim().length > 0) ||
    typeof employeeGrowth?.growth_value === "number"
  );

  // 1. Resolve Display Percentage & Numerical Ratio
  const resolvedData = useMemo(() => {
    if (!hasGrowthData) return null;

    const raw = growthPercentage || employeeGrowth?.percentage;
    if (raw && typeof raw === "string" && raw.trim().length > 0) {
      const match = raw.match(/([+-]?\d+(?:\.\d+)?)/);
      const num = match ? parseFloat(match[1]) : 0;

      // Rule: It must NEVER be more than 100% (cap at 100%)
      if (num > 100) {
        return {
          displayPercentage: "+100%",
          ratio: 100,
        };
      }
      if (num < -100) {
        return {
          displayPercentage: "-100%",
          ratio: -100,
        };
      }

      if (num === 0) {
        return {
          displayPercentage: "0%",
          ratio: 0,
        };
      }

      const cleanRaw = raw.trim();
      const hasSign = cleanRaw.startsWith("+") || cleanRaw.startsWith("-");
      const hasPercent = cleanRaw.endsWith("%");
      const display = `${hasSign ? "" : "+"}${cleanRaw}${hasPercent ? "" : "%"}`;

      return {
        displayPercentage: display,
        ratio: num,
      };
    }

    if (typeof employeeGrowth?.growth_value === "number") {
      let val = employeeGrowth.growth_value;
      if (val > 100) val = 100;
      if (val < -100) val = -100;
      if (val === 0) {
        return {
          displayPercentage: "0%",
          ratio: 0,
        };
      }
      const formatted = `${val > 0 ? "+" : ""}${Number.isInteger(val) ? val : val.toFixed(1)}%`;
      return {
        displayPercentage: formatted,
        ratio: val,
      };
    }

    return null;
  }, [hasGrowthData, growthPercentage, employeeGrowth?.percentage, employeeGrowth?.growth_value]);

  if (!hasGrowthData || !resolvedData) {
    return null;
  }

  const { displayPercentage, ratio } = resolvedData;

  // 2. Resolve Dynamic Start & End Month Labels
  const { startMonth, endMonth } = useMemo(() => {
    if (employeeGrowth?.start_month && employeeGrowth?.current_month) {
      return {
        startMonth: employeeGrowth.start_month.toUpperCase(),
        endMonth: employeeGrowth.current_month.toUpperCase(),
      };
    }

    if (employeeGrowth?.trend && employeeGrowth.trend.length >= 2) {
      const first = employeeGrowth.trend[0];
      const last = employeeGrowth.trend[employeeGrowth.trend.length - 1];
      return {
        startMonth: (first.full_month || first.month || "JANUARY").toUpperCase(),
        endMonth: (last.full_month || last.month || "JULY").toUpperCase(),
      };
    }

    return {
      startMonth: "JANUARY",
      endMonth: "JULY",
    };
  }, [employeeGrowth?.start_month, employeeGrowth?.current_month, employeeGrowth?.trend]);

  // 3. Generate Dynamic Bézier Spline Curves as per the ratio / trend data
  const { linePath, areaPath } = useMemo(() => {
    let points: { x: number; y: number }[] = [];

    // Option A: Use real trend points from API if available
    if (employeeGrowth?.trend && employeeGrowth.trend.length >= 2) {
      const trend = employeeGrowth.trend;
      const headcounts = trend.map((t) => Number(t.headcount) || Number(t.joins) || 0);
      const min = Math.min(...headcounts);
      const max = Math.max(...headcounts);
      const range = max - min || 1;

      points = trend.map((_, i) => {
        const x = (i / (trend.length - 1)) * 780;
        const normalized = (headcounts[i] - min) / range;
        // Invert Y coordinate (0 = top, 120 = bottom baseline)
        const y = 98 - normalized * 82;
        return { x, y: Math.max(12, Math.min(106, y)) };
      });
    } else {
      // Option B: Mathematically calculate organic hiring velocity curve matching ratio
      // Scale ratio: e.g. +5% is mild rise, +37.5% is steep acceleration (capped <= 100)
      const clampedRatio = Math.min(100, Math.max(-100, ratio));
      const k = Math.max(-0.6, Math.min(1.4, clampedRatio / 35));
      const startY = 92;
      const targetEndY = Math.max(12, Math.min(106, 92 - k * 78));

      const count = 7; // 7 anchor points spanning width 0 to 780
      points = Array.from({ length: count }, (_, i) => {
        const t = i / (count - 1); // 0 to 1
        const x = t * 780;

        // Hiring velocity curve dynamics (acceleration over the 6 month window)
        const curveProgress = Math.pow(t, 1.65);
        let y = startY - (startY - targetEndY) * curveProgress;

        // Add natural hiring cycle contour (slight initial dip/leveling in Q1, then rise)
        if (k > 0) {
          const dip = Math.sin(t * Math.PI) * (1 - t) * 7.5;
          y += dip;
        } else {
          const dip = Math.sin(t * Math.PI) * (1 - t) * 4.0;
          y -= dip;
        }

        return { x, y: Math.max(12, Math.min(108, y)) };
      });
    }

    // Generate smooth Catmull-Rom to Cubic Bézier spline through all points
    let pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i + 2 < points.length ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }

    const line = pathD;
    const area = `${pathD} L 780,120 L 0,120 Z`;

    return { linePath: line, areaPath: area };
  }, [employeeGrowth?.trend, ratio]);

  const isNegative = ratio < 0;

  return (
    <div className="w-full max-w-[800px] px-4 sm:px-5 flex flex-col justify-start items-start gap-3">
      <div className="w-full flex flex-col justify-start items-start gap-4">
        {/* Header Row: Title & Trending Percentage */}
        <div className="self-stretch inline-flex justify-between items-center">
          <div className="flex flex-col justify-start items-start">
            <h2 className="self-stretch text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6">
              Growth trends
            </h2>
            <p className="self-stretch text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
              {subtitle}
            </p>
          </div>

          <div
            className={`inline-flex justify-end items-center gap-2 ${
              isNegative ? "text-ds-error" : "text-ds-success"
            }`}
          >
            <ArrowUpwardAltIcon
              size={24}
              className={`w-6 h-6 shrink-0 transition-transform ${
                isNegative ? "rotate-180 text-ds-error" : "text-ds-success"
              }`}
              aria-hidden="true"
            />
            <span
              className={`text-[32px] font-bold font-['DM_Sans'] leading-[40px] shrink-0 ${
                isNegative ? "text-ds-error" : "text-ds-success"
              }`}
            >
              {displayPercentage}
            </span>
          </div>
        </div>

        {/* Chart Area */}
        <div className="w-full h-44 relative flex flex-col justify-end">
          <svg
            className="w-full h-32 overflow-visible"
            viewBox="0 0 780 120"
            preserveAspectRatio="none"
            fill="none"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ds-accent)" stopOpacity="0.28" />
                <stop offset="60%" stopColor="var(--ds-accent)" stopOpacity="0.10" />
                <stop offset="100%" stopColor="var(--ds-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Smooth Spline Area Fill (Dynamic based on ratio) */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Smooth Spline Accent Curve Line (Dynamic based on ratio) */}
            <path
              d={linePath}
              stroke="var(--ds-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Month Labels */}
          <div className="w-full flex justify-between items-center text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4 pt-3">
            <span>{startMonth}</span>
            <span>{endMonth}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
