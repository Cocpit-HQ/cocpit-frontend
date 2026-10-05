"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Folder, ChevronLeft, Pencil, Trash2, Bookmark, Loader2 } from 'lucide-react';
import { useSavedFolders, SAVED_FOLDERS_QUERY_KEY } from '../hooks/useSavedFolders';
import { CreateFolderModal } from '../components/CreateFolderModal';
import { ActionConfirmModal } from '@/shared/commonComponents/ActionConfirmModal';
import { getSavedPosts, deleteSavedFolder, toggleSavePost } from '@/features/settings/api/savedPost';
import { mapProfilePostToPost } from '@/lib/mappers/profile.mapper';
import { useQueryClient } from '@tanstack/react-query';
import { SavedFolder, Post } from '@/types/entities';
import { toast } from 'sonner';

export function SavedSettingsPage() {
  const router = useRouter();
  const pathname = usePathname() || '/settings/saved';
  const match = pathname.match(/^(.*\/settings)/);
  const basePath = match ? match[1] : '/settings';

  const queryClient = useQueryClient();

  const { folders, isLoading: isLoadingFolders } = useSavedFolders();

  const [selectedFolder, setSelectedFolder] = useState<SavedFolder | { folder_id: string; name: string; post_count?: number; cover_image?: string } | null>(null);
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

  // Delete folder handler
  const handleDeleteFolder = async () => {
    if (!selectedFolder || selectedFolder.folder_id === 'all') return;

    setIsDeleting(true);
    try {
      await deleteSavedFolder(selectedFolder.folder_id);
      queryClient.invalidateQueries({ queryKey: SAVED_FOLDERS_QUERY_KEY });
      toast.success("Collection deleted successfully");
      setIsDeleteModalOpen(false);
      setSelectedFolder(null);
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
          onClick={() => setSelectedFolder(null)}
          className="self-stretch flex justify-start items-center gap-2.5 cursor-pointer group py-1"
        >
          <ChevronLeft className="size-5 text-ds-text-primary group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-ds-text-primary text-base font-semibold leading-6">Saved</span>
        </div>

        <div className="self-stretch px-0 sm:px-4 flex flex-col justify-start items-start gap-3 w-full">
          {/* Collection Header */}
          <div className="self-stretch p-2 border-b border-ds-border flex justify-between items-center w-full">
            <div className="flex justify-start items-center gap-4 min-w-0">
              <div className="size-10 flex justify-center items-center shrink-0">
                {/* Image code removed/commented out since collections do not have images */}
                {/* {selectedFolder.cover_image ? (
                  <img
                    src={selectedFolder.cover_image}
                    alt={selectedFolder.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <Folder className="size-6 text-ds-text-primary stroke-[1.5]" />
                )} */}
                <Folder className="size-6 text-ds-text-primary stroke-[1.5]" />
              </div>
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
              <div className="flex justify-start items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="size-8 rounded-full flex items-center justify-center hover:bg-ds-surface-2 text-ds-text-secondary hover:text-ds-text-primary transition-colors cursor-pointer"
                  title="Edit collection"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="size-8 rounded-full flex items-center justify-center hover:bg-ds-surface-2 text-ds-error hover:opacity-80 transition-opacity cursor-pointer"
                  title="Delete collection"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )}
          </div>

          {/* Saved Posts List */}
          <div className="self-stretch p-2 rounded-3xl flex flex-col justify-start items-start gap-4 w-full">
            {isLoadingPosts ? (
              <div className="self-stretch flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
              </div>
            ) : posts.length === 0 ? (
              <div className="self-stretch py-12 text-center text-ds-text-secondary text-sm">
                No saved posts in this collection.
              </div>
            ) : (
              posts.map((post) => {
                const postImage = post.imageSrc || post.images?.[0];
                const rawText = post.content || (post as any).articleBody || (post as any).title || (post as any).caption || '';
                const cleanText = rawText
                  ? rawText
                      .replace(/<[^>]*>?/gm, ' ')
                      .replace(/&nbsp;/g, ' ')
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/\s+/g, ' ')
                      .trim()
                  : '';

                const hasImage = !!postImage;
                const hasText = !!cleanText;

                return (
                  <div
                    key={post.id}
                    className="self-stretch pb-4 border-b border-ds-border last:border-b-0 last:pb-0 flex flex-col justify-start items-start gap-3 w-full"
                  >
                    {/* Author Row */}
                    <div className="self-stretch flex justify-between items-center w-full">
                      <div
                        onClick={() => post.authorId && router.push(`/profile/${post.authorId}`)}
                        className="flex justify-start items-center gap-1.5 cursor-pointer group min-w-0"
                      >
                        <img
                          src={
                            post.authorAvatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author || 'User')}`
                          }
                          alt={post.author}
                          className="size-8 rounded-full object-cover shrink-0"
                        />
                        <div className="flex flex-col justify-center items-start min-w-0">
                          <span className="text-ds-text-primary text-base font-semibold leading-6 group-hover:underline truncate">
                            {post.author}
                          </span>
                          <span className="text-ds-text-muted text-[10px] font-normal leading-3 truncate">
                            {post.authorHeadline || 'Designer'}
                          </span>
                        </div>
                      </div>

                      {/* Bookmark Icon (Orange active state) */}
                      <button
                        type="button"
                        onClick={(e) => handleUnsavePost(e, post.id)}
                        className="p-1 hover:opacity-80 transition-opacity cursor-pointer text-ds-accent shrink-0"
                        title="Remove from saved"
                      >
                        <Bookmark className="size-4 fill-ds-accent text-ds-accent" />
                      </button>
                    </div>

                    {/* Post Content & Media */}
                    {hasImage ? (
                      <div
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="self-stretch flex justify-start items-center gap-4 cursor-pointer group w-full"
                      >
                        <div className="size-20 bg-ds-surface-2 rounded-xl border border-ds-border overflow-hidden shrink-0">
                          <img
                            src={postImage}
                            alt="Post attachment"
                            className="size-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        {hasText && (
                          <div className="flex-1 flex flex-col justify-start items-start min-w-0">
                            <p className="text-ds-text-primary text-sm font-normal leading-5 line-clamp-2 group-hover:text-white transition-colors">
                              {cleanText}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : hasText ? (
                      <div
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="self-stretch cursor-pointer group w-full"
                      >
                        <p className="text-ds-text-primary text-sm font-normal leading-5 line-clamp-3 group-hover:text-white transition-colors">
                          {cleanText}
                        </p>
                      </div>
                    ) : null}
                  </div>
                );
              })
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
            buttonWidthClass="w-[88px]"
            modalClassName="w-[280px]"
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
          onClick={() => router.push(basePath)}
          aria-label="Back to settings menu"
          className="flex items-center justify-center w-8 h-8 rounded-full border border-ds-border hover:bg-ds-surface-1 transition-colors shrink-0 ds-focus-ring"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="ds-text-body-2 text-ds-text-primary">Saved posts</div>
      </div>

      {/* Row 1: General + New collections button */}
      <div className="self-stretch py-2 flex justify-between items-center w-full gap-4">
        {/* General Folder */}
        <div
          onClick={() =>
            setSelectedFolder({
              folder_id: 'all',
              name: 'General',
            })
          }
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
          className="w-auto sm:w-44 px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 shrink-0"
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
                onClick={() => setSelectedFolder(folder)}
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
