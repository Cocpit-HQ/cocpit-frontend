import { useState, useRef, useCallback, useEffect } from "react";
import { validateImageFile } from "./imageUtils";

export interface UseImageEditorProps {
  allowedTypes?: string[];
  maxSize?: number;
  onValidationError?: (error: string) => void;
  fileProcessMode?: "dataUrl" | "objectUrl"; // avatar uses dataUrl, cover uses objectUrl
  onClickWithoutDrag?: () => void;
  disabled?: boolean;
}

/**
 * Reusable hook managing all editing states, pointer drag/touch calculations, dropzone events,
 * and base64 / ObjectURL file loading.
 */
export function useImageEditor({
  allowedTypes,
  maxSize,
  onValidationError,
  fileProcessMode = "dataUrl",
  onClickWithoutDrag,
  disabled = false,
}: UseImageEditorProps = {}) {
  // Transform State
  const [zoom, setZoom] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);

  // File & Modal States
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modalState, setModalState] = useState<"edit" | "upload">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Interaction States
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  const lastPointer = useRef({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasMoved = useRef(false);

  // Transform resets
  const resetTransforms = useCallback(() => {
    setZoom(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPositionX(0);
    setPositionY(0);
  }, []);

  const handleCancelPreview = useCallback(() => {
    if (previewUrl && fileProcessMode === "objectUrl") {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    resetTransforms();
    setModalState("upload");
  }, [previewUrl, fileProcessMode, resetTransforms]);

  const handleFileProcess = useCallback((file: File) => {
    const validation = validateImageFile(file, allowedTypes, maxSize);
    if (!validation.isValid) {
      if (onValidationError && validation.error) {
        onValidationError(validation.error);
      }
      return;
    }

    if (fileProcessMode === "objectUrl") {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setSelectedFile(file);
      resetTransforms();
      setModalState("edit");
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
        resetTransforms();
        setModalState("edit");
      };
      reader.readAsDataURL(file);
    }
  }, [allowedTypes, maxSize, fileProcessMode, onValidationError, resetTransforms]);

  // Document-level mouse/touch handlers for repositioning
  useEffect(() => {
    if (!isDraggingImage || disabled) return;

    const handleMove = (clientX: number, clientY: number) => {
      const dx = clientX - lastPointer.current.x;
      const dy = clientY - lastPointer.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved.current = true;
      }
      lastPointer.current = { x: clientX, y: clientY };

      const zoomScale = 1 + (zoom / 100);
      let containerWidth = 200;
      let containerHeight = 200;
      if (containerRef.current) {
        containerWidth = containerRef.current.offsetWidth;
        containerHeight = containerRef.current.offsetHeight;
      }

      const maxTranslateX = (containerWidth * zoomScale - containerWidth) / 2;
      const maxTranslateY = (containerHeight * zoomScale - containerHeight) / 2;

      setPositionX((prev) => Math.min(Math.max(prev + dx, -maxTranslateX), maxTranslateX));
      setPositionY((prev) => Math.min(Math.max(prev + dy, -maxTranslateY), maxTranslateY));
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };

    const onEnd = () => {
      setIsDraggingImage(false);
      if (!hasMoved.current && onClickWithoutDrag) {
        onClickWithoutDrag();
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
  }, [isDraggingImage, disabled, onClickWithoutDrag]);

  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    lastPointer.current = { x: clientX, y: clientY };
    hasMoved.current = false;
    setIsDraggingImage(true);
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  }, [handleFileProcess, disabled]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFileProcess, disabled]);

  const openFilePicker = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  // Clamp position when zoom changes
  useEffect(() => {
    const zoomScale = 1 + (zoom / 100);
    let containerWidth = 200;
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

  return {
    zoom,
    setZoom,
    rotation,
    setRotation,
    flipH,
    setFlipH,
    flipV,
    setFlipV,
    positionX,
    setPositionX,
    positionY,
    setPositionY,
    previewUrl,
    setPreviewUrl,
    modalState,
    setModalState,
    selectedFile,
    setSelectedFile,
    isDragOver,
    setIsDragOver,
    isDraggingImage,
    setIsDraggingImage,
    containerRef,
    fileInputRef,
    resetTransforms,
    handleCancelPreview,
    handleFileProcess,
    handlePointerDown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileChange,
    openFilePicker,
  };
}
