import { useState, useCallback, useRef, useEffect } from 'react';
import { Area } from 'react-easy-crop';
import { MediaItem } from '../types';
import getCroppedImg, { getPaddedImg } from '@/lib/canvasUtils';

export const usePostMedia = (initialImages: MediaItem[] = [], initialVideos: MediaItem[] = []) => {
  const [uploadedImages, setUploadedImages] = useState<MediaItem[]>(initialImages);
  const [uploadedVideos, setUploadedVideos] = useState<MediaItem[]>(initialVideos);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(4 / 5);
  const [previewMediaUrls, setPreviewMediaUrls] = useState<string[]>([]);

  // Refs for cleanup
  const uploadedImagesRef = useRef<MediaItem[]>([]);
  const uploadedVideosRef = useRef<MediaItem[]>([]);
  const previewMediaUrlsRef = useRef<string[]>([]);

  useEffect(() => { uploadedImagesRef.current = uploadedImages; }, [uploadedImages]);
  useEffect(() => { uploadedVideosRef.current = uploadedVideos; }, [uploadedVideos]);
  useEffect(() => { previewMediaUrlsRef.current = previewMediaUrls; }, [previewMediaUrls]);

  const createMediaItem = useCallback((file: File): MediaItem => ({
    id: `${Date.now()}-${Math.random()}`,
    url: URL.createObjectURL(file),
    file,
    type: file.type.startsWith('image/') ? 'image' : 'video',
    crop: { x: 0, y: 0 },
    zoom: 1,
    fitMode: 'cover'
  }), []);

  const revokeAllMediaUrls = useCallback(() => {
    uploadedImagesRef.current.forEach(img => {
      if (!img.isExisting) {
        URL.revokeObjectURL(img.url);
        if (img.croppedBlobUrl) URL.revokeObjectURL(img.croppedBlobUrl);
      }
    });
    uploadedVideosRef.current.forEach(video => {
      if (!video.isExisting) URL.revokeObjectURL(video.url);
    });
    previewMediaUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
  }, []);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement> | File, isEdit: boolean) => {
    if (isEdit) return;
    let file: File | undefined = e instanceof File ? e : e.target.files?.[0];
    
    if (file) {
      const newImage = createMediaItem(file);
      setUploadedImages([newImage]);
      setActiveImageIndex(0);
    }
    if (!(e instanceof File) && e.target) e.target.value = '';
  }, [createMediaItem]);

  const handleDesktopPhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (isEdit) return;
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => createMediaItem(file));
      setUploadedImages(prev => {
        const updated = [...prev, ...newImages];
        if (prev.length === 0) setActiveImageIndex(0);
        return updated;
      });
    }
    e.target.value = '';
  }, [createMediaItem]);

  const removeMediaItem = useCallback((mediaId: string, setMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>, isEdit: boolean) => {
    if (isEdit) return;
    setMedia(prev => {
      const itemToRemove = prev.find(item => item.id === mediaId);
      if (itemToRemove && !itemToRemove.isExisting) {
        URL.revokeObjectURL(itemToRemove.url);
        if (itemToRemove.croppedBlobUrl) URL.revokeObjectURL(itemToRemove.croppedBlobUrl);
      }
      const filtered = prev.filter(item => item.id !== mediaId);
      if (filtered.length === 0) setActiveImageIndex(0);
      else if (activeImageIndex >= filtered.length) setActiveImageIndex(filtered.length - 1);
      return filtered;
    });
  }, [activeImageIndex]);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (isEdit) return;
    if (e.target.files && e.target.files.length > 0) {
      const newVideos = Array.from(e.target.files).map(file => createMediaItem(file));
      setUploadedVideos(prev => [...prev, ...newVideos]);
    }
    e.target.value = '';
  }, [createMediaItem]);

  const handleCropChange = useCallback((crop: { x: number; y: number }) => {
    setUploadedImages(prev => {
      const updated = [...prev];
      if (updated[activeImageIndex]) {
        updated[activeImageIndex].crop = crop;
      }
      return updated;
    });
  }, [activeImageIndex]);

  const handleZoomChange = useCallback((zoom: number) => {
    setUploadedImages(prev => {
      const updated = [...prev];
      if (updated[activeImageIndex]) {
        updated[activeImageIndex].zoom = zoom;
      }
      return updated;
    });
  }, [activeImageIndex]);

  const handleFitModeChange = useCallback((mode: 'cover' | 'contain') => {
    setUploadedImages(prev => {
      const updated = [...prev];
      if (updated[activeImageIndex]) {
        updated[activeImageIndex].fitMode = mode;
      }
      return updated;
    });
  }, [activeImageIndex]);

  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setUploadedImages(prev => {
      const updated = [...prev];
      if (updated[activeImageIndex]) {
        updated[activeImageIndex].pixelCrop = croppedAreaPixels;
      }
      return updated;
    });
  }, [activeImageIndex]);

  const handleAspectChange = useCallback((newAspect: number) => {
    setAspectRatio(newAspect);
  }, []);

  const generatePreviewBlobs = async (postType: string) => {
    previewMediaUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    const newUrls: string[] = [];

    if (postType === 'photo') {
      for (const img of uploadedImages) {
        if (img.pixelCrop && !img.isExisting) {
          try {
            const blob = await getCroppedImg(img.url, img.pixelCrop);
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              newUrls.push(blobUrl);
            } else {
              newUrls.push(img.url);
            }
          } catch (e) {
            console.error("Failed to crop image", e);
            newUrls.push(img.url);
          }
        } else {
          newUrls.push(img.url);
        }
      }
    } else if (postType === 'video') {
      newUrls.push(...uploadedVideos.map(v => v.url));
    }
    setPreviewMediaUrls(newUrls);
    return newUrls;
  };

  const clearMedia = useCallback(() => {
     revokeAllMediaUrls();
     setUploadedImages([]);
     setUploadedVideos([]);
     setActiveImageIndex(0);
     setPreviewMediaUrls([]);
  }, [revokeAllMediaUrls]);

  const prepareFilesToUpload = async (postType: string, currentAspectRatio: number) => {
    let filesToUpload: File[] = [];

    if (postType === 'photo') {
      const processedFiles = await Promise.all(uploadedImages.map(async (item) => {
        if (item.isExisting) return undefined;
        if (item.file) {
          if (item.fitMode === 'contain') {
            try {
              const blob = await getPaddedImg(item.url, currentAspectRatio);
              if (blob) return new File([blob], item.file.name, { type: 'image/jpeg' });
            } catch (e) { console.error("Pad failed", e); }
            return item.file;
          }
          if (item.pixelCrop) {
            try {
              const blob = await getCroppedImg(item.url, item.pixelCrop);
              if (blob) return new File([blob], item.file.name, { type: 'image/jpeg' });
            } catch (e) { console.error("Crop failed", e); }
          }
          return item.file;
        }
        return undefined;
      }));
      filesToUpload = processedFiles.filter((f): f is File => !!f);
    } else if (postType === 'video') {
      uploadedVideos.forEach(v => { if (v.file) filesToUpload.push(v.file) });
    }
    return filesToUpload;
  };

  return {
    uploadedImages, setUploadedImages,
    uploadedVideos, setUploadedVideos,
    activeImageIndex, setActiveImageIndex,
    aspectRatio, setAspectRatio,
    previewMediaUrls,
    handlePhotoUpload,
    handleDesktopPhotoUpload,
    handleVideoUpload,
    removeMediaItem,
    handleCropChange,
    handleZoomChange,
    handleFitModeChange,
    handleCropComplete,
    handleAspectChange,
    generatePreviewBlobs,
    revokeAllMediaUrls,
    clearMedia,
    prepareFilesToUpload
  };
};
