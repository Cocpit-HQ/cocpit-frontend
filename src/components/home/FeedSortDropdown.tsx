"use client"

import React from "react"
import { ChevronDown } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface FeedSortDropdownProps {
    activeTab: string
    setActiveTab: (tab: string) => void
}

export function FeedSortDropdown({ activeTab, setActiveTab }: FeedSortDropdownProps) {
    const tabs = [
        { id: "top", label: "Top" },
        { id: "recent", label: "Recent" },
    ]

    const activeLabel = tabs.find((t) => t.id === activeTab)?.label || "Recent"

    return (
        <div className="flex items-center w-full">
            <div className="h-[1px] flex-1 bg-border mr-4"></div>
            <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none">
                    Sort by: <span className="font-medium text-foreground">{activeLabel}</span>
                    <ChevronDown className="w-4 h-4 ml-0.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                    {tabs.map((tab) => (
                        <DropdownMenuItem
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="cursor-pointer"
                        >
                            {tab.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
