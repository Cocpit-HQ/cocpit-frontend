import React, { useState, useRef, useCallback, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { X, Loader2, Trash2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

type ModalState = "edit" | "upload";

interface CocpitProfileUploadProps {
    value: string;
    onChange: (value: string) => void;
    trigger?: React.ReactNode;
}

export function CocpitProfileUpload({
    value,
    onChange,
    trigger,
}: CocpitProfileUploadProps) {
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [zoom, setZoom] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [flipH, setFlipH] = useState(false);
    const [flipV, setFlipV] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [modalState, setModalState] = useState<ModalState>("upload");
    const [isDragOver, setIsDragOver] = useState(false);
    const [lastClickTime, setLastClickTime] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (value || previewUrl) {
                setModalState("edit");
                if (value && !previewUrl) {
                    setPreviewUrl(value);
                }
            } else {
                setModalState("upload");
            }
        }
    }, [isOpen]);

    const displayUrl = previewUrl || value || null;
    const hasImage = !!displayUrl;

    const resetTransforms = () => {
        setZoom(0);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
    };

    const handleClose = () => {
        setIsOpen(false);
        setPreviewUrl(null);
        resetTransforms();
    };

    const handleFileProcess = useCallback((file: File) => {
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!validTypes.includes(file.type)) return;
        if (file.size > 5 * 1024 * 1024) return;

        const reader = new FileReader();
        reader.onload = () => {
            setPreviewUrl(reader.result as string);
            resetTransforms();
            setModalState("edit");
        };
        reader.readAsDataURL(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileProcess(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

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

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileProcess(file);
        },
        [handleFileProcess]
    );

    const handleSave = async () => {
        const now = Date.now();
        if (now - lastClickTime < 2000) return;
        setLastClickTime(now);

        const sourceUrl = previewUrl || value;
        if (!sourceUrl) return;

        try {
            setIsUploading(true);

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

            const size = 800;
            canvas.width = size;
            canvas.height = size;

            ctx.clearRect(0, 0, size, size);
            ctx.save();

            ctx.translate(size / 2, size / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

            const imgAspect = img.width / img.height;
            let drawWidth, drawHeight;

            if (imgAspect > 1) {
                drawHeight = size;
                drawWidth = size * imgAspect;
            } else {
                drawWidth = size;
                drawHeight = size / imgAspect;
            }

            const zoomScale = 1 + zoom / 100;
            drawWidth *= zoomScale;
            drawHeight *= zoomScale;

            ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            ctx.restore();

            canvas.toBlob(async (blob) => {
                if (blob) {
                    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
                    onChange(dataUrl);
                    handleClose();
                }
            }, "image/jpeg", 0.95);
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
            setPreviewUrl(null);
            resetTransforms();
            setModalState("upload");
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const defaultTrigger = (
        <div
            className="relative group cursor-pointer"
            onClick={() => setIsOpen(true)}
        >
            <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-muted border-4 border-white">
                {value ? (
                    <img
                        src={value}
                        alt="Profile"
                        className="object-cover w-full h-full"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full w-full bg-primary/10 text-primary text-4xl font-bold">
                        <Icon icon="solar:user-linear" className="w-10 h-10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon icon="solar:upload-linear" className="w-5 h-5 text-white" />
                </div>
            </div>

            {value && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDelete();
                    }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                >
                    <Trash2 className="w-3 h-3 text-white" />
                </button>
            )}
        </div>
    );

    return (
        <>
            <div onClick={() => setIsOpen(true)} className="cursor-pointer">
                {trigger ?? defaultTrigger}
            </div>

            <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
                <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none sm:max-w-[600px] h-[100dvh] sm:h-auto w-full [&>button]:hidden outline-none">
                    <div className="relative bg-white rounded-none sm:rounded-[24px] p-4 sm:p-[32px] w-full h-full sm:h-auto shadow-sm flex flex-col outline-none overflow-y-auto">

                        {/* Desktop close */}
                        <button
                            onClick={handleClose}
                            className="hidden sm:block absolute top-6 right-6 p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                        >
                            <X className="w-6 h-6" strokeWidth={1.5} />
                        </button>

                        {/* Mobile header */}
                        <div className="sm:hidden flex items-center justify-between mb-8 sticky top-0 bg-white z-20 pt-2 pb-4">
                            <button
                                onClick={handleClose}
                                className="p-2 -ml-2 text-foreground hover:bg-secondary rounded-full transition-colors"
                            >
                                <Icon icon="hugeicons:arrow-left-01" className="w-6 h-6" />
                            </button>
                            <DialogTitle className="text-[16px] font-medium font-['Poppins'] text-foreground m-0 p-0">
                                Profile image
                            </DialogTitle>
                            <button
                                onClick={handleSave}
                                disabled={isUploading || isDeleting || !hasImage}
                                className="px-4 py-1.5 rounded-full bg-[#EEF2FF] text-[#6366F1] font-medium text-[14px] disabled:opacity-50 transition-all"
                            >
                                {isUploading ? "..." : "Save"}
                            </button>
                        </div>

                        {/* Desktop title */}
                        <div className="hidden sm:block text-center mb-6 px-4">
                            <DialogTitle className="text-[18px] leading-[26px] font-medium font-['Poppins'] text-[#000000] mb-1">
                                Profile image
                            </DialogTitle>
                            <p className="text-[14px] leading-[20px] font-normal font-['Poppins'] text-[#6B7280]">
                                Square image works best for profile display
                            </p>
                        </div>

                        {/* Content */}
                        <div className="relative min-h-[320px] sm:min-h-[360px] flex flex-col items-center justify-center">

                            {/* Edit state */}
                            <div
                                className={cn(
                                    "absolute inset-0 flex flex-col items-center transition-all duration-300 ease-in-out",
                                    modalState === "edit"
                                        ? "opacity-100 scale-100 pointer-events-auto"
                                        : "opacity-0 scale-95 pointer-events-none"
                                )}
                            >
                                {/* Toolbar */}
                                <div className="flex justify-center items-center gap-4 mb-6">
                                    <button
                                        onClick={() => setFlipV(!flipV)}
                                        className={cn(
                                            "p-1.5 rounded-md transition-colors",
                                            flipV ? "bg-[#6366F1] text-white" : "text-foreground hover:bg-[#EEF2FF]"
                                        )}
                                    >
                                        <Icon icon="hugeicons:flip-top" className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setFlipH(!flipH)}
                                        className={cn(
                                            "p-1.5 rounded-md transition-colors",
                                            flipH ? "bg-[#6366F1] text-white" : "text-foreground hover:bg-[#EEF2FF]"
                                        )}
                                    >
                                        <Icon icon="hugeicons:flip-left" className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setRotation((prev) => (prev + 90) % 360)}
                                        className="p-1.5 text-foreground hover:bg-[#EEF2FF] rounded-md transition-colors"
                                    >
                                        <Icon icon="wordpress:rotate-left" className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                    >
                                        {isDeleting ? (
                                            <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
                                        ) : (
                                            <Trash2 className="w-6 h-6" strokeWidth={1.5} />
                                        )}
                                    </button>
                                </div>

                                {/* Preview */}
                                <div
                                    className="w-[240px] h-[240px] mx-auto relative overflow-hidden bg-muted rounded-md cursor-pointer group"
                                    onClick={() => setModalState("upload")}
                                >
                                    {hasImage && (
                                        <img
                                            src={displayUrl!}
                                            alt="Preview"
                                            className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
                                            style={{
                                                transform: `scale(${1 + zoom / 100}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                                            }}
                                        />
                                    )}
                                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                        <div className="w-full h-full rounded-full ring-[200px] ring-black/40"></div>
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 z-10">
                                        <div className="w-9 h-9 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                                            <Icon icon="solar:upload-linear" className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-white text-[13px] font-medium font-['Poppins'] mt-1">
                                            Change image
                                        </span>
                                    </div>
                                </div>

                                {/* Zoom */}
                                <div className="mt-auto sm:mt-8 max-w-[400px] mx-auto w-full px-4 sm:px-0">
                                    <p className="text-[14px] font-medium text-foreground mb-3 font-['Poppins']">Zoom</p>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-full h-1.5 bg-[#EEF2FF] rounded-full accent-[#6366F1] cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Upload state */}
                            <div
                                className={cn(
                                    "absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 ease-in-out",
                                    modalState === "upload"
                                        ? "opacity-100 scale-100 pointer-events-auto"
                                        : "opacity-0 scale-95 pointer-events-none"
                                )}
                            >
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "w-[320px] sm:w-[380px] cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center py-12 px-6 gap-4",
                                        isDragOver
                                            ? "border-[#6366F1] bg-[#EEF2FF] scale-[1.02]"
                                            : "border-[#DDE3EA] hover:border-[#818CF8] hover:bg-[#EEF2FF]"
                                    )}
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mb-2">
                                        <Icon icon="solar:upload-linear" className="w-8 h-8 text-[#6366F1]" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-[15px] font-medium text-foreground font-['Poppins']">
                                            Click or drag to upload
                                        </p>
                                        <p className="text-[13px] text-[#6B7280] font-['Poppins'] leading-relaxed">
                                            JPG, PNG, WEBP – Max 5MB
                                        </p>
                                        <p className="text-[12px] text-[#9CA3AF] font-['Poppins']">
                                            Recommended size: 400 × 400 px
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop footer */}
                        <div className="hidden sm:flex justify-center gap-4 mt-10">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isUploading || isDeleting}
                                className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[160px] h-[40px] bg-white border border-[#818CF8] rounded-[24px] font-['Poppins'] font-normal text-[14px] text-[#818CF8] hover:bg-[#EEF2FF] transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isUploading || isDeleting || !hasImage}
                                className="box-border flex flex-row justify-center items-center px-[16px] py-[8px] gap-[10px] w-[160px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] font-['Poppins'] font-normal text-[14px] text-white hover:bg-[#4F46E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </span>
                                ) : (
                                    "Save"
                                )}
                            </button>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/jpeg,image/png,image/webp,image/jpg"
                            onChange={handleFileChange}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}