"use client";

import React, { useRef, useState, useEffect } from 'react';
import { StoryLayer } from '@/types/story-editor';
import { RotateCw, Move, Pencil } from 'lucide-react';

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
    onLayerInteractionStart?: () => void;
    background?: string;
};

type DragState = {
    type: 'move' | 'scale' | 'rotate';
    layerId: string;
    startX: number;
    startY: number;
    initial: StoryLayer;
    containerRect: DOMRect;
};

export function EditorCanvas({ mediaSrc, mediaType, layers, activeLayerId, editingLayerId, onLayerSelect, onSetEditingLayer, onLayerUpdate, onLayerInteractionStart, background }: EditorCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);

    // Global pointer move/up handlers
    useEffect(() => {
        if (!dragState) return;

        const onPointerMove = (e: PointerEvent) => {
            e.preventDefault();
            if (!containerRef.current) return;

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

        const onPointerUp = () => {
            setDragState(null);
        };

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        return () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };
    }, [dragState, onLayerUpdate]);

    const handlePointerDown = (e: React.PointerEvent, layer: StoryLayer, type: 'move' | 'scale' | 'rotate') => {
        e.stopPropagation();
        if (!containerRef.current) return;

        // Select layer if not active
        if (layer.id !== activeLayerId) {
            onLayerSelect(layer.id);
        }

        // Trigger history checkpoint
        onLayerInteractionStart?.();

        setDragState({
            type,
            layerId: layer.id,
            startX: e.clientX,
            startY: e.clientY,
            initial: layer,
            containerRect: containerRef.current.getBoundingClientRect()
        });
    };

    // Determine if background is a Tailwind class or custom CSS value
    const isTailwindBg = background?.startsWith('bg-') || background?.startsWith('from-');

    return (
        <div
            ref={containerRef}
            className={`w-full h-full relative overflow-hidden select-none touch-none ${isTailwindBg ? background : 'bg-gray-900'}`}
            style={!isTailwindBg ? { background: background || undefined } : {}}
            onPointerDown={() => onLayerSelect(null)} // Deselect
        >
            {/* Background (Blur fallback if no custom background and is image) */}
            {!background && mediaSrc && mediaType === 'image' && (
                <img src={mediaSrc} className="w-full h-full object-cover blur-xl opacity-50 pointer-events-none absolute inset-0" />
            )}

            {!background && mediaSrc && mediaType === 'video' && (
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
                    onSetEditing={(editing) => {
                        if (editing) onSetEditingLayer?.(layer.id);
                        else onSetEditingLayer?.(null);
                    }}
                    fallbackMediaSrc={mediaSrc}
                    fallbackMediaType={mediaType}
                />
            ))}

            {/* Safe Area Guides */}
            <div className="absolute inset-x-0 top-[12.5%] border-t border-white/20 border-dashed pointer-events-none" />
            <div className="absolute inset-x-0 bottom-[12.5%] border-b border-white/20 border-dashed pointer-events-none" />
        </div>
    );
}

function LayerItem({ layer, isActive, isEditing, onPointerDown, onLayerUpdate, onSetEditing, fallbackMediaSrc, fallbackMediaType }: {
    layer: StoryLayer;
    isActive: boolean;
    isEditing: boolean;
    onPointerDown: (e: React.PointerEvent, l: StoryLayer, t: 'move' | 'scale' | 'rotate') => void;
    onLayerUpdate: (layer: StoryLayer) => void;
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
                ) : (
                    <img src={(layer as any).src} draggable={false} className="w-full h-full object-contain select-none" />
                )}

                {/* Controls (Only show when active and not editing) */}
                {isActive && !isEditing && (
                    <>
                        {/* Scale Handle (Bottom Right) */}
                        <div
                            className="absolute -bottom-3 -right-3 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-nwse-resize z-50 text-black border border-gray-200"
                            onPointerDown={(e) => onPointerDown(e, layer, 'scale')}
                        >
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>

                        {/* Rotate Handle (Top Center) */}
                        <div
                            className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50 text-black border border-gray-200"
                            onPointerDown={(e) => onPointerDown(e, layer, 'rotate')}
                        >
                            <RotateCw className="w-3 h-3" />
                        </div>

                        {/* Edit Handle (Top Right) - Text Only */}
                        {layer.type === 'text' && (
                            <div
                                className="absolute -top-8 -right-3 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center cursor-pointer z-50 text-black border border-gray-200"
                                onPointerDown={(e) => {
                                    e.stopPropagation();
                                    onSetEditing(true);
                                }}
                            >
                                <Pencil className="w-3 h-3" />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
