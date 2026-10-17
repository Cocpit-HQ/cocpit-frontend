import React, { ForwardedRef } from "react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  displayUrl: string;
  hasImage: boolean;
  zoom: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  positionX: number;
  positionY: number;
  isDragging: boolean;
  onPointerDown: (clientX: number, clientY: number) => void;
  onWheel?: (e: React.WheelEvent) => void;
  showCircle?: boolean;
  circleShadowColor?: string; // e.g., rgba(0, 0, 0, 0.4) vs rgba(217, 217, 217, 0.5)
  showHoverOverlay?: boolean;
  onHoverClick?: () => void;
  className?: string; // customize height/width/borders/radius
  poppinsFamilyClass?: boolean;
  customOverlayClass?: boolean; // Cover modal uses custom overlay structure
}

export const ImagePreview = React.forwardRef(
  (
    {
      displayUrl,
      hasImage,
      zoom,
      rotation,
      flipH,
      flipV,
      positionX,
      positionY,
      isDragging,
      onPointerDown,
      onWheel,
      showCircle = false,
      circleShadowColor = "rgba(0, 0, 0, 0.4)",
      showHoverOverlay = true,
      onHoverClick,
      className,
      poppinsFamilyClass = false,
      customOverlayClass = false,
    }: ImagePreviewProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      onPointerDown(e.clientX, e.clientY);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    };

    const fontClass = poppinsFamilyClass ? "font-[family-name:var(--font-poppins)]" : "font-['Poppins']";

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden select-none group flex items-center justify-center bg-muted border-card shadow-lg",
          isDragging ? "cursor-grabbing" : "cursor-grab",
          className
        )}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onWheel={onWheel}
      >
        {hasImage && (
          <img
            src={displayUrl}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover transition-none pointer-events-none z-[1]"
            draggable={false}
            style={{
              transform: `translate(${positionX}px, ${positionY}px) scale(${1 + zoom / 100}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            }}
          />
        )}

        {/* Perfect Circle Crop Overlay */}
        {showCircle && (
          <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full"
              style={{
                boxShadow: `0 0 0 999px ${circleShadowColor}`,
              }}
            />
          </div>
        )}

        {/* Hover Overlay */}
        {showHoverOverlay && !isDragging && (
          <div
            className={cn(
              "absolute inset-0 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-[3]",
              customOverlayClass ? "bg-black/0 group-hover:bg-black/50 pointer-events-none" : "bg-black/0 group-hover:bg-black/50 cursor-pointer"
            )}
            onClick={onHoverClick}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
              <Icon icon="solar:upload-linear" className="w-5 h-5 text-white" />
            </div>
            <span className={cn("text-white text-[13px] font-medium mt-1", fontClass, customOverlayClass && "tracking-wide")}>
              Change image
            </span>
          </div>
        )}
      </div>
    );
  }
);

ImagePreview.displayName = "ImagePreview";
