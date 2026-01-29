
"use client";

import React from "react";
import { SkillProofPill } from "@/components/profile/SkillProofPill";
import { Post } from "@/types/entities";

interface ProfileSkillsProps {
    skills: string[];
    experiences: any[]; // Typing as any[] to match usage in PublicProfile for now, can be strict
    posts: Post[];
}

export function ProfileSkills({ skills, experiences, posts }: ProfileSkillsProps) {
    if (!skills || skills.length === 0) return null;

    return (
        <div className="rounded-xl border p-6 mb-4 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-foreground">Skills</h2>
            </div>

            <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                    <SkillProofPill
                        key={skill}
                        skill={skill}
                        experiences={experiences}
                        posts={posts}
                        readOnly
                    />
                ))}
            </div>
        </div>
    );
}
