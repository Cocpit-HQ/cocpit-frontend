"use client";

import React, { useState, useEffect } from "react";
import { avatarGradients } from "@/constants/messaging";
import { UserIcon, BusinessBuildingIcon } from "@/components/icons";

export interface AvatarProps {
  url?: string | null;
  src?: string | null;
  name?: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  imgClassName?: string;
  iconClassName?: string;
  isCompany?: boolean;
  isOrganization?: boolean;
  online?: boolean;
  showOnlineStatus?: boolean;
  fallbackGradient?: string;
  isUnknown?: boolean;
  fallbackIcon?: React.ReactNode;
}


const STATIC_GRADIENT_CLASSES: Record<string, string> = {
  "gradient-1": "bg-gradient-to-br from-blue-400 to-cyan-400 text-white",
  "gradient-2": "bg-gradient-to-br from-pink-400 to-rose-400 text-white",
  "gradient-3": "bg-gradient-to-br from-purple-400 to-indigo-400 text-white",
  "gradient-4": "bg-gradient-to-br from-green-400 to-emerald-400 text-white",
  "gradient-5": "bg-gradient-to-br from-orange-400 to-amber-400 text-white",
};

export const getAvatarGradient = (avatar: string) => {
  return avatarGradients[avatar] || "from-gray-400 to-gray-500";
};

export default function Avatar({
  url,
  src,
  name = "User",
  alt,
  size,
  className = "",
  imgClassName = "",
  iconClassName = "",
  isCompany = false,
  isOrganization = false,
  online,
  showOnlineStatus = false,
  fallbackGradient = "gradient-1",
  isUnknown = false,
  fallbackIcon,
}: AvatarProps) {
  const [error, setError] = useState(false);

  const rawUrl = src !== undefined ? src : url;

  useEffect(() => {
    setError(false);
  }, [rawUrl]);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-[20px]",
    lg: "w-12 h-12 text-lg",
    xl: "w-16 h-16 text-2xl",
  };

  const companyRoundedClasses = {
    xs: "rounded-[6px]",
    sm: "rounded-[8px]",
    md: "rounded-[10px]",
    lg: "rounded-[12px]",
    xl: "rounded-[16px]",
  };

  const indicatorSize = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const isOrg = Boolean(isCompany || isOrganization);
  const roundedClass = isOrg
    ? (size && companyRoundedClasses[size]) || "rounded-[8px]"
    : "rounded-full";

  const hasExplicitSize = /(?:^|\s)(?:(?:[a-z]{2}:)?(?:size-|w-\d|h-\d|w-\[|h-\[))/.test(className);
  const effectiveSize = size || (hasExplicitSize ? undefined : "md");
  const sizeClass = effectiveSize ? sizeClasses[effectiveSize] : "";

  const isGradient = Boolean(rawUrl && rawUrl.startsWith("gradient-"));
  const isValidUrl = Boolean(
    rawUrl &&
      rawUrl !== "/assets/pngegg.png" &&
      rawUrl !== "/images/companyonboarding/companyprofileDefault.jpg" &&
      !isGradient &&
      !error
  );

  const backgroundClass = isUnknown
    ? "bg-transparent"
    : isValidUrl
    ? "bg-ds-surface-2"
    : isGradient
    ? (STATIC_GRADIENT_CLASSES[rawUrl!] || STATIC_GRADIENT_CLASSES[fallbackGradient] || "bg-gradient-to-br from-blue-400 to-cyan-400 text-white")
    : "bg-ds-surface-2 border border-ds-border text-ds-text-primary";

  const effectiveIndicatorSize = effectiveSize ? indicatorSize[effectiveSize] : "w-2.5 h-2.5";

  return (
    <div className={`relative shrink-0 flex-none aspect-square select-none ${sizeClass} ${className}`}>
      <div
        className={`relative w-full h-full aspect-square ${roundedClass} overflow-hidden flex-shrink-0 ${backgroundClass} flex items-center justify-center select-none`}
      >
        {isValidUrl ? (
          <img
            src={rawUrl!}
            alt={alt || name || "Avatar"}
            className={`w-full h-full object-cover aspect-square ${roundedClass} ${imgClassName}`}
            onError={() => setError(true)}
          />
        ) : fallbackIcon ? (
          fallbackIcon
        ) : isOrg ? (
          <BusinessBuildingIcon
            className={`w-[65%] h-[65%] text-ds-text-primary shrink-0 ${iconClassName}`}
          />
        ) : isGradient ? (
          <span className="font-semibold text-white text-xs sm:text-sm select-none">
            {name?.charAt(0)?.toUpperCase() || "U"}
          </span>
        ) : (
          <UserIcon
            className={`w-[65%] h-[65%] text-ds-text-primary shrink-0 ${iconClassName}`}
          />
        )}
      </div>

      {online && showOnlineStatus && (
        <div
          className={`absolute bottom-0 right-0 ${effectiveIndicatorSize} bg-green-500 rounded-full border-2 border-background z-10`}
        />
      )}
    </div>
  );
}

export { Avatar, Avatar as AppAvatar };
