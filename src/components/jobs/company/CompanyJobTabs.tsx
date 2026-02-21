"use client"

import type { JobListMode } from "@/types/jobs"

interface CompanyJobTabsProps {
    mode: JobListMode
    setMode: (mode: JobListMode) => void
}

export function CompanyJobTabs({ mode, setMode }: CompanyJobTabsProps) {
    return (
        <div>
            {/* Top-level tabs for Company Mode */}
            <div className="mb-4 md:mb-6 flex gap-2 overflow-x-auto rounded-xl bg-transparent max-w-full pb-1 scrollbar-hide">
                {[
                    { id: "my-jobs", label: "My Jobs" },
                    { id: "offered", label: "Offered" },
                    { id: "dashboard", label: "Job Posts Dashboard" },
                ].map((tab) => {
                    // Compare 'offered' internally, even though it maps to 'offers' in core logic potentially
                    // For now, let's just use 'offers' as the underlying ID but label it "Offered"
                    const rawId = tab.id
                    const tabId = (rawId === "offered" ? "offers" : rawId) as JobListMode

                    const isActive = mode === tabId
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setMode(tabId)}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                ? "bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] text-white shadow-md"
                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                }`}
                        >
                            <span>{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
