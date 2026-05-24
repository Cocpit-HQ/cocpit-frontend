"use client"

import React from 'react'
import { Image, Video, FileText, BarChart3 } from 'lucide-react'
import { PostType } from '@/features/create-post/types'
import { useActiveProfile } from '@/context/ActiveProfileContext'
import { useFeed } from '@/hooks/use-feed'
import { useUIStore } from '@/store/ui.store'

interface CreatePostProps {
  onOpenModal: (type?: PostType) => void
}

function PostButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-muted"
    >
      {icon}
      <span className="hidden text-sm text-muted-foreground sm:block">{label}</span>
    </button>
  )
}

export function CreatePost({ onOpenModal }: CreatePostProps) {
  const { activeProfile, isCompany } = useActiveProfile();
  const { currentUser } = useFeed();
  
  const avatar = isCompany && activeProfile?.avatar_url 
    ? activeProfile.avatar_url 
    : (currentUser?.image || "/assets/pngegg.png");

  return (
    <div
      className="feed-card-shell mb-4 w-full p-4 transition-shadow duration-300 hover:shadow-md"
    >
      <div className="flex gap-3 mb-3 items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex-shrink-0 overflow-hidden">
          <img
            src={avatar}
            alt="profile"
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = "/assets/pngegg.png" }}
          />
        </div>
        <input
          type="text"
          placeholder="Start a post"
          onClick={() => onOpenModal('text')}
          className="feed-card-input h-10 min-w-0 flex-1 cursor-pointer rounded-full border px-4 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-primary focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-1 px-1">
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
          onClick={() => {
            const { setArticleMode, setActiveModal } = useUIStore.getState();
            setActiveModal(null);
            setArticleMode(true);
          }}
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
