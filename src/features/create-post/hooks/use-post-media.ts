import { useState, useCallback, useRef, useEffect } from 'react';
import { Area } from 'react-easy-crop';
import { MediaItem } from '../types';
import getCroppedImg from '@/lib/canvasUtils';
import { toast } from 'sonner';

export const usePostMedia = (
  initialImages: MediaItem[] = [],
  initialVideos: MediaItem[] = [],
  onTypeChange?: (type: 'photo' | 'video') => void
) => {
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
    zoom: 1
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
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size cannot exceed 100MB");
        if (!(e instanceof File) && e.target) e.target.value = '';
        return;
      }

      if (file.type.startsWith('video/')) {
        if (uploadedImagesRef.current.length > 0) {
          toast.error("Cannot upload video and images together");
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
        if (uploadedVideosRef.current.length >= 1) {
          toast.error("Only one video file is allowed");
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
        const newVideo = createMediaItem(file);
        setUploadedVideos([newVideo]);
        setUploadedImages([]);
        setActiveImageIndex(0);
        onTypeChange?.('video');
      } else {
        if (uploadedVideosRef.current.length > 0) {
          toast.error("Cannot upload video and images together");
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
        if (uploadedImagesRef.current.length >= 5) {
          toast.error("Maximum 5 images allowed");
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
        const newImage = createMediaItem(file);
        setUploadedImages([newImage]);
        setUploadedVideos([]);
        setActiveImageIndex(0);
        onTypeChange?.('photo');
      }
    }
    if (!(e instanceof File) && e.target) e.target.value = '';
  }, [createMediaItem, onTypeChange]);

  const handleDesktopPhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (isEdit) return;
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const videoFiles = files.filter(f => f.type.startsWith('video/'));
      const imageFiles = files.filter(f => f.type.startsWith('image/'));

      // 1. Size Check
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      const hasOversized = files.some(file => file.size > MAX_FILE_SIZE);
      if (hasOversized) {
        toast.error("File size cannot exceed 100MB");
        e.target.value = '';
        return;
      }

      // 2. Mixed Check in selection
      if (videoFiles.length > 0 && imageFiles.length > 0) {
        toast.error("Cannot upload video and images together");
        e.target.value = '';
        return;
      }

      // 3. Mixed Check against existing state
      if (videoFiles.length > 0 && uploadedImagesRef.current.length > 0) {
        toast.error("Cannot upload video and images together");
        e.target.value = '';
        return;
      }
      if (imageFiles.length > 0 && uploadedVideosRef.current.length > 0) {
        toast.error("Cannot upload video and images together");
        e.target.value = '';
        return;
      }

      // 4. Video count limit
      if (uploadedVideosRef.current.length + videoFiles.length > 1) {
        toast.error("Only one video file is allowed");
        e.target.value = '';
        return;
      }

      // 5. Image count limit
      if (uploadedImagesRef.current.length + imageFiles.length > 5) {
        toast.error("Maximum 5 images allowed");
        e.target.value = '';
        return;
      }

      if (videoFiles.length > 0) {
        const newVideos = videoFiles.map(file => createMediaItem(file));
        setUploadedVideos(newVideos);
        setUploadedImages([]);
        setActiveImageIndex(0);
        onTypeChange?.('video');
      } else if (imageFiles.length > 0) {
        const newImages = imageFiles.map(file => createMediaItem(file));
        setUploadedImages(prev => {
          const updated = [...prev, ...newImages];
          if (prev.length === 0) setActiveImageIndex(0);
          return updated;
        });
        setUploadedVideos([]);
        onTypeChange?.('photo');
      }
    }
    e.target.value = '';
  }, [createMediaItem, onTypeChange]);

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
      const files = Array.from(e.target.files);
      const videoFiles = files.filter(f => f.type.startsWith('video/'));
      const imageFiles = files.filter(f => f.type.startsWith('image/'));

      // 1. Size Check
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      const hasOversized = files.some(file => file.size > MAX_FILE_SIZE);
      if (hasOversized) {
        toast.error("File size cannot exceed 100MB");
        e.target.value = '';
        return;
      }

      // 2. Mixed Check in selection
      if (videoFiles.length > 0 && imageFiles.length > 0) {
        toast.error("Cannot upload video and images together");
        e.target.value = '';
        return;
      }

      // 3. Mixed Check against existing state
      if (videoFiles.length > 0 && uploadedImagesRef.current.length > 0) {
        toast.error("Cannot upload video and images together");
        e.target.value = '';
        return;
      }
      if (imageFiles.length > 0 && uploadedVideosRef.current.length > 0) {
        toast.error("Cannot upload video and images together");
        e.target.value = '';
        return;
      }

      // 4. Video count limit
      if (uploadedVideosRef.current.length + videoFiles.length > 1) {
        toast.error("Only one video file is allowed");
        e.target.value = '';
        return;
      }

      // 5. Image count limit
      if (uploadedImagesRef.current.length + imageFiles.length > 5) {
        toast.error("Maximum 5 images allowed");
        e.target.value = '';
        return;
      }

      if (videoFiles.length > 0) {
        const newVideos = videoFiles.map(file => createMediaItem(file));
        setUploadedVideos(prev => [...prev, ...newVideos]);
        setUploadedImages([]);
        setActiveImageIndex(0);
        onTypeChange?.('video');
      } else if (imageFiles.length > 0) {
        const newImages = imageFiles.map(file => createMediaItem(file));
        setUploadedImages(prev => {
          const updated = [...prev, ...newImages];
          if (prev.length === 0) setActiveImageIndex(0);
          return updated;
        });
        setUploadedVideos([]);
        onTypeChange?.('photo');
      }
    }
    e.target.value = '';
  }, [createMediaItem, onTypeChange]);

  const handleCropChange = useCallback((crop: { x: number; y: number }) => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        return { ...img, crop };
      }
      return img;
    }));
  }, [activeImageIndex]);

  const handleZoomChange = useCallback((zoom: number) => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        return { ...img, zoom };
      }
      return img;
    }));
  }, [activeImageIndex]);


  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        return { ...img, pixelCrop: croppedAreaPixels };
      }
      return img;
    }));
  }, [activeImageIndex]);

  const handleFlipHChange = useCallback(() => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        return { ...img, flipH: !img.flipH, flipV: false };
      }
      return img;
    }));
    setUploadedVideos(prev => prev.map((vid, idx) => {
      if (idx === 0) {
        return { ...vid, flipH: !vid.flipH, flipV: false };
      }
      return vid;
    }));
  }, [activeImageIndex]);

  const handleFlipVChange = useCallback(() => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        return { ...img, flipV: !img.flipV, flipH: false };
      }
      return img;
    }));
    setUploadedVideos(prev => prev.map((vid, idx) => {
      if (idx === 0) {
        return { ...vid, flipV: !vid.flipV, flipH: false };
      }
      return vid;
    }));
  }, [activeImageIndex]);

  const handleRotateChange = useCallback(() => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        const currentRotation = img.rotation || 0;
        return { ...img, rotation: (currentRotation + 90) % 360 };
      }
      return img;
    }));
    setUploadedVideos(prev => prev.map((vid, idx) => {
      if (idx === 0) {
        const currentRotation = vid.rotation || 0;
        return { ...vid, rotation: (currentRotation + 90) % 360 };
      }
      return vid;
    }));
  }, [activeImageIndex]);

  const handleAspectChange = useCallback((newAspect: number) => {
    setAspectRatio(newAspect);
  }, []);

  const generatePreviewBlobs = async (postType: string) => {
    previewMediaUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    const newUrls: string[] = [];

    if (postType === 'photo') {
      for (const img of uploadedImages) {
        if (img.isExisting) {
          newUrls.push(img.url);
          continue;
        }

        try {
          if (img.pixelCrop) {
            const blob = await getCroppedImg(
              img.url,
              img.pixelCrop,
              img.rotation || 0,
              { horizontal: !!img.flipH, vertical: !!img.flipV },
              img.file?.type
            );
            if (blob) {
              const blobUrl = URL.createObjectURL(blob);
              newUrls.push(blobUrl);
            } else {
              newUrls.push(img.url);
            }
          } else {
            newUrls.push(img.url);
          }
        } catch (e) {
          console.error("Failed to process image preview", e);
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

    if (postType === 'photo' || postType === 'article') {
      const processedFiles = await Promise.all(uploadedImages.map(async (item) => {
        if (item.isExisting) return undefined;
        if (item.file) {
          if (item.pixelCrop) {
            try {
              const blob = await getCroppedImg(
                item.url,
                item.pixelCrop,
                item.rotation || 0,
                { horizontal: !!item.flipH, vertical: !!item.flipV },
                item.file?.type
              );
              if (blob) return new File([blob], item.file.name, { type: item.file.type || 'image/jpeg' });
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
    handleCropComplete,
    handleAspectChange,
    handleFlipHChange,
    handleFlipVChange,
    handleRotateChange,
    generatePreviewBlobs,
    revokeAllMediaUrls,
    clearMedia,
    prepareFilesToUpload
  };
};
