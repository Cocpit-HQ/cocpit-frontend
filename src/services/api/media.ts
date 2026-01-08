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

  const { data } = await api.post<{ urls: UploadedMedia[] }>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.urls;
};
