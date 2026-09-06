'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { UploadIcon } from '@/components/icons';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { uploadMedia } from '@/services/api/upload';
import { toast } from 'sonner';

interface ArticleCoverEditorProps {
  coverImage: string | null;
  onCoverChange: (url: string | null) => void;
  onRemoveCover: () => void;
  isEdit?: boolean;
}

export default function ArticleCoverEditor({
  coverImage,
  onCoverChange,
  onRemoveCover,
}: ArticleCoverEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const displayImage = previewUrl || coverImage || null;
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
    if (previewUrl && previewUrl !== coverImage) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    resetTransforms();
  };

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
      let containerHeight = 300;
      if (containerRef.current) {
        containerWidth = containerRef.current.offsetWidth;
        containerHeight = containerRef.current.offsetHeight;
      }

      // Width-fill: image always spans the full container width
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
      if (!hasMoved.current) {
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
  }, [isDraggingImage, zoom, naturalImgSize]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    lastPointer.current = { x: clientX, y: clientY };
    hasMoved.current = false;
    setIsDraggingImage(true);
  };

  // Clamp position when zoom changes
  useEffect(() => {
    const zoomScale = 1 + (zoom / 100);
    let containerWidth = 600;
    let containerHeight = 300;
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
    setIsModalOpen(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      onRemoveCover();
      handleCancelPreview();
      setIsModalOpen(false);
      toast.success("Cover photo removed.");
    } catch (error) {
      toast.error("Failed to remove cover photo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    const sourceUrl = previewUrl || coverImage;
    if (!sourceUrl) return;

    setIsUploading(true);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = sourceUrl;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 2:1 aspect ratio at high resolution
      const width = 1920;
      const height = 960;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      const imgAspect = img.width / img.height;
      const canvasAspect = width / height; // 2
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
        throw new Error("Canvas toBlob failed");
      }

      const file = new File([blob], "article_cover.jpg", { type: "image/jpeg" });
      const urls = await uploadMedia([file]);
      const raw = urls[0];
      const resolvedUrl = typeof raw === 'object' && raw !== null ? (raw as any).url : raw;

      onCoverChange(resolvedUrl);
      toast.success("Cover image updated successfully.");
      handleCancelPreview();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to process and upload cover image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Hidden input for file selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />

      {/* Article Cover Editor Page Trigger UI */}
      <div className="w-full">
        {coverImage ? (
          <div className="relative aspect-[16/9] max-w-full w-full overflow-hidden group bg-ds-surface-2 mx-auto rounded-2xl border border-ds-border">
            <img src={coverImage} alt="Article cover" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 right-3 z-10 pointer-events-auto flex items-center gap-2 p-1.5 bg-black/70 backdrop-blur-md rounded-xl border border-white/10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                  resetTransforms();
                  setIsModalOpen(true);
                }}
                aria-label="Edit cover image"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Edit"
              >
                <Icon icon="lucide:pencil" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onRemoveCover}
                aria-label="Remove cover image"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-ds-error hover:bg-white/10 transition-colors cursor-pointer"
                title="Remove"
              >
                <Icon icon="lucide:trash-2" className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Add cover image"
            className="flex flex-col items-center justify-center border border-dashed border-zinc-700/70 bg-ds-surface-1/40 hover:bg-ds-surface-1/80 hover:border-zinc-500 rounded-2xl cursor-pointer p-8 text-center w-full aspect-[16/9] max-w-full mx-auto transition-all duration-200 select-none group"
          >
            <div className="flex flex-col items-center gap-1.5 mb-5">
              <h5 className="font-semibold text-[16px] leading-[24px] text-ds-text-primary text-center">
                Cover image
              </h5>
              <p className="font-normal text-[13px] leading-[18px] text-ds-text-muted text-center">
                Add a cover image to your article
              </p>
            </div>

            <div className="flex flex-col items-center gap-3.5">
              <UploadIcon
                className="w-[80px] h-[80px] text-ds-text-secondary group-hover:text-ds-text-primary transition-colors"
              />
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-normal text-[11px] leading-[16px] text-ds-text-muted text-center">
                  JPG, PNG, max 10MB
                </span>
                <span className="font-normal text-[11px] leading-[16px] text-ds-text-muted text-center">
                  Expected ratio 16:9
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cover Preview Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) handleCancelPreview();
      }}>
        <DialogContent className="p-0 shadow-none max-w-[800px] sm:rounded-[24px] outline-none">
          <div className="relative bg-card rounded-[24px] p-[16px] w-[800px] max-w-full flex flex-col outline-none">
            <div className="text-center mb-6 relative px-4">
              <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-foreground mb-1">
                Cover image
              </DialogTitle>
              <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
                This will appear as your article&apos;s cover image
              </p>
            </div>

            <div className="relative flex flex-col items-center justify-center w-full">
              {/* Transform Toolbar */}
              <div className="flex justify-center items-center gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setFlipV(!flipV);
                    setFlipH(false);
                  }}
                  className={cn("p-1.5 rounded-md transition-colors cursor-pointer", flipV ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")}
                  title="Flip vertical"
                >
                  <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFlipH(!flipH);
                    setFlipV(false);
                  }}
                  className={cn("p-1.5 rounded-md transition-colors cursor-pointer", flipH ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")}
                  title="Flip horizontal"
                >
                  <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
                  title="Rotate"
                >
                  <Icon icon="wordpress:rotate-left" className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting || !hasImage}
                  className="p-1.5 text-ds-error hover:bg-ds-error/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  title="Delete"
                >
                  {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} /> : <Icon icon="fluent:delete-32-regular" className="w-6 h-6" />}
                </button>
              </div>

              {/* Image Preview with Drag-to-Reposition at 2:1 ratio */}
              <div
                ref={containerRef}
                className={cn(
                  "w-full max-w-[680px] aspect-[2/1] mx-auto relative overflow-hidden bg-secondary rounded-[24px] select-none group",
                  isDraggingImage ? "cursor-grabbing" : "cursor-grab"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (touch) handlePointerDown(touch.clientX, touch.clientY);
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -5 : 5;
                  setZoom(prev => Math.min(200, Math.max(0, prev + delta)));
                }}
              >
                {/* Width-fill: image spans full container width by default */}
                <img
                  src={displayImage || "/assets/coverphoto.jpg"}
                  alt="Current Cover"
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

                {/* Hover Overlay (hidden while dragging) */}
                {!isDraggingImage && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                      <Icon icon="solar:upload-linear" className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-white text-[13px] font-medium font-[family-name:var(--font-poppins)] mt-1 tracking-wide">
                      Change image
                    </span>
                  </div>
                )}
              </div>

              {/* Zoom Slider */}
              <div className="mt-8 max-w-[400px] mx-auto w-full">
                <p className="text-[14px] font-medium text-foreground mb-3">Zoom</p>
                <Slider
                  value={[zoom]}
                  onValueChange={(vals) => setZoom(vals[0])}
                  max={200}
                  step={1}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-center gap-4 mt-10">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  handleCancelPreview();
                  setIsModalOpen(false);
                }}
                disabled={isUploading || isDeleting}
                className="w-[160px] h-[40px] rounded-[24px] border-primary text-primary hover:bg-primary/5 bg-transparent text-[14px] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUploading || isDeleting || !hasImage}
                className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground border-none text-[14px] disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-primary shadow-sm cursor-pointer"
              >
                {isUploading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
