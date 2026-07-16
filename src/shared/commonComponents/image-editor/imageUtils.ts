export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

const DEFAULT_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const DEFAULT_MAX_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Validates file size and file type constraints.
 */
export function validateImageFile(
  file: File,
  allowedTypes: string[] = DEFAULT_ALLOWED_TYPES,
  maxSize: number = DEFAULT_MAX_SIZE
): ImageValidationResult {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload a supported image.",
    };
  }

  if (file.size > maxSize) {
    const sizeInMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File size exceeds ${sizeInMB}MB.`,
    };
  }

  return { isValid: true };
}

export interface ProcessImageOptions {
  sourceUrl: string;
  zoom: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  positionX: number;
  positionY: number;
  previewSizeWidth: number; // offsetWidth of container
  canvasWidth: number;      // target width, e.g., 800
  canvasHeight: number;     // target height, e.g., 800 or 480
  quality?: number;         // e.g., 0.95 or 0.9
  outputType?: "dataUrl" | "blob";
}

/**
 * Processes the source image URL on a high-resolution canvas applying all rotations, zooms, flips, and positioning.
 * Returns either a dataUrl string or a Blob.
 */
export async function processImageWithTransforms(
  options: ProcessImageOptions
): Promise<string | Blob> {
  const {
    sourceUrl,
    zoom,
    rotation,
    flipH,
    flipV,
    positionX,
    positionY,
    previewSizeWidth,
    canvasWidth,
    canvasHeight,
    quality = 0.95,
    outputType = "dataUrl",
  } = options;

  const img = new Image();
  img.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = sourceUrl;
  });

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.save();

  // Move origin to center for transformations
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

  const imgAspect = img.width / img.height;
  const canvasAspect = canvasWidth / canvasHeight;
  let drawWidth: number;
  let drawHeight: number;

  if (imgAspect > canvasAspect) {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgAspect;
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgAspect;
  }

  const zoomScale = 1 + zoom / 100;
  drawWidth *= zoomScale;
  drawHeight *= zoomScale;

  // Apply position offset scaled to canvas resolution
  const scaleRatio = canvasWidth / previewSizeWidth;
  const canvasPosX = positionX * scaleRatio;
  const canvasPosY = positionY * scaleRatio;

  ctx.drawImage(
    img,
    -drawWidth / 2 + canvasPosX,
    -drawHeight / 2 + canvasPosY,
    drawWidth,
    drawHeight
  );
  ctx.restore();

  if (outputType === "blob") {
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas toBlob failed"));
          }
        },
        "image/jpeg",
        quality
      );
    });
  } else {
    return canvas.toDataURL("image/jpeg", quality);
  }
}
