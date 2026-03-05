'use client'

import React from 'react'

function Pulse({ className }: { className: string }) {
    return (
        <div className={`animate-pulse rounded-xl bg-muted/60 ${className}`} />
    )
}

export function AnalyticsSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header skeleton */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <Pulse className="w-10 h-10 rounded-xl" />
                        <div>
                            <Pulse className="h-7 w-52 mb-2" />
                            <Pulse className="h-4 w-36" />
                        </div>
                    </div>
                    <Pulse className="h-10 w-64 rounded-xl" />
                </div>

                {/* Tab bar skeleton */}
                <div className="mb-10">
                    <Pulse className="h-12 w-72 rounded-xl" />
                </div>

                {/* KPI Cards skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                        >
                            <div className="flex items-start gap-4">
                                <Pulse className="w-12 h-12 rounded-xl" />
                                <div className="flex-1">
                                    <Pulse className="h-3.5 w-28 mb-3" />
                                    <Pulse className="h-7 w-20" />
                                </div>
                                <Pulse className="h-6 w-16 rounded-full" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section header skeleton */}
                <div className="flex items-center gap-2 mb-6">
                    <Pulse className="w-1 h-6 rounded-full" />
                    <Pulse className="h-5 w-44" />
                </div>

                {/* Charts skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <Pulse className="h-4 w-28 mb-2" />
                        <Pulse className="h-3 w-44 mb-6" />
                        <Pulse className="h-[300px] w-full rounded-xl" />
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-6">
                        <Pulse className="h-4 w-36 mb-2" />
                        <Pulse className="h-3 w-40 mb-6" />
                        <Pulse className="h-[300px] w-full rounded-xl" />
                    </div>
                </div>

                {/* Table skeleton */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Pulse className="w-8 h-8 rounded-lg" />
                        <div>
                            <Pulse className="h-4 w-40 mb-1" />
                            <Pulse className="h-3 w-28" />
                        </div>
                    </div>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4 py-3">
                            <Pulse className="h-4 w-6" />
                            <Pulse className="h-4 w-48 flex-1" />
                            <Pulse className="h-4 w-16" />
                            <Pulse className="h-4 w-16" />
                            <Pulse className="h-4 w-14 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
