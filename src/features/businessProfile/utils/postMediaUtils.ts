/**
 * Utilities for extracting media and formatting data for business profile posts.
 */

export function formatCount(num: number | string | undefined): string {
  const n = typeof num === "string" ? parseInt(num, 10) || 0 : num || 0;
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

export const isVideoPost = (p: any): boolean => {
  if (!p) return false;
  if (p.videoUrl || p.videoSrc || p.video_url) return true;
  if (Array.isArray(p.media)) {
    return p.media.some(
      (m: any) =>
        m?.media_type === "video" ||
        m?.type === "video" ||
        (typeof m === "string" && m.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/i)) ||
        (m?.url && m.url.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/i))
    );
  }
  return false;
};

export const extractVideoUrl = (p: any): string | undefined => {
  if (!p) return undefined;
  if (p.videoUrl && typeof p.videoUrl === "string" && p.videoUrl.trim() !== "") return p.videoUrl;
  if (p.videoSrc && typeof p.videoSrc === "string" && p.videoSrc.trim() !== "") return p.videoSrc;
  if (p.video_url && typeof p.video_url === "string" && p.video_url.trim() !== "") return p.video_url;
  if (Array.isArray(p.media)) {
    const v = p.media.find(
      (m: any) =>
        m?.media_type === "video" ||
        m?.type === "video" ||
        (typeof m === "string" && m.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/i)) ||
        (m?.url && m.url.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/i))
    );
    if (typeof v === "string") return v;
    if (v?.url) return v.url;
  }
  return undefined;
};

export const extractImageUrl = (p: any): string | undefined => {
  if (!p || isVideoPost(p)) return undefined;
  if (p.image_url && typeof p.image_url === "string" && p.image_url.trim() !== "") return p.image_url;
  if (p.imageUrl && typeof p.imageUrl === "string" && p.imageUrl.trim() !== "") return p.imageUrl;
  if (p.imageSrc && typeof p.imageSrc === "string" && p.imageSrc.trim() !== "") return p.imageSrc;
  if (Array.isArray(p.images) && p.images.length > 0 && typeof p.images[0] === "string" && p.images[0].trim() !== "") {
    return p.images[0];
  }
  if (Array.isArray(p.media) && p.media.length > 0) {
    const imgMedia = p.media.find(
      (m: any) =>
        (m?.type === "image" || m?.media_type === "image" || (!m?.media_type && !m?.type && m?.url && !m.url.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/i))) &&
        Boolean(m?.url && m.url.trim() !== "")
    );
    if (imgMedia?.url) return imgMedia.url;
    if (typeof p.media[0] === "string" && !p.media[0].match(/\.(mp4|webm|mov|m4v)(\?|#|$)/i)) return p.media[0];
    if (p.media[0]?.url && !p.media[0].url.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/i)) return p.media[0].url;
  }
  return undefined;
};

export const isMediaPost = (p: any): boolean => Boolean(extractImageUrl(p) || extractVideoUrl(p));
