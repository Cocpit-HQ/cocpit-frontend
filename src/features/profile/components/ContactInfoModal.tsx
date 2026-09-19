"use client";

import React, { useState } from "react";
import { Dialog, BareDialogContent, DialogTitle } from "@/components/ui/dialog";
import { CloseCrossIcon } from "@/components/icons";
import { BadgeCheck, Check } from "lucide-react";
import { UserData } from "@/types/user";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileContactInfoDrawer } from "./drawers/MobileContactInfoDrawer";

export interface ContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  isOwnProfile?: boolean;
}

export const ContactInfoModal: React.FC<ContactInfoModalProps> = ({
  isOpen,
  onClose,
  user,
  isOwnProfile = false,
}) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text?: string | null) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 3000);
  };

  if (!user) return null;

  if (isMobile) {
    return (
      <MobileContactInfoDrawer
        isOpen={isOpen}
        onClose={onClose}
        user={user}
        isOwnProfile={isOwnProfile}
      />
    );
  }

  const currentUsername = user.account_name || user.id || "";
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${currentUsername}`
      : `https://www.cocpit.com/profile/${currentUsername}`;

  // Privacy visibility checks for public view
  const isEmailVisible =
    isOwnProfile ||
    ((user as any).show_email !== false &&
      (user as any).showEmail !== false &&
      Boolean(user.email));

  const isPhoneVisible =
    isOwnProfile ||
    ((user as any).show_phone !== false &&
      (user as any).showPhone !== false &&
      Boolean(user.mobile_number));

  const handleRedirectToSettings = () => {
    onClose();
    router.push("/settings/account-phone");
  };

  const handleRedirectToVerification = () => {
    onClose();
    router.push("/settings/privacy");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BareDialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto flex justify-center items-center outline-none z-[200]"
      >
        <DialogTitle className="sr-only">Contact info</DialogTitle>

        {/* Modal Container: w-96 (384px), p-3, bg-[var(--ds-bg)], rounded-2xl, border */}
        <div className="w-96 max-w-[95vw] p-3 bg-[var(--ds-bg)] rounded-2xl border border-[var(--ds-border)] flex flex-col justify-start items-center overflow-hidden text-[var(--ds-text-primary)] select-none font-['DM_Sans'] shadow-2xl relative z-10">
          {/* Top Row: Close button right-aligned */}
          <div className="self-stretch flex justify-end items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1 border-0 outline-none bg-transparent shadow-none text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
              aria-label="Close"
            >
              <CloseCrossIcon
                size={20}
                className="w-5 h-5 text-[var(--ds-text-primary)]"
              />
            </button>
          </div>

          {/* Main Content Area: flex-col items-center gap-3 */}
          <div className="self-stretch flex flex-col justify-start items-center gap-3">
            {/* Modal Title */}
            <div className="text-center justify-start text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
              Contact info
            </div>

            {/* Email Section */}
            {isEmailVisible && (
              <div className="self-stretch py-2 flex flex-col justify-center items-start gap-2.5">
                <div className="text-center justify-start text-[var(--ds-text-primary)] text-sm font-semibold font-['DM_Sans'] leading-5">
                  Email
                </div>
                <div
                  onClick={() => user.email && handleCopy("email", user.email)}
                  className={`self-stretch inline-flex justify-between items-center ${user.email ? "cursor-pointer group" : ""}`}
                >
                  <div className="text-center justify-start text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent)] text-sm font-normal font-['DM_Sans'] leading-5 break-all transition-colors">
                    {user.email || "—"}
                  </div>
                  {copiedKey === "email" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--ds-success)] font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Phone Number Section */}
            {(isPhoneVisible || isOwnProfile) && (
              <div className="self-stretch py-2 flex flex-col justify-center items-start gap-2.5">
                <div className="text-center justify-start text-[var(--ds-text-primary)] text-sm font-semibold font-['DM_Sans'] leading-5">
                  Phone number
                </div>

                <div
                  onClick={() => user.mobile_number && handleCopy("phone", user.mobile_number)}
                  className={`self-stretch inline-flex justify-between items-center ${user.mobile_number ? "cursor-pointer group" : ""}`}
                >
                  {user.mobile_number ? (
                    <div className="text-center justify-start text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent)] text-sm font-normal font-['DM_Sans'] leading-5 transition-colors">
                      {user.mobile_number}
                    </div>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      onClick={handleRedirectToSettings}
                      className="text-center justify-start text-[var(--ds-accent)] hover:opacity-80 text-sm font-normal font-['DM_Sans'] leading-5 transition-opacity cursor-pointer"
                    >
                      Add phone number
                    </button>
                  ) : (
                    <div className="text-center justify-start text-[var(--ds-text-muted)] text-sm font-normal font-['DM_Sans'] leading-5">
                      —
                    </div>
                  )}
                  {copiedKey === "phone" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--ds-success)] font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Profile URL Section */}
            <div className="self-stretch py-2 flex flex-col justify-center items-start gap-2.5">
              <div className="text-center justify-start text-[var(--ds-text-primary)] text-sm font-semibold font-['DM_Sans'] leading-5">
                Profile Url
              </div>
              <div
                onClick={() => handleCopy("profileUrl", profileUrl)}
                className="self-stretch inline-flex justify-between items-center cursor-pointer group gap-2"
              >
                <div className="text-center justify-start text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent)] text-sm font-normal font-['DM_Sans'] leading-5 break-all line-clamp-1 transition-colors">
                  {profileUrl}
                </div>
                {copiedKey === "profileUrl" && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--ds-success)] font-medium shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </span>
                )}
              </div>
            </div>

            {/* Verifications Section */}
            <div className="self-stretch py-2 flex flex-col justify-center items-start gap-2.5">
              <div className="text-center justify-start text-[var(--ds-text-primary)] text-sm font-semibold font-['DM_Sans'] leading-5">
                Verifications
              </div>

              <div className="self-stretch inline-flex justify-start items-center gap-2">
                {user.is_identity_verified ? (
                  <>
                    <div className="text-center justify-start text-[var(--ds-text-primary)] text-sm font-normal font-['DM_Sans'] leading-5">
                      {isOwnProfile ? "You are verified" : "User is verified"}
                    </div>
                    <div className="size-4 relative overflow-hidden flex items-center justify-center">
                      <BadgeCheck
                        size={16}
                        className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0"
                      />
                    </div>
                  </>
                ) : isOwnProfile ? (
                  <button
                    type="button"
                    onClick={handleRedirectToVerification}
                    className="text-center justify-start text-[var(--ds-accent)] hover:opacity-80 text-sm font-normal font-['DM_Sans'] leading-5 transition-opacity cursor-pointer"
                  >
                    Verify account
                  </button>
                ) : (
                  <div className="text-center justify-start text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5">
                    User is not verified
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </BareDialogContent>
    </Dialog>
  );
};

export default ContactInfoModal;


