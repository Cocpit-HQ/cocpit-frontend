export interface SocialPlatformMeta {
  value: string;
  label: string;
  icon: string;
}

// Keep in sync with the backend's VALID_PLATFORMS
// (cocpit-backend/src/modules/organization/organization.profile.controller.js)
export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  { value: "instagram", label: "Instagram", icon: "ri:instagram-line" },
  { value: "twitter", label: "Twitter", icon: "codicon:twitter" },
  { value: "youtube", label: "You tube", icon: "iconoir:youtube" },
  { value: "discord", label: "Discord", icon: "iconoir:discord" },
  { value: "facebook", label: "Facebook", icon: "circum:facebook" },
  { value: "linkedin", label: "LinkedIn", icon: "mdi:linkedin" },
  { value: "github", label: "GitHub", icon: "mdi:github" },
];

export const DEFAULT_SOCIAL_PLATFORM_ICON = "mdi:link-variant";

export function getSocialPlatformMeta(platform?: string | null): SocialPlatformMeta | undefined {
  const value = (platform || "").toLowerCase();
  return SOCIAL_PLATFORMS.find((p) => p.value === value);
}
