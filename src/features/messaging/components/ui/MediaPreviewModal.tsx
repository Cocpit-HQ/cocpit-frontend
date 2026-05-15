import React, { useEffect, useState } from "react";
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaUrl: string;
    mediaType: "image" | "video" | "document";
    fileName?: string;
}

export default function MediaPreviewModal({
    isOpen,
    onClose,
    mediaUrl,
    mediaType,
    fileName = "download"
}: MediaPreviewModalProps) {
    const [scale, setScale] = useState(1);
    const [isZoomed, setIsZoomed] = useState(false);

    // Reset zoom when media changes or modal opens
    useEffect(() => {
        if (isOpen) {
            setScale(1);
            setIsZoomed(false);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        }
    }, [isOpen, mediaUrl]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    if (!isOpen) return null;

    const handleDownload = async () => {
        try {
            const response = await fetch(mediaUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            // Extract extension from url or type if needed, but blob usually has type
            // Simple name fallback
            a.download = fileName.includes('.') ? fileName : `${fileName}.${mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'pdf'}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error("Download failed:", error);
            // Fallback: Open in new tab
            window.open(mediaUrl, "_blank");
        }
    };

    const toggleZoom = () => {
        if (mediaType !== 'image') return;
        setIsZoomed(!isZoomed);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-md absolute top-0 inset-x-0 z-10 transition-transform">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10 text-white">
                        <X className="w-6 h-6" />
                    </Button>
                    <div className="text-white text-sm font-medium opacity-90 truncate max-w-[200px] md:max-w-md">
                        {fileName}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {mediaType === 'image' && (
                        <Button variant="ghost" size="icon" onClick={toggleZoom} className="rounded-full hover:bg-white/10 text-white hidden md:flex">
                            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleDownload} className="rounded-full hover:bg-white/10 text-white" title="Download">
                        <Download className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div
                className="flex-1 flex items-center justify-center p-4 overflow-hidden relative w-full h-full"
                onClick={(e) => {
                    if (e.target === e.currentTarget) onClose();
                }}
            >
                {mediaType === "image" && (
                    <div
                        className={`transition-transform duration-300 ease-out ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                        style={{ transform: `scale(${scale})` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleZoom();
                        }}
                    >
                        <img
                            src={mediaUrl}
                            alt="Preview"
                            className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl"
                            draggable={false}
                        />
                    </div>
                )}

                {mediaType === "video" && (
                    <div className="w-full max-w-5xl aspect-video bg-black rounded-lg overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <video
                            src={mediaUrl}
                            controls
                            autoPlay
                            className="w-full h-full object-contain"
                        />
                    </div>
                )}

                {mediaType === "document" && (
                    <div className="w-full h-full max-w-5xl pt-16 pb-4 md:py-0" onClick={(e) => e.stopPropagation()}>
                        <iframe
                            src={mediaUrl}
                            className="w-full h-full rounded-lg bg-white shadow-2xl border-none"
                            title="Document Preview"
                        />
                        {/* Fallback overlay in case iframe fails (rare for standard PDFs) */}
                    </div>
                )}
            </div>
        </div>
    );
}
