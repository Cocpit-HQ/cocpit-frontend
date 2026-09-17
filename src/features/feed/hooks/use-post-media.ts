import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Area, MediaSize } from 'react-easy-crop';
import { MediaItem } from '../types';
import getCroppedImg, { getPaddedImg } from '@/lib/canvasUtils';
import { feedToast as toast } from '../utils/feed-toast';

type AspectRatioMode = '1:1' | '4:5' | '16:9';

const DEFAULT_ASPECT_RATIO = 4 / 5;

const getAspectModeFromValue = (aspect: number): AspectRatioMode => {
  if (Math.abs(aspect - 1) < 0.001) return '1:1';
  if (Math.abs(aspect - 16 / 9) < 0.001) return '16:9';
  return '4:5';
};

export const usePostMedia = (
  initialImages: MediaItem[] = [],
  initialVideos: MediaItem[] = [],
  onTypeChange?: (type: 'photo' | 'video') => void
) => {
  const [uploadedImages, setUploadedImages] = useState<MediaItem[]>(initialImages);
  const [uploadedVideos, setUploadedVideos] = useState<MediaItem[]>(initialVideos);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const [aspectRatioMode, setAspectRatioMode] = useState<AspectRatioMode>('4:5');
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

  const aspectRatio = selectedAspectRatio;

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

  // Media Size Constraints for Posts:
  // - Single Image Limit: 10 MB max per individual image.
  // - Total Image Upload Limit: 100 MB max cumulative size across all attached images in a post.
  // - Single Video Limit: 100 MB max for video uploads.
  const MAX_SINGLE_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB per individual image limit
  const MAX_TOTAL_IMAGE_SIZE = 100 * 1024 * 1024; // 100 MB cumulative total limit for all images in post
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB video size limit

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement> | File, isEdit: boolean) => {
    const file: File | undefined = e instanceof File ? e : e.target.files?.[0];

    if (file) {
      if (file.type.startsWith('video/')) {
        if (file.size > MAX_VIDEO_SIZE) {
          toast.error("Video file size cannot exceed 100MB");
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
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
        if (file.size > MAX_SINGLE_IMAGE_SIZE) {
          toast.error(`Image "${file.name}" exceeds the 10MB limit.`);
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
        const currentTotalSize = uploadedImagesRef.current.reduce((sum, img) => sum + (img.file?.size || 0), 0);
        if (currentTotalSize + file.size > MAX_TOTAL_IMAGE_SIZE) {
          toast.error("Total image upload size cannot exceed 100MB.");
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
        if (uploadedVideosRef.current.length > 0) {
          toast.error("Cannot upload video and images together");
          if (!(e instanceof File) && e.target) e.target.value = '';
          return;
        }
        if (uploadedImagesRef.current.length >= 12) {
          toast.error("Maximum 12 images allowed");
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
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const videoFiles = files.filter(f => f.type.startsWith('video/'));
      const imageFiles = files.filter(f => !f.type.startsWith('video/'));

      // 1. Size Check (Per image 10MB, total images 100MB, video 100MB)
      if (videoFiles.length > 0) {
        const oversizedVideo = videoFiles.find(file => file.size > MAX_VIDEO_SIZE);
        if (oversizedVideo) {
          toast.error(`Video "${oversizedVideo.name}" exceeds the 100MB limit.`);
          e.target.value = '';
          return;
        }
      }

      if (imageFiles.length > 0) {
        const oversizedImage = imageFiles.find(file => file.size > MAX_SINGLE_IMAGE_SIZE);
        if (oversizedImage) {
          toast.error(`Image "${oversizedImage.name}" exceeds the 10MB limit.`);
          e.target.value = '';
          return;
        }

        const currentTotalSize = uploadedImagesRef.current.reduce((sum, img) => sum + (img.file?.size || 0), 0);
        const newImagesSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
        if (currentTotalSize + newImagesSize > MAX_TOTAL_IMAGE_SIZE) {
          toast.error("Total image upload size cannot exceed 100MB.");
          e.target.value = '';
          return;
        }
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
      if (uploadedImagesRef.current.length + imageFiles.length > 12) {
        toast.error("Maximum 12 images allowed");
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

  const removeMediaItem = useCallback((id: string, setter: React.Dispatch<React.SetStateAction<MediaItem[]>>, isEdit: boolean) => {
    setter(prev => {
      const itemToRemove = prev.find(item => item.id === id);
      if (itemToRemove && !itemToRemove.isExisting) {
        URL.revokeObjectURL(itemToRemove.url);
        if (itemToRemove.croppedBlobUrl) URL.revokeObjectURL(itemToRemove.croppedBlobUrl);
      }
      const remaining = prev.filter(item => item.id !== id);

      const originalUrls = new Set(remaining.map(item => item.url));
      previewMediaUrlsRef.current.forEach(url => {
        if (!originalUrls.has(url)) {
          URL.revokeObjectURL(url);
        }
      });

      if (remaining.length === 0) setActiveImageIndex(0);
      else if (activeImageIndex >= remaining.length) setActiveImageIndex(remaining.length - 1);
      return remaining;
    });
    setPreviewMediaUrls([]);
  }, [activeImageIndex]);

  const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const videoFiles = files.filter(f => f.type.startsWith('video/'));
      const imageFiles = files.filter(f => f.type.startsWith('image/'));

      // 1. Size Check (Per image 10MB, total images 100MB, video 100MB)
      if (videoFiles.length > 0) {
        const oversizedVideo = videoFiles.find(file => file.size > MAX_VIDEO_SIZE);
        if (oversizedVideo) {
          toast.error(`Video "${oversizedVideo.name}" exceeds the 100MB limit.`);
          e.target.value = '';
          return;
        }
      }

      if (imageFiles.length > 0) {
        const oversizedImage = imageFiles.find(file => file.size > MAX_SINGLE_IMAGE_SIZE);
        if (oversizedImage) {
          toast.error(`Image "${oversizedImage.name}" exceeds the 10MB limit.`);
          e.target.value = '';
          return;
        }

        const currentTotalSize = uploadedImagesRef.current.reduce((sum, img) => sum + (img.file?.size || 0), 0);
        const newImagesSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
        if (currentTotalSize + newImagesSize > MAX_TOTAL_IMAGE_SIZE) {
          toast.error("Total image upload size cannot exceed 100MB.");
          e.target.value = '';
          return;
        }
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
      if (uploadedImagesRef.current.length + imageFiles.length > 12) {
        toast.error("Maximum 12 images allowed");
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

  const handleCropInteraction = useCallback(() => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx === activeImageIndex) {
        return { ...img, hasUserCropInteraction: true };
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

  const handleVideoCropChange = useCallback((crop: { x: number; y: number }) => {
    setUploadedVideos(prev => prev.map((vid, idx) => {
      if (idx === 0) {
        return { ...vid, crop };
      }
      return vid;
    }));
  }, []);

  const handleVideoZoomChange = useCallback((zoom: number) => {
    setUploadedVideos(prev => prev.map((vid, idx) => {
      if (idx === 0) {
        return { ...vid, zoom };
      }
      return vid;
    }));
  }, []);

  const handleVideoCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setUploadedVideos(prev => prev.map((vid, idx) => {
      if (idx === 0) {
        return { ...vid, pixelCrop: croppedAreaPixels };
      }
      return vid;
    }));
  }, []);

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

  const resetActiveImageViewport = useCallback(() => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx !== activeImageIndex) return img;

      return {
        ...img,
        crop: { x: 0, y: 0 },
        zoom: 1,
      };
    }));
  }, [activeImageIndex]);

  const resetActiveVideoViewport = useCallback(() => {
    setUploadedVideos(prev => prev.map((vid, idx) => {
      if (idx !== 0) return vid;

      return {
        ...vid,
        crop: { x: 0, y: 0 },
        zoom: 1,
      };
    }));
  }, []);

  const handleAspectChange = useCallback((newAspect: number) => {
    setAspectRatioMode(getAspectModeFromValue(newAspect));
    setSelectedAspectRatio(newAspect);

    resetActiveImageViewport();
    resetActiveVideoViewport();
  }, [resetActiveImageViewport, resetActiveVideoViewport]);

  const handleActiveMediaLoaded = useCallback((mediaSize: MediaSize) => {
    setUploadedImages(prev => prev.map((img, idx) => {
      if (idx !== activeImageIndex) return img;
      if (img.naturalWidth === mediaSize.naturalWidth && img.naturalHeight === mediaSize.naturalHeight) {
        return img;
      }

      return {
        ...img,
        naturalWidth: mediaSize.naturalWidth,
        naturalHeight: mediaSize.naturalHeight,
      };
    }));
  }, [activeImageIndex]);

  const shouldPadImageToAspect = useCallback((item: MediaItem, targetAspect: number) => {
    return false;
  }, []);

  const hasImageEdits = useCallback((item: MediaItem, _targetAspect: number) => {
    return (
      !!item.hasUserCropInteraction ||
      !!item.flipH ||
      !!item.flipV ||
      (item.rotation || 0) !== 0
    );
  }, []);

  const generatePreviewBlobs = async (postType: string) => {
    const originalUrls = new Set([
      ...uploadedImages.map(img => img.url),
      ...uploadedVideos.map(v => v.url)
    ]);

    previewMediaUrlsRef.current.forEach(url => {
      if (!originalUrls.has(url)) {
        URL.revokeObjectURL(url);
      }
    });
    const newUrls: string[] = [];

    if (postType === 'photo') {
      for (const img of uploadedImages) {
        if (img.isExisting || !hasImageEdits(img, aspectRatio)) {
          newUrls.push(img.url);
          continue;
        }

        try {
          const shouldPad = shouldPadImageToAspect(img, aspectRatio);

          if (shouldPad) {
            const blob = await getPaddedImg(
              img.url,
              aspectRatio,
              '#000000',
              img.rotation || 0,
              { horizontal: !!img.flipH, vertical: !!img.flipV },
              img.file?.type
            );
            const blobUrl = URL.createObjectURL(blob);
            newUrls.push(blobUrl);
          } else if (img.pixelCrop) {
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
    setSelectedAspectRatio(DEFAULT_ASPECT_RATIO);
    setAspectRatioMode('4:5');
    setPreviewMediaUrls([]);
  }, [revokeAllMediaUrls]);

  const prepareFilesToUpload = async (postType: string, currentAspectRatio: number) => {
    let filesToUpload: File[] = [];

    if (postType === 'photo' || postType === 'article') {
      const processedFiles = await Promise.all(uploadedImages.map(async (item) => {
        if (item.isExisting) return undefined;
        if (item.file) {
          if (!hasImageEdits(item, currentAspectRatio)) {
            return item.file;
          }

          if (shouldPadImageToAspect(item, currentAspectRatio)) {
            try {
              const blob = await getPaddedImg(
                item.url,
                currentAspectRatio,
                '#000000',
                item.rotation || 0,
                { horizontal: !!item.flipH, vertical: !!item.flipV },
                item.file?.type
              );
              if (blob) return new File([blob], item.file.name, { type: item.file.type || 'image/jpeg' });
            } catch (e) { console.error("Padding failed", e); }
          } else if (item.pixelCrop) {
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
    aspectRatio,
    aspectRatioMode,
    previewMediaUrls,
    handlePhotoUpload,
    handleDesktopPhotoUpload,
    handleVideoUpload,
    removeMediaItem,
    handleCropChange,
    handleZoomChange,
    handleCropComplete,
    handleVideoCropChange,
    handleVideoZoomChange,
    handleVideoCropComplete,
    handleCropInteraction,
    handleAspectChange,
    handleActiveMediaLoaded,
    handleFlipHChange,
    handleFlipVChange,
    handleRotateChange,
    generatePreviewBlobs,
    revokeAllMediaUrls,
    clearMedia,
    prepareFilesToUpload
  };
};
