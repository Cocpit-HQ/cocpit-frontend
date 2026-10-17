import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import { uploadCoverPhoto, deleteCoverPhoto } from "@/services/api/profile";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

// Import reusable engine items
import { useImageEditor } from "./image-editor/useImageEditor";
import { processImageWithTransforms } from "./image-editor/imageUtils";
import { ImageEditorToolbar } from "./image-editor/ImageEditorToolbar";
import { ImagePreview } from "./image-editor/ImagePreview";
import { BaseImageEditorModal } from "./image-editor/BaseImageEditorModal";

// Reusable local upload dropzone helper
interface ImageUploadDropzoneProps {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  isDragOver: boolean;
  recommendedSizeText?: string;
  poppinsFamilyClass?: boolean;
}

const ImageUploadDropzone: React.FC<ImageUploadDropzoneProps> = ({
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  isDragOver,
  recommendedSizeText = "Recommended size: 400 × 400 px",
  poppinsFamilyClass = false,
}) => {
  const fontClass = poppinsFamilyClass ? "font-[family-name:var(--font-poppins)]" : "font-['Poppins']";
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        "w-[320px] sm:w-[380px] cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-12 px-6 gap-4",
        isDragOver
          ? "border-primary bg-primary/10 scale-[1.02]"
          : "border-border hover:border-primary/50 hover:bg-secondary/50"
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-2">
        <Icon icon="solar:upload-linear" className="w-8 h-8 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <p className={cn("text-[15px] font-medium text-foreground", fontClass, poppinsFamilyClass && "font-semibold")}>
          Click or drag to upload
        </p>
        <p className={cn("text-[13px] text-muted-foreground leading-relaxed", fontClass)}>
          JPG, PNG, WEBP – Max 20MB
        </p>
        <p className={cn("text-[12px] text-muted-foreground/70 max-w-[340px] leading-relaxed mx-auto", fontClass)}>
          {recommendedSizeText}
        </p>
      </div>
    </div>
  );
};


// ──────────────────────────────────────────────────────────────────────────
// 1. COCPIT PROFILE UPLOAD
// ──────────────────────────────────────────────────────────────────────────
export interface CocpitProfileUploadProps {
  value: string;
  onChange: (value: string) => void;
  trigger?: React.ReactNode;
  title?: string;
  showCircle?: boolean;
  portalContainerId?: string;
}

