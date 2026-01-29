
"use client";

import React from "react";
import { Briefcase } from "lucide-react";

import { Experience } from "@/types/entities";

export interface FormattedExperience extends Experience {
    duration: string;
    company: string;
    id: string; // mapped from experience_id
}

interface ProfileExperienceProps {
    experiences: FormattedExperience[];
}

function ReadOnlyExperienceItem({ experience }: { experience: FormattedExperience }) {
    return (
        <div className="flex gap-4 group relative">
            <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold mb-1 text-foreground">{experience.title}</h3>
                <p className="text-sm mb-1 text-muted-foreground">{experience.company}</p>
                <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                    <span>{experience.duration}</span>
                    <span>•</span>
                    <span>{experience.location}</span>
                </div>
                <p className="text-sm text-muted-foreground">{experience.description}</p>
            </div>
        </div>
    );
}

export function ProfileExperience({ experiences }: ProfileExperienceProps) {
    if (!experiences || experiences.length === 0) return null;

    return (
        <div className="rounded-xl border p-6 mb-4 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-foreground">Experience</h2>
            </div>

            <div className="space-y-6">
                {experiences.map((exp) => (
                    <ReadOnlyExperienceItem key={exp.id} experience={exp} />
                ))}
            </div>
        </div>
    );
}
