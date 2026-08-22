import React from "react";
import { Briefcase, Wrench, Layers } from "lucide-react";
import { Experience } from "@/types/entities";

interface ResumeMetricsProps {
  experiences: Experience[];
  skills: string[];
}

export function ResumeMetrics({ experiences, skills }: ResumeMetricsProps) {
  // Calculate unique domains based on company names or description keywords (Mock logic)
  const domains = new Set(experiences.map(e => e.company_name)).size;
  const toolsCount = skills.length;

  // Calculate total years based on months
  let totalMonths = 0;
  experiences.forEach((exp) => {
    if (!exp.start_date) return;
    const start = new Date(exp.start_date);
    if (isNaN(start.getTime())) return;

    const end = exp.end_date ? new Date(exp.end_date) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    totalMonths += Math.max(0, months);
  });
  
  let totalYears = 0;
  if (experiences.length > 0) {
    totalYears = Math.round(totalMonths / 12);
  } else {
    totalYears = 0;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
      <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-4">
        <div className="bg-primary/10 p-2.5 rounded-lg text-primary">
          <Briefcase className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{totalYears}+</p>
          <p className="text-xs text-muted-foreground">Years Experience</p>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-4">
        <div className="bg-purple-500/10 p-2.5 rounded-lg text-purple-600">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{domains}</p>
          <p className="text-xs text-muted-foreground">Domains Worked</p>
        </div>
      </div>

      <div className="bg-muted/30 p-4 rounded-xl border border-border flex items-center gap-4">
        <div className="bg-blue-500/10 p-2.5 rounded-lg text-blue-600">
          <Wrench className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{toolsCount}</p>
          <p className="text-xs text-muted-foreground">Tools Mastered</p>
        </div>
      </div>
    </div>
  );
}
