"use client";

import React from "react";
import { Education } from "@/types/entities";
import { Icon } from "@iconify/react";

interface EditableEducationItemProps {
    education: Education;
    onEdit: () => void;
}

export function EditableEducationItem({
    education,
    onEdit,
}: EditableEducationItemProps) {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex gap-3 sm:gap-4 group relative w-full items-start">
            {/* School Icon */}
            <div className="flex-shrink-0 w-[56px] h-[40px] px-[16px] py-[8px] rounded-[24px] bg-secondary flex items-center justify-center">
                <Icon icon="qlementine-icons:education-24" className="w-[24px] h-[24px] text-primary" />
            </div>

            {/* Center Content: School, Degree & Field, Location, Description */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] text-foreground">
                        {education.school_name}
                    </h3>
                    
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                            {education.degree}
                        </p>
                        <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                            Kolhapur, Maharashtra, India
                        </p>
                    </div>

                    {education.description && (
                        <p className="mt-1 text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground line-clamp-2">
                            {education.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Right Content: Dates, Edit Button */}
            <div className="flex items-start gap-2 sm:gap-4 flex-shrink-0 w-auto sm:w-[180px] justify-end ml-auto">
                <div className="flex flex-col items-end gap-1 text-[10px] sm:text-[12px] leading-[14px] sm:leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground text-right">
                    <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-1">
                        <span>{formatDate(education.start_date)}</span>
                        <span>-</span>
                        <span>{education.end_date ? formatDate(education.end_date) : 'Present'}</span>
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
    );
}
