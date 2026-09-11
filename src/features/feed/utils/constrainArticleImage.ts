/**
 * Article media bounding-box constraint.
 *
 * Display inline article images at their natural size, but constrain them to
 * a maximum bounding box of 688 × 500 px.  If either width or height exceeds
 * the limit, scale the image down proportionally until it fits.
 * Never upscale smaller images, crop, or distort — preserve original aspect ratio.
 *
 * Examples:
 *   400 × 300   → 400 × 300   (within limits)
 *  1200 × 800   → 688 × 459   (width-limited)
 *   800 × 1200  → 333 × 500   (height-limited)
 *  2000 × 2000  → 500 × 500   (both exceed, height-limited)
 */

export const ARTICLE_IMG_MAX_W = 688;
export const ARTICLE_IMG_MAX_H = 500;

/**
 * Given an image's natural dimensions, return the display dimensions
 * constrained to a 688×500 bounding box.  Preserves aspect ratio.
 * Never upscales smaller images.
 */
export const constrainImageToBox = (
  naturalW: number,
  naturalH: number
): { width: number; height: number } => {
  // Invalid / zero dimensions → fall back to max width, auto height
  if (!naturalW || !naturalH || naturalW <= 0 || naturalH <= 0) {
    return { width: ARTICLE_IMG_MAX_W, height: ARTICLE_IMG_MAX_H };
  }

  // If both dimensions are within limits, keep natural size (no upscale)
  if (naturalW <= ARTICLE_IMG_MAX_W && naturalH <= ARTICLE_IMG_MAX_H) {
    return { width: naturalW, height: naturalH };
  }

  // Scale down proportionally to fit inside the bounding box
  const scale = Math.min(
    ARTICLE_IMG_MAX_W / naturalW,
    ARTICLE_IMG_MAX_H / naturalH
  );

  return {
    width: Math.round(naturalW * scale),
    height: Math.round(naturalH * scale),
  };
};
