/**
 * Calculates constrained display bounds for images following the core rendering rule:
 * "Free image ratio + constrained display area"
 * - Desktop maximum bounds: 442px width × 589px height
 * - Preserves original aspect ratio without distortion or forced cropping
 */

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export const MAX_MEDIA_WIDTH = 442;
export const MAX_MEDIA_HEIGHT = 589;
export const MIN_MEDIA_WIDTH = 320;
export const MIN_MEDIA_HEIGHT = 320;

export function calculateDisplayDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = MAX_MEDIA_WIDTH,
  maxHeight = MAX_MEDIA_HEIGHT,
  minWidth = MIN_MEDIA_WIDTH,
  minHeight = MIN_MEDIA_HEIGHT
): { width: number; height: number; aspectRatio: number } {
  if (!naturalWidth || !naturalHeight || naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: maxWidth, height: Math.round(maxWidth * (4 / 5)), aspectRatio: 5 / 4 };
  }

  let width = naturalWidth;
  let height = naturalHeight;

  // 1. SCALE DOWN if exceeding max bounds
  if (width > maxWidth || height > maxHeight) {
    const scale = Math.min(maxWidth / width, maxHeight / height);
    width *= scale;
    height *= scale;
  }
  // 2. SCALE UP if below min bounds
  else if (width < minWidth || height < minHeight) {
    const scaleToMin = Math.max(minWidth / width, minHeight / height);
    const maxAllowedScale = Math.min(maxWidth / width, maxHeight / height);
    const finalScale = Math.min(scaleToMin, maxAllowedScale);
    
    width *= finalScale;
    height *= finalScale;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
    aspectRatio: naturalWidth / naturalHeight,
  };
}

/**
 * Loads image natural dimensions from a file or URL asynchronously
 */
export function getImageDimensions(source: string | File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectUrl: string | null = null;

    img.onload = () => {
      const dimensions: ImageDimensions = {
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
        aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height),
      };
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    } else {
      img.src = source;
    }
  });
}

/**
 * Loads video natural dimensions from a file or URL asynchronously
 */
export function getVideoDimensions(source: string | File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    let objectUrl: string | null = null;

    video.onloadedmetadata = () => {
      const dimensions: ImageDimensions = {
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / (video.videoHeight || 1),
      };
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    video.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    if (source instanceof File) {
      objectUrl = URL.createObjectURL(source);
      video.src = objectUrl;
    } else {
      video.src = source;
    }
  });
}
