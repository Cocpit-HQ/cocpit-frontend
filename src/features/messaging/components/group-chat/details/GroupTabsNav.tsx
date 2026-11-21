"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type GroupDetailsTab = 'members' | 'posts' | 'media' | 'links';

interface GroupTabsNavProps {
    activeTab: GroupDetailsTab;
    onTabChange: (tab: GroupDetailsTab) => void;
}

export const GroupTabsNav: React.FC<GroupTabsNavProps> = ({ activeTab, onTabChange }) => {
    const tabs: Array<{ id: GroupDetailsTab; label: string }> = [
        { id: "members", label: "Members" },
        { id: "posts", label: "Posts" },
        { id: "media", label: "Media" },
        { id: "links", label: "Links" }
    ];

    return (
        /* Frame 2610094: 24px below action buttons, max-w-[618px], gap: 24px, height: 36px, centered - No border */
        <div className="mt-6 flex flex-row justify-center items-center gap-6 max-w-[618px] mx-auto w-full h-[36px] shrink-0">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex flex-col items-center justify-center h-[36px] px-3 py-1.5 cursor-pointer relative outline-none bg-transparent border-none transition-colors",
                            isActive
                                ? "text-[var(--ds-text-primary)]"
                                : "text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]"
                        )}
                    >
                        <span className="font-['DM_Sans'] font-medium text-[14px] leading-[20px] text-center">
                            {tab.label}
                        </span>
                        {isActive && (
                            <span className="absolute bottom-0 left-[1%] right-[1%] h-[3px] bg-[var(--ds-accent)] rounded-full" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
