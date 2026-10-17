"use client";

import React from "react";
import { Calendar, Users, MapPin, Video, ArrowUpRight } from "lucide-react";

interface EventSuggestionProps {
    title: string;
    date: string;
    attendees: number;
    format: "online" | "in-person";
    location?: string;
    matchReason: string;
}

const EventSuggestionCard = ({
    title,
    date,
    attendees,
    format,
    location,
    matchReason,
}: EventSuggestionProps) => {
    return (
        <div className="group bg-sidebar border border-border rounded-xl p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-glow relative overflow-hidden animate-fade-in-up">
            {/* Subtle top border gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors pr-8">
                        {title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary/70" />
                        <span className="font-medium text-foreground">{date}</span>
                    </div>
                </div>

                {/* Format Badge */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${format === 'online'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                    {format === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                    <span className="capitalize">{format}</span>
                </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                {format === 'in-person' && location && (
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {location}
                    </div>
                )}
                <div className="flex items-center gap-1.5 bg-sidebar-accent px-2 py-1 rounded-md">
                    <Users className="w-3.5 h-3.5" />
                    {attendees} attending
                </div>
            </div>

            {/* Recommended Tag */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 text-xs flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-muted-foreground">
                    {matchReason}
                </p>
            </div>

            <button className="w-full flex items-center justify-center gap-2 bg-sidebar-accent hover:bg-sidebar-accent/80 text-foreground text-sm font-medium py-2 rounded-lg transition-colors border border-border group-hover:border-primary/30">
                View Details
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
        </div>
    );
};

export function AIEventSuggestions() {
    const suggestions: EventSuggestionProps[] = [
        {
            title: "React Server Components Architecture Deep Dive",
            date: "Tomorrow, 10:00 AM PST",
            attendees: 128,
            format: "online",
            matchReason: "Based on your recent 'React Server Components' skill trend.",
        },
        {
            title: "Local Tech Founders Mixer",
            date: "Friday, 6:00 PM EST",
            attendees: 45,
            format: "in-person",
            location: "WeWork Financial District, NY",
            matchReason: "Connecting with founders matches your transition to Senior roles.",
        },
    ];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                    <Calendar className="w-5 h-5 text-purple-400" />
                    Recommended Events
                </h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {suggestions.map((event, idx) => (
                    <div key={idx} style={{ animationDelay: `${(idx + 3) * 150}ms` }}>
                        <EventSuggestionCard {...event} />
                    </div>
                ))}
            </div>
        </div>
    );
}
