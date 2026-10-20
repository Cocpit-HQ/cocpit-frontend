import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { Dialog, BareDialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  CloseCrossIcon,
  CropIcon,
  FlipIcon,
  RotateIcon,
  ImagePlaceholderIcon,
} from "@/components/icons";
import { cn } from "@/lib/utils";
import { validateImageFile } from "./image-editor/imageUtils";

const FRAME_SIZE = 200; // 200px x 200px

export interface CocpitUserProfileImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  initialFile?: File | null;
  onSave: (dataUrl: string | null, file: File | null) => void;
  onRemove?: () => void;
  hideRemoveButton?: boolean;
  theme?: "dark" | "light";
  shape?: "circle" | "square";
  title?: string;
}

export const CocpitUserProfileImageEditor: React.FC<
  CocpitUserProfileImageEditorProps
> = ({
  isOpen,
  onClose,
  initialImage = null,
  initialFile = null,
  onSave,
  onRemove,
  hideRemoveButton = false,
  theme,
  shape = "circle",
  title = "Add profile photo",
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Transform states
  // zoom: percentage above base 1.0x cover (0 = 1.0x cover, 100 = 2.0x, 150 = 2.5x)
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [isCropMode, setIsCropMode] = useState(false);

  // Interaction states
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef({ x: 0, y: 0 });

  // Load natural dimensions when previewUrl changes
  useEffect(() => {
    if (!previewUrl) {
      setNaturalDimensions(null);
      return;
    }
    const img = new Image();
    img.onload = () => {
      setNaturalDimensions({
        width: img.naturalWidth || FRAME_SIZE,
        height: img.naturalHeight || FRAME_SIZE,
      });
    };
    img.src = previewUrl;
  }, [previewUrl]);

  // Synchronize on open
  useEffect(() => {
    if (isOpen) {
      setIsPhotoRemoved(false);
      if (initialFile) {
        setSelectedFile(initialFile);
        const url = URL.createObjectURL(initialFile);
        setPreviewUrl(url);
      } else {
        setSelectedFile(null);
        setPreviewUrl(initialImage);
      }
      setZoom(0);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setPositionX(0);
      setPositionY(0);
      setIsCropMode(false);
      setIsSaving(false);
    }
  }, [isOpen, initialImage, initialFile]);

  // Calculate exact on-screen geometry with zero blank space
  const geometry = useMemo(() => {
    const nw = naturalDimensions?.width || FRAME_SIZE;
    const nh = naturalDimensions?.height || FRAME_SIZE;
    const isSideways = rotation % 180 !== 0;

    // Dimensions in on-screen orientation
    const effectiveWidth = isSideways ? nh : nw;
    const effectiveHeight = isSideways ? nw : nh;
    const aspect = effectiveWidth / (effectiveHeight || 1);

    // At zoom = 0 (scale = 1.0), image must fully cover FRAME_SIZE x FRAME_SIZE
    let baseScreenWidth: number;
    let baseScreenHeight: number;
    if (aspect >= 1) {
      // Landscape or square: height is clamped to FRAME_SIZE, width is larger
      baseScreenHeight = FRAME_SIZE;
      baseScreenWidth = FRAME_SIZE * aspect;
    } else {
      // Portrait: width is clamped to FRAME_SIZE, height is larger
      baseScreenWidth = FRAME_SIZE;
      baseScreenHeight = FRAME_SIZE / aspect;
    }

    const scale = 1 + zoom / 100;
    const screenWidth = baseScreenWidth * scale;
    const screenHeight = baseScreenHeight * scale;

    // Dimensions of the DOM <img> element in its unrotated local space
    const imgWidth = isSideways ? screenHeight : screenWidth;
    const imgHeight = isSideways ? screenWidth : screenHeight;

    // Strict pan boundaries: image edge can never move inside FRAME_SIZE
    const maxX = Math.max(0, (screenWidth - FRAME_SIZE) / 2);
    const maxY = Math.max(0, (screenHeight - FRAME_SIZE) / 2);

    return {
      aspect,
      screenWidth,
      screenHeight,
      imgWidth,
      imgHeight,
      maxX,
      maxY,
      scale,
    };
  }, [naturalDimensions, rotation, zoom]);

  // Enforce pan limits whenever zoom, rotation, or bounds change
  useEffect(() => {
    setPositionX((prev) =>
      Math.min(Math.max(prev, -geometry.maxX), geometry.maxX),
    );
    setPositionY((prev) =>
      Math.min(Math.max(prev, -geometry.maxY), geometry.maxY),
    );
  }, [geometry.maxX, geometry.maxY]);

  const handleFileProcess = useCallback((file: File) => {
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
      setZoom(0);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setPositionX(0);
      setPositionY(0);
      setIsCropMode(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Drag & drop handlers for empty state
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Dragging to pan image within strict frame limits
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCropMode) return;
    e.preventDefault();
    lastPointer.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isCropMode) return;
    const touch = e.touches[0];
    lastPointer.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - lastPointer.current.x;
      const dy = clientY - lastPointer.current.y;
      lastPointer.current = { x: clientX, y: clientY };

      setPositionX((prev) =>
        Math.min(Math.max(prev + dx, -geometry.maxX), geometry.maxX),
      );
      setPositionY((prev) =>
        Math.min(Math.max(prev + dy, -geometry.maxY), geometry.maxY),
      );
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onEnd = () => setIsDragging(false);

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
  }, [isDragging, geometry.maxX, geometry.maxY]);

  // Mouse wheel / trackpad pinch zoom (never below 0% / 1.0x cover)
  const handleWheel = (e: React.WheelEvent) => {
    if (!isCropMode) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.15;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0), 150));
  };

  // Toolbar actions
  // Crop icon ONLY toggles/activates the Adjust feature (does NOT zoom in/out)
  const handleCropClick = () => {
    if (!previewUrl) return;
    setIsCropMode((prev) => !prev);
  };

  const handleFlip = () => {
    if (!previewUrl) return;
    setFlipH((prev) => !prev);
  };

  const handleRotate = () => {
    if (!previewUrl) return;
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setIsPhotoRemoved(true);
    setNaturalDimensions(null);
    setZoom(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPositionX(0);
    setPositionY(0);
    setIsCropMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!previewUrl) {
      if (isPhotoRemoved || initialImage) {
        onSave(null, null);
        onRemove?.();
      }
      onClose();
      return;
    }

    if (!isDirty && initialImage && !initialFile) {
      onClose();
      return;
    }

    try {
      setIsSaving(true);

      // High-resolution canvas export (600x600)
      const canvasSize = 600;
      const canvas = document.createElement("canvas");
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl;
      });

      const scaleRatio = canvasSize / FRAME_SIZE;
      const drawWidth = geometry.imgWidth * scaleRatio;
      const drawHeight = geometry.imgHeight * scaleRatio;

      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.save();

      // Exactly matches on-screen CSS transform order
      ctx.translate(
        canvasSize / 2 + positionX * scaleRatio,
        canvasSize / 2 + positionY * scaleRatio,
      );
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      ctx.drawImage(
        img,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight,
      );
      ctx.restore();

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) =>
            b ? resolve(b) : reject(new Error("Failed to export image blob")),
          "image/jpeg",
          0.95,
        );
      });

      const file = new File([blob], selectedFile?.name || "profile-photo.jpg", {
        type: "image/jpeg",
      });

      const reader = new FileReader();
      reader.onload = () => {
        onSave(reader.result as string, file);
        onClose();
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to process image transforms:", err);
      onSave(previewUrl, selectedFile);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty =
    Boolean(selectedFile) ||
    isPhotoRemoved ||
    zoom !== 0 ||
    rotation !== 0 ||
    flipH ||
    flipV ||
    positionX !== 0 ||
    positionY !== 0;

  const hasImage = !!previewUrl;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BareDialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto flex justify-center items-center outline-none z-[200]"
      >
        <DialogTitle className="sr-only">Add profile photo</DialogTitle>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileChange}
        />

        {/* Modal Container */}
        <div
          data-theme={theme}
          className="w-[384px] max-w-[calc(100vw-32px)] px-3 py-2 bg-[var(--ds-bg)] rounded-2xl border border-[var(--ds-border)] flex flex-col justify-start items-center gap-5 overflow-hidden text-[var(--ds-text-primary)] select-none font-['DM_Sans'] shadow-2xl relative z-10"
        >
          {/* Header Row */}
          <div className="self-stretch flex justify-between items-center pt-1 px-1">
            <div className="flex flex-col justify-center items-start gap-1">
              <div className="w-auto h-6 text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
                {title}
              </div>
              <div className="w-auto h-4 text-left text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4 flex-none order-1 grow-0">
                Double-click the image to change it
              </div>
            </div>

            {/* Clean Close Cross Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 border-0 outline-none bg-transparent shadow-none text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
              aria-label="Close"
            >
              <CloseCrossIcon
                size={20}
                className="w-5 h-5 text-[var(--ds-text-primary)]"
              />
            </button>
          </div>

          {/* Center Image Area */}
          {!hasImage ? (
            /* Empty State */
            <div
              onClick={openFilePicker}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "flex flex-col justify-start items-center gap-3 cursor-pointer group transition-opacity",
                isDragOver && "opacity-80",
              )}
            >
              <div
                className={cn(
                  "w-[200px] h-[200px] bg-[var(--ds-surface-1)] border border-[var(--ds-border)] flex flex-col justify-center items-center relative overflow-hidden flex-none order-0 grow-0",
                  shape === "square" ? "rounded-2xl" : "rounded-full",
                )}
              >
                {/* Media Box: 80px x 80px */}
                <div className="w-[80px] h-[80px] flex-none order-0 grow-0 relative flex items-center justify-center">
                  <ImagePlaceholderIcon
                    className="w-[65px] h-[55px] text-[var(--ds-text-primary)]"
                  />
                </div>
              </div>

              <div className="w-auto px-2 h-6 text-center text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 group-hover:opacity-80 transition-opacity flex-none order-1 grow-0">
                {shape === "square" ? "Add logo" : "Add photo"}
              </div>
            </div>
          ) : (
            /* Filled State */
            <div className="flex flex-col justify-start items-center gap-2">
              {/* 200px x 200px Image Area with strict boundary clamping */}
              <div className="relative w-[200px] h-[200px] flex-none order-0 grow-0">
                <div
                  ref={containerRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onDoubleClick={openFilePicker}
                  onWheel={handleWheel}
                  className={cn(
                    "relative w-[200px] h-[200px] rounded-2xl overflow-hidden select-none flex items-center justify-center bg-[var(--ds-surface-2)]",
                    isCropMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                  )}
                  title={isCropMode ? "Double-click to change photo, drag to reposition, scroll to Adjust" : "Double-click to change photo"}
                >
                  {/* Perfectly Sized and Centered Image */}
                  <img
                    src={previewUrl}
                    alt="Profile Preview"
                    draggable={false}
                    className="absolute select-none pointer-events-none transition-none"
                    style={{
                      position: "absolute",
                      width: `${geometry.imgWidth}px`,
                      height: `${geometry.imgHeight}px`,
                      maxWidth: "none",
                      maxHeight: "none",
                      left: `calc(50% - ${geometry.imgWidth / 2}px)`,
                      top: `calc(50% - ${geometry.imgHeight / 2}px)`,
                      transform: `translate(${positionX}px, ${positionY}px) rotate(${rotation}deg) scaleX(${
                        flipH ? -1 : 1
                      }) scaleY(${flipV ? -1 : 1})`,
                      transformOrigin: "center center",
                    }}
                  />

                  {/* Circular Mask Overlay (only when shape === 'circle') */}
                  {shape !== "square" && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full"
                        style={{
                          boxShadow: "0 0 0 999px rgba(0, 0, 0, 0.4)",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Figma-Style Crop Overlay (Accent Border + 8 Handles + Dimension Badge) */}
                {isCropMode && (
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
                      200 × 200
                    </div>
                  </div>
                )}
              </div>

              {/* Change / Remove Photo Text Button */}
              {hideRemoveButton ? (
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="w-auto px-2 h-6 text-center text-[var(--ds-accent)] hover:opacity-80 text-base font-medium font-['DM_Sans'] leading-6 cursor-pointer transition-opacity flex-none order-1 grow-0 mt-2"
                >
                  {shape === "square" ? "Change logo" : "Change photo"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="w-auto px-2 h-6 text-center text-[var(--ds-error)] hover:opacity-80 text-base font-medium font-['DM_Sans'] leading-6 cursor-pointer transition-opacity flex-none order-1 grow-0 mt-2"
                >
                  {shape === "square" ? "Remove logo" : "Remove photo"}
                </button>
              )}
            </div>
          )}

          {/* Action Row: Crop, Flip, Rotate */}
          <div className="flex justify-center items-start gap-8">
            {/* Crop (only toggles Adjust feature, never zooms in/out) */}
            <button
              type="button"
              onClick={handleCropClick}
              disabled={!hasImage}
              className={cn(
                "w-10 flex flex-col justify-start items-center gap-2 transition-colors",
                hasImage
                  ? isCropMode
                    ? "text-[var(--ds-accent)] hover:opacity-80 cursor-pointer"
                    : "text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer"
                  : "text-[var(--ds-text-muted)] cursor-default",
              )}
            >
              <CropIcon size={20} className="w-5 h-5" />
              <span className="text-center text-xs font-medium font-['DM_Sans'] leading-4">
                Adjust
              </span>
            </button>

            {/* Flip */}
            <button
              type="button"
              onClick={handleFlip}
              disabled={!hasImage}
              className={cn(
                "w-10 flex flex-col justify-start items-center gap-2 transition-colors",
                hasImage
                  ? "text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer"
                  : "text-[var(--ds-text-muted)] cursor-default",
              )}
            >
              <FlipIcon size={20} className="w-5 h-5" />
              <span className="text-center text-xs font-medium font-['DM_Sans'] leading-4">
                Flip
              </span>
            </button>

            {/* Rotate */}
            <button
              type="button"
              onClick={handleRotate}
              disabled={!hasImage}
              className={cn(
                "w-10 flex flex-col justify-start items-center gap-2 transition-colors",
                hasImage
                  ? "text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer"
                  : "text-[var(--ds-text-muted)] cursor-default",
              )}
            >
              <RotateIcon size={20} className="w-5 h-5" />
              <span className="text-center text-xs font-medium font-['DM_Sans'] leading-4">
                Rotate
              </span>
            </button>
          </div>

          {/* Save Button */}
          <div className="self-stretch flex flex-col justify-center items-end pb-1 px-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={
                isSaving ||
                (!hasImage && !isPhotoRemoved && !initialImage && !initialFile) ||
                (!isDirty && Boolean(initialImage) && !initialFile)
              }
              className="w-16 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 rounded-[100px] flex justify-center items-center transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              <span className="text-white text-base font-medium font-['DM_Sans'] leading-6">
                Save
              </span>
            </button>
          </div>
        </div>
      </BareDialogContent>
    </Dialog>
  );
};

// Aliases to support exact write-in casing and backward compatibility
export type CocpiUserProfileIMageEditorProps =
  CocpitUserProfileImageEditorProps;
export const CocpiUserProfileIMageEditor = CocpitUserProfileImageEditor;
export type CocpitImageEditorProps = CocpitUserProfileImageEditorProps;
export const CocpitImageEditor = CocpitUserProfileImageEditor;

export default CocpitUserProfileImageEditor;
