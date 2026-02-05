"use client"

import React, { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Smile } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (text: string) => void
  onTyping?: () => void
  disabled?: boolean
  disabledMessage?: string
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"];

export default function ChatInput({ onSendMessage, onTyping, disabled, disabledMessage }: ChatInputProps) {
  const [text, setText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)

  const handleSend = () => {
    if (disabled) return; 
    if (text.trim()) {
      onSendMessage(text)
      setText("")
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px'; 
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return; 
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

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

    // Restore cursor position and trigger resize
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
    }, 0);

    setShowEmojiPicker(false);
  };

  // Close picker when clicking outside
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
    <div
      className="p-3 md:p-4 border-t w-full bg-background border-border shrink-0"
    >
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <button
          className="p-2 rounded-full transition-colors mb-1 hover:bg-muted text-muted-foreground"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 relative rounded-2xl bg-muted">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onTyping?.()
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabledMessage || (disabled ? "Cannot send messages to this conversation" : "Write a message...")}
            rows={1}
            className="w-full pl-4 pr-10 py-3 bg-transparent border-0 resize-none focus:outline-none max-h-32 text-sm md:text-base text-foreground placeholder-muted-foreground"
            style={{ minHeight: "44px" }}
            disabled={disabled}
          />

          <button
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors ${showEmojiPicker ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
            disabled={disabled}
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

        <button
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className={`p-3 rounded-full transition-colors mb-0.5 shadow-md ${text.trim() && !disabled
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  )
}
