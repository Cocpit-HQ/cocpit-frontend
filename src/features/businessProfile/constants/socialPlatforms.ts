export interface SocialPlatformMeta {
  value: string;
  label: string;
  icon: string;
  placeholder?: string;
}

export const SOCIAL_PLATFORMS: SocialPlatformMeta[] = [
  { value: "instagram", label: "Instagram", icon: "ri:instagram-line", placeholder: "www.instagram.com" },
  { value: "website", label: "Website", icon: "ri:global-line", placeholder: "www.example.com" },
  { value: "x", label: "X", icon: "ri:twitter-x-fill", placeholder: "www.x.com" },
  { value: "youtube", label: "YouTube", icon: "ri:youtube-fill", placeholder: "www.youtube.com" },
  { value: "discord", label: "Discord", icon: "ic:baseline-discord", placeholder: "www.discord.com" },
  { value: "facebook", label: "Facebook", icon: "ri:facebook-fill", placeholder: "www.facebook.com" },
  { value: "linkedin", label: "LinkedIn", icon: "mdi:linkedin", placeholder: "www.linkedin.com" },
  { value: "github", label: "GitHub", icon: "mdi:github", placeholder: "www.github.com" },
  { value: "cocpit", label: "Cocpit", icon: "ri:global-line", placeholder: "www.cocpit.in" },
];

export const DEFAULT_SOCIAL_PLATFORM_ICON = "ri:global-line";

/**
 * Direct platform lookup based on the exact platform name from backend/UI.
 */
export function getSocialPlatformMeta(platform?: string | null): SocialPlatformMeta {
  const p = (platform || "").toLowerCase().trim();
  const normalized = p === "twitter" ? "x" : p;
  const matched = SOCIAL_PLATFORMS.find((m) => m.value === normalized);
  if (matched) return matched;

  return {
    value: normalized || "website",
    label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Website",
    icon: DEFAULT_SOCIAL_PLATFORM_ICON,
    placeholder: "www.example.com",
  };
}

export function getSocialPlatformPlaceholder(platform?: string | null): string {
  return getSocialPlatformMeta(platform).placeholder || "www.example.com";
}
