export interface SocialPlatformMeta {
  value: string;
  label: string;
  icon: string;
  placeholder?: string;
}

// Keep in sync with backend VALID_PLATFORMS
export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  { value: "instagram", label: "Instagram", icon: "ri:instagram-line", placeholder: "www.instagram.com" },
  { value: "website", label: "Website", icon: "ri:global-line", placeholder: "www.example.com" },
  { value: "x", label: "X", icon: "ri:twitter-x-fill", placeholder: "www.x.com" },
  { value: "twitter", label: "Twitter", icon: "ri:twitter-x-fill", placeholder: "www.x.com" },
  { value: "youtube", label: "YouTube", icon: "ri:youtube-fill", placeholder: "www.youtube.com" },
  { value: "discord", label: "Discord", icon: "ic:baseline-discord", placeholder: "www.discord.com" },
  { value: "facebook", label: "Facebook", icon: "ri:facebook-fill", placeholder: "www.facebook.com" },
  { value: "linkedin", label: "LinkedIn", icon: "mdi:linkedin", placeholder: "www.linkedin.com" },
  { value: "github", label: "GitHub", icon: "mdi:github", placeholder: "www.github.com" },
  { value: "cocpit", label: "Cocpit", icon: "ri:global-line", placeholder: "www.cocpit.com" },
];

export const DEFAULT_SOCIAL_PLATFORM_ICON = "ri:global-line";

export function getSocialPlatformMeta(platform?: string | null): SocialPlatformMeta | undefined {
  const value = (platform || "").toLowerCase();
  if (value === "x" || value === "twitter") {
    return { value: "x", label: "X", icon: "ri:twitter-x-fill", placeholder: "www.x.com" };
  }
  return SOCIAL_PLATFORMS.find((p) => p.value === value);
}

export function getSocialPlatformPlaceholder(platform?: string | null): string {
  const meta = getSocialPlatformMeta(platform);
  return meta?.placeholder || "www.example.com";
}

