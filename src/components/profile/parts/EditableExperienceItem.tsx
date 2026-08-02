"use client";

import React from "react";
import { Experience } from "@/types/entities";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface EditableExperienceItemProps {
    experience: Experience;
    onEdit: () => void;
}

export function EditableExperienceItem({
    experience,
    onEdit,
}: EditableExperienceItemProps) {
    const [isDescExpanded, setIsDescExpanded] = React.useState(false);

    const [imgError, setImgError] = React.useState(false);

    const renderField = (value: string | null | undefined) => {
        if (!value || value === "null") return "Not Specified";
        return value;
    };

    const rawDescription = renderField(experience.description);
    const isLongDescription = rawDescription.length > 160;

    const displayDescription = React.useMemo(() => {
        if (isDescExpanded || !isLongDescription) return rawDescription;

        const truncated = rawDescription.slice(0, 160);
        const lastSpace = truncated.lastIndexOf(" ");
        if (lastSpace > 50) {
            return truncated.slice(0, lastSpace);
        }
        return truncated;
    }, [rawDescription, isDescExpanded, isLongDescription]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    return (
        <div className="flex group relative w-full items-start justify-between gap-6">
            {/* Left/Center Content: Logo + Info */}
            <div className="flex gap-4 flex-1 min-w-0">
                {/* Company Logo */}
                <div className={cn(
                    "entity-placeholder",
                    (experience.company_logo && !imgError) && "bg-transparent border-none"
                )}>
                    {experience.company_logo && !imgError ? (
                        <img
                            src={experience.company_logo}
                            alt={experience.company_name}
                            className="w-full h-full object-contain p-2"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <Icon icon="lucide:building-2" className="entity-placeholder-icon" />
                    )}
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col">
                        <div className="flex justify-between items-start w-full">
                            <h3 className="text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-[8px]">
                                {experience.title}
                            </h3>
                            <button
                                onClick={onEdit}
                                className="md:hidden flex-shrink-0 p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
                            >
                                <Icon icon="eva:edit-outline" className="w-[20px] h-[20px] transition-colors" />
                            </button>
                        </div>
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
                        <div className="flex flex-col gap-[8px]">
                            <p className="text-[12px] leading-[16px] tracking-normal text-center font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                {experience.company_name}
                            </p>
                            <p className="text-[12px] leading-[16px] tracking-normal text-center font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                {renderField(experience.location)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata + Edit Button (Fixed 240px) */}
            <div className="flex items-start flex-shrink-0 w-[240px] justify-between hidden md:flex">
                <div className="w-full">
                    <div className="grid grid-cols-[75px_9px_auto] gap-x-[6px] items-center w-full text-[10px] sm:text-[12px] leading-[14px] sm:leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                        {!(!experience.start_date && !experience.end_date && !experience.is_current) ? (
                            <>
                                {experience.start_date ? (
                                    <>
                                        <span className="whitespace-nowrap text-left">{formatDate(experience.start_date)}</span>
                                        <span className="flex items-center justify-center w-[9px] h-[16px]">
                                            <span className="text-center">-</span>
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <span className="whitespace-nowrap text-left"></span>
                                        <span className="flex items-center justify-center w-[9px] h-[16px]"></span>
                                    </>
                                )}
                                <span className="whitespace-nowrap text-left">{experience.end_date ? formatDate(experience.end_date) : (experience.start_date ? 'Present' : '')}</span>
                            </>
                        ) : (
                            <>
                                <span className="whitespace-nowrap text-left"></span>
                                <span className="flex items-center justify-center w-[9px] h-[16px]"></span>
                                <span className="whitespace-nowrap text-left"></span>
                            </>
                        )}

                        <span className="whitespace-nowrap text-left">{experience.work_type || ''}</span>
                        <span className="flex items-center justify-center w-[9px] h-[16px]">
                            {experience.work_mode ? <span className="text-center">—</span> : null}
                        </span>
                        <span className="whitespace-nowrap text-left">{experience.work_mode || ''}</span>
                    </div>
                </div>
                <button
                    onClick={onEdit}
                    className="flex-shrink-0 mt-0.5 p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors"
                >
                    <Icon icon="eva:edit-outline" className="w-[24px] h-[24px] transition-colors" />
                </button>
            </div>
        </div>
    )
}
