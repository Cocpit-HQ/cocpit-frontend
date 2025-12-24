"use client";

import React, { useState } from "react";
import { Download, FileText, BarChart2 } from "lucide-react";
import { ExtendedExperience } from "@/types/profile";
import { getResumeOverview } from "./ResumeOverview";
import { ResumeMetrics } from "./ResumeMetrics";
import { toast } from "sonner"; // Assuming sonner or similar is available, otherwise alert

interface LivingResumeProps {
  experiences: ExtendedExperience[];
  skills: string[];
}

export function LivingResume({ experiences, skills }: LivingResumeProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "metrics">("overview");
  const overview = getResumeOverview(experiences);

  const handleDownload = () => {
    // Mock toast
    const message = "Resume download will be available soon.";
    if (typeof window !== 'undefined') {
        alert(message); // Fallback if no toast provider is wrapped here, or usage of simple alert for MVP
    }
  };

  return (
    <div className="rounded-xl border p-6 mb-4 bg-card border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl text-foreground font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Living Resume
        </h2>

        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "metrics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Metrics
        </button>
      </div>

      <div className="min-h-[120px]">
        {activeTab === "overview" && (
            <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-foreground mb-1">{overview.yearsOfExperience}</p>
                        <p className="text-sm text-muted-foreground">across product management & strategy</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-foreground mb-1">{overview.featuresShipped}</p>
                        <p className="text-sm text-muted-foreground">driving user growth & revenue</p>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {overview.summary}
                </p>
            </div>
        )}

        {activeTab === "metrics" && (
            <div className="animate-in fade-in duration-300">
                <ResumeMetrics experiences={experiences} skills={skills} />
            </div>
        )}
      </div>
    </div>
  );
}
