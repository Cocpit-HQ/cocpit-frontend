import type { ImageVariantSet } from '@/types/entities';

export const FEED_IMAGE_SIZES = '(max-width: 640px) 100vw, 442px';

export function imageSrcSet(variants: ImageVariantSet | null | undefined, format: 'fallback' | 'avif'): string | undefined {
  const entries = variants?.[format]
    ?.filter((item) => Number.isInteger(item.width) && item.width > 0 && typeof item.url === 'string' && item.url.length > 0)
    .sort((a, b) => a.width - b.width);
  return entries?.length ? entries.map((item) => `${item.url} ${item.width}w`).join(', ') : undefined;
}
