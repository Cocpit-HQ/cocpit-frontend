'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/services/api/upload';
import { toast } from 'sonner';

interface ChannelBannerEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBanner: string | null;
  onSaveBanner: (url: string | null) => void;
}

export default function ChannelBannerEditorModal({
  isOpen,
  onClose,
  currentBanner,
  onSaveBanner,
}: ChannelBannerEditorModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [naturalImgSize, setNaturalImgSize] = useState({ w: 0, h: 0 });

  const lastPointer = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const displayImage = previewUrl || currentBanner || null;
  const hasImage = !!displayImage;

  const resetTransforms = () => {
    setZoom(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPositionX(0);
    setPositionY(0);
    setNaturalImgSize({ w: 0, h: 0 });
  };

  const handleCancelPreview = () => {
    if (previewUrl && previewUrl !== currentBanner) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    resetTransforms();
  };

  useEffect(() => {
    if (!isOpen) {
      handleCancelPreview();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isDraggingImage) return;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - lastPointer.current.x;
      const dy = clientY - lastPointer.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved.current = true;
      }
      const zoomScale = 1 + (zoom / 100);
      let containerWidth = 600;
      let containerHeight = 100;
      if (containerRef.current) {
        containerWidth = containerRef.current.offsetWidth;
        containerHeight = containerRef.current.offsetHeight;
      }

      let renderedW = containerWidth;
      let renderedH = containerHeight;
      if (naturalImgSize.w > 0 && naturalImgSize.h > 0) {
        const imgAspect = naturalImgSize.w / naturalImgSize.h;
        renderedW = containerWidth;
        renderedH = containerWidth / imgAspect;
      }

      const maxTranslateX = Math.max(0, (renderedW * zoomScale - containerWidth) / 2);
      const maxTranslateY = Math.max(0, (renderedH * zoomScale - containerHeight) / 2);

      setPositionX(prev => Math.min(Math.max(prev + dx, -maxTranslateX), maxTranslateX));
      setPositionY(prev => Math.min(Math.max(prev + dy, -maxTranslateY), maxTranslateY));
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) handleMove(touch.clientX, touch.clientY);
    };
    const onEnd = () => {
      setIsDraggingImage(false);
      if (!hasMoved.current && !hasImage) {
        fileInputRef.current?.click();
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onEnd);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [isDraggingImage, zoom, naturalImgSize, hasImage]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    lastPointer.current = { x: clientX, y: clientY };
    hasMoved.current = false;
    setIsDraggingImage(true);
  };

  useEffect(() => {
    const zoomScale = 1 + (zoom / 100);
    let containerWidth = 600;
    let containerHeight = 100;
    if (containerRef.current) {
      containerWidth = containerRef.current.offsetWidth;
      containerHeight = containerRef.current.offsetHeight;
    }

    let renderedW = containerWidth;
    let renderedH = containerHeight;
    if (naturalImgSize.w > 0 && naturalImgSize.h > 0) {
      const imgAspect = naturalImgSize.w / naturalImgSize.h;
      renderedW = containerWidth;
      renderedH = containerWidth / imgAspect;
    }

    const maxTranslateX = Math.max(0, (renderedW * zoomScale - containerWidth) / 2);
    const maxTranslateY = Math.max(0, (renderedH * zoomScale - containerHeight) / 2);

    setPositionX((prev) => Math.min(Math.max(prev, -maxTranslateX), maxTranslateX));
    setPositionY((prev) => Math.min(Math.max(prev, -maxTranslateY), maxTranslateY));
  }, [zoom, naturalImgSize]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload an image.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File size exceeds 20MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    resetTransforms();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    const sourceUrl = previewUrl || currentBanner;
    if (!sourceUrl) return;

    setIsUploading(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
          // Fallback if CORS fails on existing external url: just pass sourceUrl directly
          resolve(null);
        };
        img.src = sourceUrl;
      });

      // If image failed CORS or has 0 width, just return the source URL directly
      if (!img.width) {
        onSaveBanner(sourceUrl);
        handleCancelPreview();
        onClose();
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 6:1 aspect ratio at high resolution
      const width = 1200;
      const height = 200;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      const imgAspect = img.width / img.height;
      const canvasAspect = width / height; // 6
      let drawWidth, drawHeight;

      if (imgAspect > canvasAspect) {
        drawHeight = height;
        drawWidth = height * imgAspect;
      } else {
        drawWidth = width;
        drawHeight = width / imgAspect;
      }

      const zoomScale = 1 + (zoom / 100);
      drawWidth *= zoomScale;
      drawHeight *= zoomScale;

      const containerEl = containerRef.current;
      const previewWidth = containerEl ? containerEl.offsetWidth : 600;
      const scaleRatio = width / previewWidth;
      const canvasPosX = positionX * scaleRatio;
      const canvasPosY = positionY * scaleRatio;

      ctx.drawImage(img, -drawWidth / 2 + canvasPosX, -drawHeight / 2 + canvasPosY, drawWidth, drawHeight);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.95);
      });

      if (!blob) {
        onSaveBanner(sourceUrl);
        handleCancelPreview();
        onClose();
        return;
      }

      const file = new File([blob], "channel_banner.jpg", { type: "image/jpeg" });
      try {
        const urls = await uploadMedia([file]);
        const raw = urls[0];
        const resolvedUrl = typeof raw === 'object' && raw !== null ? (raw as any).url : raw;
        onSaveBanner(resolvedUrl);
        toast.success("Banner image updated successfully.");
      } catch (uploadError) {
        // Fallback to local Data URL if upload endpoint fails during offline design/preview
        const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
        onSaveBanner(dataUrl);
        toast.success("Banner image cropped and set.");
      }

      handleCancelPreview();
      onClose();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to process channel banner.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-[720px] sm:max-w-[720px] p-[24px] sm:rounded-[24px] rounded-[24px] bg-[#FFFFFF] dark:bg-[#121B2B] !border-0 !shadow-2xl outline-none [&>button]:hidden">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp,image/heic,image/jpg"
          className="hidden"
        />

        <div className="flex flex-col w-full">
          <div className="text-center mb-6 relative">
            <DialogTitle className="text-[20px] leading-[28px] font-medium font-['Poppins'] text-black dark:text-[#FFFFFF] mb-1">
              Edit channel banner
            </DialogTitle>
            <p className="text-[13px] leading-[18px] font-normal font-['Poppins'] text-[#6B7280] dark:text-[#A1A8B3]">
              Adjust and crop your banner (6:1 display ratio)
            </p>
          </div>

          <div className="relative flex flex-col items-center justify-center w-full">
            {/* Transform Toolbar */}
            <div className="flex justify-center items-center gap-4 mb-6">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium font-['Poppins'] text-[#1A73E8] bg-[#E8F1FF] dark:bg-[#1A2435] hover:opacity-90 transition-opacity"
                title="Upload new image"
              >
                <Icon icon="solar:upload-linear" className="w-4 h-4" />
                <span>Upload image</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlipV(!flipV);
                  setFlipH(false);
                }}
                className={cn("p-2 rounded-md transition-colors cursor-pointer", flipV ? "bg-[#1A73E8] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1A2435]")}
                title="Flip vertical"
              >
                <Icon icon="hugeicons:flip-top" className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setFlipH(!flipH);
                  setFlipV(false);
                }}
                className={cn("p-2 rounded-md transition-colors cursor-pointer", flipH ? "bg-[#1A73E8] text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1A2435]")}
                title="Flip horizontal"
              >
                <Icon icon="hugeicons:flip-left" className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1A2435] rounded-md transition-colors cursor-pointer"
                title="Rotate"
              >
                <Icon icon="wordpress:rotate-left" className="w-5 h-5" />
              </button>
            </div>

            {/* Image Preview with Drag-to-Reposition at 6:1 ratio */}
            <div
              ref={containerRef}
              className={cn(
                "w-full max-w-[600px] aspect-[6/1] mx-auto relative overflow-hidden bg-gray-100 dark:bg-[#0F1115] rounded-[12px] border border-gray-200 dark:border-[#2A2D35] select-none group flex items-center justify-center",
                isDraggingImage ? "cursor-grabbing" : "cursor-grab"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                if (hasImage) handlePointerDown(e.clientX, e.clientY);
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                if (touch && hasImage) handlePointerDown(touch.clientX, touch.clientY);
              }}
              onWheel={(e) => {
                e.preventDefault();
                if (hasImage) {
                  const delta = e.deltaY > 0 ? -5 : 5;
                  setZoom(prev => Math.min(200, Math.max(0, prev + delta)));
                }
              }}
            >
              {hasImage ? (
                <img
                  src={displayImage || ''}
                  alt="Current Banner"
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    setNaturalImgSize({ w: el.naturalWidth, h: el.naturalHeight });
                  }}
                  className="absolute pointer-events-none select-none w-full h-auto"
                  draggable={false}
                  style={{
                    left: 0,
                    top: '50%',
                    transform: `translateY(calc(-50% + ${positionY}px)) translateX(${positionX}px) scale(${1 + (zoom / 100)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    transformOrigin: '50% 50%',
                  }}
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center p-4 text-center cursor-pointer w-full h-full"
                >
                  <Icon icon="iconoir:cloud-upload" className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs font-['Poppins'] text-gray-500 dark:text-[#A1A8B3]">Click to choose a banner image</span>
                </div>
              )}

              {/* Hover Overlay */}
              {hasImage && !isDraggingImage && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                    <Icon icon="solar:upload-linear" className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-[12px] font-medium font-['Poppins']">
                    Change image
                  </span>
                </div>
              )}
            </div>

            {/* Zoom Slider */}
            {hasImage && (
              <div className="mt-6 max-w-[360px] mx-auto w-full">
                <p className="text-[13px] font-medium font-['Poppins'] text-black dark:text-[#FFFFFF] mb-2 text-center">Zoom</p>
                <Slider
                  value={[zoom]}
                  onValueChange={(vals) => setZoom(vals[0])}
                  max={200}
                  step={1}
                  className="w-full cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-center items-center gap-[16px] mt-8">
            <button
              type="button"
              onClick={() => {
                handleCancelPreview();
                onClose();
              }}
              disabled={isUploading}
              className="w-[140px] h-[40px] rounded-[24px] border border-[#1A73E8] dark:border-[#4D9CFF] bg-[#FFFFFF] dark:bg-transparent text-[#1A73E8] dark:text-[#4D9CFF] text-[14px] leading-[20px] font-normal font-['Poppins'] hover:bg-[#EFF4FF] dark:hover:bg-[#1A2435] transition-colors flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUploading || !hasImage}
              className="w-[140px] h-[40px] rounded-[24px] bg-[#1A73E8] dark:bg-[#4D9CFF] border border-[#FFFFFF] dark:border-transparent text-[#FFFFFF] dark:text-[#0F1115] text-[14px] leading-[20px] font-normal font-['Poppins'] hover:opacity-90 disabled:opacity-50 disabled:cursor-default transition-colors flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              <span>{isUploading ? "Saving..." : "Apply"}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
