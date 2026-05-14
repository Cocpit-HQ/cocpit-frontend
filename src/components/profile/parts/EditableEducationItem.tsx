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
        <div className="flex group relative w-full items-start justify-between gap-6">
            {/* Left/Center Content: Icon + Info */}
            <div className="flex gap-4 flex-1 min-w-0">
                {/* School Icon */}
                <div className="entity-placeholder">
                    <Icon icon="qlementine-icons:education-24" className="entity-placeholder-icon" />
                </div>

                {/* Info block */}
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
            </div>

            {/* Right Column: Metadata + Edit Button (Fixed 220px) */}
            <div className="flex items-start flex-shrink-0 w-[220px] ml-auto">
                <div className="flex flex-col items-end w-full">
                    <div className="grid grid-cols-[75px_9px_auto] gap-x-[6px] items-center w-full text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                        <span className="whitespace-nowrap text-left">{formatDate(education.start_date)}</span>
                        <span className="flex items-center justify-center w-[9px] h-[16px]">
                            <span className="text-center">—</span>
                        </span>
                        <span className="whitespace-nowrap text-left">{education.end_date ? formatDate(education.end_date) : 'Present'}</span>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="flex-shrink-0 mt-0.5 ml-2"
                >
                    <Icon
                        icon="eva:edit-outline"
                        className="w-[24px] h-[24px] text-muted-foreground stroke-[1.5px] hover:text-primary transition-colors"
                    />
                </button>
            </div>
        </div>
    );
}
