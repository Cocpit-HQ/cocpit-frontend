'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Loader2, X, Crop, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Icon } from '@iconify/react';
import { UploadIcon, EditIcon, DeleteIcon } from '@/components/icons';
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
  const [isAdjustActive, setIsAdjustActive] = useState(false);
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
    setIsAdjustActive(false);
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelPreview();
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
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

      const zoomScale = 1 + zoom / 100;
      let containerWidth = 688;
      let containerHeight = 338;
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

      const drawScale = width / containerWidth;
      const drawW = renderedW * zoomScale * drawScale;
      const drawH = renderedH * zoomScale * drawScale;
      const drawX = -drawW / 2 + positionX * drawScale;
      const drawY = -drawH / 2 + positionY * drawScale;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
      ctx.restore();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
      });

      if (!blob) throw new Error("Canvas export failed");

      const processedFile = new File([blob], "article-cover.jpg", {
        type: "image/jpeg",
      });

      const urls = await uploadMedia([processedFile]);
      const raw = urls[0];
      const url = typeof raw === 'object' && raw !== null ? (raw as any).url : raw;

      if (!url) throw new Error("Upload response missing URL");

      onCoverChange(url);
      handleCancelPreview();
      setIsModalOpen(false);
      toast.success("Cover image updated successfully");
    } catch (error) {
      console.error("Cover image upload failed:", error);
      toast.error("Failed to upload cover image. Please try again.");
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
      <div className="w-full flex justify-center">
        {coverImage ? (
          <div className="relative w-[688px] h-[338px] max-w-full overflow-hidden group bg-ds-surface-2 mx-auto rounded-[16px] border border-ds-border">
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
                <EditIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onRemoveCover}
                aria-label="Remove cover image"
                className="flex items-center justify-center w-8 h-8 rounded-lg text-ds-error hover:bg-white/10 transition-colors cursor-pointer"
                title="Remove"
              >
                <DeleteIcon className="w-4 h-4" />
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
            className="relative flex h-[338px] w-[688px] max-w-full flex-col items-center justify-center gap-[12px] rounded-[16px] p-[10px] select-none cursor-pointer group"
          >
            {/* SVG Dashed Border: style dashed 8, 8 1px with 16px border-radius */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="0.5"
                y="0.5"
                width="calc(100% - 1px)"
                height="calc(100% - 1px)"
                style={{ width: 'calc(100% - 1px)', height: 'calc(100% - 1px)' }}
                rx="16"
                stroke="#2C2C33"
                strokeWidth="1"
                strokeDasharray="8 8"
                className="group-hover:stroke-[#726B67] transition-colors"
              />
            </svg>

            {/* Frame 2609567: 215px x 52px, gap 8px */}
            <div className="flex flex-col items-center gap-[8px] w-[215px] h-[52px]">
              <h5 className="font-dm-sans font-normal text-[16px] leading-[24px] text-ds-text-primary text-center">
                Cover image
              </h5>
              <p className="font-dm-sans font-normal text-[14px] leading-[20px] text-ds-text-secondary text-center">
                Add a cover image to your article
              </p>
            </div>

            {/* Upload Icon: 80px x 80px */}
            <div className="w-[80px] h-[80px] flex items-center justify-center">
              <UploadIcon
                className="w-[80px] h-[80px] text-ds-text-primary group-hover:scale-105 transition-transform"
                fill="#FFECE6"
              />
            </div>

            {/* Frame 2609569: 153px x 40px, gap 8px */}
            <div className="flex flex-col items-center gap-[8px] w-[153px] h-[40px]">
              <span className="font-dm-sans font-normal text-[12px] leading-[16px] text-ds-text-secondary text-center whitespace-nowrap">
                JPG, PNG, WEBP (max 5Mb)
              </span>
              <span className="font-dm-sans font-normal text-[12px] leading-[16px] text-ds-text-secondary text-center whitespace-nowrap">
                Expected ratio 16:9
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Banner Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelPreview();
              setIsModalOpen(false);
            }
          }}
        >
          <div
            className="relative box-border flex h-[592px] w-[700px] flex-col items-center justify-between rounded-[16px] border border-ds-border bg-ds-bg p-[12px] shadow-2xl font-dm-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: 674px x 44px */}
            <div className="flex h-[44px] w-[674px] shrink-0 items-center justify-between gap-[16px]">
              <div className="flex h-[44px] w-[199px] flex-col items-start justify-center gap-[4px]">
                <span className="h-[24px] w-[89px] font-dm-sans text-[16px] font-medium leading-[24px] text-ds-text-primary">
                  Add banner
                </span>
                <span className="h-[16px] w-[199px] font-dm-sans text-[12px] font-normal leading-[16px] text-ds-text-secondary">
                  Double-click the image to change it
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleCancelPreview();
                  setIsModalOpen(false);
                }}
                className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-ds-text-primary hover:opacity-75 transition-opacity cursor-pointer border-none bg-transparent p-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Image + controls: w-[600px] flex-col items-center */}
            <div className="flex w-[600px] shrink-0 flex-col items-center gap-[24px]">
              {/* Banner: 600px x 338px */}
              <div className="relative rounded-[16px]">
              <div
                ref={containerRef}
                onDoubleClick={() => fileInputRef.current?.click()}
                onMouseDown={isAdjustActive ? (e) => {
                  e.preventDefault();
                  handlePointerDown(e.clientX, e.clientY);
                } : undefined}
                onTouchStart={isAdjustActive ? (e) => {
                  const touch = e.touches[0];
                  if (touch) handlePointerDown(touch.clientX, touch.clientY);
                } : undefined}
                onWheel={isAdjustActive ? (e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -5 : 5;
                  setZoom(prev => Math.min(200, Math.max(0, prev + delta)));
                } : undefined}
                className={cn(
                  "h-[338px] w-[600px] shrink-0 overflow-hidden rounded-[16px] relative bg-ds-surface-1 select-none",
                  isAdjustActive
                    ? isDraggingImage
                      ? "cursor-grabbing"
                      : "cursor-grab"
                    : "cursor-pointer"
                )}
                title={isAdjustActive ? "Drag to reposition, scroll to zoom" : "Double-click to change image"}
              >
                <img
                  src={displayImage || "/assets/coverphoto.jpg"}
                  alt="Banner"
                  draggable={false}
                  onLoad={(e) => {
                    const el = e.currentTarget;
                    setNaturalImgSize({ w: el.naturalWidth, h: el.naturalHeight });
                  }}
                  className="absolute pointer-events-none select-none w-full h-auto"
                  style={{
                    left: 0,
                    top: '50%',
                    transform: `translateY(calc(-50% + ${positionY}px)) translateX(${positionX}px) scale(${1 + (zoom / 100)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    transformOrigin: '50% 50%',
                  }}
                />

                  {/* Optional visual indicator overlay on hover if not adjusting */}
                  {!isAdjustActive && (
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100 pointer-events-none">
                      <span className="text-white text-[12px] font-dm-sans bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                        Double-click to change
                      </span>
                    </div>
                  )}
                </div>

                {/* Adjust Overlay (Copied from CocpitUserProfileImageEditor) */}
                {isAdjustActive && (
                  <div className="absolute inset-0 pointer-events-none z-20 border border-dashed border-[var(--ds-accent)]">
                    {/* 4 Corner Handles */}
                    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[var(--ds-accent)]" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[var(--ds-accent)]" />
                    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[var(--ds-accent)]" />
                    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[var(--ds-accent)]" />
                    
                    {/* 4 Edge Center Handles */}
                    <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-[var(--ds-accent)]" />
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-1 bg-[var(--ds-accent)]" />
                    <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-3.5 bg-[var(--ds-accent)]" />
                    <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-3.5 bg-[var(--ds-accent)]" />
                    
                    {/* Dimension Badge */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-[var(--ds-accent)] text-white text-[10px] font-semibold font-['DM_Sans'] rounded shadow-md pointer-events-none select-none tracking-tight whitespace-nowrap">
                      1200 × 300
                    </div>
                  </div>
                )}
              </div>

              {/* Remove photo */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || !hasImage}
                className="h-[24px] w-[109px] shrink-0 text-center font-dm-sans text-[16px] font-medium leading-[24px] text-ds-error hover:underline cursor-pointer border-none bg-transparent p-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Removing..." : "Remove photo"}
              </button>

              {/* Tools: 136px x 44px, gap: 8px */}
              <div className="flex h-[44px] w-[136px] items-start justify-center gap-[8px]">
                {/* Adjust */}
                <button
                  type="button"
                  onClick={() => setIsAdjustActive(prev => !prev)}
                  className={cn(
                    "flex h-[44px] w-[40px] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-0 cursor-pointer transition-colors",
                    isAdjustActive ? "text-ds-accent" : "text-ds-text-primary hover:text-ds-accent"
                  )}
                  title="Adjust zoom and position"
                >
                  <div className="flex h-[20px] w-[20px] items-center justify-center">
                    <Crop className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="h-[16px] w-[37px] text-center font-dm-sans text-[12px] font-medium leading-[16px]">
                    Adjust
                  </span>
                </button>

                {/* Flip */}
                <button
                  type="button"
                  onClick={() => setFlipH(prev => !prev)}
                  className="flex h-[44px] w-[40px] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-0 text-ds-text-primary hover:text-ds-accent cursor-pointer transition-colors"
                  title="Flip horizontally"
                >
                  <div className="flex h-[20px] w-[20px] items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M7 5L3.5 8.5M3.5 8.5L7 12M3.5 8.5H16.5" />
                      <path d="M13 15L16.5 11.5M16.5 11.5L13 8M16.5 11.5H3.5" />
                    </svg>
                  </div>
                  <span className="h-[16px] w-[20px] text-center font-dm-sans text-[12px] font-medium leading-[16px]">
                    Flip
                  </span>
                </button>

                {/* Rotate */}
                <button
                  type="button"
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="flex h-[44px] w-[40px] flex-col items-center justify-center gap-[4px] border-none bg-transparent p-0 text-ds-text-primary hover:text-ds-accent cursor-pointer transition-colors"
                  title="Rotate 90 degrees"
                >
                  <div className="flex h-[20px] w-[20px] items-center justify-center">
                    <RefreshCw className="w-4 h-4" strokeWidth={1.8} />
                  </div>
                  <span className="h-[16px] w-[37px] text-center font-dm-sans text-[12px] font-medium leading-[16px]">
                    Rotate
                  </span>
                </button>
              </div>
            </div>

            {/* Save: flex h-[36px] w-[674px] shrink-0 flex-col items-end justify-center gap-[10px] */}
            <div className="flex h-[36px] w-[674px] shrink-0 flex-col items-end justify-center gap-[10px]">
              <button
                type="button"
                onClick={handleSave}
                disabled={isUploading || isDeleting || !hasImage}
                className="flex h-[36px] w-[68px] items-center justify-center gap-[10px] rounded-full bg-ds-accent hover:opacity-90 active:scale-95 px-[12px] py-[6px] font-dm-sans text-[16px] font-medium leading-[24px] text-ds-text-primary border-none outline-none cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
