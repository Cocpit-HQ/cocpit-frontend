
"use client";

import React from "react";

interface ProfileAboutProps {
    aboutText: string;
}

export function ProfileAbout({ aboutText }: ProfileAboutProps) {
    if (!aboutText) return null;

    return (
        <div className="rounded-xl border p-6 mb-4 bg-card border-border">
            <h2 className="text-xl text-foreground mb-4">About</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
                {aboutText}
            </p>
        </div>
    );
}
