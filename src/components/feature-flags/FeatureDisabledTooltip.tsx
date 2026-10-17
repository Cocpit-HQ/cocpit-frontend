"use client";

import React, { useState } from "react";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { Wrench } from "lucide-react";

interface FeatureDisabledTooltipProps {
  featureKey: string;
  disabledMessage?: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}

export const FeatureDisabledTooltip: React.FC<FeatureDisabledTooltipProps> = ({
  featureKey,
  disabledMessage,
  children,
  position = "top",
}) => {
  const { isFeatureActive, isLoading } = useFeatureFlags();
  const { isCompany } = useActiveProfile();
  const [showNotice, setShowNotice] = useState(false);

  if (isLoading) {
    return <>{children}</>;
  }

  const active = isFeatureActive(featureKey);

  if (!active) {
    const defaultNotice = disabledMessage || (
      isCompany
        ? "This action is temporarily paused by system administration."
        : "This feature is currently undergoing scheduled maintenance."
    );

    const positionClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    const popupClass = positionClasses[position];

    return (
      <div
        className="relative inline-block cursor-default group"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowNotice(true);
          setTimeout(() => setShowNotice(false), 3000);
        }}
      >
        {/* Render children disabled & non-interactive */}
        <div className="opacity-50 pointer-events-none select-none">
          {children}
        </div>

        {/* Hover / Click Popup Tooltip */}
        <div className={`absolute z-50 ${popupClass} w-56 p-2.5 bg-popover text-popover-foreground border border-amber-500/30 rounded-xl shadow-xl text-xs font-medium opacity-0 group-hover:opacity-100 transition-all pointer-events-none flex items-start gap-2 backdrop-blur-md`}>
          <Wrench className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <span>{defaultNotice}</span>
        </div>

        {/* Click Toast Fallback */}
        {showNotice && (
          <div className={`absolute z-50 ${popupClass} w-60 p-3 bg-amber-900 text-amber-100 border border-amber-500/40 rounded-xl shadow-2xl text-xs font-medium flex items-center gap-2 animate-in fade-in zoom-in-95`}>
            <Wrench className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>{defaultNotice}</span>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};
