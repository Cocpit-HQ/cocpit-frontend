"use client";

import React from "react";
import { Plus } from "lucide-react";
import { SkillProofPill } from "../components/SkillProofPill";

interface ProfileSkillsProps {
    skills: any[];
    experiences: any[];
    posts: any[];
    isOwnProfile: boolean;
    onAddSkillClick?: () => void;
    onDeleteSkill?: (skillName: string) => void;
}

export function ProfileSkills({
    skills,
    experiences,
    posts,
    isOwnProfile,
    onAddSkillClick,
    onDeleteSkill,
}: ProfileSkillsProps) {
    return (
        <div className="w-full bg-card mt-[16px] md:rounded-[24px] transition-all duration-500 ease-in-out overflow-hidden">
            <div className="pt-[16px] pb-[40px] flex flex-col gap-0">
                {/* Header */}
                <div className="flex items-center justify-between px-4 md:pl-10 md:pr-4">
                    <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-[family-name:var(--font-poppins)]">Skills</h2>
                    {isOwnProfile && onAddSkillClick && (
                        <button
                            onClick={onAddSkillClick}
                            className="add-button-chip cursor-pointer"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Skills Nested Card Wrapper */}
                <div className="px-4 md:pl-10 md:pr-4">
                    <div className="bg-card rounded-[24px] min-h-[100px] flex items-center p-4 md:p-8">
                        <div className="flex flex-wrap gap-3 sm:gap-4 md:gap-[40px]">
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
                    </div>
                </div>
            </div>
        </div>
    );
}
