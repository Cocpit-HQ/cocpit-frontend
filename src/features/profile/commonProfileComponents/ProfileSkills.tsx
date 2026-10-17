"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { SkillProofPill } from "../components/SkillProofPill";
import { FeatureDisabledTooltip } from "@/components/feature-flags";
import { StrengthenProfileChips } from "@/features/profile-score/components/StrengthenProfileChips";

interface ProfileSkillsProps {
    skills: any[];
    experiences: any[];
    posts: any[];
    isOwnProfile: boolean;
    onAddSkillClick?: () => void;
    onDeleteSkill?: (skillName: string) => void;
}

// Chip height (40px) + Chips Wrapper padding (16px top + 16px bottom) = 72px frame
const COLLAPSED_ROW_HEIGHT = 72;

export function ProfileSkills({
    skills,
    experiences,
    posts,
    isOwnProfile,
    onAddSkillClick,
    onDeleteSkill,
}: ProfileSkillsProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [hasOverflow, setHasOverflow] = useState(false);
    const chipsRef = useRef<HTMLDivElement>(null);

    // Detect if the chips container overflows beyond one row
    const checkOverflow = useCallback(() => {
        const el = chipsRef.current;
        if (!el) return;
        setHasOverflow(el.scrollHeight > COLLAPSED_ROW_HEIGHT);
    }, []);

    useEffect(() => {
        checkOverflow();

        const el = chipsRef.current;
        if (!el) return;

        const observer = new ResizeObserver(() => checkOverflow());
        observer.observe(el);
        return () => observer.disconnect();
    }, [checkOverflow, skills]);

    return (
        <>
            {/* Outer Card */}
            <div className="w-full bg-card mt-[16px] md:rounded-[24px] rounded-[24px] shadow-[0px_0px_4px_0px_rgba(99,102,241,0.05)] overflow-hidden transition-all duration-500 ease-in-out">
            <div className="pt-[16px] pb-[16px] flex flex-col gap-[16px]">
                {/* Header */}
                <div className="w-full h-[40px] flex items-center justify-between px-4 md:pl-10 md:pr-4">
                    <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-['DM_Sans']">Skills</h2>
                    {isOwnProfile && onAddSkillClick && (
                        <FeatureDisabledTooltip featureKey="enableProfileSkills">
                        <button
                            onClick={onAddSkillClick}
                            className="add-button-chip cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                        </FeatureDisabledTooltip>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="px-4 md:pl-10 md:pr-4">
                    {isOwnProfile && skills.length < 5 && (
                        <div className="pb-2">
                            <StrengthenProfileChips
                                chips={[{ key: "add-skills", label: "Add 5+ skills", fieldRef: "skills" }]}
                                onChipClick={() => {
                                    if (onAddSkillClick) onAddSkillClick();
                                }}
                            />
                        </div>
                    )}
                    <div className="w-full flex flex-col items-center">
                        {/* Chips Wrapper */}
                        <div
                            ref={chipsRef}
                            className="w-full p-[16px] flex flex-wrap gap-[24px] overflow-hidden transition-[max-height] duration-[400ms] ease-in-out"
                            style={{
                                maxHeight: isExpanded
                                    ? `${chipsRef.current?.scrollHeight ?? 1000}px`
                                    : `${COLLAPSED_ROW_HEIGHT}px`,
                            }}
                        >
                            {skills.map((skill: any, index) => {
                                const skillName = skill.name || (typeof skill === 'string' ? skill : '');
                                if (!skillName) return null;
                                return (
                                    <SkillProofPill
                                        key={`${skill.skill_id || 'skill'}-${index}`}
                                        skill={skillName}
                                        experiences={experiences}
                                        posts={posts}
                                        onDelete={isOwnProfile ? onDeleteSkill : undefined}
                                    />
                                );
                            })}
                        </div>

                        {/* "View more" Bar */}
                        {hasOverflow && (
                            <div className="w-full flex justify-center">
                                <button
                                    onClick={() => setIsExpanded((prev) => !prev)}
                                    className="py-[8px] px-[16px] flex justify-center items-center font-normal text-[14px] leading-[20px] text-[#6366F1] font-['DM_Sans'] cursor-pointer"
                                >
                                    {isExpanded ? "View less" : "View more"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}
