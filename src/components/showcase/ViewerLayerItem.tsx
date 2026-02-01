import React, { useEffect, useRef } from "react"
import { StoryLayer } from "@/types/story-editor"

type ViewerLayerItemProps = {
    layer: StoryLayer;
    isActive: boolean;
    onVideoEnd?: () => void;
    fallbackVideoUrl?: string;
    onVideoProgress?: (progress: number) => void;
}

export const ViewerLayerItem = ({ layer, isActive, onVideoEnd, fallbackVideoUrl, onVideoProgress }: ViewerLayerItemProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasTriggeredEnd = useRef(false);

    // Handle video layer trim logic
    useEffect(() => {
        if (layer.type === 'video' && videoRef.current && isActive) {
            const vid = videoRef.current;
            hasTriggeredEnd.current = false; // Reset on new video

            // Start at trim start
            if (layer.trim) {
                vid.currentTime = layer.trim.start;
            }

            // Wait for video to be ready before playing
            const playVideo = () => {
                if (vid.readyState >= 2) { // HAVE_CURRENT_DATA or better
                    vid.play().catch(err => {
                        // Ignore AbortError (happens when video is interrupted by new load)
                        if (err.name !== 'AbortError') {
                            console.error('Video play failed:', err);
                        }
                    });
                } else {
                    // Wait for loadeddata event
                    vid.addEventListener('loadeddata', () => {
                        vid.play().catch(err => {
                            if (err.name !== 'AbortError') {
                                console.error('Video play failed:', err);
                            }
                        });
                    }, { once: true });
                }
            };

            playVideo();
        }
    }, [layer, isActive]);

    // Determine video source (fallback to Cloudinary URL if blob)
    const getVideoSrc = () => {
        if (layer.type === 'video') {
            // If src is a blob URL, use fallback
            if (layer.src.startsWith('blob:')) {
                return fallbackVideoUrl || layer.src;
            }
            return layer.src;
        }
        return '';
    };

    return (
        <div
            className="absolute origin-center pointer-events-none"
            style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: layer.type === 'text' ? 'auto' : `${layer.width}%`,
                height: layer.type === 'text' ? 'auto' : `${layer.height}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                zIndex: layer.zIndex + 10, // Ensure above background
            }}
        >
            {layer.type === 'text' ? (
                <p style={{
                    color: layer.style.color,
                    fontSize: `${layer.style.fontSize}px`, // This might need viewport scaling adjustment
                    fontWeight: layer.style.fontWeight,
                    fontFamily: layer.style.fontFamily,
                    textAlign: layer.style.textAlign,
                    whiteSpace: 'nowrap',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    padding: '4px'
                }}>
                    {layer.content}
                </p>
            ) : layer.type === 'sticker' ? (
                <img src={layer.src} className="w-full h-full object-contain" alt="sticker" />
            ) : layer.type === 'image' ? (
                /* Image Layer - movable/scalable */
                <img src={layer.src} className="w-full h-full object-contain pointer-events-none" alt="layer" />
            ) : layer.type === 'video' ? (
                <video
                    ref={videoRef}
                    src={getVideoSrc()}
                    className="w-full h-full object-contain pointer-events-none"
                    muted={layer.isMuted}
                    playsInline
                    onTimeUpdate={(e) => {
                        const vid = e.currentTarget;
                        if (layer.trim) {
                            const trimDuration = layer.trim.end - layer.trim.start;
                            const currentTime = vid.currentTime - layer.trim.start;

                            // Update progress
                            if (onVideoProgress && trimDuration > 0) {
                                const percent = Math.min(100, (currentTime / trimDuration) * 100);
                                onVideoProgress(percent);
                            }

                            // Check if we've reached the end of trim
                            if (vid.currentTime >= layer.trim.end && !hasTriggeredEnd.current) {
                                hasTriggeredEnd.current = true;
                                vid.pause();
                                if (onVideoEnd) onVideoEnd();
                            }
                        } else {
                            // No trim, use full duration
                            if (onVideoProgress && vid.duration) {
                                const percent = (vid.currentTime / vid.duration) * 100;
                                onVideoProgress(percent);
                            }
                        }
                    }}
                    onEnded={(e) => {
                        // Natural end (no trim)
                        if (!layer.trim && !hasTriggeredEnd.current) {
                            hasTriggeredEnd.current = true;
                            if (onVideoEnd) onVideoEnd();
                        }
                    }}
                />
            ) : null}
        </div>
    );
};
