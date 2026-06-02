"use client";

import React, { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoryLayer } from "../types/story-editor";

// The canonical reference canvas dimensions (9:16 aspect ratio)
export const CANVAS_W = 390;
export const CANVAS_H = 693;

// ─────────────────────────────────────────────────────────────────────────────
// ViewerLayerItem
// Renders a single story layer inside a fixed CANVAS_W × CANVAS_H coordinate
// space. The parent must be the virtual canvas container (position: relative,
// width: CANVAS_W, height: CANVAS_H) so that percentage positions are stable.
// ─────────────────────────────────────────────────────────────────────────────
export function ViewerLayerItem({
    layer,
    fallbackMedia,
    isActive,
    onVideoEnd,
    onVideoProgress,
    onReady,
}: {
    layer: StoryLayer;
    fallbackMedia?: string;
    isActive?: boolean;
    onVideoEnd?: () => void;
    onVideoProgress?: (pct: number) => void;
    onReady?: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const readyCalledRef = useRef(false);
    const videoEndTriggeredRef = useRef(false);
    const router = useRouter();

    // Reset ready called flag when layer ID changes
    useEffect(() => {
        readyCalledRef.current = false;
    }, [layer.id]);

    const triggerReady = () => {
        if (!readyCalledRef.current) {
            readyCalledRef.current = true;
            onReady?.();
        }
    };

    // Auto-play video layers when active
    useEffect(() => {
        if (layer.type !== "video" || !videoRef.current) return;
        videoEndTriggeredRef.current = false;
        const vid = videoRef.current;
        if (layer.trim) vid.currentTime = layer.trim.start;
        if (isActive !== false) {
            vid.play().catch((err) => {
                if (err.name !== "AbortError") console.error("Video play failed:", err);
            });
        } else {
            vid.pause();
        }
    }, [layer, isActive]);

    const getSource = (): string => {
        if (layer.type === "text" || layer.type === "post") return "";
        // @ts-ignore – all non-text/post layers have .src
        const src: string = layer.src || "";
        if (src.startsWith("blob:") && fallbackMedia) return fallbackMedia;
        return src;
    };

    const handlePostClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (layer.type === "post" && layer.post_data.id) {
            router.push(`/post/${layer.post_data.id}`);
        }
    };

    // Check if video is already ready (e.g., from browser cache)
    useEffect(() => {
        if (layer.type === "video" && videoRef.current) {
            const vid = videoRef.current;
            const checkReady = () => {
                if (vid.readyState >= 2) {
                    triggerReady();
                }
            };
            checkReady();
            vid.addEventListener("loadeddata", checkReady);
            vid.addEventListener("canplay", checkReady);
            return () => {
                vid.removeEventListener("loadeddata", checkReady);
                vid.removeEventListener("canplay", checkReady);
            };
        }
    }, [layer.type, getSource()]);

    // Check if image is already loaded (e.g., from browser cache)
    useEffect(() => {
        if ((layer.type === "sticker" || layer.type === "image") && imgRef.current) {
            const img = imgRef.current;
            const checkLoaded = () => {
                if (img.complete && img.naturalWidth > 0) {
                    triggerReady();
                }
            };
            checkLoaded();
            img.addEventListener("load", checkLoaded);
            return () => {
                img.removeEventListener("load", checkLoaded);
            };
        }
    }, [layer.type, getSource()]);

    const isEmoji = layer.type === "sticker" && !getSource().includes("/");


    const layerStyle: React.CSSProperties = {
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        width: layer.type === "text" ? "auto" : isEmoji ? "auto" : `${layer.width}%`,
        height: layer.type === "text" ? "auto" : isEmoji ? "auto" : `${layer.height}%`,
        transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
        zIndex: layer.zIndex + 10,
    };

    return (
        <div
            className={`absolute origin-center ${layer.type === "post" ? "pointer-events-auto cursor-pointer" : "pointer-events-none"
                }`}
            style={layerStyle}
            onClick={layer.type === "post" ? handlePostClick : undefined}
        >
            {layer.type === "text" ? (
                <p
                    style={{
                        color: layer.style.color,
                        // fontSize stored as px relative to the 390px reference canvas.
                        // Because we render inside the exact same 390px-wide canvas (scaled by CSS),
                        // no conversion is needed.
                        fontSize: `${layer.style.fontSize}px`,
                        fontWeight: layer.style.fontWeight,
                        fontFamily: layer.style.fontFamily,
                        textAlign: layer.style.textAlign,
                        fontStyle: layer.style.fontStyle,
                        whiteSpace: "nowrap",
                        textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                        padding: "4px",
                        minWidth: "50px",
                    }}
                >
                    {layer.content}
                </p>
            ) : layer.type === "video" && getSource() ? (
                <video
                    ref={videoRef}
                    src={getSource()}
                    className="w-full h-full object-contain pointer-events-none"
                    muted={layer.isMuted}
                    autoPlay
                    playsInline
                    crossOrigin="anonymous"
                    onTimeUpdate={(e) => {
                        const vid = e.currentTarget;
                        if (layer.trim) {
                            if (vid.currentTime < layer.trim.start) {
                                vid.currentTime = layer.trim.start;
                            }
                            if (vid.currentTime >= layer.trim.end) {
                                if (onVideoEnd) {
                                    vid.currentTime = layer.trim.end;
                                    vid.pause();
                                    if (!videoEndTriggeredRef.current) {
                                        videoEndTriggeredRef.current = true;
                                        onVideoProgress?.(100);
                                        onVideoEnd();
                                    }
                                    return;
                                }
                                // Fallback (no navigation callback): keep prior looping behavior.
                                vid.currentTime = layer.trim.start;
                            }
                        }
                        if (onVideoProgress && vid.duration) {
                            const trim = layer.trim;
                            const dur = trim ? trim.end - trim.start : vid.duration;
                            const cur = trim
                                ? vid.currentTime - trim.start
                                : vid.currentTime;
                            onVideoProgress(Math.max(0, Math.min(100, (cur / dur) * 100)));
                        }
                    }}
                    onLoadedMetadata={(e) => {
                        videoEndTriggeredRef.current = false;
                        if (layer.trim) e.currentTarget.currentTime = layer.trim.start;
                    }}
                    onLoadedData={() => triggerReady()}
                    onEnded={() => {
                        if (videoEndTriggeredRef.current) return;
                        videoEndTriggeredRef.current = true;
                        onVideoProgress?.(100);
                        onVideoEnd?.();
                    }}
                />
            ) : layer.type === "sticker" && isEmoji ? (
                // Emoji stickers: use a font-size relative to the reference canvas width
                // so they scale identically in editor and viewer.
                <span
                    style={{
                        fontSize: `${CANVAS_W * 0.185}px`, // ≈ 72px at reference width
                        lineHeight: 1,
                        display: "block",
                        userSelect: "none",
                        fontFamily:
                            "Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif",
                    }}
                >
                    {getSource()}
                </span>
            ) : (layer.type === "sticker" || layer.type === "image") && getSource() ? (
                <img
                    ref={imgRef}
                    src={getSource()}
                    draggable={false}
                    className={`w-full h-full select-none ${layer.type === "image" ? "object-cover" : "object-contain"}`}
                    alt=""
                    onLoad={() => triggerReady()}
                    onError={(e) => { e.currentTarget.style.display = 'none'; triggerReady(); }}
                />
            ) : layer.type === "post" ? (
                <div
                    className="w-full h-full bg-white dark:bg-card rounded-xl p-4 shadow-lg border border-border flex flex-col gap-3 overflow-hidden hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
                    onClick={handlePostClick}
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-secondary overflow-hidden shrink-0">
                            {layer.post_data.author?.avatar ? (
                                <img
                                    src={layer.post_data.author.avatar}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-muted-foreground">
                                    {layer.post_data.author?.name?.[0]}
                                </div>
                            )}
                        </div>
                        <div className="text-xs font-bold text-gray-900 dark:text-foreground">
                            {layer.post_data.author?.name}
                        </div>
                    </div>
                    {layer.post_data.content && (
                        <p className="text-xs text-gray-800 dark:text-foreground line-clamp-3 leading-relaxed">
                            {layer.post_data.content}
                        </p>
                    )}
                    {layer.post_data.media?.[0]?.url && (
                        <div className="relative flex-1 min-h-0 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-muted">
                            {layer.post_data.media[0].media_type === "video" ? (
                                <video
                                    src={layer.post_data.media[0].url}
                                    className="w-full h-full object-cover"
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                />
                            ) : (
                                <img
                                    src={layer.post_data.media[0].url}
                                    alt="Post media"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// VirtualLayerCanvas
// A container that renders a CANVAS_W × CANVAS_H inner div scaled to fill
// the available space. Drop ViewerLayerItems inside it.
// ─────────────────────────────────────────────────────────────────────────────
export function VirtualLayerCanvas({
    layers,
    fallbackVideoUrl,
    isActive,
    onVideoEnd,
    onVideoProgress,
    background,
    onReady,
}: {
    layers: StoryLayer[];
    fallbackVideoUrl?: string;
    isActive?: boolean;
    onVideoEnd?: () => void;
    onVideoProgress?: (pct: number) => void;
    background?: string;
    onReady?: () => void;
}) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(1);

    const isTailwindBg = background?.startsWith('bg-') || background?.startsWith('from-');

    const mediaLayersCount = layers.filter(l => l.type === "video" || l.type === "image" || (l.type === "sticker" && l.src && l.src.includes("/"))).length;
    const [readyCount, setReadyCount] = React.useState(0);

    const isReady = mediaLayersCount === 0 || readyCount >= mediaLayersCount;

    // Reset when layers change to prevent infinite loaders
    useEffect(() => {
        setReadyCount(0);
    }, [layers]);

    useEffect(() => {
        if (mediaLayersCount === 0 || readyCount >= mediaLayersCount) {
            onReady?.();
        }
    }, [readyCount, mediaLayersCount, onReady]);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            setScale(Math.min(width / CANVAS_W, height / CANVAS_H));
        };

        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    return (
        // Outer: fills parent, centres the virtual canvas
        <div
            ref={wrapperRef}
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                overflow: "hidden",
            }}
        >
            {/* Virtual fixed-size canvas – same logical size as the editor */}
            <div
                className={isTailwindBg ? background : undefined}
                style={{
                    width: CANVAS_W,
                    height: CANVAS_H,
                    transform: `scale(${scale})`,
                    transformOrigin: "center center",
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                    opacity: isReady ? 1 : 0,
                    transition: "opacity 200ms ease-in-out",
                    background: !isTailwindBg ? (background || "transparent") : undefined,
                }}
            >
                {layers.map((layer) => (
                    <ViewerLayerItem
                        key={layer.id}
                        layer={layer}
                        fallbackMedia={fallbackVideoUrl}
                        isActive={isActive}
                        onVideoEnd={layer.type === "video" ? onVideoEnd : undefined}
                        onVideoProgress={
                            layer.type === "video" ? onVideoProgress : undefined
                        }
                        onReady={() => setReadyCount(c => c + 1)}
                    />
                ))}
            </div>
        </div>
    );
}
