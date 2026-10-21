import { uploadMedia as uploadMediaR2, UploadedAsset } from "./upload";

export interface UploadedMedia {
  url: string;
  media_type: 'image' | 'video';
  master_url?: string;
}

export const uploadMedia = async (files: File[]): Promise<UploadedMedia[]> => {
  const assets: UploadedAsset[] = await uploadMediaR2(files);
  return assets.map(a => ({
    url: a.url,
    media_type: a.media_type,
    master_url: a.master_url,
  }));
};

