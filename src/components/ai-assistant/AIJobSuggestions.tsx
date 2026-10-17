"use client";

import React from "react";
import { Building2, MapPin, Briefcase, Zap, Star } from "lucide-react";

interface JobSuggestionProps {
    role: string;
    company: string;
    location: string;
    salary: string;
    matchScore: number;
    matchReason: string;
    isNew: boolean;
}

const JobSuggestionCard = ({
    role,
    company,
    location,
    salary,
    matchScore,
    matchReason,
    isNew,
}: JobSuggestionProps) => {
    return (
        <div className="relative group bg-sidebar border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-purple animate-fade-in-up">
            {/* Decorative gradient highlight on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center p-2 shadow-sm">
                        <Building2 className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            {role}
                            {isNew && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-400">
                                    NEW
                                </span>
                            )}
                        </h3>
                        <p className="text-sm text-muted-foreground">{company}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md mb-1">
                        <Zap className="w-3 h-3 fill-primary" />
                        <span className="text-xs font-semibold">{matchScore}% Match</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground relative z-10">
                <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {location}
                </div>
                <div className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    {salary}
                </div>
            </div>

            {/* Match Reason Bar */}
            <div className="bg-background/50 rounded-lg p-3 text-xs flex items-start gap-2 border border-border/50 relative z-10">
                <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-muted-foreground">
                    <span className="text-foreground font-medium">Why it's a match: </span>
                    {matchReason}
                </p>
            </div>

            <div className="mt-5 flex gap-2 relative z-10">
                <button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium py-2 rounded-lg transition-colors">
                    Apply Now
                </button>
                <button className="px-4 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground text-sm font-medium rounded-lg transition-colors border border-border">
                    Save
                </button>
            </div>
        </div>
    );
};

export function AIJobSuggestions() {
    const suggestions = [
        {
            role: "Senior Frontend Engineer",
            company: "Stripe",
            location: "San Francisco, CA (Hybrid)",
            salary: "$160k - $210k. Equity",
            matchScore: 94,
            matchReason: "Strong alignment with your 5+ years React experience and recent activity on payment integration articles.",
            isNew: true,
        },
        {
            role: "Product Designer UI/UX",
            company: "Figma",
            location: "Remote",
            salary: "$140k - $180k",
            matchScore: 88,
            matchReason: "Your portfolio skills match their requirement for design system architecture.",
            isNew: false,
        },
        {
            role: "Full-Stack Developer",
            company: "Notion",
            location: "New York, NY",
            salary: "$150k - $190k",
            matchScore: 82,
            matchReason: "Cross-matches your Node.js backend experience with your React frontend preferences.",
            isNew: false,
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Today's Job Picks
                </h2>
                <span className="text-xs text-muted-foreground bg-sidebar px-2 py-1 rounded border border-border">
                    Refreshed Daily
                </span>
            </div>

            <div className="space-y-4">
                {suggestions.map((job, idx) => (
                    <div key={idx} style={{ animationDelay: `${idx * 150}ms` }}>
                        <JobSuggestionCard {...job} />
                    </div>
                ))}
            </div>
        </div>
    );
}
