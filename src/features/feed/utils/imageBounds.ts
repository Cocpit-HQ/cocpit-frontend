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


export interface VideoMetadata {
  width: number;
  height: number;
  aspectRatio: number;
  duration: number;
  posterBlob?: Blob;
  posterUrl?: string;
}

/**
 * Loads video natural dimensions, duration, and extracts a poster frame thumbnail
 */
export function getVideoMetadataAndPoster(source: string | File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    let objectUrl: string | null = null;
    let isSettled = false;
    video.crossOrigin = 'anonymous';
    video.preload = 'auto';
    video.muted = true;
    (video as any).playsInline = true;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };

    // Safety timeout: never hang if browser decodes slowly or blocks canvas
    const timeoutId = setTimeout(() => {
      if (isSettled) return;
      isSettled = true;
      const duration = video.duration || 0;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      cleanup();
      resolve({
        width,
        height,
        aspectRatio: width / (height || 1),
        duration,
      });
    }, 3500);

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      const aspectRatio = width / (height || 1);

      // Seek to 0.5s (or halfway if duration < 0.5s) to capture a representative poster frame
      const seekTime = Math.min(0.5, duration / 2);
      try {
        video.currentTime = seekTime;
      } catch {
        // If currentTime assignment fails, capture immediately
        captureFrame();
      }

      function captureFrame() {
        if (isSettled) return;
        isSettled = true;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, width, height);
            canvas.toBlob((blob) => {
              const posterUrl = blob ? URL.createObjectURL(blob) : undefined;
              cleanup();
              resolve({
                width,
                height,
                aspectRatio,
                duration,
                posterBlob: blob || undefined,
                posterUrl,
              });
            }, 'image/jpeg', 0.85);
            return;
          }
        } catch (e) {
          console.warn('Canvas poster capture failed', e);
        }
        cleanup();
        resolve({
          width,
          height,
          aspectRatio,
          duration,
        });
      }

      video.onseeked = captureFrame;
    };

    video.onerror = (err) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
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
