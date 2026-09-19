"use client";

import React from "react";
import AIChatPage from "@/features/ai/pages/AIChatPage";
import { FeatureGuard } from "@/components/feature-flags";

export default function AIAssistantPage() {
    return (
        <FeatureGuard featureKey="enableAITab" moduleName="AI Assistant">
            <div className="w-full h-[calc(100vh-112px)] md:h-[calc(100vh-72px)] overflow-hidden">
                <AIChatPage />
            </div>
        </FeatureGuard>
    );
}