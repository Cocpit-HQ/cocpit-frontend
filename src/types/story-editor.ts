export type LayerType = 'text' | 'sticker' | 'image' | 'video';

export interface BaseLayer {
    id: string;
    type: LayerType;
    x: number; // Percentage 0-100
    y: number; // Percentage 0-100
    width: number; // Percentage 0-100
    height: number; // Percentage 0-100 for stickers/images, or 'auto' for text
    rotation: number; // Degrees
    scale: number;
    zIndex: number;
}

// ... (TextLayer, StickerLayer, ImageLayer unchanged)

export interface VideoLayer extends BaseLayer {
    type: 'video';
    src: string;
    poster?: string;
    isMuted?: boolean;
    volume?: number; // 0-1
    trim?: {
        start: number; // Seconds
        end: number; // Seconds
    };
    duration?: number; // Total duration in seconds
}

// TextLayer, StickerLayer, ImageLayer definitions

export interface TextLayer extends BaseLayer {
    type: 'text';
    content: string;
    style: {
        color: string;
        backgroundColor?: string;
        fontSize: number; // Relative size unit or scaled px
        fontFamily: string;
        fontWeight: string;
        textAlign: 'left' | 'center' | 'right';
        fontStyle?: 'normal' | 'italic';
    };
}

export interface StickerLayer extends BaseLayer {
    type: 'sticker';
    src: string;
}

export interface ImageLayer extends BaseLayer {
    type: 'image';
    src: string;
}

export type StoryLayer = TextLayer | StickerLayer | ImageLayer | VideoLayer;

export interface StoryMetadata {
    version: "1.0";
    layers: StoryLayer[];
    trim?: {
        start: number; // Seconds
        end: number; // Seconds
    };
    background?: string; // CSS background string (for text-only stories)
    intent?: 'casual' | 'announcement' | 'update';
    filter?: string; // CSS filter string
}

export interface EditorState {
    layers: StoryLayer[];
    activeLayerId: string | null;
    history: StoryLayer[][]; // Stack of layer arrays
    historyIndex: number;
}
