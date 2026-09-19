"use client";

import React from "react";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { FeatureMaintenanceView } from "./FeatureMaintenanceView";
import { FeatureInlineNotice } from "./FeatureInlineNotice";
import { FeatureDisabledTooltip } from "./FeatureDisabledTooltip";

interface FeatureGuardProps {
  featureKey: string;
  moduleName?: string;
  mode?: "fullPage" | "inline" | "tooltip" | "silent";
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
        <FeatureInlineNotice
          moduleName={moduleName}
          message={customMessage}
        />
      );
    }

    if (mode === "tooltip") {
      return (
        <FeatureDisabledTooltip
          featureKey={featureKey}
          disabledMessage={customMessage}
        >
          {children}
        </FeatureDisabledTooltip>
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

// Test HMR
