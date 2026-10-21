import api from "@/lib/axios";

// ─────────────────────────────────────────────────────────────────────────────
// Cocpit Scalable Upload Service
// Dual-Asset Architecture: Direct-to-R2 presigned PUT + 12-bit AVIF processing
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadedAsset {
  url: string;         // Active display URL (12-bit AVIF for images, raw for video)
  master_url: string;  // 100% untouched original master
  media_type: "image" | "video";
  width?: number | null;
  height?: number | null;
  format?: string;
  bit_depth?: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// R2 Direct Upload (New Flow)
// 1. Request presigned PUT URL from backend (<10ms, zero file bytes sent to server)
// 2. PUT file directly to Cloudflare R2 (raw master preserved 100% untouched)
// 3. Notify backend to run 12-bit AVIF transcoding → returns display URL
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a single file via presigned PUT directly to Cloudflare R2.
 * The backend never receives the raw file bytes.
 *
 * @param file     - Raw File object from the user's input
 * @param folder   - R2 folder prefix (default: "posts")
 * @param onProgress - Optional progress callback (0–100)
 * @returns Processed asset with display URL + master URL
 */
async function uploadFileToR2(
  file: File,
  folder = "posts",
  onProgress?: (pct: number) => void
): Promise<UploadedAsset> {
  // Step 1: Request presigned upload ticket from backend
  const { data: ticket } = await api.post("/upload/presign", {
    filename: file.name,
    contentType: file.type,
    folder,
  });

  onProgress?.(10);

  // Step 2: PUT file DIRECTLY to R2 (100% raw, untouched bytes)
  // This never goes through Express – goes straight to Cloudflare's servers
  const uploadRes = await fetch(ticket.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadRes.ok) {
    throw new Error(
      `[uploadMedia] Direct R2 PUT failed: HTTP ${uploadRes.status} — ${await uploadRes.text()}`
    );
  }

  onProgress?.(70);

  // Step 3: Notify backend → triggers 12-bit AVIF transcode → returns display URL
  const mediaType = file.type.startsWith("video") ? "video" : "image";
  const { data: processed } = await api.post("/upload/process", {
    rawKey: ticket.rawKey,
    rawMasterUrl: ticket.rawMasterUrl,
    mediaType,
  });

  onProgress?.(100);

  console.log(`[uploadMedia] ✅ Dual-asset complete → display: ${processed.url} | master: ${processed.master_url}`);

  return {
    url: processed.url,             // 12-bit AVIF display variant (or raw video)
    master_url: processed.master_url, // 100% original master
    media_type: processed.media_type,
    width: processed.width,
    height: processed.height,
    format: processed.format,
    bit_depth: processed.bit_depth,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy Cloudinary Upload (Fallback when R2 is not configured)
// Used only in local dev without R2 env vars set.
// ─────────────────────────────────────────────────────────────────────────────

async function uploadBatchLegacy(batch: File[], maxRetries = 2, delayMs = 1000): Promise<any[]> {
  let attempt = 0;
  while (true) {
    try {
      const formData = new FormData();
      batch.forEach(file => formData.append("files", file));
      const { data } = await api.post("/upload", formData);
      return data?.urls || [];
    } catch (error: any) {
      attempt++;
      if (attempt > maxRetries) {
        console.error(`[uploadMedia:legacy] Batch of ${batch.length} files failed after ${attempt} attempts:`, error);
        throw error;
      }
      console.warn(`[uploadMedia:legacy] Attempt ${attempt}/${maxRetries + 1} failed. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export: uploadMedia
// Automatically selects R2 flow (presigned) or legacy (multipart Cloudinary)
// based on backend availability.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload media files using the Dual-Asset R2 architecture.
 * Falls back to legacy Cloudinary upload if R2 presign endpoint returns 503.
 *
 * @param files - Array of File objects to upload
 * @returns Array of uploaded asset descriptors with display + master URLs
 */
export async function uploadMedia(files: File[]): Promise<UploadedAsset[]> {
  if (!files || files.length === 0) return [];

  console.log(
    "[uploadMedia] Starting upload for",
    files.length,
    "files:",
    files.map(f => ({ name: f.name, type: f.type, size: `${(f.size / 1024 / 1024).toFixed(2)}MB` }))
  );

  // Try R2 presigned flow first
  try {
    const results: UploadedAsset[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`[uploadMedia] Processing file ${i + 1}/${files.length}: ${file.name}`);
      const asset = await uploadFileToR2(file, "posts");
      results.push(asset);
    }
    console.log("[uploadMedia] ✅ All files uploaded via R2:", results.length, "assets");
    return results;
  } catch (error: any) {
    // If backend returns 503 (R2 not configured), fall back to legacy Cloudinary upload
    if (error?.response?.status === 503 || error?.response?.data?.error === "R2 not configured") {
      console.warn("[uploadMedia] R2 not configured on server – falling back to legacy Cloudinary upload.");
      const allUrls: any[] = [];
      for (let i = 0; i < files.length; i += 12) {
        const batch = files.slice(i, i + 12);
        const batchUrls = await uploadBatchLegacy(batch);
        allUrls.push(...batchUrls);
      }
      console.log("[uploadMedia] ✅ Legacy Cloudinary upload complete:", allUrls.length, "urls");
      return allUrls;
    }

    // Re-throw any other error
    console.error("[uploadMedia] Upload failed:", {
      message: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    throw error;
  }
}
