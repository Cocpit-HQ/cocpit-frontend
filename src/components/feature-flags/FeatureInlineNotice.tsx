"use client";

import React from "react";
import { Wrench, RefreshCw } from "lucide-react";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useFeatureFlags } from "@/context/FeatureFlagContext";

interface FeatureInlineNoticeProps {
  title?: string;
  message?: string;
  moduleName?: string;
  className?: string;
}

export const FeatureInlineNotice: React.FC<FeatureInlineNoticeProps> = ({
  title,
  message,
  moduleName,
  className = "",
}) => {
  const { isCompany } = useActiveProfile();
  const { refreshFlags } = useFeatureFlags();

  const defaultMessage = message || (
    isCompany
      ? `${moduleName || "This section"} is temporarily under maintenance for employers.`
      : `${moduleName || "This section"} is currently undergoing scheduled maintenance.`
  );

  return (
    <div className={`w-full p-4 my-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-between gap-3 shadow-sm ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
          <Wrench className="w-5 h-5 flex-shrink-0" />
        </div>
        <div>
          {title && <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">{title}</h4>}
          <p className="text-xs font-medium leading-relaxed">{defaultMessage}</p>
        </div>
      </div>
      <button
        onClick={() => refreshFlags()}
        className="inline-flex items-center gap-1 text-xs font-semibold hover:underline cursor-pointer whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Check Status
      </button>
    </div>
  );
};
