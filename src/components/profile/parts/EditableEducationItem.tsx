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
        <div className="flex gap-4 group relative w-full items-start">
            {/* School Icon */}
            <div className="flex-shrink-0 w-[56px] h-[40px] px-[16px] py-[8px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center">
                <Icon icon="qlementine-icons:education-24" className="w-[24px] h-[24px] text-[#6366F1]" />
            </div>

            {/* Center Content: School, Degree & Field, Location, Description */}
            <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] text-[#000000]">
                        {education.school_name}
                    </h3>
                    
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                            {education.degree}
                        </p>
                        <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280]">
                            Kolhapur, Maharashtra, India
                        </p>
                    </div>

                    {education.description && (
                        <p className="mt-1 text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-[#000000] line-clamp-2">
                            {education.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Right Content: Dates, Edit Button */}
            <div className="flex items-start gap-4 flex-shrink-0 w-[180px] justify-end">
                <div className="flex flex-col items-end gap-1 text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-[#6B7280] whitespace-nowrap">
                    <div className="flex items-center gap-1 whitespace-nowrap">
                        <span>{formatDate(education.start_date)}</span>
                        <span>-</span>
                        <span>{education.end_date ? formatDate(education.end_date) : 'Present'}</span>
                    </div>
                </div>
                <button 
                  onClick={onEdit} 
                  className="flex-shrink-0 mt-0.5"
                >
                    <Icon icon="eva:edit-outline" className="w-[24px] h-[24px] text-[#94A3B8] hover:text-[#6366F1] transition-colors" />
                </button>
            </div>
        </div>
    );
}
