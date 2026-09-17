"use client";

import React from "react";
import { Drawer } from "vaul";
import { BadgeCheck } from "lucide-react";
import { UserData } from "@/types/user";
import { useRouter } from "next/navigation";

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

  const isVerified = Boolean((user as any).is_verified || (user as any).isVerified);

  const handleRedirectToSettings = () => {
    onClose();
    router.push("/settings/account");
  };

  const handleRedirectToVerification = () => {
    onClose();
    router.push("/settings/privacy");
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-[99]" />
        <Drawer.Content className="bg-[var(--ds-surface-1)] flex flex-col rounded-t-[20px] fixed bottom-0 left-0 right-0 z-[100] outline-none font-['DM_Sans'] border-t border-[var(--ds-border)] px-5 pb-8 pt-3">
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
                <span className="text-[var(--ds-text-primary)] text-sm font-normal break-all">
                  {user.email || "—"}
                </span>
              </div>
            )}

            {/* Phone Number Section */}
            {(isPhoneVisible || isOwnProfile) && (
              <div className="flex flex-col gap-1">
                <span className="text-[var(--ds-text-secondary)] text-sm font-medium">Phone number</span>
                {user.mobile_number ? (
                  <span className="text-[var(--ds-text-primary)] text-sm font-normal">
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
              </div>
            )}

            {/* Profile Url Section */}
            <div className="flex flex-col gap-1">
              <span className="text-[var(--ds-text-secondary)] text-sm font-medium">Profile Url</span>
              <span className="text-[var(--ds-text-primary)] text-sm font-normal break-all">
                {profileUrl}
              </span>
            </div>

            {/* Verifications Section */}
            <div className="flex flex-col gap-1">
              <span className="text-[var(--ds-text-secondary)] text-sm font-medium">Verifications</span>
              {isVerified ? (
                <div className="flex items-center gap-1.5 text-sm font-normal text-[var(--ds-text-primary)]">
                  <span>User is verified</span>
                  <BadgeCheck className="w-4 h-4 text-[var(--ds-accent)] fill-[var(--ds-accent)]/20" />
                </div>
              ) : isOwnProfile ? (
                <button
                  type="button"
                  onClick={handleRedirectToVerification}
                  className="text-left text-[var(--ds-accent)] hover:underline text-sm font-normal cursor-pointer"
                >
                  Verify account
                </button>
              ) : (
                <span className="text-[var(--ds-text-muted)] text-sm font-normal">User is unverified</span>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default MobileContactInfoDrawer;
