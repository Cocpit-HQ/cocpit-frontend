import React from 'react';
import { Area, MediaSize } from 'react-easy-crop';
import { Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';
import { AdaptiveCropper } from './AdaptiveCropper';

interface MediaCropperProps {
  imageSrc: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onAspectChange: (aspect: number) => void;
  onMediaLoaded?: (mediaSize: MediaSize) => void;
  aspectMode?: '1:1' | '4:5' | '16:9';
  isMobile: boolean;
  readOnly?: boolean;
}

const ASPECT_RATIOS = [
  { value: 1 / 1, label: '1:1', icon: Square },
  { value: 4 / 5, label: '4:5', icon: RectangleVertical },
  { value: 16 / 9, label: '16:9', icon: RectangleHorizontal },
];

export function MediaCropper({
  imageSrc,
  crop,
  zoom,
  aspect,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onAspectChange,
  onMediaLoaded,
  aspectMode = '4:5',
  isMobile,
  readOnly,
}: MediaCropperProps) {
  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Cropper Area */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {readOnly ? (
          <img src={imageSrc} className="w-full h-full object-contain" alt="Post media" />
        ) : (
          <AdaptiveCropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            onMediaLoaded={onMediaLoaded}
            cropAreaStyle={{ border: '2px solid rgba(255, 255, 255, 0.5)' }}
          />
        )}
      </div>

      {/* Controls - Hide if readOnly */}
      {!readOnly && (
        <div className="flex flex-col gap-4 px-2">
          {/* Zoom Control */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground w-12">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center justify-between md:justify-start md:gap-4">
            <span className="text-sm font-medium text-muted-foreground md:w-12">Ratio</span>

            <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
              {ASPECT_RATIOS.map((ratio) => {
                const Icon = ratio.icon;
                const isActive = Math.abs(aspect - ratio.value) < 0.001;

                return (
                  <button
                    key={ratio.label}
                    onClick={() => onAspectChange(ratio.value)}
                    className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                    ${isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                  `}
                    title={ratio.label}
                  >
                    <Icon className="w-4 h-4" />
                    <span className={`${isMobile ? 'hidden' : 'inline'}`}>{ratio.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
