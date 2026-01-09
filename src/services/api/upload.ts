import api from "@/lib/axios";

export async function uploadMedia(files: File[]) {
  const formData = new FormData();

  files.forEach(file => {
    formData.append("files", file);
  });

  const { data } = await api.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data.urls;
}
