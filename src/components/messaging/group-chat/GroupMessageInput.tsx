import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Send, Smile, Mic } from "lucide-react";

interface GroupMessageInputProps {
    onSendMessage: (text: string) => void;
    onTyping?: () => void;
    isLoading?: boolean;
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"];

export default function GroupMessageInput({ onSendMessage, onTyping, isLoading }: GroupMessageInputProps) {
    const [text, setText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);

    const handleSend = () => {
        if (isLoading) return;
        if (text.trim()) {
            onSendMessage(text);
            setText("");
            if (textareaRef.current) {
                textareaRef.current.style.height = '44px';
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (isLoading) return;
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) {
            setText(prev => prev + emoji);
            return;
        }

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = text.substring(0, start) + emoji + text.substring(end);

        setText(newText);

        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
            textarea.focus();
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
        }, 0);

        setShowEmojiPicker(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target as Node) &&
                emojiButtonRef.current &&
                !emojiButtonRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    return (
        <div className="p-3 md:p-4 border-t w-full bg-background border-border shrink-0">
            <div className="flex items-end gap-2 max-w-4xl mx-auto">
                <button
                    className="p-2 rounded-full transition-colors mb-1 hover:bg-muted text-muted-foreground"
                    disabled={isLoading}
                >
                    <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 relative rounded-2xl bg-muted">
                    <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={(e) => {
                            setText(e.target.value);
                            if (onTyping) onTyping();

                            const target = e.target;
                            target.style.height = 'auto';
                            const newHeight = Math.min(target.scrollHeight, 128);
                            target.style.height = `${newHeight}px`;
                            target.style.overflowY = target.scrollHeight > 128 ? 'auto' : 'hidden';
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                        className="w-full pl-4 pr-10 py-3 bg-transparent border-0 resize-none focus:outline-none max-h-32 text-sm md:text-base text-foreground placeholder-muted-foreground scrollbar-hide overflow-hidden"
                        style={{ minHeight: "44px" }}
                        disabled={isLoading}
                    />

                    <button
                        ref={emojiButtonRef}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                        disabled={isLoading}
                    >
                        <Smile className="w-5 h-5" />
                    </button>

                    {showEmojiPicker && (
                        <div ref={pickerRef} className="absolute bottom-full right-0 mb-2 p-2 bg-card border border-border rounded-lg shadow-xl z-50 w-64">
                            <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
                                {EMOJI_LIST.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => insertEmoji(emoji)}
                                        className="p-1.5 hover:bg-muted rounded text-xl transition-colors flex items-center justify-center"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {text.trim() ? (
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="p-3 rounded-full bg-primary text-primary-foreground transition-colors mb-0.5 shadow-md hover:opacity-90"
                    >
                        <Send className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                ) : (
                    <button
                        className="p-3 rounded-full transition-colors mb-0.5 hover:bg-muted text-muted-foreground"
                        disabled={isLoading}
                    >
                        <Mic className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
