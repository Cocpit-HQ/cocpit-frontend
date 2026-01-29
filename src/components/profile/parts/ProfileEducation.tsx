
"use client";

import React from "react";
import { GraduationCap } from "lucide-react";

import { Education } from "@/types/entities";

export interface FormattedEducation extends Education {
    duration: string;
    school: string; // mapped from school_name
    fieldOfStudy: string; // mapped from field_of_study
    id: string; // mapped from education_id
}

interface ProfileEducationProps {
    educations: FormattedEducation[];
}

function ReadOnlyEducationItem({ education }: { education: FormattedEducation }) {
    return (
        <div className="flex gap-4 group relative">
            <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                    {education.school}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">
                    {education.degree}, {education.fieldOfStudy}
                </p>
                <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                    <span>{education.duration}</span>
                </div>
                <p className="text-sm text-muted-foreground">{education.description}</p>
            </div>
        </div>
    );
}

export function ProfileEducation({ educations }: ProfileEducationProps) {
    if (!educations || educations.length === 0) return null;

    return (
        <div className="rounded-xl border p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-foreground">Education</h2>
            </div>

            <div className="space-y-6">
                {educations.map((edu) => (
                    <ReadOnlyEducationItem key={edu.id} education={edu} />
                ))}
            </div>
        </div>
    );
}
