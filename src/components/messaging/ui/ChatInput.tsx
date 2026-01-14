"use client"

import React, { useState } from "react"
import { Paperclip, Send, Smile } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (text: string) => void
  onTyping?: () => void
  disabled?: boolean
}

export default function ChatInput({ onSendMessage, onTyping, disabled }: ChatInputProps) {
  const [text, setText] = useState("")

  const handleSend = () => {
    if (disabled) return; // Prevent sending if disabled
    if (text.trim()) {
      onSendMessage(text)
      setText("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return; // Prevent sending if disabled
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="p-3 md:p-4 border-t sticky bottom-0 z-10 w-full bg-background border-border"
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
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onTyping?.()
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Cannot send messages to this conversation" : "Write a message..."}
            rows={1}
            className="w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none max-h-32 text-sm md:text-base text-foreground placeholder-muted-foreground"
            style={{ minHeight: "44px" }}
            disabled={disabled}
            />
        </div>

        {text.trim() && !disabled ? (
            <button
            onClick={handleSend}
            className="p-3 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-colors mb-0.5 shadow-md"
            >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
        ) : (
            <button
            className="p-2 rounded-full transition-colors mb-1 hover:bg-muted text-muted-foreground"
            disabled={disabled}
            >
            <Smile className="w-6 h-6" />
            </button>
        )}
      </div>
    </div>
  )
}
