"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Undo, Redo, Type, Smile, Crop, Sliders, Image as ImageIcon, Palette, Volume2, VolumeX } from 'lucide-react';
import { StoryMetadata, StoryLayer } from '@/types/story-editor';
import { useStoryHistory } from '@/hooks/useStoryHistory';
import { EditorCanvas } from '@/components/showcase/editor/EditorCanvas';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/canvasUtils';

// Helper to deep copy layers to avoid mutation issues
const clone = (obj: any) => JSON.parse(JSON.stringify(obj));

type StoryEditorProps = {
    file: File | string; // File object or URL
    initialMetadata?: StoryMetadata;
    onSave: (file: File | Blob | string, metadata: StoryMetadata) => void;
    onCancel: () => void;
};

export function StoryEditor({ file, initialMetadata, onSave, onCancel }: StoryEditorProps) {
    const defaultMetadata: StoryMetadata = {
        version: "1.0",
        layers: [],
    };

    const { layers, undo, redo, pushState, replaceState, canUndo, canRedo } = useStoryHistory(initialMetadata?.layers || []);
    const [metadata, setMetadata] = useState<StoryMetadata>(initialMetadata || defaultMetadata);
    const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
    const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<'none' | 'text' | 'sticker' | 'crop' | 'filter' | 'background'>('none');

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
            const croppedBlob = await getCroppedImg(mediaSrc, croppedAreaPixels, rotation);
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
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    useEffect(() => {
        if (mediaSrc && layers.length === 0) {
            if (initialMetadata && initialMetadata.layers.length > 0) {
                // If editing existing metadata, use it
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
        const id = crypto.randomUUID();
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

    const handleLayerInteractionStart = () => {
        pushState(layers);
    };

    const handleUpdateLayer = (updatedLayer: StoryLayer) => {
        const newLayers = layers.map(l => l.id === updatedLayer.id ? updatedLayer : l);
        replaceState(newLayers);
    };

    const handleSave = () => {
        const finalMetadata: StoryMetadata = {
            ...metadata,
            layers: layers,
        };
        if (currentMediaBlob) {
            onSave(currentMediaBlob, finalMetadata);
        } else {
            onSave(file, finalMetadata);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
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

            {/* Canvas Area */}
            <div className="relative w-full h-full max-w-md aspect-[9/16] bg-gray-900 overflow-hidden shadow-2xl">
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
                            <input type="color" className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer p-0 border-0" onChange={(e) => setMetadata({ ...metadata, background: e.target.value })} value={!metadata.background?.startsWith('bg-') ? metadata.background || "#000000" : "#000000"} />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center pointer-events-none"><span className="text-[10px] font-bold text-white drop-shadow-md">Pick</span></div>
                        </div>
                        {[
                            "bg-gradient-to-tr from-purple-500 to-pink-500",
                            "bg-gradient-to-tr from-blue-500 to-teal-500",
                            "bg-gradient-to-tr from-orange-500 to-red-500",
                            "bg-gradient-to-t from-gray-900 via-purple-900 to-violet-600",
                            "bg-black",
                            "bg-white",
                            "bg-[#FF5733]",
                            "bg-[#33FF57]",
                            "bg-[#3357FF]",
                            "bg-[#FF33A8]",
                        ].map((bg, i) => (
                            <button
                                key={i}
                                onClick={() => setMetadata({ ...metadata, background: bg })}
                                className={`w-12 h-12 rounded-full border-2 flex-shrink-0 ${bg.startsWith('bg-[') ? '' : bg} ${metadata.background === bg ? 'border-white' : 'border-transparent'}`}
                                style={bg.startsWith('bg-[') ? { background: bg.match(/bg-\[(.*)\]/)?.[1] } : {}}
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
                    <button onClick={() => handleAddLayer('sticker')} className="flex flex-col items-center gap-1 text-white opacity-80 hover:opacity-100 transition">
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
        </div>
    );
}
