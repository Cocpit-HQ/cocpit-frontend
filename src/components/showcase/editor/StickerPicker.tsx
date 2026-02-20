import React, { useState } from 'react';
import { X } from 'lucide-react';

export interface StickerSelection {
    type: 'emoji' | 'image';
    /** For emoji: the emoji character. For image: the URL/path. */
    src: string;
}

interface StickerPickerProps {
    onSelect: (sticker: StickerSelection) => void;
    onClose: () => void;
}

const EMOJI_CATEGORIES = [
    {
        label: '😊 Smileys',
        emojis: ['😀', '😂', '🤣', '😍', '🥰', '😎', '🤩', '😭', '😱', '🥺',
            '😴', '🤔', '🫡', '😏', '😤', '🤯', '😈', '🥳', '😬', '😇',
            '🤪', '😜', '😛', '🤑', '🤗', '🙄', '😒', '😔', '🤒', '😷']
    },
    {
        label: '❤️ Love',
        emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💗', '💓',
            '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '💝', '💘', '💖', '🫶',
            '😘', '💋', '💑', '👫', '👬', '👭', '💌', '🌹', '🌷', '💐']
    },
    {
        label: '🔥 Trending',
        emojis: ['🔥', '💯', '✨', '⭐', '🌟', '💫', '⚡', '🎉', '🎊', '🏆',
            '🥇', '🎯', '🚀', '💎', '👑', '🦋', '🌈', '🍀', '🎈', '🎁',
            '🙌', '👏', '💪', '🤜', '🤛', '👍', '🫶', '🥂', '🍾', '🎶']
    },
    {
        label: '🌿 Nature',
        emojis: ['🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🌿', '🌴', '🌊', '⛅',
            '🌈', '❄️', '🔮', '🦄', '🐬', '🦋', '🐉', '🦊', '🐺', '🌙',
            '☀️', '🌎', '🌊', '🗻', '🌋', '🌅', '🍃', '🌾', '🍄', '🌵']
    },
    {
        label: '😂 Reactions',
        emojis: ['💀', '🫠', '😵', '🤌', '🫰', '🤞', '✌️', '🤟', '🤘', '👋',
            '🖐️', '🫳', '🤙', '👁️', '👅', '🫦', '🫁', '🧠', '🦷', '👀',
            '🙈', '🙉', '🙊', '🐸', '🤡', '👻', '💩', '🤖', '👽', '🎭']
    },
    {
        label: '🎵 Vibes',
        emojis: ['🎵', '🎶', '🎸', '🎹', '🎷', '🥁', '🎤', '🎧', '🎬', '🎮',
            '🕹️', '🎲', '🃏', '🎱', '🏀', '⚽', '🎾', '🏋️', '🤸', '💃',
            '🕺', '🌙', '💫', '🎪', '🎠', '🎡', '🛸', '🚀', '🌠', '🎆']
    },
];

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, onClose }) => {
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

    return (
        <div className="fixed inset-x-0 bottom-0 z-[60] bg-[#141414] rounded-t-3xl shadow-2xl border-t border-white/10 flex flex-col animate-in slide-in-from-bottom duration-300" style={{ maxHeight: '75vh' }}>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-1 pb-3 border-b border-white/5">
                <span className="text-white font-semibold text-sm">Emojis</span>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Category strip */}
            <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide flex-shrink-0">
                {EMOJI_CATEGORIES.map((cat, i) => (
                    <button
                        key={i}
                        onClick={() => setActiveCategoryIndex(i)}
                        className={`flex-shrink-0 text-xl px-2 py-1 rounded-xl transition-all ${activeCategoryIndex === i ? 'bg-white/15 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    >
                        {cat.emojis[0]}
                    </button>
                ))}
            </div>

            {/* Emoji grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 pt-2 scrollbar-hide">
                <p className="text-white/30 text-[10px] uppercase tracking-widest mb-3">
                    {EMOJI_CATEGORIES[activeCategoryIndex].label}
                </p>
                <div className="grid grid-cols-6 gap-2">
                    {EMOJI_CATEGORIES[activeCategoryIndex].emojis.map((emoji, i) => (
                        <button
                            key={i}
                            onClick={() => onSelect({ type: 'emoji', src: emoji })}
                            className="aspect-square flex items-center justify-center text-3xl rounded-2xl bg-white/5 hover:bg-white/15 active:scale-90 transition-all"
                            aria-label={emoji}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
