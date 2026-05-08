
"use client";

import React from "react";
import { Experience } from "@/types/entities";
import { Icon } from "@iconify/react";

interface EditableExperienceItemProps {
    experience: Experience;
    onEdit: () => void;
}

export function EditableExperienceItem({
    experience,
    onEdit,
}: EditableExperienceItemProps) {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex group relative w-full items-start justify-between gap-6">
            {/* Left/Center Content: Logo + Info */}
            <div className="flex gap-4 flex-1 min-w-0">
                {/* Company Logo */}
                <div className={`flex-shrink-0 w-[56px] h-[40px] rounded-[20px] overflow-hidden flex items-center justify-center ${experience.company_logo ? 'bg-transparent' : 'bg-[#EEF2FF]'}`}>
                    <img
                        src="/assets/company-placeholder.png"
                        alt={experience.company_name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";
                        }}
                    />
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                        <h3 className="text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
                            {experience.title}
                        </h3>
                        <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground line-clamp-2">
                            {experience.description}
                        </p>
                        <div className="mt-1 flex flex-col gap-0.5">
                            <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                {experience.company_name}
                            </p>
                            <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                {experience.location}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata + Edit Button (Fixed 240px) */}
            <div className="flex items-start flex-shrink-0 w-[240px] justify-between">
                <div className="w-full">
                    <div className="grid grid-cols-[75px_9px_auto] gap-x-[6px] items-center w-full text-[10px] sm:text-[12px] leading-[14px] sm:leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                        <span className="whitespace-nowrap text-left">{formatDate(experience.start_date)}</span>
                        <span className="flex items-center justify-center w-[9px] h-[16px]">
                            <span className="text-center">-</span>
                        </span>
                        <span className="whitespace-nowrap text-left">{experience.end_date ? formatDate(experience.end_date) : 'Present'}</span>
                        
                        <span className="whitespace-nowrap text-left">{experience.work_type || ''}</span>
                        <span className="flex items-center justify-center w-[9px] h-[16px]">
                            {experience.work_mode ? <span className="text-center">—</span> : null}
                        </span>
                        <span className="whitespace-nowrap text-left">{experience.work_mode || ''}</span>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="flex-shrink-0 mt-0.5"
                >
                    <Icon icon="eva:edit-outline" className="w-[24px] h-[24px] text-muted-foreground hover:text-primary transition-colors" />
                </button>
            </div>
        </div>
    )
}
