import React from 'react';
import Cropper from 'react-easy-crop';
import { Slider } from '@/components/ui/slider'; // Assuming we have shadcn UI components, otherwise standard input
import { Monitor, Smartphone, Grid, Crop, Square, RectangleHorizontal, RectangleVertical } from 'lucide-react';

interface MediaCropperProps {
  imageSrc: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: any, croppedAreaPixels: any) => void;
  onAspectChange: (aspect: number) => void;
  isMobile: boolean;
  readOnly?: boolean;
  fitMode: 'cover' | 'contain';
  onFitModeChange: (mode: 'cover' | 'contain') => void;
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
  isMobile,
  readOnly,
  fitMode,
  onFitModeChange,
}: MediaCropperProps) {
  return (
    <div className="flex flex-col h-full w-full gap-4">
      {/* Cropper Area */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-black rounded-lg overflow-hidden flex items-center justify-center">
        {readOnly ? (
          <img src={imageSrc} className="w-full h-full object-contain" alt="Post media" />
        ) : fitMode === 'contain' ? (
          // Contain Mode: Show image respecting aspect ratio with padding
          // We create a container with the target aspect ratio, centered in the viewing area
          <div
            className="relative flex items-center justify-center bg-black"
            style={{
              width: aspect >= 1 ? '100%' : 'auto',
              height: aspect < 1 ? '100%' : 'auto',
              aspectRatio: `${aspect}`,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
          >
            <img
              src={imageSrc}
              className="max-w-full max-h-full object-contain"
              alt="Post media"
            />
          </div>
        ) : (
          // Cover Mode: Standard Cropper
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropComplete}
            showGrid={true}
            objectFit="contain" // This ensures initial load is sane, but zoom allows covering
            style={{
              containerStyle: { background: '#000' },
              cropAreaStyle: { border: '2px solid rgba(255, 255, 255, 0.5)' },
            }}
          />
        )}
      </div>

      {/* Controls - Hide if readOnly */}
      {!readOnly && (
        <div className="flex flex-col gap-4 px-2">
          {/* Zoom Control - Only for Cover mode */}
          {fitMode === 'cover' && (
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
          )}

          {/* Fit/Fill Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground w-12">Mode</span>
            <div className="flex bg-muted/50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => onFitModeChange('cover')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${fitMode === 'cover' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Fill
              </button>
              <button
                type="button"
                onClick={() => onFitModeChange('contain')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${fitMode === 'contain' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Fit
              </button>
            </div>
          </div>

          {/* Aspect Ratio Selector */}
          <div className="flex items-center justify-between md:justify-start md:gap-4">
            <span className="text-sm font-medium text-muted-foreground md:w-12">Ratio</span>

            <div className="flex gap-2 bg-muted/50 p-1 rounded-lg">
              {ASPECT_RATIOS.map((ratio) => {
                const Icon = ratio.icon;
                const isActive = aspect === ratio.value;

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
