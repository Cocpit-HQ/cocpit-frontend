import { useEffect, useRef, useState } from 'react';
import { useFeedUIStore } from '@/store/feed.store';

export const usePostMediaObserver = (id: string | number, videoSrc?: string, aspectRatio?: string | number) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { imageAspectRatios, setImageAspectRatio } = useFeedUIStore();
  
  const storedRatio = imageAspectRatios[id.toString()];
  const [dynamicAspectRatio, setDynamicAspectRatio] = useState<number | undefined>(
    aspectRatio && aspectRatio !== 'auto' ? parseFloat(aspectRatio.toString()) : storedRatio
  );

  // Video Autoplay Observer
  useEffect(() => {
    if (!videoRef.current || !videoSrc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.6 }
    );

    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [videoSrc]);

  const handleMediaLoad = (event: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement>) => {
    if (!aspectRatio || aspectRatio === 'auto') {
      const element = event.currentTarget;
      const width = 'naturalWidth' in element ? element.naturalWidth : (element as HTMLVideoElement).videoWidth;
      const height = 'naturalHeight' in element ? element.naturalHeight : (element as HTMLVideoElement).videoHeight;
      
      const ratio = width / height;
      if (ratio && !isNaN(ratio)) {
        setDynamicAspectRatio(ratio);
        setImageAspectRatio(id.toString(), ratio);
      }
    }
  };

  const finalAspectRatio = dynamicAspectRatio ? `${dynamicAspectRatio}/1` : undefined;
  const isVerticalVideo = !!(!!videoSrc && dynamicAspectRatio && dynamicAspectRatio < 0.8);

  return {
    videoRef,
    finalAspectRatio,
    isVerticalVideo,
    handleMediaLoad
  };
};
