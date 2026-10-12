"use client";

import React from "react";
import { VerifyBadgeIcon } from "@/components/icons";

interface VerificationStatusCardProps {
  isVerified?: boolean;
  onManageDocumentsClick?: () => void;
}

export default function VerificationStatusCard({
  isVerified = false,
  onManageDocumentsClick,
}: VerificationStatusCardProps) {
  if (isVerified) return null;

  return (
    <div className="w-full max-w-[800px] px-5">
      <div className="w-full self-stretch min-h-[96px] py-[10px] flex flex-col justify-center items-center gap-4">
        {/* Row 1: Icon + Title & Status Badge */}
        <div className="self-stretch w-full flex justify-between items-center gap-2 h-6">
          <div className="flex items-center gap-2 h-6">
            <VerifyBadgeIcon
              className="w-6 h-6 text-ds-accent shrink-0"
              fill="currentColor"
            />
            <h3 className="text-ds-text-primary ds-text-body-2">
              Verification Status
            </h3>
          </div>

          <div className="flex items-center shrink-0">
            <span
              className={`ds-text-small ${
                isVerified ? "text-ds-success" : "text-ds-warning"
              }`}
            >
              {isVerified ? "Verified" : "Unverified"}
            </span>
          </div>
        </div>

        {/* Row 2: Description & Action Button */}
        <div className="self-stretch w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 sm:h-9">
          <p className="text-ds-text-secondary ds-text-secondary">
            {isVerified
              ? "Your profile is verified. Maintain updated documentation to preserve status."
              : "Your profile is unverified. Maintain updated documentation to preserve status."}
          </p>

          <button
            type="button"
            onClick={onManageDocumentsClick}
            className="h-9 px-3 py-1.5 rounded-full bg-transparent border border-ds-border flex justify-center items-center gap-2.5 text-ds-text-primary ds-text-body-1 hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors cursor-pointer shrink-0"
          >
            Manage Documents
          </button>
        </div>
      </div>
    </div>
  );
}
