"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Image, Video, FileText, BarChart3 } from 'lucide-react'
import { PostType } from '@/features/feed/types'
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
  const router = useRouter();
  const { activeProfile, isCompany } = useActiveProfile();
  const { currentUser } = useFeed();

  const avatar = isCompany && activeProfile?.avatar_url
    ? activeProfile.avatar_url
    : currentUser?.image;
  const initial = isCompany && activeProfile?.name
    ? activeProfile.name[0]
    : currentUser?.name?.[0] || 'U';

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="h-full w-full rounded-full object-cover"
              onError={(e) => {
                if (!isCompany) (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            initial
          )}
        </div>
        <button
          onClick={() => onOpenModal('text')}
          className="flex-1 rounded-full bg-muted px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/80"
        >
          What's on your mind?
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <PostButton
          icon={<Image className="w-4 h-4 text-blue-600" />}
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
            router.push('/article/create');
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
