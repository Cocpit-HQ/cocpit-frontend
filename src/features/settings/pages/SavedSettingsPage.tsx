"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Icon, FolderIcon } from '@/components/icons';
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
import { MobileSettingsHeader } from '../components/MobileSettingsView';
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
      <div className="w-full max-w-[712px] p-0 md:p-[8px_0px] flex flex-col items-start gap-0 md:gap-3 rounded-tr-3xl rounded-br-3xl text-ds-text-primary">
        {/* Mobile Back Header */}
        <MobileSettingsHeader title="Save" onBack={() => router.push(pathname)} />

        {/* Desktop Back Bar */}
        <div
          onClick={() => router.push(pathname)}
          className="hidden md:flex self-stretch px-4 justify-start items-center gap-2.5 cursor-pointer group py-1"
        >
          <ChevronLeft className="size-5 text-ds-text-primary group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-ds-text-primary text-base font-semibold leading-6">Saved</span>
        </div>

        <div className="self-stretch px-4 flex flex-col justify-start items-start gap-3 w-full">
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
                  className="p-1 text-ds-text-secondary hover:text-ds-text-primary transition-colors cursor-pointer flex items-center justify-center"
                  title="Edit collection"
                >
                  <Icon name="profile-edit" className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-1 text-ds-error hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center"
                  title="Delete collection"
                >
                  <Icon name="trash" className="size-5" />
                </button>
              </div>
            )}
          </div>

          {/* Saved Posts List (Frame 2609256) */}
          <div className="self-stretch p-2 rounded-[24px] flex flex-col justify-start items-start gap-[12px] w-full">
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
                  className="self-stretch pb-[12px] border-b border-ds-border last:border-b-0 last:pb-0 flex flex-col justify-start items-start gap-[12px] w-full"
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
    <div className="w-full max-w-[712px] p-0 md:p-[8px_0px] flex flex-col items-start gap-0 md:gap-3 rounded-tr-3xl rounded-br-3xl text-ds-text-primary font-sans">
      {/* Mobile Back Header (visible on mobile only) */}
      <MobileSettingsHeader title="Save" />

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. DESKTOP VIEW: 100% Intact & Untouched for >= md (768px+)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="hidden md:flex w-full px-4 py-2 flex-col justify-start items-start gap-3">
        {/* Row 1: General + New collections button */}
        <div className="self-stretch py-2 flex justify-between items-center w-full gap-4">
          {/* General Folder */}
          <div
            onClick={() => router.push(`${pathname}?folderId=all`)}
            className="flex justify-start items-center gap-4 cursor-pointer group"
          >
            <div className="size-10 flex justify-center items-center shrink-0">
              <FolderIcon className="size-6 text-ds-text-primary" />
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
                    <FolderIcon className="size-6 text-ds-text-primary" />
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
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. MOBILE VIEW: Strictly rendered on < md (< 768px)          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden flex-col w-full px-4 select-none">
        {/* General Folder */}
        <div
          onClick={() => router.push(`${pathname}?folderId=all`)}
          role="button"
          tabIndex={0}
          className="flex items-center gap-3.5 cursor-pointer py-1.5 active:opacity-75 transition-opacity"
        >
          <FolderIcon className="w-5 h-5 text-ds-text-primary shrink-0" />
          <span className="text-ds-text-primary text-[15px] font-normal font-['DM_Sans'] leading-[22px]">
            General
          </span>
        </div>

        {/* New collections Button (Full-width pill) */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full h-[38px] mt-3 rounded-full border border-ds-border hover:bg-ds-surface-1 active:bg-ds-surface-1 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="text-ds-text-primary text-[14px] font-medium font-['DM_Sans']">
            New collections
          </span>
        </button>

        {/* Collections Title */}
        <div className="mt-5 mb-3 w-full">
          <span className="text-ds-text-secondary text-[12px] font-normal font-['DM_Sans']">
            Collections
          </span>
        </div>

        {/* Collections 2-Column Grid */}
        {isLoadingFolders ? (
          <div className="w-full flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
          </div>
        ) : folders.length === 0 ? (
          <div className="w-full py-6 text-center text-ds-text-secondary text-[13px] font-['DM_Sans']">
            No collections created yet
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-4 w-full">
            {folders.map((folder: SavedFolder) => (
              <div
                key={folder.folder_id}
                onClick={() => router.push(`${pathname}?folderId=${folder.folder_id}`)}
                role="button"
                tabIndex={0}
                className="flex items-start gap-2.5 cursor-pointer py-1 active:opacity-75 transition-opacity"
              >
                <FolderIcon className="w-5 h-5 text-ds-text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-ds-text-primary text-[14px] font-normal font-['DM_Sans'] leading-[20px] truncate">
                    {folder.name}
                  </span>
                  <span className="text-ds-text-secondary text-[12px] font-normal font-['DM_Sans'] leading-[16px] truncate">
                    Posts - {folder.post_count ?? 0}
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
