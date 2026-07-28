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
          <div className="relative aspect-[2/1] max-w-[600px] w-full overflow-hidden group bg-[#D9D9D9] mx-auto rounded-[24px]">
            <img src={coverImage} alt="Article cover" className="w-full h-full object-cover" />
            <div className="absolute bottom-3 right-3 z-10 pointer-events-auto flex items-center gap-[10px] p-[8px] w-[78px] h-[40px] bg-[#EEF2FF] rounded-[12px] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl(null);
                  setSelectedFile(null);
                  resetTransforms();
                  setIsModalOpen(true);
                }}
                className="edit-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer"
                title="Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" stroke="#000000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14.44 5.78L4.198 16.02a2 2 0 0 0-.565 1.125l-.553 3.774l3.775-.553A2 2 0 0 0 7.98 19.8L18.22 9.56m-3.78-3.78l2.229-2.23a1.6 1.6 0 0 1 2.263 0l1.518 1.518a1.6 1.6 0 0 1 0 2.263l-2.23 2.23M14.44 5.78l3.78 3.78"/></svg>
              </button>
              <button
                type="button"
                onClick={onRemoveCover}
                className="delete-img-btn flex items-center justify-center w-[24px] h-[24px] rounded cursor-pointer"
                title="Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 16 16"><path fill="#FF6B6B" d="M7 3h2a1 1 0 0 0-2 0M6 3a2 2 0 1 1 4 0h4a.5.5 0 0 1 0 1h-.564l-1.205 8.838A2.5 2.5 0 0 1 9.754 15H6.246a2.5 2.5 0 0 1-2.477-2.162L2.564 4H2a.5.5 0 0 1 0-1zm1 3.5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0zM9.5 6a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-1 0v-5a.5.5 0 0 1 .5-.5m-4.74 6.703A1.5 1.5 0 0 0 6.246 14h3.508a1.5 1.5 0 0 0 1.487-1.297L12.427 4H3.573z"/></svg>
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center bg-[#FFFFFF] dark:bg-card rounded-2xl cursor-pointer p-4 text-center w-full gap-10 aspect-[2/1] max-w-[600px] mx-auto transition-colors hover:bg-gray-50/50 dark:hover:bg-secondary/20"
          >
            <div className="flex flex-col items-center gap-2">
              <h5 className="w-[118px] h-[26px] font-medium text-[18px] leading-[26px] text-[#000000] dark:text-foreground text-center font-poppins">Cover image</h5>
              <p className="w-[255px] h-[16px] font-normal text-[12px] leading-[16px] text-[#6B7280] dark:text-muted-foreground text-center font-poppins">Add a cover image or video to your article.</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Icon
                icon="iconoir:cloud-upload"
                className="w-[40px] h-[40px] text-muted-foreground flex-shrink-0"
              />
              <div className="flex flex-col items-center font-poppins">
                <span className="inline-block font-normal text-[10px] leading-[16px] text-[#6B7280] dark:text-muted-foreground text-center font-poppins">
                  JPG, PNG, WEBP (Max 5MB)
                </span>
                <span className="inline-block max-w-[350px] mt-1 font-normal text-[10px] leading-[16px] text-[#6B7280] dark:text-muted-foreground text-center font-poppins">
                  Recommended: 1200 × 600 px
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
                  className="p-1.5 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
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
