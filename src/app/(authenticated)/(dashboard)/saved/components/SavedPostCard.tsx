import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Post } from '@/types/entities';
import { toggleSavePost } from '@/features/settings/api/savedPost';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface SavedPostCardProps {
  post: Post;
  folderId?: string;
  onUnsave: (postId: string) => void;
}

export function SavedPostCard({ post, folderId, onUnsave }: SavedPostCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isUnsaving, setIsUnsaving] = useState(false);
  const router = useRouter();

  const handleUnsave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnsaving) return;
    setIsUnsaving(true);
    try {
      // Toggle save post (which unsaves if it's already saved)
      await toggleSavePost(post.id);
      toast.success("Post unsaved");
      onUnsave(post.id);
    } catch (error) {
      console.error("Failed to unsave post", error);
      toast.error("Failed to unsave post");
      setIsUnsaving(false);
    }
  };

  // Find the first image if any
  const imageUrl = post.imageSrc || post.images?.[0];

  return (
    <div 
      className="flex flex-col items-start p-0 gap-[12px] w-full max-w-[650px] cursor-pointer hover:bg-gray-50/50 rounded-lg transition-colors"
      onClick={() => router.push(`/post/${post.id}`)}
    >
      {/* Header section */}
      <div className="flex flex-row justify-between items-center w-full h-[36px] px-2 pt-2">
        <div className="flex flex-row gap-[6px] items-center">
          <img 
            src={post.authorAvatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(post.author || "User")} 
            alt={post.author} 
            className="w-[32px] h-[32px] rounded-full object-cover"
          />
          <div className="flex flex-col justify-center">
            <span className="text-[14px] font-[family-name:var(--font-poppins)] font-semibold text-black leading-[20px]">
              {post.author}
            </span>
            <span className="text-[12px] font-[family-name:var(--font-poppins)] font-normal text-[#6B7280] leading-[16px]">
              {post.authorHeadline || "Designer"}
            </span>
          </div>
        </div>

        {/* Bookmark Button */}
        <div 
          className="relative flex flex-col items-center justify-center cursor-pointer group px-2"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={handleUnsave}
        >
          {/* Every post here is already saved, so this always renders the
              filled/bold bookmark — same icon + state SaveButton (feed) uses
              for isSaved === true. Clicking it unsaves via handleUnsave. */}
          <Icon
            icon="solar:bookmark-bold"
            className="w-6 h-6 text-primary transition-opacity group-hover:opacity-80"
            aria-hidden="true"
          />
          
          {/* Hover Tooltip - 'Unsave' Pill */}
          {isHovering && (
            <div className="absolute right-0 top-8 bg-[#EEF2FF] text-[#6366F1] text-[14px] px-4 py-2 rounded-full font-medium whitespace-nowrap z-10 animate-in fade-in duration-200">
              Unsave
            </div>
          )}
        </div>
      </div>

      {/* Content section */}
      {imageUrl ? (
        <div className="flex flex-row items-center gap-[16px] w-full h-[76px] px-2 pb-2">
          <div className="flex flex-col justify-center items-center w-[76px] h-[76px] bg-[#F3F4F6] border border-[#E5E7EB] rounded-[12px] flex-shrink-0 overflow-hidden">
            <img 
              src={imageUrl} 
              alt="Post media" 
              className="w-[74px] h-[74px] object-cover"
            />
          </div>
          <div className="flex flex-col items-start gap-[8px] flex-1">
            <p className="text-[14px] font-[family-name:var(--font-poppins)] font-normal text-black leading-[20px] line-clamp-3">
              {post.content}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center gap-[12px] w-full px-2 pb-2">
          <p className="text-[14px] font-[family-name:var(--font-poppins)] font-normal text-black leading-[20px] w-full line-clamp-2">
            {post.content}
          </p>
        </div>
      )}
    </div>
  );
}
