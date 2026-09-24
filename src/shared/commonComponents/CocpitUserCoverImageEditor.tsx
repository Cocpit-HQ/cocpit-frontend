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

const FRAME_WIDTH = 600;
const FRAME_HEIGHT = 150;
const FRAME_ASPECT = FRAME_WIDTH / FRAME_HEIGHT; // 4:1 (matches profile banner ratio 800x200 / 1200x300)

export interface CocpitUserCoverImageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialImage?: string | null;
  initialFile?: File | null;
  onSave: (dataUrl: string | null, file: File | null) => Promise<void> | void;
  onRemove?: () => void;
  title?: string;
  subtitle?: string;
  theme?: "dark" | "light";
}

export const CocpitUserCoverImageEditor: React.FC<
  CocpitUserCoverImageEditorProps
> = ({
  isOpen,
  onClose,
  initialImage = null,
  initialFile = null,
  onSave,
  onRemove,
  title = "Add banner",
  subtitle = "Double-click the image to change it",
  theme,
}) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
    const [selectedFile, setSelectedFile] = useState<File | null>(initialFile);
    const [isPhotoRemoved, setIsPhotoRemoved] = useState(false);
    const [naturalDimensions, setNaturalDimensions] = useState<{
      width: number;
      height: number;
    } | null>(null);

    // Transform states
    const [zoom, setZoom] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [positionX, setPositionX] = useState(0);
    const [positionY, setPositionY] = useState(0);

    // Crop feature toggle (Figma Adjust mode with 8 handles)
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
          width: img.naturalWidth || FRAME_WIDTH,
          height: img.naturalHeight || FRAME_HEIGHT,
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
      const nw = naturalDimensions?.width || FRAME_WIDTH;
      const nh = naturalDimensions?.height || FRAME_HEIGHT;
      const isSideways = rotation % 180 !== 0;

      // Dimensions in on-screen orientation
      const effectiveWidth = isSideways ? nh : nw;
      const effectiveHeight = isSideways ? nw : nh;
      const imgAspect = effectiveWidth / (effectiveHeight || 1);

      // Image must fully cover FRAME_WIDTH x FRAME_HEIGHT at zoom = 0
      let baseScreenWidth: number;
      let baseScreenHeight: number;
      if (imgAspect >= FRAME_ASPECT) {
        // Wider than 4:1 -> clamp height to FRAME_HEIGHT, width is larger
        baseScreenHeight = FRAME_HEIGHT;
        baseScreenWidth = FRAME_HEIGHT * imgAspect;
      } else {
        // Taller than 4:1 -> clamp width to FRAME_WIDTH, height is larger
        baseScreenWidth = FRAME_WIDTH;
        baseScreenHeight = FRAME_WIDTH / imgAspect;
      }

      const scale = 1 + zoom / 100;
      const screenWidth = baseScreenWidth * scale;
      const screenHeight = baseScreenHeight * scale;

      // Dimensions of the DOM <img> element in its unrotated local space
      const imgWidth = isSideways ? screenHeight : screenWidth;
      const imgHeight = isSideways ? screenWidth : screenHeight;

      // Strict pan boundaries: image edge can never move inside the frame
      const maxX = Math.max(0, (screenWidth - FRAME_WIDTH) / 2);
      const maxY = Math.max(0, (screenHeight - FRAME_HEIGHT) / 2);

      return {
        imgAspect,
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
        Math.min(Math.max(prev, -geometry.maxX), geometry.maxX)
      );
      setPositionY((prev) =>
        Math.min(Math.max(prev, -geometry.maxY), geometry.maxY)
      );
    }, [geometry.maxX, geometry.maxY]);

    const handleFileProcess = useCallback((file: File) => {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        return;
      }
      setSelectedFile(file);
      setIsPhotoRemoved(false);
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
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileProcess(file);
      }
    };

    const openFilePicker = () => {
      fileInputRef.current?.click();
    };

    // Drag-to-pan handlers
    const handlePointerDown = (clientX: number, clientY: number) => {
      if (!previewUrl) return;
      lastPointer.current = { x: clientX, y: clientY };
      setIsDragging(true);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      handlePointerDown(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    useEffect(() => {
      if (!isDragging) return;

      const handlePointerMove = (clientX: number, clientY: number) => {
        const dx = clientX - lastPointer.current.x;
        const dy = clientY - lastPointer.current.y;
        lastPointer.current = { x: clientX, y: clientY };

        setPositionX((prev) =>
          Math.min(Math.max(prev + dx, -geometry.maxX), geometry.maxX)
        );
        setPositionY((prev) =>
          Math.min(Math.max(prev + dy, -geometry.maxY), geometry.maxY)
        );
      };

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault();
        handlePointerMove(e.clientX, e.clientY);
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 1) {
          e.preventDefault();
          handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      };

      const handleEnd = () => setIsDragging(false);

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleEnd);
      };
    }, [isDragging, geometry.maxX, geometry.maxY]);

    // Wheel to zoom
    const handleWheel = (e: React.WheelEvent) => {
      if (!previewUrl) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 5 : -5;
      setZoom((prev) => Math.min(Math.max(prev + delta, 0), 150));
    };

    // Adjust / Crop toggle
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
          await onSave(null, null);
          onRemove?.();
        }
        onClose();
        return;
      }

      try {
        setIsSaving(true);

        // High-resolution canvas export (1200x300 - exact 4:1 banner proportion)
        const canvasWidth = 1200;
        const canvasHeight = 300;
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not get canvas context");

        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = previewUrl;
        });

        const scaleRatio = canvasWidth / FRAME_WIDTH;
        const drawWidth = geometry.imgWidth * scaleRatio;
        const drawHeight = geometry.imgHeight * scaleRatio;

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.save();

        // Exactly matches on-screen CSS transform order
        ctx.translate(
          canvasWidth / 2 + positionX * scaleRatio,
          canvasHeight / 2 + positionY * scaleRatio
        );
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        ctx.drawImage(
          img,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
        ctx.restore();

        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) =>
              b ? resolve(b) : reject(new Error("Failed to export image blob")),
            "image/jpeg",
            0.95
          );
        });

        const file = new File([blob], selectedFile?.name || "cover-banner.jpg", {
          type: "image/jpeg",
        });

        const reader = new FileReader();
        reader.onload = async () => {
          await onSave(reader.result as string, file);
          onClose();
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error("Failed to process cover transforms:", err);
        await onSave(previewUrl, selectedFile);
        onClose();
      } finally {
        setIsSaving(false);
      }
    };

    const hasImage = !!previewUrl;
    const isDirty =
      !!selectedFile ||
      isPhotoRemoved ||
      zoom !== 0 ||
      rotation !== 0 ||
      flipH ||
      flipV ||
      positionX !== 0 ||
      positionY !== 0;

    const canSave = (hasImage && isDirty) || (isPhotoRemoved && !!initialImage);

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <BareDialogContent
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          className="p-0 border-0 bg-transparent shadow-none max-w-none w-auto flex justify-center items-center outline-none z-[200]"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
          />

          {/* Modal Container (700px width as per Figma spec) */}
          <div
            data-theme={theme}
            className="w-[700px] max-w-[95vw] p-3 bg-[var(--ds-bg)] rounded-2xl border border-[var(--ds-border)] flex flex-col justify-start items-center gap-5 overflow-hidden text-[var(--ds-text-primary)] select-none font-['DM_Sans'] shadow-2xl relative z-10"
          >
            {/* Header Row */}
            <div className="self-stretch flex justify-between items-center px-1">
              <div className="flex flex-col justify-center items-start gap-1">
                <div className="w-[89px] h-6 text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6 flex-none order-0 grow-0">
                  {title}
                </div>
                <div className="w-[199px] h-4 text-center text-[var(--ds-text-secondary)] text-xs font-normal font-['DM_Sans'] leading-4 flex-none order-1 grow-0">
                  {subtitle}
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

            {/* Center Banner Image Area */}
            <div className="w-[600px] max-w-full flex flex-col justify-start items-center gap-5">
              {!hasImage ? (
                /* Empty State Matching Figma */
                <>
                  <div
                    onClick={openFilePicker}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "self-stretch h-36 p-2.5 rounded-2xl flex flex-col justify-center items-center gap-3 overflow-hidden cursor-pointer group transition-opacity",
                      isDragOver && "opacity-80"
                    )}
                  >
                    {/* Media Box: 80px x 80px */}
                    <div className="w-[80px] h-[80px] flex-none order-0 grow-0 relative flex items-center justify-center">
                      <ImagePlaceholderIcon
                        className="w-[65px] h-[55px] text-[var(--ds-text-primary)]"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="w-[80px] h-6 text-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 text-base font-medium font-['DM_Sans'] leading-6 cursor-pointer transition-opacity flex-none order-1 grow-0"
                  >
                    Add photo
                  </button>
                </>
              ) : (
                /* Filled State */
                <>
                  {/* 600px x 150px Banner Area (4:1 Aspect Ratio) */}
                  <div className="relative w-[600px] max-w-full h-[150px]">
                    <div
                      ref={containerRef}
                      onMouseDown={handleMouseDown}
                      onTouchStart={handleTouchStart}
                      onDoubleClick={openFilePicker}
                      onWheel={handleWheel}
                      className={cn(
                        "w-full h-full rounded-2xl overflow-hidden relative select-none",
                        isCropMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"
                      )}
                    >
                      {/* Perfectly Sized and Centered Banner Image */}
                      <img
                        src={previewUrl}
                        alt="Banner Preview"
                        draggable={false}
                        className="absolute max-w-none origin-center select-none pointer-events-none transition-transform duration-75"
                        style={{
                          width: `${geometry.imgWidth}px`,
                          height: `${geometry.imgHeight}px`,
                          maxWidth: "none",
                          maxHeight: "none",
                          transform: `translate(${positionX}px, ${positionY}px) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1
                            }) scaleY(${flipV ? -1 : 1})`,
                          transformOrigin: "center center",
                        }}
                      />
                    </div>

                    {/* Crop / Pan Visual Frame Indicator */}
                    {isCropMode && (
                      <div className="absolute inset-0 border-2 border-[var(--ds-accent)] rounded-2xl pointer-events-none">
                        {/* Corner Handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[var(--ds-accent)]" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[var(--ds-accent)]" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[var(--ds-accent)]" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[var(--ds-accent)]" />

                        {/* Center Crosshairs / Rule-of-Thirds */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
                          <div className="border-r border-b border-[var(--ds-accent)]" />
                          <div className="border-r border-b border-[var(--ds-accent)]" />
                          <div className="border-b border-[var(--ds-accent)]" />
                          <div className="border-r border-b border-[var(--ds-accent)]" />
                          <div className="border-r border-b border-[var(--ds-accent)]" />
                          <div className="border-b border-[var(--ds-accent)]" />
                          <div className="border-r border-[var(--ds-accent)]" />
                          <div className="border-r border-[var(--ds-accent)]" />
                          <div />
                        </div>

                        {/* Edge Tick Marks */}
                        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-[var(--ds-accent)]" />
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-1 bg-[var(--ds-accent)]" />
                        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-[var(--ds-accent)]" />
                        <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1 h-4 bg-[var(--ds-accent)]" />
                      </div>
                    )}
                  </div>

                  {/* Remove Photo Text Button */}
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="w-[109px] h-6 text-center text-[var(--ds-error)] hover:opacity-80 text-base font-medium font-['DM_Sans'] leading-6 cursor-pointer transition-opacity flex-none order-1 grow-0"
                  >
                    Remove photo
                  </button>
                </>
              )}
            </div>

            {/* Action Row: Adjust, Flip, Rotate */}
            <div className="inline-flex justify-start items-start gap-2">
              {/* Adjust (Crop Mode) */}
              <button
                type="button"
                onClick={handleCropClick}
                disabled={!hasImage}
                className={cn(
                  "w-10 inline-flex flex-col justify-start items-center gap-2 transition-colors",
                  hasImage
                    ? isCropMode
                      ? "text-[var(--ds-accent)] hover:opacity-80 cursor-pointer"
                      : "text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer"
                    : "text-[var(--ds-text-muted)] cursor-default"
                )}
              >
                <div className="size-5 relative overflow-hidden flex items-center justify-center">
                  <CropIcon size={20} className="w-5 h-5" />
                </div>
                <span className="w-[37px] h-4 text-center text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-1 grow-0">
                  Adjust
                </span>
              </button>

              {/* Flip */}
              <button
                type="button"
                onClick={handleFlip}
                disabled={!hasImage}
                className={cn(
                  "w-10 inline-flex flex-col justify-start items-center gap-2 transition-colors",
                  hasImage
                    ? "text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer"
                    : "text-[var(--ds-text-muted)] cursor-default"
                )}
              >
                <div className="size-5 relative overflow-hidden flex items-center justify-center">
                  <FlipIcon size={20} className="w-5 h-5" />
                </div>
                <span className="h-4 text-center text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-1 grow-0">
                  Flip
                </span>
              </button>

              {/* Rotate */}
              <button
                type="button"
                onClick={handleRotate}
                disabled={!hasImage}
                className={cn(
                  "w-10 inline-flex flex-col justify-start items-center gap-2 transition-colors",
                  hasImage
                    ? "text-[var(--ds-text-primary)] hover:opacity-80 cursor-pointer"
                    : "text-[var(--ds-text-muted)] cursor-default"
                )}
              >
                <div className="size-5 relative overflow-hidden flex items-center justify-center">
                  <RotateIcon size={20} className="w-5 h-5" />
                </div>
                <span className="h-4 text-center text-xs font-medium font-['DM_Sans'] leading-4 flex-none order-1 grow-0">
                  Rotate
                </span>
              </button>
            </div>

            {/* Save Button */}
            <div className="self-stretch flex flex-col justify-center items-end gap-2.5 px-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !canSave}
                className={cn(
                  "w-[68px] h-[36px] px-3 py-1.5 gap-[10px] rounded-[100px] flex justify-center items-center flex-none order-0 grow-0 transition-all",
                  canSave
                    ? "bg-[var(--ds-accent)] text-[var(--ds-text-primary)] hover:opacity-90 cursor-pointer"
                    : "bg-zinc-900 text-stone-500 cursor-default"
                )}
              >
                <span className="text-base font-medium font-['DM_Sans'] leading-6">
                  Save
                </span>
              </button>
            </div>
          </div>
        </BareDialogContent>
      </Dialog>
    );
  };

export default CocpitUserCoverImageEditor;
