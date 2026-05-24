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
    const [isDescExpanded, setIsDescExpanded] = React.useState(false);

    const isLongDescription = education.description && education.description.length > 160;

    const displayDescription = React.useMemo(() => {
        if (!education.description) return "";
        if (isDescExpanded || !isLongDescription) return education.description;
        
        const truncated = education.description.slice(0, 160);
        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > 50) {
            return truncated.slice(0, lastSpace);
        }
        return truncated;
    }, [education.description, isDescExpanded, isLongDescription]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex flex-col md:flex-row group relative w-full items-start justify-between gap-3 md:gap-6">
            {/* Left/Center Content: Icon + Info */}
            <div className="flex gap-4 flex-1 min-w-0">
                {/* School Icon */}
                <div className="entity-placeholder">
                    <Icon icon="qlementine-icons:education-24" className="entity-placeholder-icon" />
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-[8px]">
                        <div className="flex justify-between items-start w-full">
                            <h3 className="text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-[8px]">
                                {education.school_name}
                            </h3>
                            <button
                                onClick={onEdit}
                                className="md:hidden flex-shrink-0 p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
                            >
                                <Icon
                                    icon="eva:edit-outline"
                                    className="w-[20px] h-[20px] stroke-[1.5px] transition-colors"
                                />
                            </button>
                        </div>

                        {education.description && (
                            <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground mb-[10px] break-words">
                                {displayDescription}
                                {!isDescExpanded && isLongDescription && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDescExpanded(true);
                                        }}
                                        className="text-muted-foreground hover:text-primary font-semibold transition-colors cursor-pointer ml-1 inline-flex items-center"
                                    >
                                        ... More
                                    </button>
                                )}
                                {isDescExpanded && isLongDescription && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsDescExpanded(false);
                                        }}
                                        className="text-primary hover:underline ml-1 font-medium cursor-pointer inline-flex items-center"
                                    >
                                        See less
                                    </button>
                                )}
                            </p>
                        )}

                        <div className="flex flex-col gap-[8px]">
                            <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                {education.degree}
                            </p>
                            <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                Kolhapur, Maharashtra, India
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata + Edit Button */}
            <div className="flex flex-row items-start justify-between md:justify-end flex-shrink-0 w-full md:w-[220px] gap-3 md:gap-0 md:ml-auto pl-[72px] md:pl-0 hidden md:flex">
                <div className="flex flex-col items-start md:items-end w-full">
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
                    className="flex-shrink-0 mt-0.5 md:ml-2 p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors"
                >
                    <Icon
                        icon="eva:edit-outline"
                        className="w-[24px] h-[24px] stroke-[1.5px] transition-colors"
                    />
                </button>
            </div>
        </div>
    );
}
