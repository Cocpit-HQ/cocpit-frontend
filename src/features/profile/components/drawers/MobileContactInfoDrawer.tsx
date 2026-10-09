"use client";

import React, { useState } from "react";
import { Drawer } from "vaul";
import { BadgeCheck, Check } from "lucide-react";
import { UserData } from "@/types/user";
import { useRouter } from "next/navigation";
import { VerifyIdentityModal } from "@/features/settings";

interface MobileContactInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  isOwnProfile?: boolean;
}

export const MobileContactInfoDrawer: React.FC<MobileContactInfoDrawerProps> = ({
  isOpen,
  onClose,
  user,
  isOwnProfile = false,
}) => {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const handleCopy = (key: string, text?: string | null) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 3000);
  };

  if (!user) return null;

  const currentUsername = user.account_name || user.id || "";
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${currentUsername}`
      : `https://www.cocpit.com/profile/${currentUsername}`;

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

  const isVerified = Boolean(
    (user as any).is_verified ||
    (user as any).isVerified ||
    user.is_identity_verified ||
    (user as any).verification_status === "VERIFIED" ||
    (user as any).verification_status === "approved"
  );

  const handleRedirectToSettings = () => {
    onClose();
    router.push("/settings/account-phone");
  };

  const handleRedirectToVerification = () => {
    setIsVerifyModalOpen(true);
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" onClick={onClose} />
        <Drawer.Content className="bg-[var(--ds-bg)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-5 pb-8 pt-3">
          <Drawer.Title className="sr-only">Contact info</Drawer.Title>
          <Drawer.Description className="sr-only">Contact details and verification info</Drawer.Description>

          {/* Drag Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--ds-border)] mb-4" />

          {/* Title */}
          <div className="text-center text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 mb-4">
            Contact info
          </div>

          <div className="flex flex-col gap-4 w-full text-left">
            {/* Email Section */}
            {isEmailVisible && (
              <div className="flex flex-col gap-1">
                <span className="text-[var(--ds-text-secondary)] text-sm font-medium">Email</span>
                <div
                  onClick={() => user.email && handleCopy("email", user.email)}
                  className={`flex justify-between items-center ${user.email ? "cursor-pointer group" : ""}`}
                >
                  <span className="text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent)] active:text-[var(--ds-accent)] transition-colors text-sm font-normal break-all">
                    {user.email || "—"}
                  </span>
                  {copiedKey === "email" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--ds-success)] font-medium shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Phone Number Section */}
            {(isPhoneVisible || isOwnProfile) && (
              <div className="flex flex-col gap-1">
                <span className="text-[var(--ds-text-secondary)] text-sm font-medium">Phone number</span>
                <div
                  onClick={() => user.mobile_number && handleCopy("phone", user.mobile_number)}
                  className={`flex justify-between items-center ${user.mobile_number ? "cursor-pointer group" : ""}`}
                >
                  {user.mobile_number ? (
                    <span className="text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent)] active:text-[var(--ds-accent)] transition-colors text-sm font-normal">
                      {user.mobile_number}
                    </span>
                  ) : isOwnProfile ? (
                    <button
                      type="button"
                      onClick={handleRedirectToSettings}
                      className="text-left text-[var(--ds-accent)] hover:underline text-sm font-normal cursor-pointer"
                    >
                      Add phone number
                    </button>
                  ) : (
                    <span className="text-[var(--ds-text-muted)] text-sm font-normal">—</span>
                  )}
                  {copiedKey === "phone" && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--ds-success)] font-medium shrink-0">
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Profile Url Section */}
            <div className="flex flex-col gap-1">
              <span className="text-[var(--ds-text-secondary)] text-sm font-medium">Profile Url</span>
              <div
                onClick={() => handleCopy("profileUrl", profileUrl)}
                className="flex justify-between items-center cursor-pointer group gap-2"
              >
                <span className="text-[var(--ds-text-primary)] group-hover:text-[var(--ds-accent)] active:text-[var(--ds-accent)] transition-colors text-sm font-normal break-all line-clamp-1">
                  {profileUrl}
                </span>
                {copiedKey === "profileUrl" && (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--ds-success)] font-medium shrink-0">
                    <Check className="w-3.5 h-3.5" />
                    Copied!
                  </span>
                )}
              </div>
            </div>

            {/* Verifications Section */}
            <div className="flex flex-col gap-1">
              <span className="text-[var(--ds-text-secondary)] text-sm font-medium">Verifications</span>
              {isVerified ? (
                <div className="flex items-center gap-1.5 text-sm font-normal text-[var(--ds-text-primary)]">
                  <span>{isOwnProfile ? "You are verified" : "User is verified"}</span>
                  <BadgeCheck className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" />
                </div>
              ) : isOwnProfile ? (
                <button
                  type="button"
                  onClick={handleRedirectToVerification}
                  className="text-left text-[var(--ds-accent)] hover:opacity-80 text-sm font-normal cursor-pointer outline-none"
                >
                  Verify account
                </button>
              ) : (
                <span className="text-[var(--ds-text-muted)] text-sm font-normal">User is not verified</span>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
      <VerifyIdentityModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
      />
    </Drawer.Root>
  );
};

export default MobileContactInfoDrawer;


