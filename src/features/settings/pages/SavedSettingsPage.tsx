"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Folder, ChevronLeft, Loader2 } from 'lucide-react';
import { Icon } from '@/components/icons';
import { saveScrollPosition } from '@/hooks/use-scroll-restoration';
import { useSavedFolders, SAVED_FOLDERS_QUERY_KEY } from '../hooks/useSavedFolders';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';
import { getSavedPosts, deleteSavedFolder, toggleSavePost } from '@/features/settings/api/savedPost';
import { mapProfilePostToPost } from '@/lib/mappers/profile.mapper';
import { useQueryClient } from '@tanstack/react-query';
import { SavedFolder, Post } from '@/types/entities';
import { toast } from 'sonner';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SavedPostCard } from '@/app/(authenticated)/(dashboard)/saved/components/SavedPostCard';
export function SavedSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/saved';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const folderIdParam = searchParams.get('folderId');

  const { folders, isLoading: isLoadingFolders } = useSavedFolders();

  const [selectedFolder, setSelectedFolder] = useState<SavedFolder | { folder_id: string; name: string; post_count?: number; cover_image?: string } | null>(null);

  // Sync selectedFolder with URL param
  useEffect(() => {
    if (folderIdParam) {
      if (folderIdParam === 'all') {
        setSelectedFolder({ folder_id: 'all', name: 'General' });
      } else {
        const found = folders?.find((f: SavedFolder) => f.folder_id === folderIdParam);
        if (found) {
          setSelectedFolder(found);
        }
      }
    } else {
      setSelectedFolder(null);
    }
  }, [folderIdParam, folders]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch posts when selected folder changes
  const fetchPostsForFolder = useCallback(async () => {
    if (!selectedFolder) return;

    setIsLoadingPosts(true);
    try {
      const folderIdParam = selectedFolder.folder_id === 'all' ? null : selectedFolder.folder_id;
      const res = await getSavedPosts(folderIdParam, 1, 30);
      const mapped = (res as any).posts?.map(mapProfilePostToPost) || [];
      setPosts(mapped);
    } catch (err) {
      console.error("Failed to load saved posts", err);
      toast.error("Failed to load saved posts");
    } finally {
      setIsLoadingPosts(false);
    }
  }, [selectedFolder]);

  useEffect(() => {
    if (selectedFolder) {
      fetchPostsForFolder();
    }
  }, [selectedFolder, fetchPostsForFolder]);

  // Unsave post handler
  const handlePostUnsaved = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setSelectedFolder((prev) =>
      prev
        ? {
            ...prev,
            post_count: Math.max(0, (prev.post_count ?? posts.length) - 1),
          }
        : null
    );
    queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY });
  };

  const handleUnsavePost = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      await toggleSavePost(postId);
      toast.success("Post removed from saved");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSelectedFolder((prev) =>
        prev
          ? {
              ...prev,
              post_count: Math.max(0, (prev.post_count ?? posts.length) - 1),
            }
          : null
      );
      queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY });
    } catch (error) {
      console.error("Failed to unsave post", error);
      toast.error("Failed to remove post from saved");
    }
  };

  const handlePostClick = (postId: string) => {
    saveScrollPosition('saved', postId);
    router.push(`/post/${postId}`);
  };


  // Delete folder handler
  const handleDeleteFolder = async () => {
    if (!selectedFolder || selectedFolder.folder_id === 'all') return;

    setIsDeleting(true);
    try {
      await deleteSavedFolder(selectedFolder.folder_id);
      queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY });
      toast.success("Collection deleted successfully");
      setIsDeleteModalOpen(false);
      router.push(pathname);
    } catch (error) {
      console.error("Failed to delete folder", error);
      toast.error("Failed to delete collection");
    } finally {
      setIsDeleting(false);
    }
  };

  // -------------------------------------------------------------
  // View 2: Inner Collection View (When a folder is selected)
  // -------------------------------------------------------------
  if (selectedFolder) {
    const isCustomFolder = selectedFolder.folder_id !== 'all';
    const displayCount = selectedFolder.post_count !== undefined ? selectedFolder.post_count : posts.length;

    return (
      <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3 text-ds-text-primary">
        {/* Top Back Bar */}
        <div
          onClick={() => router.push(pathname)}
          className="self-stretch flex justify-start items-center gap-2.5 cursor-pointer group py-1"
        >
          <ChevronLeft className="size-5 text-ds-text-primary group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-ds-text-primary text-base font-semibold leading-6">Saved</span>
        </div>

        <div className="self-stretch px-0 sm:px-4 flex flex-col justify-start items-start gap-3 w-full">
          {/* Collection Header */}
          <div className="self-stretch p-2 border-b border-ds-border flex justify-between items-center w-full">
            <div className="flex justify-start items-center gap-4 min-w-0">
              <div className="flex flex-col justify-start items-start gap-1 min-w-0">
                <span className="text-ds-text-primary text-base font-semibold leading-6 truncate">
                  {selectedFolder.name}
                </span>
                <span className="text-ds-text-muted text-[10px] font-normal leading-3">
                  Post - {displayCount}
                </span>
              </div>
            </div>

            {/* Folder Actions (Edit & Delete for custom folders) */}
            {isCustomFolder && (
              <div className="flex justify-start items-center gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-ds-text-secondary hover:text-ds-text-primary transition-colors cursor-pointer"
                  title="Edit collection"
                >
                  <Icon name="profile-edit" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="text-ds-error hover:opacity-80 transition-opacity cursor-pointer"
                  title="Delete collection"
                >
                  <Icon name="trash" className="size-5" />
                </button>
              </div>
            )}
          </div>

          {/* Saved Posts List (Frame 2609256) */}
          <div className="self-stretch p-2 rounded-[24px] flex flex-col justify-start items-start gap-[12px] w-full max-w-[648px]">
            {isLoadingPosts ? (
              <div className="self-stretch flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
              </div>
            ) : posts.length === 0 ? (
              <div className="self-stretch py-12 text-center text-ds-text-secondary text-sm">
                No saved posts in this collection.
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="self-stretch pb-[12px] border-b border-[#2C2C33] last:border-b-0 last:pb-0 flex flex-col justify-start items-start gap-[12px] w-full"
                >
                  <SavedPostCard
                    post={post}
                    folderId={selectedFolder.folder_id}
                    onUnsave={handlePostUnsaved}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit Collection Modal */}
        {isCustomFolder && (
          <CreateFolderModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={(updatedFolder) => {
              queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY });
              setSelectedFolder((prev) => (prev ? { ...prev, ...updatedFolder } : updatedFolder));
              setIsEditModalOpen(false);
            }}
            isEditing={true}
            initialName={selectedFolder.name}
            // initialCoverImage={selectedFolder.cover_image}
            folderId={selectedFolder.folder_id}
          />
        )}

        {/* Delete Collection Confirmation Modal */}
        {isCustomFolder && (
          <ActionConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteFolder}
            title="Delete collection"
            description="Are you sure you want to delete this collection"
            confirmText="Delete"
            cancelText="Cancel"
            confirmColor="accent"
            isLoading={isDeleting}
            buttonWidthClass="w-[77px]"
            modalClassName="w-[237px] h-[150px]"
          />
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // View 1: Collections List View (Default)
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-[712px] px-3 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3 text-ds-text-primary font-sans">
      {/* Mobile Back Header (visible on mobile only) */}
      <div className="self-stretch inline-flex md:hidden justify-start items-center gap-3 mb-1">
        <button
          type="button"
          onClick={() => router.replace(basePath)}
          aria-label="Back to settings menu"
          className="-ml-1.5 flex items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="ds-text-body-2 text-ds-text-primary">Saved posts</div>
      </div>

      {/* Row 1: General + New collections button */}
      <div className="self-stretch py-2 flex justify-between items-center w-full gap-4">
        {/* General Folder */}
        <div
          onClick={() => router.push(`${pathname}?folderId=all`)}
          className="flex justify-start items-center gap-4 cursor-pointer group"
        >
          <div className="size-10 flex justify-center items-center shrink-0">
            <Folder className="size-6 text-ds-text-primary stroke-[1.5]" />
          </div>
          <div className="justify-center text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6 group-hover:text-white transition-colors">
            General
          </div>
        </div>

        {/* New collections Button */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-[169px] h-[36px] px-3 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 shrink-0"
        >
          <span>New collections</span>
        </button>
      </div>

      {/* Divider */}
      <div className="self-stretch h-0 border-b border-ds-border" />

      {/* Collections Section */}
      <div className="self-stretch flex flex-col justify-start items-start gap-4 w-full">
        <div className="self-stretch flex justify-start items-center gap-2.5">
          <span className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4">
            Collections
          </span>
        </div>

        {isLoadingFolders ? (
          <div className="self-stretch flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
          </div>
        ) : (
          <div className="self-stretch grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {folders.map((folder: SavedFolder) => (
              <div
                key={folder.folder_id}
                onClick={() => router.push(`${pathname}?folderId=${folder.folder_id}`)}
                className="py-2 flex justify-start items-center gap-4 cursor-pointer group hover:bg-ds-surface-1/40 rounded-xl px-2 transition-colors"
              >
                <div className="size-10 flex justify-center items-center shrink-0">
                  <Folder className="size-6 text-ds-text-primary stroke-[1.5]" />
                </div>
                <div className="flex flex-col justify-center items-start gap-1 min-w-0">
                  <span className="text-ds-text-primary text-base font-normal font-['DM_Sans'] leading-6 group-hover:text-white transition-colors truncate">
                    {folder.name}
                  </span>
                  <span className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4">
                    Posts - {folder.post_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Collection Modal */}
      <CreateFolderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY });
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
