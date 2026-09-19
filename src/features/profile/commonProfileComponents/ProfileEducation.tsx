"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { EditableEducationItem } from "../components/EditableEducationItem";
import { ProfileEmptyState } from "./ProfileEmptyState";
import { FeatureDisabledTooltip } from "@/components/feature-flags";

interface ProfileEducationProps {
    educations: any[];
    isOwnProfile: boolean;
    onAddEducationClick?: () => void;
    onEditEducationClick?: (edu: any) => void;
}

export function ProfileEducation({
    educations,
    isOwnProfile,
    onAddEducationClick,
    onEditEducationClick,
}: ProfileEducationProps) {
    const [isEducationExpanded, setIsEducationExpanded] = useState(false);

    return (
        <div
            id="education-section"
            className="w-full bg-card mt-[16px] md:rounded-[24px] transition-all duration-500 ease-in-out overflow-hidden"
        >
            <div className="pb-[40px] flex flex-col gap-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:pl-10 md:pr-4">
                    <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-['DM_Sans']">Education</h2>
                    {isOwnProfile && onAddEducationClick && (
                        <FeatureDisabledTooltip featureKey="enableProfileEducation">
                        <button
                            onClick={onAddEducationClick}
                            className="add-button-chip cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                        </FeatureDisabledTooltip>
                    )}
                </div>

                {/* Education Nested Card Wrapper */}
                <div className="px-4 md:pl-10 md:pr-4">
                    <div className={`bg-card rounded-[24px] ${educations.length > 0 ? 'min-h-[72px] py-4 md:py-8' : ''} px-4 md:pl-[40px] md:pr-4 `}>
                        {educations.length === 0 ? (
                            <ProfileEmptyState
                                type="education"
                                isOwnProfile={isOwnProfile}
                            />
                        ) : (
                            <div className="flex flex-col gap-[16px]">
                                {(isEducationExpanded ? educations : educations.slice(0, 2)).map((edu, index) => (
                                    <EditableEducationItem
                                        key={`${edu.education_id}-${index}`}
                                        education={edu}
                                        onEdit={() => onEditEducationClick?.(edu)}
                                        isOwnProfile={isOwnProfile}
                                    />
                                ))}
                            </div>
                        )}

                        {educations.length > 2 && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setIsEducationExpanded(!isEducationExpanded)}
                                    className="w-[86px] h-[24px] flex items-center justify-center text-[14px] leading-[20px] font-normal font-['DM_Sans'] text-primary transition-all flex-none cursor-pointer"
                                >
                                    {isEducationExpanded ? "View less" : "View more"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
