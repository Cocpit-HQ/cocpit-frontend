
"use client";

import React from "react";
import { GraduationCap, Edit2 } from "lucide-react";
import { Education } from "@/types/entities";

interface EditableEducationItemProps {
    education: Education;
    onEdit: () => void;
}

export function EditableEducationItem({
    education,
    onEdit,
}: EditableEducationItemProps) {
    return (
        <div className="flex gap-4 group relative">
            <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">
                    {education.school_name}
                </h3>
                <p className="text-sm text-muted-foreground mb-1">{education.degree}, {education.field_of_study}</p>
                <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                    <span>{new Date(education.start_date).getFullYear()} - {education.end_date ? new Date(education.end_date).getFullYear() : 'Present'}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {education.description}
                </p>
            </div>
            <button onClick={onEdit} className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-foreground transition-opacity">
                <Edit2 className="w-4 h-4" />
            </button>
        </div>
    )
}
