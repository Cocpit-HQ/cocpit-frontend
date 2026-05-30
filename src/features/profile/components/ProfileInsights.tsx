"use client";

import React from "react";
import { Eye, TrendingUp, Search, Award } from "lucide-react";
import { ProfileInsights as ProfileInsightsType } from "../types/profile.types";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";

interface ProfileInsightsProps {
  insights: ProfileInsightsType;
}

export function ProfileInsights({ insights }: ProfileInsightsProps) {
  const chartData = insights.profileViews.map((views, index) => ({
    day: ["M", "T", "W", "T", "F", "S", "S"][index],
    views,
  }));

  return (
    <div className="rounded-xl border p-6 mb-6 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl text-foreground font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Profile Insights
          <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Private to you
          </span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Views Chart */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Profile views</p>
              <p className="text-2xl font-bold text-foreground">
                {insights.profileViews.reduce((a, b) => a + b, 0)}
              </p>
            </div>
            <div className="text-green-500 text-sm font-medium flex items-center">
              +12% <TrendingUp className="w-3 h-3 ml-1" />
            </div>
          </div>
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <Bar
                  dataKey="views"
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                  barSize={8}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  cursor={{ fill: "transparent" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{insights.searchAppearances}</p>
              <p className="text-sm text-muted-foreground">Search appearances this week</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="bg-purple-500/10 p-2 rounded-lg text-purple-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">Profile Strength</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Intermediate</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{ width: `${insights.profileStrength}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">Top searched skills for your profile:</p>
        <div className="flex flex-wrap gap-2">
          {insights.mostViewedSkills.map((skill) => (
            <span key={skill} className="text-xs font-medium px-2 py-1 bg-muted text-foreground rounded-md">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
