import api from "@/lib/axios";

// Helper function to upload a batch of up to 12 files with automated retry
async function uploadBatchWithRetry(batch: File[], maxRetries = 2, delayMs = 1000): Promise<any[]> {
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
        console.error(`[uploadMedia] Batch of ${batch.length} files failed after ${attempt} attempts:`, error);
        throw error;
      }
      console.warn(`[uploadMedia] Batch upload failed (attempt ${attempt}/${maxRetries + 1}). Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

export async function uploadMedia(files: File[]) {
  if (!files || files.length === 0) return [];

  try {
    console.log("[uploadMedia] Sending files to backend:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // Backend multer route has upload.array("files", 12) limit.
    // Chunk all files into batches of at most 12 files (allows up to 12 carousel images in a single request).
    const allUrls: any[] = [];
    for (let i = 0; i < files.length; i += 12) {
      const batch = files.slice(i, i + 12);
      const batchUrls = await uploadBatchWithRetry(batch);
      allUrls.push(...batchUrls);
    }

    console.log("[uploadMedia] All batches uploaded successfully:", allUrls.length, "urls");
    return allUrls;
  } catch (error: any) {
    console.error("[uploadMedia] Upload API call failed:", {
      message: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    throw error;
  }
}
