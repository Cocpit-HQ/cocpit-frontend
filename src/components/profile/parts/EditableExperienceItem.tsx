
"use client";

import React from "react";
import { Briefcase, Edit2 } from "lucide-react";
import { Experience } from "@/types/entities";

interface EditableExperienceItemProps {
    experience: Experience;
    onEdit: () => void;
}

export function EditableExperienceItem({
    experience,
    onEdit,
}: EditableExperienceItemProps) {
    return (
        <div className="flex gap-4 group relative">
            <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold mb-1 text-foreground">{experience.title}</h3>
                <p className="text-sm mb-1 text-muted-foreground">{experience.company_name}</p>
                <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                    <span>{new Date(experience.start_date).getFullYear()} - {experience.end_date ? new Date(experience.end_date).getFullYear() : 'Present'}</span>
                    <span>•</span>
                    <span>{experience.location}</span>
                </div>
                <p className="text-sm text-muted-foreground">{experience.description}</p>
            </div>
            <button onClick={onEdit} className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-foreground transition-opacity">
                <Edit2 className="w-4 h-4" />
            </button>
        </div>
    )
}
