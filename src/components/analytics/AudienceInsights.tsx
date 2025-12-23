'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts'
import { MapPin, Briefcase } from 'lucide-react'
import { AudienceMetric } from '@/app/analytics/data'

interface AudienceInsightsProps {
  industries: AudienceMetric[]
  locations: AudienceMetric[]
  isDark?: boolean // Optional
}

const COLORS = ['#5B7CFF', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export function AudienceInsights({ industries, locations }: AudienceInsightsProps) {
  return (
    <div className="p-6 rounded-xl border bg-card border-border">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">
          Audience Demographics
        </h3>
        <p className="text-sm mt-1 text-muted-foreground">
          Who is viewing your profile
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Industries - Pie Chart */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Top Industries</h4>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-[180px] h-[180px] flex-shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={industries}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {industries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip
                     contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: '8px',
                      color: "var(--foreground)"
                    }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className="text-xs font-medium text-muted-foreground">Industries</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex-1 space-y-2 w-full">
              {industries.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Locations - Bar/List Visual */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">Top Locations</h4>
          </div>

          <div className="space-y-4">
            {locations.map((loc, index) => (
              <div key={loc.name} className="relative">
                <div className="flex justify-between text-xs mb-1 z-10 relative">
                  <span className="text-foreground">{loc.name}</span>
                  <span className="text-muted-foreground">{loc.percentage}%</span>
                </div>
                <div className="w-full h-8 rounded-lg relative overflow-hidden flex items-center px-3 bg-muted/30">
                   <div
                      className="absolute left-0 top-0 bottom-0 bg-primary/20 rounded-lg transition-all duration-1000"
                      style={{ width: `${loc.percentage}%` }}
                   />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
