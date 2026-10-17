"use client"

import React, { useState, useRef, useEffect } from "react"
import { Paperclip, Send, Smile, X, FileText, Film, Image as ImageIcon } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (text: string, files: File[]) => void
  onTyping?: () => void
  disabled?: boolean
  disabledMessage?: string
}

const EMOJI_LIST = ["😀", "😂", "😍", "🥺", "🔥", "👍", "👎", "🎉", "❤️", "💼", "🚀", "💯", "👏", "🤔", "👀", "✨", "✅", "❌", "🙌", "😎"];

export default function ChatInput({ onSendMessage, onTyping, disabled, disabledMessage }: ChatInputProps) {
  const [text, setText] = useState("")
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (disabled) return;
    if (text.trim() || files.length > 0) {
      onSendMessage(text, files)
      setText("")
      setFiles([])
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Film className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div
      className="p-3 md:p-4 border-t w-full bg-background border-border shrink-0"
    >
      {/* File Previews */}
      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto mb-2 pb-2">
          {files.map((file, index) => (
            <div key={index} className="relative group bg-muted rounded-lg p-2 flex items-center gap-2 min-w-[120px]">
              {file.type.startsWith('image/') ? (
                <div className="w-10 h-10 relative overflow-hidden rounded bg-background">
                  <img src={URL.createObjectURL(file)} alt="preview" className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-background rounded text-muted-foreground">
                  {getFileIcon(file)}
                </div>
              )}
              <span className="text-xs truncate max-w-[100px]">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <input
          type="file"
          multiple
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
        <button
          className="p-2 rounded-full transition-colors mb-1 hover:bg-muted text-muted-foreground"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
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

              const target = e.target;
              target.style.height = 'auto';
              const newHeight = Math.min(target.scrollHeight, 128);
              target.style.height = `${newHeight}px`;
              target.style.overflowY = target.scrollHeight > 128 ? 'auto' : 'hidden';
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabledMessage || (disabled ? "Cannot send messages to this conversation" : "Write a message...")}
            rows={1}
            className="w-full pl-4 pr-10 py-3 bg-transparent border-0 resize-none focus:outline-none max-h-32 text-sm md:text-base text-foreground placeholder-muted-foreground scrollbar-hide overflow-hidden"
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
          disabled={(!text.trim() && files.length === 0) || disabled}
          className={`p-3 rounded-full transition-colors mb-0.5 shadow-md ${(text.trim() || files.length > 0) && !disabled
            ? "bg-primary text-primary-foreground hover:opacity-90"
            : "bg-muted text-muted-foreground cursor-default"
            }`}
        >
          <Send className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>
    </div>
  )
}
