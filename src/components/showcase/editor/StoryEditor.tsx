"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Undo, Type, Smile, Crop, Palette, Volume2, VolumeX } from 'lucide-react';
import { StoryMetadata, StoryLayer } from '@/types/story-editor';
import { useStoryHistory } from '@/components/showcase/hooks/use-story-history';
import { EditorCanvas } from '@/components/showcase/editor/EditorCanvas';
import { StickerPicker } from '@/components/showcase/editor/StickerPicker';
import { v4 as uuidv4 } from "uuid";
import type { StickerSelection } from '@/components/showcase/editor/StickerPicker';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/canvasUtils';
import { CANVAS_W, CANVAS_H } from '@/components/showcase/ViewerLayerItem';

// Helper to deep copy layers to avoid mutation issues
const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

type StoryEditorProps = {
    file: File | string; // File object or URL
    initialMetadata?: StoryMetadata;
    onSave: (file: File | Blob | string, metadata: StoryMetadata) => void;
    onCancel: () => void;
    disableBackgroundFallback?: boolean;
};

export function StoryEditor({ file, initialMetadata, onSave, onCancel, disableBackgroundFallback = false }: StoryEditorProps) {
    const defaultMetadata: StoryMetadata = {
        version: "1.0",
        layers: [],
    };

    const { layers, undo, pushState, replaceState, canUndo } = useStoryHistory(initialMetadata?.layers || []);
    const [metadata, setMetadata] = useState<StoryMetadata>(initialMetadata || defaultMetadata);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<'none' | 'text' | 'sticker' | 'crop' | 'filter' | 'background'>('none');
    const [showStickerPicker, setShowStickerPicker] = useState(false);

    // Fixed virtual canvas scaling
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const [canvasScale, setCanvasScale] = useState(1);

    useEffect(() => {
        const el = canvasWrapperRef.current;
        if (!el) return;
        const update = () => {
            const { width, height } = el.getBoundingClientRect();
            setCanvasScale(Math.min(width / CANVAS_W, height / CANVAS_H));
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Media State
    const [mediaSrc, setMediaSrc] = useState<string>("");
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    const [currentMediaBlob, setCurrentMediaBlob] = useState<File | Blob | null>(null);

    // Crop State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<number | undefined>(9 / 16);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleCropSave = async () => {
        try {
            const croppedBlob = await getCroppedImg(
                mediaSrc, 
                croppedAreaPixels, 
                rotation,
                undefined,
                typeof file !== 'string' ? file.type : undefined
            );
            setCurrentMediaBlob(croppedBlob);
            const croppedImage = URL.createObjectURL(croppedBlob);

            setMediaSrc(croppedImage);

            // Update Main Image Layer if it exists
            const mainLayerIndex = layers.findIndex(l => l.id === 'main-image');
            if (mainLayerIndex !== -1) {
                const updatedLayers = [...layers];
                (updatedLayers[mainLayerIndex] as any).src = croppedImage;
                pushState(updatedLayers);
            }

            setActiveTool('none');
            setRotation(0);
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        } catch (e) {
            console.error('Failed to crop image', e);
        }
    };

    useEffect(() => {
        if (typeof file === 'string') {
            setMediaSrc(file);
            setMediaType(file.endsWith('.mp4') ? 'video' : 'image');
        } else if (file instanceof File) {
            setCurrentMediaBlob(file);
            const url = URL.createObjectURL(file);
            setMediaSrc(url);
            setMediaType(file.type.startsWith('video') ? 'video' : 'image');
            // NOTE: Do NOT revoke this URL on cleanup — initialMetadata.layers
            // may reference it, and layers are initialized synchronously (useStoryHistory)
            // before any effect can refresh the src. The URL is auto-collected on page nav.
        }
    }, [file]);

    useEffect(() => {
        if (mediaSrc && layers.length === 0) {
            if (initialMetadata && initialMetadata.layers.length > 0) {
                // Re-editing: restore layers but refresh main image/video src
                // (the old blob URL was revoked when StoryEditor unmounted)
                const refreshedLayers = initialMetadata.layers.map(layer => {
                    if ((layer.id === 'main-image' || layer.id === 'main-video') && 'src' in layer) {
                        return { ...layer, src: mediaSrc };
                    }
                    return layer;
                });
                pushState(refreshedLayers);
            } else {
                const mainLayer: StoryLayer = mediaType === 'video' ? {
                    id: 'main-video',
                    type: 'video',
                    src: mediaSrc,
                    x: 50, y: 50,
                    width: 100, height: 100,
                    rotation: 0, scale: 1, zIndex: 0,
                    isMuted: false,
                    trim: { start: 0, end: 15 }
                } : {
                    id: 'main-image',
                    type: 'image',
                    src: mediaSrc,
                    x: 50, y: 50,
                    width: 100, height: 100,
                    rotation: 0, scale: 1, zIndex: 0
                };
                pushState([mainLayer]);
            }
        }
    }, [mediaSrc, mediaType]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddLayer = (type: 'text' | 'sticker') => {
        const id = uuidv4();
        const newLayer: StoryLayer = type === 'text' ? {
            id,
            type: 'text',
            x: 50, y: 50,
            width: 80, height: 10,
            rotation: 0, scale: 1, zIndex: layers.length + 1,
            content: "New Text",
            style: {
                color: '#ffffff',
                fontSize: 24,
                fontFamily: 'Inter',
                fontWeight: 'bold',
                textAlign: 'center'
            }
        } : {
            id,
            type: 'sticker',
            x: 50, y: 50,
            width: 30, height: 30,
            rotation: 0, scale: 1, zIndex: layers.length + 1,
            src: "/stickers/smile.png"
        };

        const newLayers = [...layers, newLayer];
        pushState(newLayers);
        setActiveLayerId(newLayer.id);
        if (type === 'text') {
            setEditingLayerId(newLayer.id);
        }
    };

    /** Called when user picks an emoji or image sticker from the StickerPicker sheet */
    const handleStickerSelect = (sticker: StickerSelection) => {
        const id = uuidv4();
        const isEmoji = sticker.type === 'emoji';
        const newLayer: StoryLayer = {
            id,
            type: 'sticker',
            x: 50, y: 50,
            // Emojis self-size via font-size; image stickers fill the percentage box
            width: isEmoji ? 20 : 30,
            height: isEmoji ? 20 : 30,
            rotation: 0,
            scale: 1,
            zIndex: layers.length + 1,
            src: sticker.src,
        };
        const newLayers = [...layers, newLayer];
        pushState(newLayers);
        setActiveLayerId(newLayer.id);
        setShowStickerPicker(false);
    };

    const handleLayerInteractionStart = () => {
        pushState(layers);
    };

    const handleUpdateLayer = (updatedLayer: StoryLayer) => {
        const newLayers = layers.map(l => l.id === updatedLayer.id ? updatedLayer : l);
        replaceState(newLayers);
    };

    const handleSave = async () => {
        try {
            // The inner fixed canvas element (not the outer wrapper)
            const element = document.getElementById('story-editor-canvas');

            if (!element) {
                console.error("Canvas element not found");
                return;
            }

            // Temporarily hide UI controls
            setActiveLayerId(null);
            setEditingLayerId(null);
            setActiveTool('none');

            // Wait for React to render the deselection state
            await new Promise(resolve => setTimeout(resolve, 120));

            // html2canvas captures the element at its natural (logical) dimensions.
            // IMPORTANT: Reset CSS transform and wait for reflow to prevent html2canvas
            // from misinterpreting element positions due to the viewport scale + scroll.
            const prevTransform = element.style.transform;
            element.style.transform = 'none';

            // Wait for browser to fully reflow after transform change
            await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

            const canvas = await (await import('html2canvas')).default(element, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                width: CANVAS_W,
                height: CANVAS_H,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0,
                onclone: (clonedDoc) => {
                    const elements = clonedDoc.getElementsByTagName('*');
                    for (let i = 0; i < elements.length; i++) {
                        const el = elements[i] as HTMLElement;
                        try {
                            const style = window.getComputedStyle(el);
                            if (el.style.backgroundColor?.includes('okl') || style.backgroundColor?.includes('okl')) {
                                el.style.backgroundColor = "#111827"; 
                            }
                            if (el.style.color?.includes('okl') || style.color?.includes('okl')) {
                                el.style.color = "#ffffff";
                            }
                            if (el.style.backgroundImage?.includes('okl') || style.backgroundImage?.includes('okl')) {
                                el.style.backgroundImage = "none";
                            }
                        } catch (e) {
                            // Ignore elements that don't support getComputedStyle or other minor errors
                        }
                    }
                }
            });

            // Restore the CSS transform
            element.style.transform = prevTransform;

            // Generate Snapshot Blob (JPEG)
            const snapshotBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));

            if (!snapshotBlob) {
                console.error("Failed to generate blob");
                return;
            }

            const compositeFile = new File([snapshotBlob], "story-composite.jpg", { type: "image/jpeg" });

            // Prepare base file (Video or Image)
            const baseFile = currentMediaBlob || (file instanceof File ? file : null);

            if (mediaType === 'video' && baseFile) {
                // Return VIDEO as main file, but attach Snapshot as _compositeFile
                const finalMetadata: StoryMetadata = {
                    ...metadata,
                    layers: layers,
                    // @ts-ignore
                    _baseFile: baseFile,
                    // @ts-ignore
                    _compositeFile: compositeFile
                };
                onSave(baseFile, finalMetadata);
            } else {
                // Check if we have a base file, if not use composite
                const finalFile = mediaType === 'image' ? compositeFile : (baseFile || compositeFile);

                // If it is an image, usually we just save the composite as the result
                // But if we want to preserve original, we should pass it.
                // For now, keep existing behavior for images (Composite is the result)

                const finalMetadata: StoryMetadata = {
                    ...metadata,
                    layers: layers,
                    // @ts-ignore
                    _baseFile: baseFile || compositeFile
                };

                onSave(compositeFile, finalMetadata);
            }

        } catch (error) {
            console.error("Failed to save story", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-stretch">
            {/* Top Bar */}
            <div className="w-full h-16 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent absolute top-0 z-20">
                <button onClick={onCancel} className="p-2 rounded-full bg-black/20 text-white backdrop-blur-md">
                    <X className="w-6 h-6" />
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={() => undo()}
                        disabled={!canUndo}
                        className={`p-2 rounded-full bg-black/20 text-white backdrop-blur-md ${!canUndo ? 'opacity-30' : ''}`}
                    >
                        <Undo className="w-6 h-6" />
                    </button>
                </div>
                <button onClick={handleSave} className="px-4 py-2 rounded-full bg-white text-black font-bold">
                    Done
                </button>
            </div>

            {/* Canvas Wrapper — fills the space between top bar and bottom toolbar */}
            <div
                ref={canvasWrapperRef}
                className="flex-1 flex items-center justify-center overflow-hidden"
                style={{ paddingTop: '64px', paddingBottom: '96px' }}
            >
                {/* Fixed virtual canvas: always 390×693, CSS-scaled to fit wrapper */}
                <div
                    id="story-editor-canvas"
                    style={{
                        width: CANVAS_W,
                        height: CANVAS_H,
                        transform: `scale(${canvasScale})`,
                        transformOrigin: 'center center',
                        flexShrink: 0,
                        position: 'relative',
                        overflow: 'hidden',
                        backgroundColor: '#111827',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.8)',
                    }}
                >
                    {mediaSrc && activeTool !== 'crop' && (
                        <EditorCanvas
                            mediaSrc={mediaSrc}
                            mediaType={mediaType}
                            layers={layers}
                            activeLayerId={activeLayerId}
                            onLayerSelect={(id) => {
                                setActiveLayerId(id);
                                if (id !== editingLayerId) setEditingLayerId(null);
                            }}
                            editingLayerId={editingLayerId}
                            onSetEditingLayer={setEditingLayerId}
                            onLayerUpdate={handleUpdateLayer}
                            onLayerInteractionStart={handleLayerInteractionStart}
                            background={metadata.background}
                            disableBackgroundFallback={disableBackgroundFallback}
                        />
                    )}

                    {mediaSrc && activeTool === 'crop' && (
                        <div className="absolute inset-0 z-30 bg-black">
                            <Cropper
                                image={mediaSrc}
                                crop={crop}
                                zoom={zoom}
                                rotation={rotation}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                onRotationChange={setRotation}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Toolbar */}
            {activeLayerId && layers.find(l => l.id === activeLayerId)?.type === 'video' ? (
                <div className="w-full px-6 py-4 flex flex-col items-center justify-center bg-black absolute bottom-0 z-40 space-y-4">
                    {/* ... Video Logic (Simplified for brevity as it was correct) ... */}
                    <div className="flex items-center gap-4 w-full">
                        <button
                            onClick={() => {
                                const layer = layers.find(l => l.id === activeLayerId);
                                if (layer && layer.type === 'video') {
                                    handleUpdateLayer({ ...layer, isMuted: !layer.isMuted });
                                }
                            }}
                            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
                        >
                            {(layers.find(l => l.id === activeLayerId) as any)?.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <span className="text-white text-sm font-medium">
                            {(layers.find(l => l.id === activeLayerId) as any)?.isMuted ? 'Muted' : 'Audio On'}
                        </span>
                    </div>
                    {/* Trim Logic */}
                    <div className="w-full space-y-2">
                        <div className="flex items-center justify-between text-white text-xs">
                            <span>Trim Video</span>
                            <span>{Math.floor((layers.find(l => l.id === activeLayerId) as any)?.trim?.start || 0)}s - {Math.floor((layers.find(l => l.id === activeLayerId) as any)?.trim?.end || 15)}s</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-white text-xs w-12">Start</span>
                            <input
                                type="range"
                                min={0}
                                max={15}
                                step={0.1}
                                value={(layers.find(l => l.id === activeLayerId) as any)?.trim?.start || 0}
                                onChange={(e) => {
                                    const layer = layers.find(l => l.id === activeLayerId);
                                    if (layer && layer.type === 'video') {
                                        const newStart = Number(e.target.value);
                                        const currentEnd = layer.trim?.end || 15;
                                        handleUpdateLayer({
                                            ...layer,
                                            trim: { start: Math.min(newStart, currentEnd - 0.5), end: currentEnd }
                                        });
                                    }
                                }}
                                className="flex-1 accent-white"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-white text-xs w-12">End</span>
                            <input
                                type="range" min={0} max={15} step={0.1}
                                value={(layers.find(l => l.id === activeLayerId) as any)?.trim?.end || 15}
                                onChange={(e) => {
                                    const layer = layers.find(l => l.id === activeLayerId);
                                    if (layer && layer.type === 'video') {
                                        const newEnd = Number(e.target.value);
                                        const currentStart = layer.trim?.start || 0;
                                        handleUpdateLayer({
                                            ...layer,
                                            trim: { start: currentStart, end: Math.max(newEnd, currentStart + 0.5) }
                                        });
                                    }
                                }}
                                className="flex-1 accent-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-8 pt-2">
                        <button onClick={() => setActiveLayerId(null)} className="text-white font-bold bg-white/20 px-6 py-2 rounded-full">Done</button>
                    </div>
                </div>
            ) : activeLayerId && layers.find(l => l.id === activeLayerId)?.type === 'text' ? (
                <div className="w-full px-6 py-4 flex flex-col items-center justify-center bg-black absolute bottom-0 z-40 space-y-4">
                    <div className="flex gap-4 overflow-x-auto w-full pb-2 scrollbar-hide items-center">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                            <input
                                type="color"
                                className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0"
                                onChange={(e) => {
                                    const layer = layers.find(l => l.id === activeLayerId);
                                    if (layer && layer.type === 'text') {
                                        handleUpdateLayer({ ...layer, style: { ...layer.style, color: e.target.value } });
                                    }
                                }}
                                value={(layers.find(l => l.id === activeLayerId) as any)?.style?.color || "#ffffff"}
                            />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-bold text-white drop-shadow-md">Pick</span>
                            </div>
                        </div>
                        {["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"].map(color => (
                            <button
                                key={color}
                                onClick={() => {
                                    const layer = layers.find(l => l.id === activeLayerId);
                                    if (layer && layer.type === 'text') {
                                        handleUpdateLayer({ ...layer, style: { ...layer.style, color } });
                                    }
                                }}
                                className="w-12 h-12 rounded-full border-2 border-white/20 flex-shrink-0"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-8 pt-2">
                        <button onClick={() => setActiveLayerId(null)} className="text-white font-bold bg-white/20 px-6 py-2 rounded-full">Done</button>
                    </div>
                </div>
            ) : activeTool === 'crop' ? (
                <div className="w-full px-6 py-4 flex flex-col items-center justify-center bg-black absolute bottom-0 z-40 space-y-4">
                    <div className="flex gap-4 overflow-x-auto w-full pb-2 scrollbar-hide justify-center">
                        <button onClick={() => setAspectRatio(undefined)} className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${aspectRatio === undefined ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>Free</button>
                        <button onClick={() => setAspectRatio(9 / 16)} className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${aspectRatio === 9 / 16 ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>9:16</button>
                        <button onClick={() => setAspectRatio(16 / 9)} className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${aspectRatio === 16 / 9 ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>16:9</button>
                        <button onClick={() => setAspectRatio(4 / 5)} className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${aspectRatio === 4 / 5 ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>4:5</button>
                        <button onClick={() => setAspectRatio(1)} className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${aspectRatio === 1 ? 'bg-white text-black' : 'bg-white/10 text-white'}`}>1:1</button>
                    </div>
                    <div className="w-full flex items-center gap-4">
                        <span className="text-white text-xs w-12">Zoom</span>
                        <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-white" />
                    </div>
                    <div className="w-full flex items-center gap-4">
                        <span className="text-white text-xs w-12">Rotate</span>
                        <input type="range" min={0} max={360} step={1} value={rotation} onChange={(e) => setRotation(Number(e.target.value))} className="flex-1 accent-white" />
                    </div>
                    <div className="flex gap-8 pt-2">
                        <button onClick={() => setActiveTool('none')} className="text-white font-medium">Cancel</button>
                        <button onClick={handleCropSave} className="text-white font-bold bg-white/20 px-4 py-1 rounded-full">Apply Crop</button>
                    </div>
                </div>
            ) : activeTool === 'background' ? (
                <div className="w-full px-6 py-4 flex flex-col items-center justify-center bg-black absolute bottom-0 z-40 space-y-4">
                    <div className="flex gap-4 overflow-x-auto w-full pb-2 scrollbar-hide">
                        <button onClick={() => setMetadata({ ...metadata, background: undefined })} className="w-12 h-12 rounded-full border-2 border-white/20 flex-shrink-0 flex items-center justify-center bg-gray-800 text-white text-[10px]">None</button>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                            <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0" onChange={(e) => setMetadata({ ...metadata, background: e.target.value })} value={metadata.background?.startsWith('#') ? metadata.background : "#000000"} />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center pointer-events-none"><span className="text-[10px] font-bold text-white drop-shadow-md">Pick</span></div>
                        </div>
                        {[
                            "linear-gradient(to top right, #a855f7, #ec4899)",
                            "linear-gradient(to top right, #3b82f6, #14b8a6)",
                            "linear-gradient(to top right, #f97316, #ef4444)",
                            "linear-gradient(to top, #111827, #581c87, #7c3aed)",
                            "#000000",
                            "#ffffff",
                            "#FF5733",
                            "#33FF57",
                            "#3357FF",
                            "#FF33A8",
                        ].map((bg, i) => (
                            <button
                                key={i}
                                onClick={() => setMetadata({ ...metadata, background: bg })}
                                className={`w-12 h-12 rounded-full border-2 flex-shrink-0 ${metadata.background === bg ? 'border-white' : 'border-transparent'}`}
                                style={{ background: bg }}
                            />
                        ))}
                    </div>
                    <div className="flex gap-8 pt-2">
                        <button onClick={() => setActiveTool('none')} className="text-white font-bold bg-white/20 px-6 py-2 rounded-full">Done</button>
                    </div>
                </div>
            ) : (
                <div className="w-full h-24 px-6 flex items-center justify-around bg-gradient-to-t from-black/90 to-transparent absolute bottom-0 z-20 pb-4">
                    {mediaType === 'image' && (
                        <button onClick={() => setActiveTool('crop')} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                <Crop className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-medium">Crop</span>
                        </button>
                    )}
                    <button onClick={() => handleAddLayer('text')} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Type className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">Text</span>
                    </button>
                    <button onClick={() => setShowStickerPicker(true)} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Smile className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">Sticker</span>
                    </button>
                    <button onClick={() => setActiveTool('background')} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <Palette className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium">Background</span>
                    </button>
                </div>
            )}

            {/* Sticker / Emoji Picker Sheet */}
            {showStickerPicker && (
                <StickerPicker
                    onSelect={handleStickerSelect}
                    onClose={() => setShowStickerPicker(false)}
                />
            )}
        </div>
    );
}
