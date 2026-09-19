"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { EditableExperienceGroup } from "../components/EditableExperienceGroup";
import { ProfileEmptyState } from "./ProfileEmptyState";
import { FeatureDisabledTooltip } from "@/components/feature-flags";

interface ProfileExperienceProps {
    experiences: any[];
    isOwnProfile: boolean;
    onAddExperienceClick?: () => void;
    onEditExperienceClick?: (groupExps: any[], selectedExp?: any) => void;
}

export function ProfileExperience({
    experiences,
    isOwnProfile,
    onAddExperienceClick,
    onEditExperienceClick,
}: ProfileExperienceProps) {
    const [isExperienceExpanded, setIsExperienceExpanded] = useState(false);

    return (
        <div
            id="experience-section"
            className="w-full bg-card mt-[16px] md:rounded-[24px] transition-all duration-500 ease-in-out overflow-hidden"
        >
            <div className="pt-[16px] pb-[40px] flex flex-col gap-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:pl-10 md:pr-4">
                    <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-['DM_Sans']">Experience</h2>
                    {isOwnProfile && onAddExperienceClick && (
                        <FeatureDisabledTooltip featureKey="enableProfileExperience">
                        <button
                            onClick={onAddExperienceClick}
                            className="add-button-chip cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                        </FeatureDisabledTooltip>
                    )}
                </div>

                {/* Experience Nested Card Wrapper */}
                <div className="px-4 md:pl-10 md:pr-4">
                    <div className={`bg-card rounded-[24px] ${experiences.length > 0 ? 'min-h-[72px] py-4 md:py-8' : ''} px-4  md:pl-[40px] md:pr-4 `}>
                        {experiences.length === 0 ? (
                            <ProfileEmptyState
                                type="experience"
                                isOwnProfile={isOwnProfile}
                            />
                        ) : (
                            <div className="flex flex-col gap-[16px]">
                                {(isExperienceExpanded ? experiences : experiences.slice(0, 2)).map((group, gIdx) => (
                                    <EditableExperienceGroup
                                        key={`${group.company_name}-${gIdx}`}
                                        group={group}
                                        onEdit={(selectedExp) => onEditExperienceClick?.(group.experiences, selectedExp)}
                                        isOwnProfile={isOwnProfile}
                                    />
                                ))}
                            </div>
                        )}

                        {experiences.length > 2 && (
                            <div className="flex justify-center mt-6">
                                <button
                                    onClick={() => setIsExperienceExpanded(!isExperienceExpanded)}
                                    className="w-[86px] h-[24px] flex items-center justify-center text-[14px] leading-[20px] font-normal font-['DM_Sans'] text-primary transition-all flex-none cursor-pointer"
                                >
                                    {isExperienceExpanded ? "View less" : "View more"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
