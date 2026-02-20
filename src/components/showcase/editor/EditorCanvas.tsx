"use client";

import React, { useRef, useState, useEffect } from 'react';
import { StoryLayer } from '@/types/story-editor';
import { RotateCw, Move, Pencil, Trash2 } from 'lucide-react';

// EditorCanvas Props
type EditorCanvasProps = {
    mediaSrc: string;
    mediaType: 'image' | 'video';
    layers: StoryLayer[];
    activeLayerId: string | null;
    editingLayerId?: string | null;
    onLayerSelect: (id: string | null) => void;
    onSetEditingLayer?: (id: string | null) => void;
    onLayerUpdate: (layer: StoryLayer) => void;
    onLayerDelete?: (id: string) => void;
    onLayerInteractionStart?: () => void;
    background?: string;
    disableBackgroundFallback?: boolean;
};

type DragState = {
    type: 'move' | 'scale' | 'rotate';
    layerId: string;
    startX: number;
    startY: number;
    initial: StoryLayer;
    containerRect: DOMRect;
};

export function EditorCanvas({ mediaSrc, mediaType, layers, activeLayerId, editingLayerId, onLayerSelect, onSetEditingLayer, onLayerUpdate, onLayerDelete, onLayerInteractionStart, background, disableBackgroundFallback = false }: EditorCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const pointerCache = useRef<PointerEvent[]>([]);
    const initialDistance = useRef<number | null>(null);
    const initialRotation = useRef<number | null>(null);

    // Global pointer move/up handlers
    useEffect(() => {
        if (!dragState && pointerCache.current.length === 0) return;

        const onPointerMove = (e: PointerEvent) => {
            if (!containerRef.current) return;

            // Update pointer cache
            const index = pointerCache.current.findIndex((p) => p.pointerId === e.pointerId);
            if (index !== -1) pointerCache.current[index] = e;

            if (pointerCache.current.length === 2 && activeLayerId) {
                // Multi-touch: Pinch-to-zoom and Rotate
                e.preventDefault();
                const p1 = pointerCache.current[0];
                const p2 = pointerCache.current[1];

                const dx = p1.clientX - p2.clientX;
                const dy = p1.clientY - p2.clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                const activeLayer = layers.find(l => l.id === activeLayerId);
                if (!activeLayer) return;

                if (initialDistance.current === null) {
                    initialDistance.current = distance;
                    initialRotation.current = angle;
                    onLayerInteractionStart?.();
                    return;
                }

                const scaleDelta = (distance / initialDistance.current);
                const rotationDelta = angle - (initialRotation.current || 0);

                onLayerUpdate({
                    ...activeLayer,
                    scale: Math.max(0.1, activeLayer.scale * scaleDelta),
                    rotation: (activeLayer.rotation + rotationDelta) % 360,
                });

                initialDistance.current = distance;
                initialRotation.current = angle;
                return;
            }

            if (!dragState) return;
            e.preventDefault();

            const { type, startX, startY, initial, containerRect } = dragState;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Convert pixels to percentage
            const deltaXPercent = (deltaX / containerRect.width) * 100;
            const deltaYPercent = (deltaY / containerRect.height) * 100;

            if (type === 'move') {
                onLayerUpdate({
                    ...initial,
                    x: initial.x + deltaXPercent,
                    y: initial.y + deltaYPercent,
                });
            } else if (type === 'scale') {
                // Simple proportional uniform scaling based on X delta (right corner)
                const scaleDelta = (deltaX / containerRect.width) * 2;
                onLayerUpdate({
                    ...initial,
                    scale: Math.max(0.2, initial.scale + scaleDelta),
                });
            } else if (type === 'rotate') {
                // Calculate angle from center
                const centerY = containerRect.top + (initial.y / 100) * containerRect.height;
                const centerX = containerRect.left + (initial.x / 100) * containerRect.width;

                const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
                const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
                const rotationDelta = currentAngle - startAngle;

                onLayerUpdate({
                    ...initial,
                    rotation: (initial.rotation + rotationDelta) % 360,
                });
            }
        };

        const onPointerUp = (e: PointerEvent) => {
            const index = pointerCache.current.findIndex((p) => p.pointerId === e.pointerId);
            if (index !== -1) pointerCache.current.splice(index, 1);

            if (pointerCache.current.length < 2) {
                initialDistance.current = null;
                initialRotation.current = null;
            }

            if (pointerCache.current.length === 0) {
                setDragState(null);
            }
        };

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('pointercancel', onPointerUp);
        };
    }, [dragState, onLayerUpdate, activeLayerId, layers]);

    const handlePointerDown = (e: React.PointerEvent, layer: StoryLayer, type: 'move' | 'scale' | 'rotate') => {
        // @ts-ignore
        pointerCache.current.push(e.nativeEvent);

        if (pointerCache.current.length > 2) return;

        e.stopPropagation();
        if (!containerRef.current) return;

        // Select layer if not active
        if (layer.id !== activeLayerId) {
            onLayerSelect(layer.id);
        }

        // Trigger history checkpoint
        onLayerInteractionStart?.();

        if (pointerCache.current.length === 1) {
            setDragState({
                type,
                layerId: layer.id,
                startX: e.clientX,
                startY: e.clientY,
                initial: layer,
                containerRect: containerRef.current.getBoundingClientRect()
            });
        }
    };

    // Determine if background is a Tailwind class or custom CSS value
    const isTailwindBg = background?.startsWith('bg-') || background?.startsWith('from-');

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden select-none touch-none ${isTailwindBg ? background : ''}`}
            style={!isTailwindBg ? { background: background || undefined } : {}}
            onPointerDown={() => onLayerSelect(null)} // Deselect
        >
            {/* Background (Blur fallback if no custom background and is image) */}
            {!background && !disableBackgroundFallback && mediaSrc && mediaType === 'image' && (
                <img src={mediaSrc} className="w-full h-full object-cover blur-xl opacity-50 pointer-events-none absolute inset-0" />
            )}

            {!background && !disableBackgroundFallback && mediaSrc && mediaType === 'video' && (
                <video src={mediaSrc} className="w-full h-full object-cover blur-xl opacity-50 pointer-events-none absolute inset-0" />
            )}

            {/* Layers */}
            {layers.map(layer => (
                <LayerItem
                    key={layer.id}
                    layer={layer}
                    isActive={layer.id === activeLayerId}
                    isEditing={layer.id === editingLayerId}
                    onPointerDown={handlePointerDown}
                    onLayerUpdate={onLayerUpdate}
                    onLayerDelete={onLayerDelete}
                    onSetEditing={(editing) => {
                        if (editing) onSetEditingLayer?.(layer.id);
                        else onSetEditingLayer?.(null);
                    }}
                    fallbackMediaSrc={mediaSrc}
                    fallbackMediaType={mediaType}
                />
            ))}

            {/* Safe Area Guides */}
            <div className="absolute inset-x-0 top-[12.5%] border-t border-dashed pointer-events-none" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
            <div className="absolute inset-x-0 bottom-[12.5%] border-b border-dashed pointer-events-none" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        </div>
    );
}

function LayerItem({ layer, isActive, isEditing, onPointerDown, onLayerUpdate, onLayerDelete, onSetEditing, fallbackMediaSrc, fallbackMediaType }: {
    layer: StoryLayer;
    isActive: boolean;
    isEditing: boolean;
    onPointerDown: (e: React.PointerEvent, l: StoryLayer, t: 'move' | 'scale' | 'rotate') => void;
    onLayerUpdate: (layer: StoryLayer) => void;
    onLayerDelete?: (id: string) => void;
    onSetEditing: (editing: boolean) => void;
    fallbackMediaSrc?: string;
    fallbackMediaType?: 'image' | 'video';
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const lastTapTimeRef = useRef(0);

    // Ensure video plays (especially in preview mode)
    useEffect(() => {
        if (layer.type === 'video' && videoRef.current) {
            const vid = videoRef.current;

            // Set initial time if trim exists
            if (layer.trim) {
                vid.currentTime = layer.trim.start;
            }

            // Explicitly play video
            vid.play().catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Video autoplay failed:', err);
                }
            });
        }
    }, [layer]);

    // Get video source with fallback
    const getVideoSrc = () => {
        if (layer.type === 'video') {
            // If layer src is a blob URL and we have a fallback, use it
            if (layer.src.startsWith('blob:') && fallbackMediaSrc && fallbackMediaType === 'video') {
                return fallbackMediaSrc;
            }
            return layer.src;
        }
        return '';
    };

    const handlePointerDownInternal = (e: React.PointerEvent) => {
        // Custom Double Tap Detection because onDoubleClick is unreliable on some touch devices
        const now = Date.now();
        if (now - lastTapTimeRef.current < 300) {
            if (layer.type === 'text') {
                onSetEditing(true);
            }
        }
        lastTapTimeRef.current = now;

        // Pass to parent for drag/select
        onPointerDown(e, layer, 'move');
    };

    return (
        <div
            className="absolute origin-center will-change-transform"
            style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: layer.type === 'text' ? 'auto' : `${layer.width}%`,
                transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
                zIndex: layer.zIndex,
                cursor: 'grab',
            }}
            onPointerDown={handlePointerDownInternal}
        >
            {/* Content */}
            <div
                className={`relative ${isActive && !isEditing ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-black/20' : ''}`}
                onDoubleClick={() => layer.type === 'text' && onSetEditing(true)}
            >
                {layer.type === 'text' ? (
                    isEditing ? (
                        <textarea
                            autoFocus
                            defaultValue={layer.content}
                            className="bg-transparent border-none outline-none resize-none overflow-hidden"
                            style={{
                                color: layer.style.color,
                                fontSize: `${layer.style.fontSize}px`,
                                fontWeight: layer.style.fontWeight,
                                fontFamily: layer.style.fontFamily,
                                textAlign: layer.style.textAlign,
                                whiteSpace: 'pre-wrap', // constrained width
                                padding: '4px',
                                minWidth: '50px'
                            }}
                            onPointerDown={(e) => e.stopPropagation()} // Allow text selection
                            onBlur={(e) => {
                                onSetEditing(false);
                                onLayerUpdate({ ...layer, content: e.target.value });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                }
                            }}
                        />
                    ) : (
                        <p style={{
                            color: layer.style.color,
                            fontSize: `${layer.style.fontSize}px`,
                            fontWeight: layer.style.fontWeight,
                            fontFamily: layer.style.fontFamily,
                            textAlign: layer.style.textAlign,
                            whiteSpace: 'nowrap',
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            padding: '4px',
                            minWidth: '50px'
                        }}>
                            {layer.content}
                        </p>
                    )
                ) : layer.type === 'video' ? (
                    <video
                        ref={videoRef}
                        src={getVideoSrc()}
                        className="w-full h-full object-contain select-none pointer-events-none"
                        muted={layer.isMuted}
                        autoPlay
                        loop
                        playsInline
                        onTimeUpdate={(e) => {
                            if (layer.trim) {
                                const vid = e.currentTarget;
                                // Loop within trim range
                                if (vid.currentTime < layer.trim.start || vid.currentTime >= layer.trim.end) {
                                    vid.currentTime = layer.trim.start;
                                }
                            }
                        }}
                        onLoadedMetadata={(e) => {
                            if (layer.trim) {
                                e.currentTarget.currentTime = layer.trim.start;
                            }
                        }}
                        onEnded={(e) => {
                            // Ensure loop continues
                            if (layer.trim) {
                                e.currentTarget.currentTime = layer.trim.start;
                                e.currentTarget.play();
                            }
                        }}
                    />
                ) : layer.type === 'sticker' && !(layer as any).src?.includes('/') ? (
                    // Emoji sticker: font-size relative to reference canvas width for consistent
                    // rendering in both editor and viewer (both use 390px reference canvas).
                    <span
                        style={{
                            fontSize: `${390 * 0.185}px`,  // ≈72px at 390px canvas = same as ViewerLayerItem
                            lineHeight: 1,
                            display: 'block',
                            userSelect: 'none',
                            fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
                        }}
                    >
                        {(layer as any).src}
                    </span>
                ) : (
                    <img src={(layer as any).src} draggable={false} className="w-full h-full object-contain select-none" />
                )}

                {/* Controls (Only show when active and not editing) */}
                {isActive && !isEditing && (
                    <>
                        {/* Scale Handle (Bottom Right) */}
                        <div
                            data-html2canvas-ignore
                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-nwse-resize z-50 text-black border border-gray-200"
                            onPointerDown={(e) => onPointerDown(e, layer, 'scale')}
                        >
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>

                        {/* Rotate Handle (Top Center) */}
                        <div
                            data-html2canvas-ignore
                            className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50 text-black border border-gray-200"
                            onPointerDown={(e) => onPointerDown(e, layer, 'rotate')}
                        >
                            <RotateCw className="w-3 h-3" />
                        </div>

                        {/* Edit Handle (Top Right) - Text Only */}
                        {layer.type === 'text' && (
                            <div
                                data-html2canvas-ignore
                                className="absolute -top-8 -right-3 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50 text-black border border-gray-200"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    onSetEditing(true);
                                }}
                            >
                                <Pencil className="w-3 h-3" />
                            </div>
                        )}

                        {/* Delete Handle (Bottom Center) */}
                        <div
                            data-html2canvas-ignore
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-red-500 rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50 text-white border border-red-600"
                            onPointerDown={(e) => {
                                e.stopPropagation();
                                if (confirm('Remove this layer?')) {
                                    onLayerDelete?.(layer.id);
                                }
                            }}
                        >
                            <Trash2 className="w-3 h-3" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
