"use client"

import React, { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Image, Video, FileText, BarChart3 } from 'lucide-react'
import { useActionModal } from '@/context/ActionModalContext'

type PostType = 'text' | 'photo' | 'video' | 'poll';

interface CreatePostProps {
  onOpenModal: (type?: PostType) => void
}

function PostButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 hover:bg-[#F3F2EF] rounded-lg transition-colors"
    >
      {icon}
      <span className="text-[#666666] hidden sm:block">{label}</span>
    </button>
  )
}

export function CreatePost({ onOpenModal }: CreatePostProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === 'dark'

  return (
    <div
      className={`rounded-xl border p-6 mb-6 ${
        isDark ? 'bg-[#242b3d] border-[#2d3548]' : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      <div className="flex gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex-shrink-0 overflow-hidden">
          <img
            src="/assets/pngegg.png"
            alt="profile"
            className="w-full h-full object-cover"
          />
        </div>
        <input
          type="text"
          placeholder="Start a post"
          onClick={() => onOpenModal('text')}
          className={`flex-1 px-4 py-3 border rounded-full hover:bg-[#F3F2EF] cursor-pointer focus:outline-none transition-colors ${
            isDark
              ? 'bg-[#1a1f2e] text-white placeholder-gray-500 border-[#2d3548] hover:border-[#5B7CFF]'
              : 'bg-gray-50 text-gray-900 placeholder-gray-500 border-[#E1E1E1] hover:bg-[#F3F2EF]'
          }`}
        />
      </div>

      <div className="flex items-center justify-around">
        <PostButton
          icon={<Image className="w-5 h-5 text-[#0A66C2]" />}
          label="Photo"
          onClick={() => onOpenModal('photo')}
        />
        <PostButton
          icon={<Video className="w-5 h-5 text-green-600" />}
          label="Video"
          onClick={() => onOpenModal('video')}
        />
        <PostButton
          icon={<FileText className="w-5 h-5 text-orange-600" />}
          label="Article"
          onClick={() => onOpenModal('text')}
        />
        <PostButton
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          label="Poll"
          onClick={() => onOpenModal('poll')}
        />
      </div>
    </div>
  )
}

export default CreatePost

