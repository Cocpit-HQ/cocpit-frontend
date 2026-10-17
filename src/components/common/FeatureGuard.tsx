"use client";

import React from "react";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { FeatureMaintenanceView } from "./FeatureMaintenanceView";
import { Wrench } from "lucide-react";

interface FeatureGuardProps {
  featureKey: string;
  moduleName?: string;
  mode?: "fullPage" | "inline" | "silent";
  customMessage?: string;
  children: React.ReactNode;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  featureKey,
  moduleName,
  mode = "fullPage",
  customMessage,
  children,
}) => {
  const { isFeatureActive, isLoading, refreshFlags } = useFeatureFlags();

  // While feature flags are initial loading, show children or fallback cleanly
  if (isLoading) {
    return <>{children}</>;
  }

  const active = isFeatureActive(featureKey);

  if (!active) {
    if (mode === "silent") {
      return null;
    }

    if (mode === "inline") {
      return (
        <div className="w-full p-4 my-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-medium">
              {customMessage || `${moduleName || "This feature"} is currently under maintenance. Some functions may be temporarily unavailable.`}
            </p>
          </div>
          <button
            onClick={() => refreshFlags()}
            className="text-xs underline hover:no-underline font-semibold cursor-pointer whitespace-nowrap"
          >
            Check Status
          </button>
        </div>
      );
    }

    // Default: fullPage
    return (
      <FeatureMaintenanceView
        moduleName={moduleName}
        message={customMessage}
        onRefresh={refreshFlags}
      />
    );
  }

  return <>{children}</>;
};
