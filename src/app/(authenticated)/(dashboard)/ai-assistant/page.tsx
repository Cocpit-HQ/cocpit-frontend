"use client";

import React from "react";
import AIChatPage from "@/features/ai/pages/AIChatPage";

export default function AIAssistantPage() {
    return (
        <div className="w-full h-[calc(100vh-112px)] md:h-[calc(100vh-72px)] overflow-hidden">
            <AIChatPage />
        </div>
    );
}