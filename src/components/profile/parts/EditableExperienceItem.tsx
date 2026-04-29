
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
        <div className="flex gap-3 sm:gap-4 group relative w-full items-start">
            {/* Company Logo */}
            <div className="flex-shrink-0 w-[56px] h-[40px] pt-[8px] pr-[16px] pb-[8px] pl-[16px] rounded-[24px] overflow-hidden bg-card border border-border flex items-center justify-center">
                <img 
                    src="/assets/company-placeholder.png" 
                    alt={experience.company_name} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://www.gstatic.com/images/branding/product/1x/googleg_48dp.png";
                    }}
                />
            </div>

            {/* Center Content: Title, Description, Company, Location */}
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

            {/* Right Content: Dates, Work Details, Edit Button */}
            <div className="flex items-start gap-2 sm:gap-4 flex-shrink-0 w-auto sm:w-[180px] justify-end ml-auto">
                <div className="flex flex-col items-end gap-1 text-[10px] sm:text-[12px] leading-[14px] sm:leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground text-right">
                    <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-1">
                        <span>{formatDate(experience.start_date)}</span>
                        <span>-</span>
                        <span>{experience.end_date ? formatDate(experience.end_date) : 'Present'}</span>
                    </div>
                    <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-1">
                        <span>{experience.employment_type || 'Full time'}</span>
                        <span>-</span>
                        <span>Remote</span>
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
