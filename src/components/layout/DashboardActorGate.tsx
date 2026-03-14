"use client";

import React from "react";

import { useActiveProfile } from "@/context/ActiveProfileContext";

function DashboardShellSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-64 border-r border-border bg-card/60 md:block" />
      <main className="flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-2xl bg-muted" />
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
              <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="hidden h-80 animate-pulse rounded-2xl bg-muted lg:block" />
          </div>
        </div>
      </main>
    </div>
  );
}

export function DashboardActorGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useActiveProfile();

  if (isLoading) {
    return <DashboardShellSkeleton />;
  }

  return <>{children}</>;
}
