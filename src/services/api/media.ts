import api from "@/lib/axios";

export interface UploadedMedia {
  url: string;
  media_type: 'image' | 'video';
}

export const uploadMedia = async (files: File[]): Promise<UploadedMedia[]> => {
  const formData = new FormData();

  files.forEach(file => {
    formData.append("files", file);
  });

  try {
    console.log("[uploadMedia] Sending files to backend:", files.map(f => ({ name: f.name, type: f.type, size: f.size })));
    
    // Omit manual Content-Type so browser calculates boundary
    const { data } = await api.post<{ urls: UploadedMedia[] }>("/upload", formData);

    console.log("[uploadMedia] Upload success:", data);
    return data.urls;
  } catch (error: any) {
    console.error("[uploadMedia] Upload API call failed:", {
      message: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
    });
    throw error;
  }
};
