type StoryLikeWithMedia = {
  media_url?: string | null;
  image?: string | null;
  thumbnail_url?: string | null;
  story_metadata?: unknown;
};

type StoryMetadataRecord = Record<string, unknown>;

export const JOB_STRUCTURED_DATA_PLACEHOLDER = "job-structured-data";

export function isValidStoryMediaUrl(url?: string | null): boolean {
  const candidate = (url || "").trim();
  if (!candidate) return false;
  if (candidate === JOB_STRUCTURED_DATA_PLACEHOLDER) return false;

  if (
    candidate.startsWith("blob:") ||
    candidate.startsWith("data:") ||
    candidate.startsWith("/") ||
    candidate.startsWith("./") ||
    candidate.startsWith("../")
  ) {
    return true;
  }

  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseStoryMetadata(storyMetadata: unknown): StoryMetadataRecord {
  if (!storyMetadata) return {};
  if (typeof storyMetadata === "string") {
    try {
      const parsed = JSON.parse(storyMetadata);
      return typeof parsed === "object" && parsed !== null ? parsed as StoryMetadataRecord : {};
    } catch {
      return {};
    }
  }
  if (typeof storyMetadata === "object") {
    return storyMetadata as StoryMetadataRecord;
  }
  return {};
}

function getMetadataString(metadata: StoryMetadataRecord, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

function getFirstValidStoryMediaUrl(...candidates: Array<string | null | undefined>): string | undefined {
  return candidates.find((candidate) => isValidStoryMediaUrl(candidate)) as string | undefined;
}

function isVideoAssetUrl(url?: string | null): boolean {
  if (!url) return false;
  const normalized = url.split("?")[0].toLowerCase();
  return normalized.endsWith(".mp4") || normalized.endsWith(".mov") || normalized.endsWith(".webm");
}

export function getStoryThumbnailUrl(story: StoryLikeWithMedia): string | undefined {
  const metadata = parseStoryMetadata(story.story_metadata);
  const directThumbnail = getFirstValidStoryMediaUrl(
    story.thumbnail_url,
    getMetadataString(metadata, "thumbnail_url"),
    getMetadataString(metadata, "logo"),
    getMetadataString(metadata, "company_logo"),
    getMetadataString(metadata, "avatar")
  );
  if (directThumbnail) return directThumbnail;

  // If story.image is set and is NOT a video URL, use it directly as a thumbnail
  if (isValidStoryMediaUrl(story.image) && !isVideoAssetUrl(story.image)) {
    return story.image!;
  }

  return undefined;
}

export function getStoryImageUrl(story: StoryLikeWithMedia): string | undefined {
  const metadata = parseStoryMetadata(story.story_metadata);
  return getFirstValidStoryMediaUrl(
    story.media_url,
    story.image,
    story.thumbnail_url,
    getMetadataString(metadata, "thumbnail_url"),
    getMetadataString(metadata, "logo")
  );
}

export function getStoryVideoUrl(story: StoryLikeWithMedia): string | undefined {
  return getFirstValidStoryMediaUrl(story.media_url, story.image);
}
