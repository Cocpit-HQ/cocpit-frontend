import React from 'react';
import { Image as ImageIcon, Plus, X } from 'lucide-react';
import { Icon } from '@iconify/react';
import { MediaCropper } from '../shared/MediaCropper';
import RichTextEditor from '../shared/RichTextEditor';
import { MediaItem } from '../types';
import { Area, MediaSize } from 'react-easy-crop';

interface PhotoFlowProps {
  uploadedImages: MediaItem[];
  activeImageIndex: number;
  setActiveImageIndex: (index: number) => void;
  aspectRatio: number;
  isMobile: boolean;
  isEdit: boolean;
  caption: string;
  onCaptionChange: (html: string) => void;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: Area, croppedAreaPixels: Area) => void;
  onAspectChange: (aspect: number) => void;
  onMediaLoaded?: (mediaSize: MediaSize) => void;
  onCropInteraction?: () => void;
  aspectMode?: '1:1' | '4:5' | '16:9';
  galleryInputRef: React.RefObject<HTMLInputElement | null>;
  isEditingMedia?: boolean;
  setIsEditingMedia?: (isEditing: boolean) => void;
}

const PhotoFlow = ({
  uploadedImages,
  activeImageIndex,
  setActiveImageIndex,
  aspectRatio,
  isMobile,
  isEdit,
  caption,
  onCaptionChange,
  onPhotoUpload,
  onRemoveImage,
  onCropChange,
  onZoomChange,
  onCropComplete,
  onAspectChange,
  onMediaLoaded,
  onCropInteraction,
  aspectMode,
  galleryInputRef,
  isEditingMedia,
  setIsEditingMedia
}: PhotoFlowProps) => {

  const hasImages = uploadedImages.length > 0;

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {!hasImages ? (
          <div className="flex-grow flex flex-col justify-center items-center gap-4">
            {!isEdit && (
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-4 text-lg font-semibold rounded-lg bg-muted hover:bg-muted/90 text-foreground transition-colors"
              >
                <ImageIcon className="w-6 h-6" />
                Upload from Gallery
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <RichTextEditor
              content={caption}
              onChange={onCaptionChange}
              placeholder="Write a caption..."
              className={`bg-transparent border shadow-none ${(isEdit && isEditingMedia) ? 'hidden' : ''}`}
              editorClassName="overflow-y-auto resize-none custom-scrollbar min-h-0"
              style={{ minHeight: '96px', maxHeight: '200px' }}
            />

            <div className="w-full relative group">
              <MediaCropper
                imageSrc={uploadedImages[activeImageIndex]?.url}
                crop={uploadedImages[activeImageIndex]?.crop || { x: 0, y: 0 }}
                zoom={uploadedImages[activeImageIndex]?.zoom || 1}
                aspect={aspectRatio}
                onCropChange={onCropChange}
                onZoomChange={onZoomChange}
                onCropComplete={onCropComplete}
                onAspectChange={onAspectChange}
                onMediaLoaded={onMediaLoaded}
                onCropInteraction={onCropInteraction}
                aspectMode={aspectMode}
                isMobile={true}
                readOnly={isEdit && !isEditingMedia}
              />
              {isEdit && !isEditingMedia && setIsEditingMedia && (
                <button
                  type="button"
                  onClick={() => setIsEditingMedia(true)}
                  className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-100 transition-opacity hover:bg-black/80"
                >
                  <Icon icon="proicons:pencil" className="w-5 h-5" />
                </button>
              )}
            </div>

            {isEdit && isEditingMedia && setIsEditingMedia && (
              <div className="flex justify-between items-center pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditingMedia(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMedia(false)}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md"
                >
                  Next
                </button>
              </div>
            )}

            {(!isEdit || !isEditingMedia) && uploadedImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto py-2">
                {uploadedImages.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${idx === activeImageIndex ? 'border-primary' : 'border-transparent opacity-70'}`}
                    type="button"
                  >
                    <img src={img.url} className="w-full h-full object-cover" alt="Thumbnail" />
                  </button>
                ))}
                {!isEdit && (
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-16 h-16 flex items-center justify-center bg-muted rounded-md border border-dashed border-border flex-shrink-0"
                    type="button"
                  >
                    <Plus className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple onChange={onPhotoUpload} className="hidden" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasImages ? (
        <div className="flex flex-col items-center justify-center h-52 border-2 border-dashed border-border rounded-xl bg-muted/20">
          {!isEdit && (
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <div className="p-4 rounded-full bg-muted">
                <ImageIcon className="w-8 h-8" />
              </div>
              <span className="font-semibold text-lg">Upload photos</span>
            </button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg p-4 space-y-4 bg-background border-border">
          <RichTextEditor
            content={caption}
            onChange={onCaptionChange}
            className={`bg-transparent border-none ${(isEdit && isEditingMedia) ? 'hidden' : ''}`}
            editorClassName="overflow-y-auto resize-none custom-scrollbar min-h-0"
            style={{ minHeight: '96px', maxHeight: '200px' }}
            placeholder="Add a caption..."
          />

          <div className="w-full relative group">
            <MediaCropper
              imageSrc={uploadedImages[activeImageIndex]?.url}
              crop={uploadedImages[activeImageIndex]?.crop || { x: 0, y: 0 }}
              zoom={uploadedImages[activeImageIndex]?.zoom || 1}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropComplete}
              onAspectChange={onAspectChange}
              onMediaLoaded={onMediaLoaded}
              onCropInteraction={onCropInteraction}
              aspectMode={aspectMode}
              isMobile={false}
              readOnly={isEdit && !isEditingMedia}
            />
            {isEdit && !isEditingMedia && setIsEditingMedia && (
              <button
                type="button"
                onClick={() => setIsEditingMedia(true)}
                className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <Icon icon="proicons:pencil" className="w-5 h-5" />
              </button>
            )}
          </div>

          {isEdit && isEditingMedia && setIsEditingMedia && (
            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsEditingMedia(false)}
                className="px-6 py-2 text-sm font-medium text-muted-foreground border border-border hover:bg-muted rounded-full transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setIsEditingMedia(false)}
                className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-full transition-colors"
              >
                Next
              </button>
            </div>
          )}

          {(!isEdit || !isEditingMedia) && (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pb-2 pt-2">
              {uploadedImages.map((img, idx) => (
                <div
                  key={img.id}
                  className={`relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 ${idx === activeImageIndex
                    ? 'border-primary ring-2 ring-primary/20 scale-95 shadow-md'
                    : 'border-transparent hover:border-border/50 hover:shadow-sm hover:scale-[1.02]'
                    }`}
                  onClick={() => setActiveImageIndex(idx)}
                >
                  <img
                    src={img.url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  {!isEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRemoveImage(img.id); }}
                      className="absolute top-1 right-1 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground translate-y-[-10px] group-hover:translate-y-0"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {idx === activeImageIndex && (
                    <div className="absolute inset-0 bg-primary/10 pointer-events-none ring-inset ring-1 ring-primary/20" />
                  )}
                </div>
              ))}
              {!isEdit && (
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="aspect-square flex flex-col items-center justify-center bg-muted/30 rounded-xl border-2 border-dashed border-border hover:bg-muted/50 hover:border-primary/50 transition-all duration-300 group hover:shadow-sm"
                  title="Add more photos"
                >
                  <div className="p-3 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform duration-300 group-hover:text-primary">
                    <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground mt-2 group-hover:text-primary transition-colors">Add</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
      <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple onChange={onPhotoUpload} className="hidden" />
    </div>
  );
};

export default PhotoFlow;
