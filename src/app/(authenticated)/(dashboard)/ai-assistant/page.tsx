"use client";

import React from "react";
import { AIChatInterface } from "@/components/ai-assistant/AIChatInterface";
import { AIJobSuggestions } from "@/components/ai-assistant/AIJobSuggestions";
import { AIEventSuggestions } from "@/components/ai-assistant/AIEventSuggestions";

export default function AIAssistantPage() {
    return (
        <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-background">
            {/* Left Column: Chat Interface */}
            <div className="w-full lg:w-3/5 h-[calc(100vh-64px)] lg:h-screen border-r border-border">
                <AIChatInterface />
            </div>

            {/* Right Column: Suggestions panels */}
            <div className="w-full lg:w-2/5 h-[calc(100vh-64px)] lg:h-screen overflow-y-auto bg-sidebar/30">
                <div className="p-6 space-y-8">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400 mb-2">
                            Your Daily Insights
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Tailored opportunities based on your skills and platform activity.
                        </p>
                    </div>

                    <AIJobSuggestions />
                    <AIEventSuggestions />
                </div>
            </div>
        </div>
    );
}
