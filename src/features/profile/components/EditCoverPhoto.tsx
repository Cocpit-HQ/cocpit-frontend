"use client";

import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import { uploadCoverPhoto, deleteCoverPhoto } from "../services/profile.service";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type ModalState = "edit" | "upload";

interface EditCoverPhotoProps {
  coverImage: string | null;
  setCoverImage: (image: string | null) => void;
  children?: ReactNode;
  onUpload?: (formData: FormData) => Promise<{ coverUrl: string }>;
  onDelete?: () => Promise<void>;
  portalContainerId?: string;
}

const EditCoverPhoto: React.FC<EditCoverPhotoProps> = ({ coverImage, setCoverImage, children, onUpload, onDelete, portalContainerId }) => {
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
  const [modalState, setModalState] = useState<ModalState>("edit");
  const [isDragOver, setIsDragOver] = useState(false);

  const lastPointer = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const displayImage = previewUrl || coverImage || null;
  const hasImage = !!displayImage;

  // Determine initial state when modal opens
  useEffect(() => {
    if (isModalOpen) {
      resetTransforms();
      if (coverImage || previewUrl) {
        setModalState("edit");
      } else {
        setModalState("upload");
      }
    }
  }, [isModalOpen]);

  const resetTransforms = () => {
    setZoom(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPositionX(0);
    setPositionY(0);
  };

  // Document-level mouse/touch move & up for smooth dragging
  const hasMoved = useRef(false);

  useEffect(() => {
    if (!isDraggingImage) return;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - lastPointer.current.x;
      const dy = clientY - lastPointer.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved.current = true;
      }
      const zoomScale = 1 + (zoom / 100);
      let containerWidth = 800;
      let containerHeight = 200;
      if (containerRef.current) {
        containerWidth = containerRef.current.offsetWidth;
        containerHeight = containerRef.current.offsetHeight;
      }
      const maxTranslateX = (containerWidth * zoomScale - containerWidth) / 2;
      const maxTranslateY = (containerHeight * zoomScale - containerHeight) / 2;

      setPositionX(prev => Math.min(Math.max(prev + dx, -maxTranslateX), maxTranslateX));
      setPositionY(prev => Math.min(Math.max(prev + dy, -maxTranslateY), maxTranslateY));
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };
    const onEnd = () => {
      setIsDraggingImage(false);
      if (!hasMoved.current) {
        openFilePicker();
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
  }, [isDraggingImage]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    lastPointer.current = { x: clientX, y: clientY };
    hasMoved.current = false;
    setIsDraggingImage(true);
  };

  // Clamp position when zoom changes
  useEffect(() => {
    const zoomScale = 1 + (zoom / 100);
    let containerWidth = 800;
    let containerHeight = 200;
    if (containerRef.current) {
      containerWidth = containerRef.current.offsetWidth;
      containerHeight = containerRef.current.offsetHeight;
    }
    const maxTranslateX = (containerWidth * zoomScale - containerWidth) / 2;
    const maxTranslateY = (containerHeight * zoomScale - containerHeight) / 2;

    setPositionX((prev) => Math.min(Math.max(prev, -maxTranslateX), maxTranslateX));
    setPositionY((prev) => Math.min(Math.max(prev, -maxTranslateY), maxTranslateY));
  }, [zoom]);

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    resetTransforms();
  };

  const handleFileProcess = useCallback((file: File) => {
    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Error", description: "Invalid file type. Please upload an image.", variant: "destructive" });
      return;
    }
    // Validate size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Error", description: "File size exceeds 20MB.", variant: "destructive" });
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    resetTransforms();
    setModalState("edit");
  }, [toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFileProcess(file);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  }, [handleFileProcess]);

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

      // Maintain a high resolution aspect ratio (16:3)
      const width = 1920;
      const height = 360;
      canvas.width = width;
      canvas.height = height;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      ctx.translate(width / 2, height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
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

      // Apply position offset scaled to canvas resolution
      const containerEl = containerRef.current;
      const previewWidth = containerEl ? containerEl.offsetWidth : 800;
      const scaleRatio = width / previewWidth;
      const canvasPosX = positionX * scaleRatio;
      const canvasPosY = positionY * scaleRatio;

      ctx.drawImage(img, -drawWidth / 2 + canvasPosX, -drawHeight / 2 + canvasPosY, drawWidth, drawHeight);
      ctx.restore();

      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "cover_photo.jpg", { type: "image/jpeg" });
          const formData = new FormData();
          formData.append("cover", file);

          let response;
          if (onUpload) {
            response = await onUpload(formData);
          } else {
            response = await uploadCoverPhoto(formData);
          }

          setCoverImage(response.coverUrl || (response as any).url);
          queryClient.invalidateQueries({ queryKey: ["my-profile"] });
          toast({ title: "Success", description: "Cover photo updated successfully." });

          handleCancelPreview();
          setIsModalOpen(false);
        }
      }, "image/jpeg", 0.9);

    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to save cover photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (previewUrl) {
      handleCancelPreview();
      if (coverImage) {
        setModalState("edit");
      } else {
        setModalState("upload");
      }
      return;
    }

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete();
      } else {
        await deleteCoverPhoto();
      }
      setCoverImage(null);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast({ title: "Success", description: "Cover photo removed." });
      setPreviewUrl(null);
      setSelectedFile(null);
      resetTransforms();
      setModalState("upload");
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Failed to remove cover photo.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const CoverPhotoModal = (
    <Dialog open={isModalOpen} onOpenChange={(open) => {
      setIsModalOpen(open);
      if (!open) handleCancelPreview();
    }}>
      <DialogContent 
        className="p-0 shadow-none max-w-[800px] sm:rounded-[24px] outline-none [&>button]:hidden"
        portalContainer={portalContainerId ? document.getElementById(portalContainerId) : null}
      >
        <div className="relative bg-card rounded-[24px] p-4 w-[800px] max-w-full flex flex-col outline-none">
          {/* Top Close Row */}
          <div className="flex justify-end w-full">
            <button
              onClick={() => {
                handleCancelPreview();
                setIsModalOpen(false);
              }}
              type="button"
              className="text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" strokeWidth={1} />
            </button>
          </div>

          <div className="text-center mb-6 relative px-4">
            <DialogTitle className="text-[18px] leading-[26px] font-semibold font-[family-name:var(--font-poppins)] text-foreground mb-1">
              Cover image
            </DialogTitle>
            <p className="text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground">
              This will appear at the top of your profile
            </p>
          </div>

          {/* ─── Content Area with Smooth Transition ─── */}
          <div className="relative min-h-[340px] flex flex-col items-center justify-center">

            {/* ═══ EDIT STATE ═══ */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center transition-all duration-300 ease-in-out",
                modalState === "edit"
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              )}
            >
              {/* Transform Toolbar */}
              <div className="flex justify-center items-center gap-4 mb-6">
                <button
                  onClick={() => {
                    setFlipV(!flipV);
                    setFlipH(false);
                  }}
                  className={cn("p-1.5 rounded-md transition-colors", flipV ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")}
                >
                  <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
                </button>
                <button
                  onClick={() => {
                    setFlipH(!flipH);
                    setFlipV(false);
                  }}
                  className={cn("p-1.5 rounded-md transition-colors", flipH ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary")}
                >
                  <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="p-1.5 text-foreground hover:bg-secondary rounded-md transition-colors"
                >
                  <Icon icon="wordpress:rotate-left" className="w-6 h-6" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting || (!coverImage && !previewUrl)}
                  className="p-1.5 text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                >
                  {isDeleting ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} /> : <Icon icon="fluent:delete-32-regular" className="w-6 h-6" />}
                </button>
              </div>

              {/* Image Preview with Drag-to-Reposition */}
              <div
                ref={containerRef}
                className={cn(
                  "w-full aspect-[16/3] mx-auto relative overflow-hidden bg-secondary rounded-[24px] select-none group",
                  isDraggingImage ? "cursor-grabbing" : "cursor-grab"
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handlePointerDown(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  handlePointerDown(touch.clientX, touch.clientY);
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -5 : 5;
                  setZoom(prev => Math.min(100, Math.max(0, prev + delta)));
                }}
              >
                <img
                  src={displayImage || "/assets/coverphoto.jpg"}
                  alt="Current Cover"
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  draggable={false}
                  style={{ transform: `translate(${positionX}px, ${positionY}px) scale(${1 + (zoom / 100)}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})` }}
                />

                {/* ─── Hover Overlay (hidden while dragging) ─── */}
                {!isDraggingImage && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
                    {/* Upload icon */}
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                      <Icon icon="solar:upload-linear" className="w-5 h-5 text-white" />
                    </div>
                    {/* Text */}
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
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* ═══ UPLOAD STATE ═══ */}
            <div
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
                modalState === "upload"
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-95 pointer-events-none"
              )}
            >
              {/* Centered Upload Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFilePicker}
                className={cn(
                  "w-[320px] sm:w-[380px] cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-12 px-6 gap-4",
                  isDragOver
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                )}
              >
                {/* Upload Icon */}
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-2">
                  <Icon icon="solar:upload-linear" className="w-8 h-8 text-primary" />
                </div>

                {/* Text Content */}
                <div className="text-center space-y-2">
                  <p className="text-[15px] font-semibold text-foreground font-[family-name:var(--font-poppins)]">
                    Click or drag to upload
                  </p>
                  <p className="text-[13px] text-muted-foreground font-[family-name:var(--font-poppins)] leading-relaxed">
                    JPG, PNG, WEBP – Max 20MB
                  </p>
                  <p className="text-[12px] text-muted-foreground/70 font-[family-name:var(--font-poppins)] max-w-[340px] leading-relaxed mx-auto">
                    Use a 16:3 banner. Minimum size: 960 x 180 px. Recommended size: 1920 x 360 px for optimal quality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Footer Buttons ─── */}
          <div className="flex justify-center gap-4 mt-10">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleCancelPreview();
                setIsModalOpen(false);
              }}
              disabled={isUploading || isDeleting}
              className="w-[160px] h-[40px] rounded-[24px] border-primary text-primary hover:bg-primary/5 bg-transparent text-[14px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUploading || isDeleting || !hasImage || (!previewUrl && zoom === 0 && rotation === 0 && !flipH && !flipV && positionX === 0 && positionY === 0)}
              className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground border-none text-[14px] disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-primary shadow-sm"
            >
              {isUploading ? "Saving..." : "Save"}
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      <div className="relative w-full h-[160px] bg-muted rounded-[24px] group overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <img src="/assets/coverphoto.jpg" alt="Default Cover" className="w-full h-full object-cover" />
        )}
        {children}

        {/* Avatar Cutout */}
        <div className="absolute left-[12px] md:left-[34px] -bottom-[49px] w-[98px] h-[98px] bg-[#ffffff] rounded-full z-0" />

        <div className="absolute bottom-4 right-4 flex gap-2 z-10 pointer-events-auto">
          {/* Minimal trigger buttons on the cover itself */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer"
            aria-label="Edit cover photo"
          >
            <div className="w-[32px] h-[32px] rounded-full bg-[#6366F1] flex items-center justify-center">
              <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-white" style={{ strokeWidth: '1.5px' }} />
            </div>
          </button>
        </div>
      </div>
      {CoverPhotoModal}
    </>
  );
};

export default EditCoverPhoto;
