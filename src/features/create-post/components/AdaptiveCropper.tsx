import React, { useEffect, useRef, useState } from 'react';
import Cropper, { Area, MediaSize } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

type CropPoint = { x: number; y: number };

interface AdaptiveCropperProps {
  image?: string;
  video?: string;
  crop: CropPoint;
  zoom: number;
  rotation?: number;
  aspect: number;
  onCropChange: (crop: CropPoint) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onMediaLoaded?: (mediaSize: MediaSize) => void;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  cropAreaStyle?: React.CSSProperties;
  onInteractionEnd?: () => void;
}

type CropBoxSize = { width: number; height: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function getCropBoxSize(width: number, height: number, aspect: number): CropBoxSize | null {
  if (width <= 0 || height <= 0 || aspect <= 0) return null;

  const containerAspect = width / height;

  if (containerAspect > aspect) {
    return {
      width: height * aspect,
      height,
    };
  }

  return {
    width,
    height: width / aspect,
  };
}

export function AdaptiveCropper({
  image,
  video,
  crop,
  zoom,
  rotation = 0,
  aspect,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onMediaLoaded,
  containerClassName,
  containerStyle,
  cropAreaStyle,
  onInteractionEnd,
}: AdaptiveCropperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [cropSize, setCropSize] = useState<CropBoxSize | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateCropSize = () => {
      setCropSize(getCropBoxSize(element.clientWidth, element.clientHeight, aspect));
    };

    updateCropSize();

    const observer = new ResizeObserver(updateCropSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, [aspect]);

  return (
    <div ref={containerRef} className={containerClassName ?? 'relative w-full h-full'} style={containerStyle}>
      {cropSize && (
        <div
          style={{
            width: cropSize.width,
            height: cropSize.height,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            overflow: 'visible',
          }}
        >
          <Cropper
            image={image}
            video={video}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            cropSize={cropSize}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            showGrid={true}
            restrictPosition={true}
            onInteractionEnd={onInteractionEnd}
            style={{
              containerStyle: { background: 'transparent', overflow: 'visible' },
              cropAreaStyle,
            }}
          />
        </div>
      )}
    </div>
  );
}
