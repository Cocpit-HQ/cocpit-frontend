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
const MAX_BOUNDS_RATIO = MAX_MEDIA_WIDTH / MAX_MEDIA_HEIGHT; // ~0.7504 (approx 3:4)

export function calculateDisplayDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxWidth = MAX_MEDIA_WIDTH,
  maxHeight = MAX_MEDIA_HEIGHT
): { width: number; height: number; aspectRatio: number } {
  if (!naturalWidth || !naturalHeight || naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: maxWidth, height: Math.round(maxWidth * (4 / 5)), aspectRatio: 5 / 4 };
  }

  const aspectRatio = naturalWidth / naturalHeight;
  const boundsRatio = maxWidth / maxHeight;

  let width: number;
  let height: number;

  if (aspectRatio >= boundsRatio) {
    // Width-constrained: wider than or equal to 3:4 (e.g. 16:9, 1:1, 4:5, 3:4)
    width = maxWidth;
    height = Math.round(maxWidth / aspectRatio);
  } else {
    // Height-constrained: taller than 3:4 (e.g. 1:2 portrait)
    height = maxHeight;
    width = Math.round(maxHeight * aspectRatio);
  }

  return {
    width: Math.min(width, maxWidth),
    height: Math.min(height, maxHeight),
    aspectRatio,
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
