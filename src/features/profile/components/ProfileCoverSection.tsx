import React, { useState, useRef } from "react";
import { AddProfileUserIcon, ProfileEditIcon, UserIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { MobileProfileMenuDrawer } from "./drawers/MobileProfileMenuDrawer";
import type { ProfileScoreBreakdown } from "@/features/profile-score/types/profileScore.types";
import { ViewMediaModal } from "../commonProfileComponents/ViewMediaModal";

interface ProfileCoverSectionProps {
  coverImage?: string | null;
  avatarImage?: string | null;
  userName?: string;
  isOwnProfile?: boolean;
  completionPercentage?: number;
  breakdown?: ProfileScoreBreakdown | null;
  hasExperience?: boolean;
  hasEducation?: boolean;
  hasProjects?: boolean;
  hasSkills?: boolean;
  hasAvatar?: boolean;
  hasCoverImage?: boolean;
  hasBasicInfo?: boolean;
  onActionClick?: (action: string) => void;
  onEditCover?: () => void;
  onEditAvatar?: () => void;
  onEditProfile?: () => void;
  onContactInfo?: () => void;
  onMore?: () => void;
  onShareProfile?: () => void;
  onDownloadProfile?: () => void;
  // For public profile actions
  actionButtons?: React.ReactNode;
}

export const ProfileCoverSection: React.FC<ProfileCoverSectionProps> = ({
  coverImage,
  avatarImage,
  userName,
  isOwnProfile = true,
  completionPercentage = 90,
  breakdown,
  hasExperience = false,
  hasEducation = false,
  hasProjects = false,
  hasSkills = false,
  hasAvatar = false,
  hasCoverImage = false,
  hasBasicInfo = false,
  onActionClick,
  onEditCover,
  onEditAvatar,
  onEditProfile,
  onContactInfo,
  onMore,
  onShareProfile,
  onDownloadProfile,
  actionButtons,
}) => {
  const [coverError, setCoverError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    type: "avatar" | "banner";
    url: string;
  } | null>(null);

  const handleDefaultShare = () => {
    if (onShareProfile) {
      onShareProfile();
    } else {
      if (typeof window !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Profile link copied to clipboard!");
      }
    }
  };

  const handleDefaultDownload = () => {
    if (onDownloadProfile) {
      onDownloadProfile();
    } else {
      toast.info("Download profile is a work in progress!");
    }
  };

  const displayCover = !coverError && coverImage ? coverImage : null;
  // SCRUM-998: Google profile picture should not be used automatically in Cocpit
  const isGoogleAvatar = avatarImage && (avatarImage.includes("googleusercontent.com") || avatarImage.includes("ggpht.com"));
  const displayAvatar = !avatarError && avatarImage && !isGoogleAvatar ? avatarImage : null;

  // Circular progress calculations for own profile (116px diameter, 5px stroke width, radius = 55.5)
  const radius = 55.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPercentage / 100) * circumference;

  const showProgressRing = isOwnProfile && Math.round(completionPercentage) < 100;

  const handleBannerClick = () => {
    if (displayCover) {
      setMediaModal({ isOpen: true, type: "banner", url: displayCover });
    }
  };

  const handleAvatarClick = (e: React.MouseEvent) => {
    if (displayAvatar) {
      e.stopPropagation();
      setMediaModal({ isOpen: true, type: "avatar", url: displayAvatar });
    }
  };

  return (
    <div className="w-full max-w-[800px] h-[205px] sm:h-[235px] md:h-[264px] relative select-none">
      {/* Cover Photo Frame (800x200px on desktop, 16:9 responsive on mobile) */}
      <div
        className={cn(
          "w-full h-[140px] sm:h-[180px] md:h-[200px] rounded-none sm:rounded-[16px] overflow-hidden relative flex flex-col justify-center items-center select-none bg-[var(--ds-surface-1)]",
          displayCover && "cursor-pointer"
        )}
        onClick={handleBannerClick}
      >
        {displayCover ? (
          <img
            src={displayCover}
            alt="Cover"
            className="w-full h-full object-cover"
            onError={() => setCoverError(true)}
          />
        ) : isOwnProfile ? (
          <div className="flex flex-col justify-center items-center gap-2 p-2.5 select-none">
            <div className="w-[87px] h-6 text-center text-[var(--ds-text-secondary)] text-base font-normal font-['DM_Sans'] leading-6 flex-none order-0 select-none">
              Add banner
            </div>
            <div className="w-[303px] max-w-full h-4 text-center text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4 flex-none order-1 select-none">
              Recommended: 16:9 · At least 1200 × 675 px · JPG, PNG
            </div>
          </div>
        ) : null}
      </div>

      {/* Avatar Container (88px mobile, 116px desktop) */}
      <div className={cn("absolute left-4 md:left-[20px] top-[95px] sm:top-[125px] md:top-[139px] w-[88px] md:w-[116px] z-20 select-none", showProgressRing ? "h-[94px] md:h-[121px]" : "h-[88px] md:h-[116px]")}>
        {showProgressRing ? (
          <>
            {/* SVG Progress Ring (116x116 viewBox, scales responsively) */}
            <svg
              className="w-[88px] h-[88px] md:w-[116px] md:h-[116px] left-0 top-0 absolute rotate-90 z-20 overflow-visible"
              viewBox="0 0 116 116"
              style={{ pointerEvents: "none" }}
            >
              {/* Ellipse 19: Background Track (2.5px solid #222228 / var(--ds-surface-2)) */}
              <circle
                cx="58"
                cy="58"
                r={radius}
                className="stroke-[var(--ds-surface-2)]"
                strokeWidth="2.5"
                fill="none"
              />
              {/* Ellipse 20: Progress Fill (5px solid #EC6229 / var(--ds-accent)) */}
              <circle
                cx="58"
                cy="58"
                r={radius}
                className="stroke-[var(--ds-accent)] transition-all duration-500 ease-out"
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Frame 2609490: Inner Avatar Image */}
            <div
              onClick={handleAvatarClick}
              className={cn(
                "w-[76px] h-[76px] md:w-[102px] md:h-[102px] left-[6px] top-[6px] md:left-[7px] md:top-[7px] absolute rounded-full overflow-hidden flex flex-col justify-center items-center select-none bg-[var(--ds-surface-2)] z-10",
                displayAvatar && "cursor-pointer"
              )}
            >
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={userName || "Profile avatar"}
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <UserIcon className="w-10 h-10 text-[var(--ds-text-primary)] flex-none" size={40} />
              )}
            </div>

            {/* Frame 2609750: Percentage Badge */}
            <div
              className="w-[34px] md:w-[38px] h-[16px] md:h-[17.5px] px-0.5 left-1/2 -translate-x-1/2 top-[76px] md:top-[103.51px] absolute bg-[var(--ds-surface-1)] rounded-[99px] inline-flex justify-center items-center gap-1 md:gap-2.5 z-30 shadow-md pointer-events-none"
            >
              <span className="text-[var(--ds-text-primary)] text-[9px] md:text-[10px] font-medium font-['DM_Sans'] leading-[12px]">
                {completionPercentage}%
              </span>
            </div>
          </>
        ) : (
          /* Standalone Avatar Circle */
          <div
            onClick={handleAvatarClick}
            className={cn(
              "w-[88px] h-[88px] md:w-[116px] md:h-[116px] rounded-full overflow-hidden flex flex-col justify-center items-center select-none bg-[var(--ds-surface-2)]",
              displayAvatar && "cursor-pointer"
            )}
          >
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={userName || "Profile avatar"}
                className="w-full h-full object-cover rounded-full"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <UserIcon className="w-10 h-10 text-[var(--ds-text-primary)] flex-none" size={40} />
            )}
          </div>
        )}
      </div>

      {/* Mobile Quick Action Buttons (Own Profile) */}
      {isOwnProfile && (
        <div className="flex md:hidden items-center gap-2 absolute right-4 top-[150px] sm:top-[190px] z-20">
          {onEditProfile && (
            <button
              type="button"
              onClick={onEditProfile}
              aria-label="Edit profile"
              className="w-9 h-9 rounded-full bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex items-center justify-center text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <ProfileEditIcon size={16} className="w-4 h-4 text-[var(--ds-text-primary)]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="More options"
            className="w-9 h-9 rounded-full bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex items-center justify-center text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-2)] active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <MoreHorizontal className="w-4 h-4 text-[var(--ds-text-primary)]" />
          </button>
        </div>
      )}

      {/* Desktop Action Buttons: Frame 2609610 (right aligned, absolute right-0 bottom-0, h-[36px] gap-3) */}
      <div className={cn("absolute right-0 bottom-0 h-[36px] flex-row items-center justify-end gap-3 p-0 z-20", actionButtons !== undefined ? "flex" : "hidden md:flex")}>
        {actionButtons !== undefined ? (
          actionButtons
        ) : (
          <>
            {isOwnProfile && onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                className="w-[75px] h-[36px] px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] rounded-[100px] flex flex-row items-center justify-center gap-2.5 flex-none order-0 flex-grow-0 transition-all cursor-pointer border-none outline-none"
              >
                <span className="w-[51px] h-[24px] text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 text-center flex-none order-0 flex-grow-0 whitespace-nowrap select-none">
                  Edit all
                </span>
              </button>
            )}

            {onContactInfo && (
              <button
                type="button"
                onClick={onContactInfo}
                className="w-[118px] h-[36px] px-3 py-1.5 border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] rounded-[100px] flex flex-row items-center justify-center gap-2.5 flex-none order-1 flex-grow-0 transition-all cursor-pointer outline-none bg-transparent"
              >
                <span className="w-[94px] h-[24px] text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 text-center flex-none order-0 flex-grow-0 whitespace-nowrap select-none">
                  Contact info
                </span>
              </button>
            )}

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="w-[63px] h-[36px] px-3 py-1.5 border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] rounded-[100px] flex flex-row items-center justify-center gap-2.5 flex-none order-2 flex-grow-0 transition-all cursor-pointer outline-none bg-transparent"
                >
                  <span className="w-[39px] h-[24px] text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 text-center flex-none order-0 flex-grow-0 whitespace-nowrap select-none">
                    More
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="p-[12px] !bg-[var(--ds-bg)] !border !border-[var(--ds-border)] rounded-[16px] flex flex-col justify-start items-start gap-[16px] overflow-hidden shadow-2xl z-50 outline-none w-[135px] h-[82px] box-border"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuItem
                  onClick={handleDefaultShare}
                  className="!p-0 !m-0 justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none h-[20px] w-[82px] flex-none order-0 grow-0"
                >
                  Share profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDefaultDownload}
                  className="!p-0 !m-0 justify-start text-[var(--ds-text-secondary)] hover:!text-[var(--ds-text-primary)] focus:!text-[var(--ds-text-primary)] data-[highlighted]:!text-[var(--ds-text-primary)] hover:!bg-transparent focus:!bg-transparent data-[highlighted]:!bg-transparent text-[14px] font-normal font-['DM_Sans'] leading-[20px] cursor-pointer outline-none transition-colors border-none h-[20px] w-[109px] flex-none order-1 grow-0"
                >
                  Download profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Mobile 3-Dots Drawer for Own Profile */}
      {isOwnProfile && (
        <MobileProfileMenuDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          onContactInfo={() => onContactInfo?.()}
          onShareProfile={handleDefaultShare}
          onDownloadProfile={handleDefaultDownload}
          isProfileComplete={Number(completionPercentage) >= 100}
        />
      )}

      {/* Full screen view modal for profile photo or banner */}
      {mediaModal?.isOpen && (
        <ViewMediaModal
          isOpen={mediaModal.isOpen}
          onClose={() => setMediaModal(null)}
          mediaUrl={mediaModal.url}
          type={mediaModal.type}
          alt={mediaModal.type === "avatar" ? userName || "Profile photo" : "Banner"}
        />
      )}
    </div>
  );
};

export default ProfileCoverSection;
