"use client"

import React, { useState, useEffect } from 'react'
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
      className="flex items-center gap-2 px-4 py-2 hover:bg-muted rounded-lg transition-colors"
    >
      {icon}
      <span className="text-muted-foreground hidden sm:block">{label}</span>
    </button>
  )
}

export function CreatePost({ onOpenModal }: CreatePostProps) {
  return (
    <div
      className="rounded-xl border p-6 mb-6 bg-card border-border shadow-sm"
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
          className="flex-1 px-4 py-3 border rounded-full hover:bg-muted cursor-pointer focus:outline-none transition-colors bg-muted/50 text-foreground placeholder-muted-foreground border-border hover:border-primary"
        />
      </div>

      <div className="flex items-center justify-around">
        <PostButton
          icon={<Image className="w-5 h-5 text-primary" />}
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
