"use client"

import React, { useState, useEffect } from 'react'
import { Image, Video, FileText, BarChart3 } from 'lucide-react'
import { useActionModal } from '@/context/ActionModalContext'
import { PostType } from './CreatePostModal'

interface CreatePostProps {
  onOpenModal: (type?: PostType) => void
}

function PostButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-1 hover:bg-muted rounded-lg transition-colors"
    >
      {icon}
      <span className="text-muted-foreground hidden sm:block">{label}</span>
    </button>
  )
}

export function CreatePost({ onOpenModal }: CreatePostProps) {
  return (
    <div
      className="rounded-lg border p-4 mb-3 bg-card border-border shadow-sm"
    >
      <div className="flex gap-3 mb-3 items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex-shrink-0 overflow-hidden">
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
          className="flex-1 h-10 px-4 border rounded-full hover:bg-muted cursor-pointer focus:outline-none transition-colors bg-muted/50 text-foreground placeholder-muted-foreground border-border hover:border-primary text-sm"
        />
      </div>

      <div className="flex items-center justify-between px-2">
        <PostButton
          icon={<Image className="w-4 h-4 text-primary" />}
          label="Photo"
          onClick={() => onOpenModal('photo')}
        />
        <PostButton
          icon={<Video className="w-4 h-4 text-green-600" />}
          label="Video"
          onClick={() => onOpenModal('video')}
        />
        <PostButton
          icon={<FileText className="w-4 h-4 text-orange-600" />}
          label="Article"
          onClick={() => onOpenModal('article')}
        />
        <PostButton
          icon={<BarChart3 className="w-4 h-4 text-purple-600" />}
          label="Poll"
          onClick={() => onOpenModal('poll')}
        />
      </div>
    </div>
  )
}

export default CreatePost
