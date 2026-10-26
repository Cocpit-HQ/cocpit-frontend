import api from "@/lib/axios";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_POST_IMAGE_BYTES = 100 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_MEDIA_COUNT = 12;

const imageMimeByExtension: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg", png: "image/png",
  webp: "image/webp", avif: "image/avif", heic: "image/heic", heif: "image/heif",
};
const videoMimeByExtension: Record<string, string> = { mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };

export interface UploadedAsset {
  url: string;
  master_url: string;
  media_type: "image" | "video";
  processing_status?: "processing" | "ready" | "failed";
  fallback_url?: string | null;
  avif_url?: string | null;
  jobId?: string;
  width?: number | null;
  height?: number | null;
  format?: string;
  bit_depth?: number | null;
}

interface UploadTicket {
  uploadUrl: string;
  rawKey: string;
  rawMasterUrl: string;
  filename: string;
  contentType: string;
}

interface MultipartUploadResponse { urls?: UploadedAsset[] }

function getUploadType(file: File): { contentType: string; mediaType: "image" | "video" } {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const imageMime = imageMimeByExtension[extension];
  const videoMime = videoMimeByExtension[extension];
  if (imageMime) return { contentType: imageMime, mediaType: "image" };
  if (videoMime) return { contentType: videoMime, mediaType: "video" };
  throw new Error(`${file.name} is not a supported image or video. Supported images: JPEG, PNG, WebP, AVIF, HEIC, HEIF.`);
}

function validateBatch(files: File[]): Array<{ contentType: string; mediaType: "image" | "video" }> {
  if (!files.length || files.length > MAX_MEDIA_COUNT) throw new Error(`Choose between 1 and ${MAX_MEDIA_COUNT} media files.`);
  let imageBytes = 0;
  const types = files.map(getUploadType);
  files.forEach((file, index) => {
    if (types[index].mediaType === "image") {
      if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name} exceeds the 10 MB image limit.`);
      imageBytes += file.size;
    } else if (file.size > MAX_VIDEO_BYTES) {
      throw new Error(`${file.name} exceeds the 100 MB video limit.`);
    }
  });
  if (imageBytes > MAX_POST_IMAGE_BYTES) throw new Error("Images in a post may not exceed 100 MB total.");
  return types;
}

async function uploadBatchMultipart(files: File[], syncProcessing: boolean): Promise<UploadedAsset[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const { data } = await api.post<MultipartUploadResponse>("/upload", formData, { params: syncProcessing ? { sync: "true" } : undefined });
  return data?.urls || [];
}

/** Upload originals directly to R2, then return immediately while the worker builds display variants. */
export async function uploadMedia(files: File[], options: { syncProcessing?: boolean } = {}): Promise<UploadedAsset[]> {
  if (!files?.length) return [];
  const types = validateBatch(files);
  let tickets: UploadTicket[];

  try {
    const { data } = await api.post<{ uploads: UploadTicket[] }>("/upload/presign-batch", {
      files: files.map((file, index) => ({ filename: file.name, size: file.size, contentType: types[index].contentType })),
    });
    tickets = data.uploads;
  } catch {
    // Older/local deployments may not expose batch presigning yet. Multipart uses the same worker queue.
    return uploadBatchMultipart(files, Boolean(options.syncProcessing));
  }

  if (!tickets || tickets.length !== files.length) throw new Error("The server returned an incomplete upload batch.");
  await Promise.all(tickets.map(async (ticket, index) => {
    const file = files[index];
    const response = await fetch(ticket.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": ticket.contentType } });
    if (!response.ok) throw new Error(`Upload failed for ${file.name} (HTTP ${response.status}).`);
  }));

  return Promise.all(tickets.map(async (ticket, index) => {
    const { data } = await api.post<UploadedAsset>("/upload/process", {
      rawKey: ticket.rawKey,
      rawMasterUrl: ticket.rawMasterUrl,
      mediaType: types[index].mediaType,
      size: files[index].size,
      sync: Boolean(options.syncProcessing),
    });
    return data;
  }));
}
