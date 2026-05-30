"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ProfileAboutProps {
    aboutText: string | null | undefined;
    isOwnProfile?: boolean;
}

export const ProfileAbout = React.memo(function ProfileAbout({ aboutText }: ProfileAboutProps) {
    const [isAboutExpanded, setIsAboutExpanded] = useState(false);

    if (!aboutText) return null;

    return (
        <div className="w-full px-4 md:pr-[16px] pb-[20px] md:pl-[40px] flex flex-col gap-[12px] mt-[16px]">
            <h2 className="font-[family-name:var(--font-poppins)] font-medium text-[18px] leading-[26px] text-foreground">About</h2>
            <div className="relative w-full md:max-w-[904px]">
                <p
                    className={cn(
                        "font-[family-name:var(--font-poppins)] font-normal text-[14px] md:text-[16px] leading-[20px] md:leading-[24px] text-foreground transition-all duration-300",
                        !isAboutExpanded && "line-clamp-3 md:line-clamp-2"
                    )}
                >
                    {aboutText}
                </p>
                {!isAboutExpanded && aboutText.length > 150 && (
                    <button
                        onClick={() => setIsAboutExpanded(true)}
                        className="absolute bottom-0 right-0 bg-card pl-2 text-[#6366F1] font-normal text-[14px] leading-[20px] font-[family-name:var(--font-poppins)] transition-colors cursor-pointer"
                    >
                        ....More
                    </button>
                )}
                {isAboutExpanded && (
                    <button
                        onClick={() => setIsAboutExpanded(false)}
                        className="text-[#6366F1] font-normal text-[14px] mt-2 block cursor-pointer"
                    >
                        Show less
                    </button>
                )}
            </div>
        </div>
    );
});