export function CocpitProfileUpload({
  value,
  onChange,
  trigger,
  title = "Profile",
  showCircle = false,
  portalContainerId,
}: CocpitProfileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const editor = useImageEditor({
    onClickWithoutDrag: () => editor.openFilePicker(),
    disabled: isUploading || isDeleting,
  });

  useEffect(() => {
    if (isOpen) {
      if (value || editor.previewUrl) {
        editor.setModalState("edit");
        if (value && !editor.previewUrl) {
          editor.setPreviewUrl(value);
        }
      } else {
        editor.setModalState("upload");
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !value) {
      const timer = setTimeout(() => {
        editor.openFilePicker();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, value]);

  const displayUrl = editor.previewUrl || value || null;
  const hasImage = !!displayUrl;

  const handleClose = () => {
    setIsOpen(false);
    editor.handleCancelPreview();
  };

  const handleSave = async () => {
    const now = Date.now();
    if (now - lastClickTime < 2000) return;
    setLastClickTime(now);

    const sourceUrl = editor.previewUrl || value;
    if (!sourceUrl) return;

    try {
      setIsUploading(true);

      const dataUrl = await processImageWithTransforms({
        sourceUrl,
        zoom: editor.zoom,
        rotation: editor.rotation,
        flipH: editor.flipH,
        flipV: editor.flipV,
        positionX: editor.positionX,
        positionY: editor.positionY,
        previewSizeWidth: editor.containerRef.current?.offsetWidth || 240,
        canvasWidth: 800,
        canvasHeight: 800,
        quality: 0.95,
        outputType: "dataUrl",
      }) as string;

      console.log("CocpitProfileUpload: Saving image, length:", dataUrl.length);
      onChange(dataUrl);
      handleClose();
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      onChange("");
      editor.handleCancelPreview();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const defaultTrigger = (
    <div className="relative group cursor-pointer" onClick={() => setIsOpen(true)}>
      <div className={cn(
        "w-[100px] h-[100px] overflow-hidden bg-muted border-4 border-white relative z-0",
        showCircle ? "rounded-full" : "rounded-[24px]"
      )}>
        {value ? (
          <img src={value} alt="Profile" className="object-cover w-full h-full" />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary text-4xl font-bold">
            <Icon icon="solar:user-linear" className="w-10 h-10" />
          </div>
        )}
        <div className={cn(
          "absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10",
          showCircle ? "rounded-full" : "rounded-[24px]"
        )}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
            <Icon icon="solar:upload-linear" className="w-4 h-4 text-white" />
          </div>
          <span className="text-white text-[10px] font-medium font-['Poppins']">
            Update
          </span>
        </div>
      </div>

      {showCircle && (
        <div className="absolute bottom-0 right-0 z-10 pointer-events-none">
          <div className="w-[28px] h-[28px] rounded-full bg-[#6366F1] flex items-center justify-center shadow-md border-2 border-white hover:bg-[#5558e6] transition-colors cursor-pointer">
            <Icon icon="hugeicons:edit-03" className="w-3.5 h-3.5 text-white" style={{ strokeWidth: '1.5px' }} />
          </div>
        </div>
      )}

      {value && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-20"
        >
          <Icon icon="lucide:trash-2" className="w-3 h-3 text-white" />
        </button>
      )}
    </div>
  );

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {trigger ?? defaultTrigger}
      </div>

      <BaseImageEditorModal
        isOpen={isOpen}
        onClose={handleClose}
        title={`${title} image`}
        descriptionText="Square image works best for profile display"
        poppinsFamilyClass={true}
        animateClasses={true}
        extraContentClass="shadow-none"
        portalContainerId={portalContainerId}
        mobileHeaderSaveButton={
          <button
            onClick={handleSave}
            disabled={
              isUploading ||
              isDeleting ||
              !hasImage ||
              (!editor.previewUrl &&
                editor.zoom === 0 &&
                editor.rotation === 0 &&
                !editor.flipH &&
                !editor.flipV &&
                editor.positionX === 0 &&
                editor.positionY === 0)
            }
            className="px-4 py-1.5 rounded-full bg-secondary text-primary font-medium text-[14px] disabled:opacity-40 disabled:cursor-default transition-all cursor-pointer"
          >
            {isUploading ? "..." : "Save"}
          </button>
        }
        desktopFooter={
          <>
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading || isDeleting}
              className="w-[160px] h-[40px] rounded-[24px] border border-primary text-primary bg-transparent text-[14px] flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                isUploading ||
                isDeleting ||
                !hasImage ||
                (!editor.previewUrl &&
                  editor.zoom === 0 &&
                  editor.rotation === 0 &&
                  !editor.flipH &&
                  !editor.flipV &&
                  editor.positionX === 0 &&
                  editor.positionY === 0)
              }
              className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground border-none text-[14px] disabled:opacity-40 disabled:cursor-default transition-all flex items-center justify-center shadow-sm cursor-pointer"
            >
              {isUploading ? "Saving..." : "Save"}
            </button>
          </>
        }
      >
        <div className="relative min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center">
          {/* Edit state */}
          <div className={cn(
            "absolute inset-0 flex flex-col items-center transition-all duration-300 ease-in-out",
            editor.modalState === "edit" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
          )}>
            <ImageEditorToolbar
              flipH={editor.flipH}
              flipV={editor.flipV}
              onToggleFlipH={() => editor.setFlipH(!editor.flipH)}
              onToggleFlipV={() => editor.setFlipV(!editor.flipV)}
              onRotate={() => editor.setRotation((prev) => (prev + 90) % 360)}
              onDelete={handleDelete}
              isDeleting={isDeleting}
              deleteIconRed={true}
              disableDelete={!value}
            />

            <ImagePreview
              ref={editor.containerRef}
              displayUrl={displayUrl!}
              hasImage={hasImage}
              zoom={editor.zoom}
              rotation={editor.rotation}
              flipH={editor.flipH}
              flipV={editor.flipV}
              positionX={editor.positionX}
              positionY={editor.positionY}
              isDragging={editor.isDraggingImage}
              onPointerDown={editor.handlePointerDown}
              showCircle={showCircle}
              circleShadowColor={showCircle ? "rgba(217, 217, 217, 0.5)" : undefined}
              className={showCircle ? "w-[200px] h-[200px] rounded-none aspect-square flex-shrink-0" : "w-[240px] h-[240px] mx-auto rounded-md"}
              poppinsFamilyClass={true}
              onHoverClick={() => editor.openFilePicker()}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -5 : 5;
                editor.setZoom((prev) => Math.min(100, Math.max(0, prev + delta)));
              }}
            />

            <div className="mt-auto sm:mt-8 max-w-[400px] mx-auto w-full px-4 sm:px-0">
              <p className="text-[14px] font-medium text-foreground mb-3 font-[family-name:var(--font-poppins)]">Zoom</p>
              <Slider
                value={[editor.zoom]}
                onValueChange={(vals) => editor.setZoom(vals[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Upload state */}
          <div className={cn(
            "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
            editor.modalState === "upload" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
          )}>
            <ImageUploadDropzone
              onDragOver={editor.handleDragOver}
              onDragLeave={editor.handleDragLeave}
              onDrop={editor.handleDrop}
              onClick={editor.openFilePicker}
              isDragOver={editor.isDragOver}
              poppinsFamilyClass={true}
            />
          </div>
        </div>

        <input
          type="file"
          ref={editor.fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          onChange={editor.handleFileChange}
        />
      </BaseImageEditorModal>
    </>
  );
}


// ──────────────────────────────────────────────────────────────────────────
// 2. EDIT AVATAR MODAL
// ──────────────────────────────────────────────────────────────────────────
export interface EditAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  portalContainerId?: string;
}

export function EditAvatarModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onUpload,
  onDelete,
  portalContainerId,
}: EditAvatarModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editor = useImageEditor({
    onClickWithoutDrag: () => editor.openFilePicker(),
    disabled: isUploading || isDeleting,
  });

  useEffect(() => {
    if (isOpen) {
      editor.resetTransforms();
      if (currentAvatarUrl || editor.previewUrl) {
        editor.setModalState("edit");
      } else {
        editor.setModalState("upload");
      }
    }
  }, [isOpen]);

  const displayUrl = editor.previewUrl || currentAvatarUrl || null;
  const hasImage = !!displayUrl;

  const handleToggleFlipH = () => {
    editor.setFlipH(!editor.flipH);
    editor.setFlipV(false);
  };

  const handleToggleFlipV = () => {
    editor.setFlipV(!editor.flipV);
    editor.setFlipH(false);
  };

  const handleSave = async () => {
    const sourceUrl = editor.previewUrl || currentAvatarUrl;
    if (!sourceUrl) return;

    try {
      setIsUploading(true);

      const blob = await processImageWithTransforms({
        sourceUrl,
        zoom: editor.zoom,
        rotation: editor.rotation,
        flipH: editor.flipH,
        flipV: editor.flipV,
        positionX: editor.positionX,
        positionY: editor.positionY,
        previewSizeWidth: editor.containerRef.current?.offsetWidth || 200,
        canvasWidth: 800,
        canvasHeight: 800,
        quality: 0.95,
        outputType: "blob",
      }) as Blob;

      const file = new File([blob], "profile_avatar.jpg", { type: "image/jpeg" });
      await onUpload(file);
      onClose();
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      editor.handleCancelPreview();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseImageEditorModal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile image"
      descriptionText="Square image works best for profile display"
      poppinsFamilyClass={true}
      animateClasses={true}
      extraContentClass="shadow-none"
      portalContainerId={portalContainerId}
      mobileHeaderSaveButton={
        <button
          onClick={handleSave}
          disabled={
            isUploading ||
            isDeleting ||
            !hasImage ||
            (!editor.previewUrl &&
              editor.zoom === 0 &&
              editor.rotation === 0 &&
              !editor.flipH &&
              !editor.flipV &&
              editor.positionX === 0 &&
              editor.positionY === 0)
          }
          className="px-4 py-1.5 rounded-full bg-secondary text-primary font-medium text-[14px] disabled:opacity-40 disabled:cursor-default transition-all cursor-pointer"
        >
          {isUploading ? "..." : "Save"}
        </button>
      }
      desktopFooter={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading || isDeleting}
            className="w-[160px] h-[40px] rounded-[24px] border border-primary text-primary bg-transparent text-[14px] flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              isUploading ||
              isDeleting ||
              !hasImage ||
              (!editor.previewUrl &&
                editor.zoom === 0 &&
                editor.rotation === 0 &&
                !editor.flipH &&
                !editor.flipV &&
                editor.positionX === 0 &&
                editor.positionY === 0)
            }
            className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground border-none text-[14px] disabled:opacity-40 disabled:cursor-default transition-all flex items-center justify-center shadow-sm cursor-pointer"
          >
            {isUploading ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      <div className="relative min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center">
        {/* Edit state */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center transition-all duration-300 ease-in-out",
          editor.modalState === "edit" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}>
          <ImageEditorToolbar
            flipH={editor.flipH}
            flipV={editor.flipV}
            onToggleFlipH={handleToggleFlipH}
            onToggleFlipV={handleToggleFlipV}
            onRotate={() => editor.setRotation((prev) => (prev + 90) % 360)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deleteIconRed={true}
            disableDelete={!currentAvatarUrl}
          />

          <ImagePreview
            ref={editor.containerRef}
            displayUrl={displayUrl!}
            hasImage={hasImage}
            zoom={editor.zoom}
            rotation={editor.rotation}
            flipH={editor.flipH}
            flipV={editor.flipV}
            positionX={editor.positionX}
            positionY={editor.positionY}
            isDragging={editor.isDraggingImage}
            onPointerDown={editor.handlePointerDown}
            showCircle={true}
            circleShadowColor="rgba(217, 217, 217, 0.5)"
            className="w-[200px] h-[200px] rounded-none aspect-square flex-shrink-0"
            poppinsFamilyClass={true}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -5 : 5;
              editor.setZoom((prev) => Math.min(100, Math.max(0, prev + delta)));
            }}
          />

          <div className="mt-auto sm:mt-8 max-w-[400px] mx-auto w-full px-4 sm:px-0">
            <p className="text-[14px] font-medium text-foreground mb-3 font-[family-name:var(--font-poppins)]">Zoom</p>
            <Slider
              value={[editor.zoom]}
              onValueChange={(vals) => editor.setZoom(vals[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Upload state */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
          editor.modalState === "upload" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}>
          <ImageUploadDropzone
            onDragOver={editor.handleDragOver}
            onDragLeave={editor.handleDragLeave}
            onDrop={editor.handleDrop}
            onClick={editor.openFilePicker}
            isDragOver={editor.isDragOver}
            poppinsFamilyClass={true}
          />
        </div>
      </div>

      <input
        type="file"
        ref={editor.fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={editor.handleFileChange}
      />
    </BaseImageEditorModal>
  );
}


// ──────────────────────────────────────────────────────────────────────────
// 3. EDIT COVER MODAL
// ──────────────────────────────────────────────────────────────────────────
export interface EditCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoverUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  portalContainerId?: string;
}

export function EditCoverModal({
  isOpen,
  onClose,
  currentCoverUrl,
  onUpload,
  onDelete,
  portalContainerId,
}: EditCoverModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const editor = useImageEditor({
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"],
    fileProcessMode: "objectUrl",
    onClickWithoutDrag: () => editor.openFilePicker(),
    disabled: isUploading || isDeleting,
  });

  useEffect(() => {
    if (isOpen) {
      editor.resetTransforms();
      if (currentCoverUrl || editor.previewUrl) {
        editor.setModalState("edit");
      } else {
        editor.setModalState("upload");
      }
    }
  }, [isOpen]);

  const displayUrl = editor.previewUrl || currentCoverUrl || null;
  const hasImage = !!displayUrl;

  const handleSave = async () => {
    const sourceUrl = editor.previewUrl || currentCoverUrl;
    if (!sourceUrl) return;

    try {
      setIsUploading(true);

      const blob = await processImageWithTransforms({
        sourceUrl,
        zoom: editor.zoom,
        rotation: editor.rotation,
        flipH: editor.flipH,
        flipV: editor.flipV,
        positionX: editor.positionX,
        positionY: editor.positionY,
        previewSizeWidth: editor.containerRef.current?.offsetWidth || 800,
        canvasWidth: 1920,
        canvasHeight: 360,
        quality: 0.9,
        outputType: "blob",
      }) as Blob;

      const file = new File([blob], "cover_photo.jpg", { type: "image/jpeg" });
      await onUpload(file);
      onClose();
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      editor.handleCancelPreview();
    } catch (error) {
      console.error("Delete failed", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <BaseImageEditorModal
      isOpen={isOpen}
      onClose={onClose}
      title="Cover image"
      descriptionText="This will appear at the top of your profile"
      maxWidthClass="sm:max-w-[800px]"
      cardPaddingClass="p-[16px] w-[800px] max-w-full"
      poppinsFamilyClass={true}
      hideCloseButton={false}
      animateClasses={true}
      portalContainerId={portalContainerId}
      desktopFooter={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUploading || isDeleting}
            className="w-[160px] h-[40px] rounded-[24px] border-primary text-primary hover:bg-primary/5 bg-transparent text-[14px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isUploading ||
              isDeleting ||
              !hasImage ||
              (!editor.previewUrl &&
                editor.zoom === 0 &&
                editor.rotation === 0 &&
                !editor.flipH &&
                !editor.flipV &&
                editor.positionX === 0 &&
                editor.positionY === 0)
            }
            className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground border-none text-[14px] disabled:opacity-40 disabled:cursor-default transition-all hover:bg-primary shadow-sm"
          >
            {isUploading ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="relative min-h-[340px] flex flex-col items-center justify-center">
        {/* Edit state */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center transition-all duration-300 ease-in-out",
          editor.modalState === "edit" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}>
          <ImageEditorToolbar
            flipH={editor.flipH}
            flipV={editor.flipV}
            onToggleFlipH={() => {
              editor.setFlipH(!editor.flipH);
              editor.setFlipV(false);
            }}
            onToggleFlipV={() => {
              editor.setFlipV(!editor.flipV);
              editor.setFlipH(false);
            }}
            onRotate={() => editor.setRotation((prev) => (prev + 90) % 360)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deleteIconRed={true}
            disableDelete={!currentCoverUrl}
          />

          <ImagePreview
            ref={editor.containerRef}
            displayUrl={displayUrl!}
            hasImage={hasImage}
            zoom={editor.zoom}
            rotation={editor.rotation}
            flipH={editor.flipH}
            flipV={editor.flipV}
            positionX={editor.positionX}
            positionY={editor.positionY}
            isDragging={editor.isDraggingImage}
            onPointerDown={editor.handlePointerDown}
            className="w-full aspect-[16/3] rounded-[24px]"
            poppinsFamilyClass={true}
            customOverlayClass={true}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -5 : 5;
              editor.setZoom((prev) => Math.min(100, Math.max(0, prev + delta)));
            }}
          />

          <div className="mt-8 max-w-[400px] mx-auto w-full">
            <p className="text-[14px] font-medium text-foreground mb-3 font-[family-name:var(--font-poppins)]">Zoom</p>
            <Slider
              value={[editor.zoom]}
              onValueChange={(vals) => editor.setZoom(vals[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Upload state */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
          editor.modalState === "upload" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}>
          <ImageUploadDropzone
            onDragOver={editor.handleDragOver}
            onDragLeave={editor.handleDragLeave}
            onDrop={editor.handleDrop}
            onClick={editor.openFilePicker}
            isDragOver={editor.isDragOver}
            recommendedSizeText="Use a 16:3 banner. Minimum size: 960 x 180 px. Recommended size: 1920 x 360 px for optimal quality."
            poppinsFamilyClass={true}
          />
        </div>
      </div>

      <input
        type="file"
        ref={editor.fileInputRef}
        onChange={editor.handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />
    </BaseImageEditorModal>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// 4. EDIT COVER PHOTO
// ──────────────────────────────────────────────────────────────────────────
export interface EditCoverPhotoProps {
  coverImage: string | null;
  setCoverImage: (image: string | null) => void;
  children?: ReactNode;
  onUpload?: (formData: FormData) => Promise<{ coverUrl: string }>;
  onDelete?: () => Promise<void>;
  portalContainerId?: string;
}

export const EditCoverPhoto: React.FC<EditCoverPhotoProps> = ({
  coverImage,
  setCoverImage,
  children,
  onUpload,
  onDelete,
  portalContainerId,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const editor = useImageEditor({
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/jpg"],
    onValidationError: (err) => toast({ title: "Error", description: err, variant: "destructive" }),
    fileProcessMode: "objectUrl",
    onClickWithoutDrag: () => editor.openFilePicker(),
    disabled: isUploading || isDeleting,
  });

  useEffect(() => {
    if (isModalOpen) {
      editor.resetTransforms();
      if (coverImage || editor.previewUrl) {
        editor.setModalState("edit");
      } else {
        editor.setModalState("upload");
      }
    }
  }, [isModalOpen]);

  const displayImage = editor.previewUrl || coverImage || null;
  const hasImage = !!displayImage;

  const handleSave = async () => {
    const sourceUrl = editor.previewUrl || coverImage;
    if (!sourceUrl) return;

    try {
      setIsUploading(true);

      const blob = await processImageWithTransforms({
        sourceUrl,
        zoom: editor.zoom,
        rotation: editor.rotation,
        flipH: editor.flipH,
        flipV: editor.flipV,
        positionX: editor.positionX,
        positionY: editor.positionY,
        previewSizeWidth: editor.containerRef.current?.offsetWidth || 800,
        canvasWidth: 1500,
        canvasHeight: 480,
        quality: 0.9,
        outputType: "blob",
      }) as Blob;

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

      editor.handleCancelPreview();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Error", description: "Failed to save cover photo.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete();
      } else {
        await deleteCoverPhoto();
      }
      setCoverImage(null);
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      toast({ title: "Success", description: "Cover photo removed." });
      editor.handleCancelPreview();
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Failed to remove cover photo.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const CoverPhotoModal = (
    <BaseImageEditorModal
      isOpen={isModalOpen}
      onClose={() => {
        setIsModalOpen(false);
        editor.handleCancelPreview();
      }}
      title="Cover image"
      descriptionText="This will appear at the top of your profile"
      maxWidthClass="sm:max-w-[800px]"
      cardPaddingClass="p-[16px] w-[800px] max-w-full"
      poppinsFamilyClass={true}
      hideCloseButton={false}
      animateClasses={true}
      portalContainerId={portalContainerId}
      desktopFooter={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              editor.handleCancelPreview();
              setIsModalOpen(false);
            }}
            disabled={isUploading || isDeleting}
            className="w-[160px] h-[40px] rounded-[24px] border-primary text-primary hover:bg-primary/5 bg-transparent text-[14px]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isUploading ||
              isDeleting ||
              !hasImage ||
              (!editor.previewUrl &&
                editor.zoom === 0 &&
                editor.rotation === 0 &&
                !editor.flipH &&
                !editor.flipV &&
                editor.positionX === 0 &&
                editor.positionY === 0)
            }
            className="w-[160px] h-[40px] rounded-[24px] bg-primary text-primary-foreground border-none text-[14px] disabled:opacity-40 disabled:cursor-default transition-all hover:bg-primary shadow-sm"
          >
            {isUploading ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <div className="relative min-h-[340px] flex flex-col items-center justify-center">
        {/* Edit state */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center transition-all duration-300 ease-in-out",
          editor.modalState === "edit" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}>
          <ImageEditorToolbar
            flipH={editor.flipH}
            flipV={editor.flipV}
            onToggleFlipH={() => {
              editor.setFlipH(!editor.flipH);
              editor.setFlipV(false);
            }}
            onToggleFlipV={() => {
              editor.setFlipV(!editor.flipV);
              editor.setFlipH(false);
            }}
            onRotate={() => editor.setRotation((prev) => (prev + 90) % 360)}
            onDelete={handleDelete}
            isDeleting={isDeleting}
            deleteIconRed={true}
            disableDelete={!coverImage}
          />

          <ImagePreview
            ref={editor.containerRef}
            displayUrl={displayImage || "/assets/coverphoto.jpg"}
            hasImage={hasImage}
            zoom={editor.zoom}
            rotation={editor.rotation}
            flipH={editor.flipH}
            flipV={editor.flipV}
            positionX={editor.positionX}
            positionY={editor.positionY}
            isDragging={editor.isDraggingImage}
            onPointerDown={editor.handlePointerDown}
            className="w-full h-[200px] rounded-[24px]"
            poppinsFamilyClass={true}
            customOverlayClass={true}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -5 : 5;
              editor.setZoom((prev) => Math.min(100, Math.max(0, prev + delta)));
            }}
          />

          <div className="mt-8 max-w-[400px] mx-auto w-full">
            <p className="text-[14px] font-medium text-foreground mb-3 font-[family-name:var(--font-poppins)]">Zoom</p>
            <Slider
              value={[editor.zoom]}
              onValueChange={(vals) => editor.setZoom(vals[0])}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>

        {/* Upload state */}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
          editor.modalState === "upload" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}>
          <ImageUploadDropzone
            onDragOver={editor.handleDragOver}
            onDragLeave={editor.handleDragLeave}
            onDrop={editor.handleDrop}
            onClick={editor.openFilePicker}
            isDragOver={editor.isDragOver}
            recommendedSizeText="Recommended size: 1500 × 480 px"
            poppinsFamilyClass={true}
          />
        </div>
      </div>

      <input
        type="file"
        ref={editor.fileInputRef}
        onChange={editor.handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
      />
    </BaseImageEditorModal>
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
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="cursor-pointer"
            aria-label="Edit cover photo"
          >
            <div className="w-[32px] h-[32px] rounded-full bg-[#6366F1] flex items-center justify-center">
              <Icon icon="hugeicons:edit-03" className="w-6 h-6 text-white" style={{ strokeWidth: "1.5px" }} />
            </div>
          </button>
        </div>
      </div>
      {CoverPhotoModal}
    </>
  );
};