// Preview URLs are scoped to this browser tab. They survive a feed refetch while
// processing but never leave the device or enter the API payload.
const previews = new Map<string, { url: string; timeout: ReturnType<typeof setTimeout> }>();
const MAX_PREVIEWS = 24;
const PREVIEW_TTL_MS = 20 * 60 * 1000;

export function rememberLocalMediaPreview(masterUrl: string, file: File): string {
  const old = previews.get(masterUrl);
  if (old) {
    clearTimeout(old.timeout);
    URL.revokeObjectURL(old.url);
  }
  while (previews.size >= MAX_PREVIEWS) {
    const oldest = previews.keys().next().value;
    if (!oldest) break;
    forgetLocalMediaPreview(oldest);
  }
  const url = URL.createObjectURL(file);
  const timeout = setTimeout(() => forgetLocalMediaPreview(masterUrl), PREVIEW_TTL_MS);
  previews.set(masterUrl, { url, timeout });
  return url;
}

export function getLocalMediaPreview(masterUrl?: string | null): string | undefined {
  return masterUrl ? previews.get(masterUrl)?.url : undefined;
}

export function forgetLocalMediaPreview(masterUrl: string): void {
  const preview = previews.get(masterUrl);
  if (!preview) return;
  clearTimeout(preview.timeout);
  URL.revokeObjectURL(preview.url);
  previews.delete(masterUrl);
}
