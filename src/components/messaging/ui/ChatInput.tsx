"use client"

import React, { useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { Paperclip, Send, Smile, Image as ImageIcon } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (text: string) => void
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const { resolvedTheme } = useTheme()
  const isDark = useMemo(() => resolvedTheme === "dark", [resolvedTheme])
  const [text, setText] = useState("")

  const handleSend = () => {
    if (text.trim()) {
      onSendMessage(text)
      setText("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={`p-3 md:p-4 border-t sticky bottom-0 z-10 w-full ${
        isDark ? "bg-[#171c28] border-[#2d3548]" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        <button
          className={`p-2 rounded-full transition-colors mb-1 ${
            isDark ? "hover:bg-[#2d3548] text-gray-400" : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <div className={`flex-1 relative rounded-2xl ${
            isDark ? "bg-[#1e2535]" : "bg-gray-100"
        }`}>
            <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            rows={1}
            className={`w-full px-4 py-3 bg-transparent border-0 resize-none focus:outline-none max-h-32 text-sm md:text-base ${
                isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-500"
            }`}
            style={{ minHeight: "44px" }}
            />
        </div>

        {text.trim() ? (
            <button
            onClick={handleSend}
            className="p-3 bg-[#5B7CFF] text-white rounded-full hover:bg-[#4A6BEF] transition-colors mb-0.5 shadow-md"
            >
            <Send className="w-4 h-4 md:w-5 md:h-5" />
            </button>
        ) : (
            <button
            className={`p-2 rounded-full transition-colors mb-1 ${
                isDark ? "hover:bg-[#2d3548] text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
            >
            <Smile className="w-6 h-6" />
            </button>
        )}
      </div>
    </div>
  )
}
