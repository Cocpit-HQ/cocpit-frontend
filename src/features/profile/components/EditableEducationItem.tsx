"use client";

import React from "react";
import { Education } from "@/types/entities";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface EditableEducationItemProps {
    education: Education;
    onEdit?: () => void;
    isOwnProfile?: boolean;
}

export function EditableEducationItem({
    education,
    onEdit,
    isOwnProfile = true,
}: EditableEducationItemProps) {
    const [isDescExpanded, setIsDescExpanded] = React.useState(false);

    const [imgError, setImgError] = React.useState(false);

    const renderField = (value: string | null | undefined) => {
        if (!value || value === "null") return "Not Specified";
        return value;
    };

    const rawDescription = renderField(education.description);
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
        <div className="flex flex-col md:flex-row group relative w-full items-start justify-between gap-3 md:gap-6">
            {/* Left/Center Content: Icon + Info */}
            <div className="flex gap-4 flex-1 min-w-0">
                {/* School Icon */}
                <div className={cn(
                    "entity-placeholder",
                    (education.school_logo && !imgError) && "bg-transparent border-none"
                )}>
                    {education.school_logo && !imgError ? (
                        <img
                            src={education.school_logo}
                            alt={education.school_name}
                            className="w-full h-full object-contain p-2"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <Icon icon="qlementine-icons:education-24" className="entity-placeholder-icon" />
                    )}
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-[8px]">
                        <div className="flex justify-between items-start w-full">
                            <h3 className="text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-[8px]">
                                {renderField(education.school_name)}
                            </h3>
                            {isOwnProfile && onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="md:hidden flex-shrink-0 p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
                                >
                                    <Icon
                                        icon="eva:edit-outline"
                                        className="w-[20px] h-[20px] stroke-[1.5px] transition-colors"
                                    />
                                </button>
                            )}
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
                            <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                {renderField(education.degree)}
                            </p>
                            <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                                {renderField(education.location)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Metadata + Edit Button */}
            <div className="flex flex-row items-start justify-between md:justify-end flex-shrink-0 w-full md:w-[220px] gap-[12px] md:gap-[16px] md:ml-auto pl-[72px] md:pl-0 hidden md:flex">
                <div className="flex flex-col items-start p-0 gap-[8px] md:w-[130px]">
                    {!(!education.start_date && !education.end_date) && (
                        <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-x-[8px] gap-y-[4px]">
                            {education.start_date && (
                                <>
                                    <span className="md:w-[60px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                                        {formatDate(education.start_date)}
                                    </span>
                                    <span className="md:w-[9px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-muted-foreground">
                                        -
                                    </span>
                                </>
                            )}
                            <span className="md:w-[75px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                                {education.end_date ? formatDate(education.end_date) : (education.start_date ? 'Present' : '')}
                            </span>
                        </div>
                    )}
                    <div className="w-full break-words font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground">
                        {renderField(education.field_of_study)}
                    </div>
                </div>
                <div className="w-[32px] flex justify-end flex-shrink-0">
                    {isOwnProfile && onEdit && (
                        <button
                            onClick={onEdit}
                            className="p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
                        >
                            <Icon
                                icon="eva:edit-outline"
                                className="w-[24px] h-[24px] stroke-[1.5px] transition-colors"
                            />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
