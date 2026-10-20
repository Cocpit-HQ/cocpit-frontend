export interface SocialLinkValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateSocialLinkUrl(
  platform: string | undefined | null,
  url: string | undefined | null
): SocialLinkValidationResult {
  const trimmed = (url || "").trim();
  if (!trimmed) {
    return { isValid: true };
  }

  // Prepend https:// if protocol is missing for URL parser
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    return {
      isValid: false,
      error: "Please enter a valid URL.",
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const p = (platform || "website").toLowerCase().trim();
  const normalizedPlatform = p === "twitter" ? "x" : p;

  switch (normalizedPlatform) {
    case "instagram": {
      const isInstagram =
        hostname === "instagram.com" ||
        hostname.endsWith(".instagram.com") ||
        hostname === "instagr.am" ||
        hostname.endsWith(".instagr.am");
      if (!isInstagram) {
        return {
          isValid: false,
          error: "Please enter a valid Instagram URL",
        };
      }
      return { isValid: true };
    }

    case "x": {
      const isX =
        hostname === "x.com" ||
        hostname.endsWith(".x.com") ||
        hostname === "twitter.com" ||
        hostname.endsWith(".twitter.com");
      if (!isX) {
        return {
          isValid: false,
          error: "Please enter a valid X (Twitter) URL",
        };
      }
      return { isValid: true };
    }

    case "facebook": {
      const isFb =
        hostname === "facebook.com" ||
        hostname.endsWith(".facebook.com") ||
        hostname === "fb.com" ||
        hostname.endsWith(".fb.com") ||
        hostname === "fb.me" ||
        hostname.endsWith(".fb.me");
      if (!isFb) {
        return {
          isValid: false,
          error: "Please enter a valid Facebook URL",
        };
      }
      return { isValid: true };
    }

    case "youtube": {
      const isYt =
        hostname === "youtube.com" ||
        hostname.endsWith(".youtube.com") ||
        hostname === "youtu.be" ||
        hostname.endsWith(".youtu.be");
      if (!isYt) {
        return {
          isValid: false,
          error: "Please enter a valid YouTube URL",
        };
      }
      return { isValid: true };
    }

    case "discord": {
      const isDiscord =
        hostname === "discord.com" ||
        hostname.endsWith(".discord.com") ||
        hostname === "discord.gg" ||
        hostname.endsWith(".discord.gg") ||
        hostname === "discordapp.com" ||
        hostname.endsWith(".discordapp.com");
      if (!isDiscord) {
        return {
          isValid: false,
          error: "Please enter a valid Discord invite URL",
        };
      }
      return { isValid: true };
    }

    case "cocpit": {
      const isCocpit =
        hostname === "cocpit.in" ||
        hostname.endsWith(".cocpit.in") ||
        hostname === "localhost";
      if (!isCocpit) {
        return {
          isValid: false,
          error: "Please enter a valid Cocpit URL",
        };
      }
      return { isValid: true };
    }

    case "linkedin": {
      const isLinkedin =
        hostname === "linkedin.com" ||
        hostname.endsWith(".linkedin.com");
      if (!isLinkedin) {
        return {
          isValid: false,
          error: "Please enter a valid LinkedIn URL",
        };
      }
      return { isValid: true };
    }

    case "github": {
      const isGithub =
        hostname === "github.com" ||
        hostname.endsWith(".github.com");
      if (!isGithub) {
        return {
          isValid: false,
          error: "Please enter a valid GitHub URL",
        };
      }
      return { isValid: true };
    }

    case "website":
    default: {
      if (!hostname.includes(".")) {
        return {
          isValid: false,
          error: "Please enter a valid website URL",
        };
      }
      return { isValid: true };
    }
  }
}
