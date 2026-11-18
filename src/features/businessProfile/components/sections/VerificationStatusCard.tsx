"use client";

import React from "react";
import { VerifyBadgeIcon } from "@/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useCompanyPermissions } from "@/features/businessProfile";

interface VerificationStatusCardProps {
  isVerified?: boolean;
  verificationStatus?: string;
  onManageDocumentsClick?: () => void;
  canVerify?: boolean;
}

export default function VerificationStatusCard({
  isVerified = false,
  verificationStatus,
  onManageDocumentsClick,
  canVerify,
}: VerificationStatusCardProps) {
  const { activeProfile } = useActiveProfile();
  const perms = useCompanyPermissions(activeProfile);

  const effectiveCanVerify =
    canVerify ??
    Boolean(
      perms.isOwner ||
      perms.isAdmin ||
      perms.canVerify ||
      perms.checkPermission("MANAGE_VERIFICATION") ||
      perms.checkPermission("*")
    );

  if (isVerified) return null;

  const rawStatus = (
    verificationStatus ||
    activeProfile?.verification_status ||
    (activeProfile as any)?.verificationStatus ||
    "UNVERIFIED"
  ).toUpperCase();

  const isUnderReview = !isVerified && [
    "UNDER_REVIEW",
    "DOCUMENT_PENDING",
    "PENDING",
    "SUBMITTED",
    "IN_REVIEW",
  ].includes(rawStatus);

  const isRejected = !isVerified && !isUnderReview && rawStatus === "REJECTED";

  let statusText = "Unverified";
  let statusColor = "text-ds-warning";
  let statusMessage = "Your profile is unverified. Maintain updated documentation to preserve status.";

  if (isUnderReview) {
    statusText = "Under Review";
    statusColor = "text-amber-500";
    statusMessage = "Your verification request is under review and awaiting admin approval.";
  } else if (isRejected) {
    statusText = "Rejected";
    statusColor = "text-red-500";
    statusMessage = "Your verification request was rejected. Please re-submit your documentation.";
  }

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
              className={`ds-text-small font-medium ${statusColor}`}
            >
              {statusText}
            </span>
          </div>
        </div>

        {/* Row 2: Description & Action Button */}
        <div className="self-stretch w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 sm:h-9">
          <p className="text-ds-text-secondary ds-text-secondary">
            {statusMessage}
          </p>

          {!effectiveCanVerify ? (
            <TooltipProvider>
              <Tooltip delayDuration={100} enableTouch>
                <TooltipTrigger asChild>
                  <span className="inline-block cursor-not-allowed">
                    <button
                      type="button"
                      onClick={onManageDocumentsClick}
                      className="h-9 px-3 py-1.5 rounded-full bg-transparent border border-ds-border flex justify-center items-center gap-2.5 text-ds-text-primary ds-text-body-1 hover:bg-ds-surface-1 transition-colors cursor-not-allowed shrink-0"
                    >
                      Manage Documents
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs font-['DM_Sans'] z-50">
                  You don't have access to verify on the behalf of company
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              type="button"
              onClick={onManageDocumentsClick}
              className="h-9 px-3 py-1.5 rounded-full bg-transparent border border-ds-border flex justify-center items-center gap-2.5 text-ds-text-primary ds-text-body-1 hover:bg-ds-surface-1 active:bg-ds-surface-2 transition-colors cursor-pointer shrink-0"
            >
              Manage Documents
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
