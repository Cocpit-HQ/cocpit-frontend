export interface SocialPlatformMeta {
  value: string;
  label: string;
  icon: string;
}

// Keep in sync with backend VALID_PLATFORMS
export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  { value: "instagram", label: "Instagram", icon: "ri:instagram-line" },
  { value: "x", label: "X", icon: "ri:twitter-x-fill" },
  { value: "twitter", label: "Twitter", icon: "ri:twitter-x-fill" },
  { value: "youtube", label: "YouTube", icon: "ri:youtube-fill" },
  { value: "discord", label: "Discord", icon: "ic:baseline-discord" },
  { value: "facebook", label: "Facebook", icon: "ri:facebook-fill" },
  { value: "linkedin", label: "LinkedIn", icon: "mdi:linkedin" },
  { value: "github", label: "GitHub", icon: "mdi:github" },
];

export const DEFAULT_SOCIAL_PLATFORM_ICON = "mdi:link-variant";

export function getSocialPlatformMeta(platform?: string | null): SocialPlatformMeta | undefined {
  const value = (platform || "").toLowerCase();
  if (value === "x" || value === "twitter") {
    return { value: "x", label: "X", icon: "ri:twitter-x-fill" };
  }
  return SOCIAL_PLATFORMS.find((p) => p.value === value);
}
