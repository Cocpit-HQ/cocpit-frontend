"use client";


// Refactored to use standalone useFeed hook
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Eye, EyeOff, Flag } from 'lucide-react';
import { Icon } from '@iconify/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EditPostModal } from '@/shared/commonComponents/EditPostModal';
import { useFeed } from '@/hooks/use-feed';
import { updatePost } from '@/services/api/posts';
import { useUIStore } from '@/store/ui.store';
import { ReportModal } from '@/components/shared/ReportModal';
import { DeleteConfirmationModal } from '@/components/shared/DeleteConfirmationModal';
import { PostMenuAccess } from '@/features/feed/utils/postMenuAccess';

interface PostOptionsMenuProps {
  postId: string;
  onDelete?: (id: string) => void;
  isOwnPost?: boolean;
  /** Tri-state access; when provided, takes precedence over isOwnPost ('internal' hides the menu entirely). */
  menuAccess?: PostMenuAccess;
  className?: string;
  onToggleVisibility?: (id: string) => void; // Keep for compatibility if needed
  postType?: string; // Need post type to check for poll
  visibility?: 'public' | 'private';
  companyId?: string;
}

import { useNotifyEmployees } from '@/components/organizations/hooks/use-company';
import { Megaphone } from 'lucide-react';

export function PostOptionsMenu({
  postId,
  onDelete,
  isOwnPost,
  menuAccess,
  className = "",
  onToggleVisibility,
  postType,
  visibility = 'public'
}: PostOptionsMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { updatePostInFeed } = useFeed();
  const { mutate: notifyEmployees } = useNotifyEmployees();
  const { setEditMode } = useUIStore();
  const router = useRouter();

  // menuAccess (tri-state) takes precedence over the legacy isOwnPost boolean when provided.
  const effectiveIsOwnPost = menuAccess ? menuAccess === 'owner' : isOwnPost;
  const hideMenuEntirely = menuAccess === 'internal';

  const isPoll = postType === 'poll';

  if (hideMenuEntirely) return null;

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVisibility = visibility === 'public' ? 'private' : 'public';

    // Optimistic update
    updatePostInFeed(postId, { visibility: newVisibility });
    if (onToggleVisibility) onToggleVisibility(postId);

    try {
      await updatePost(postId, { visibility: newVisibility });
    } catch (err) {
      console.error("Failed to toggle visibility", err);
      // Revert
      updatePostInFeed(postId, { visibility: visibility });
    }
  };

  return (
    <>
      <div className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="text-white/80 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/20"
            >
              <Icon icon="ph:dots-three-outline-vertical-light" className="w-6 h-6" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-card border-border">
            {effectiveIsOwnPost ? (
              <>
                {!isPoll && (
                  <>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        if (postType === 'Article' || postType === 'article') {
                          router.push(`/article/edit/${postId}`);
                        } else {
                          setIsEditModalOpen(true);
                        }
                      }}
                      className="cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl px-3 py-1.5 transition-colors group"
                    >
                      <Icon icon="hugeicons:edit-03" className="w-6 h-6 mr-2 text-black group-focus:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                      <span>Edit Post</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleToggleVisibility}
                      className="cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-xl px-3 py-1.5 transition-colors group"
                    >
                      {visibility === 'private' ? (
                        <Icon icon="hugeicons:view" className="w-6 h-6 mr-2 text-black group-focus:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                      ) : (
                        <Icon icon="hugeicons:view-off-slash" className="w-6 h-6 mr-2 text-black group-focus:text-[#6366F1]" style={{ strokeWidth: '1.5px' }} />
                      )}
                      <span>{visibility === 'private' ? 'Make Public' : 'Make Private'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}
                  className="text-red-500 focus:text-red-600 cursor-pointer focus:bg-red-50 rounded-xl px-3 py-1.5 transition-colors group"
                >
                  <Icon icon="hugeicons:delete-02" className="w-6 h-6 mr-2 text-red-500 group-focus:text-red-600" style={{ strokeWidth: '1.5px' }} />
                  <span>Delete Post</span>
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setIsReportModalOpen(true);
                }}
                className="cursor-pointer"
              >
                <Flag className="w-4 h-4 mr-2" />
                <span>Report Post</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DeleteConfirmationModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          if (onDelete) onDelete(postId);
          setIsDeleteDialogOpen(false);
        }}
      />

      {isEditModalOpen && (
        <EditPostModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
          }}
          editPostId={postId}
          onUpdate={(updatedPost) => updatePostInFeed(postId, updatedPost)}
        />
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetType="POST"
        targetId={postId}
      />
    </>
  );
}
