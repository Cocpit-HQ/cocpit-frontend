"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Folder, Pencil, Trash2 } from "lucide-react";
import { getSavedPosts, getSavedFolders, deleteSavedFolder, renameSavedFolder } from "@/features/settings/api/savedPost";
import { deletePost as apiDeletePost } from "@/services/api/posts";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { Post, SavedFolder } from "@/types/entities";
import { SavedPostCard } from "../components/SavedPostCard";
import { toast } from "sonner";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import { CreateFolderModal } from "@/features/settings/components/CreateFolderModal";
import { useQueryClient } from "@tanstack/react-query";
import { useActiveProfile } from "@/context/ActiveProfileContext";

const isValidImageUrl = (url?: string | null): boolean => !!url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:'));

export default function CustomSavedPostsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const folderId = params.folderId as string;
  const { activeProfile, isCompany } = useActiveProfile();
  
  const [folder, setFolder] = useState<SavedFolder | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const getSavedSettingsUrl = () => {
    if (isCompany && activeProfile?.slug) {
      return `/organization/${activeProfile.slug}/settings/saved`;
    }
    return "/settings/saved";
  };

  useEffect(() => {
    // Fetch folder name for the header
    async function fetchFolderName() {
      try {
        const response = await getSavedFolders();
        if (response.success && response.folders) {
          const foundFolder = response.folders.find((f: SavedFolder) => String(f.folder_id) === String(folderId));
          if (foundFolder) {
            setFolder(foundFolder);
          }
        }
      } catch (err) {
        console.error("Failed to fetch folder name", err);
      }
    }
    fetchFolderName();
  }, [folderId]);

  const fetchPosts = useCallback(async (reset = false) => {
    if (loadingRef.current && !reset) return;

    setLoading(true);
    loadingRef.current = true;
    try {
      const response = await getSavedPosts(folderId, reset ? 1 : currentPage + (reset ? 0 : 1), 10);
      const mappedPosts = (response as any).posts?.map(mapProfilePostToPost) || []; 
      setHasMore((response as any).hasMore || false);
      setCurrentPage(prev => reset ? 1 : prev + 1);

      if (reset) {
        setPosts(mappedPosts);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewPosts = mappedPosts.filter((p: Post) => !existingIds.has(p.id));
          return [...prev, ...uniqueNewPosts];
        });
      }
    } catch (error) {
      console.error("Failed to fetch saved posts", error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [currentPage, folderId]);

  useEffect(() => {
    fetchPosts(true);

    const handleRefresh = () => {
      fetchPosts(true);
    };
    window.addEventListener("cocpit:saved-updated", handleRefresh);
    return () => window.removeEventListener("cocpit:saved-updated", handleRefresh);
  }, [folderId]);

  const handleDeleteFolder = async () => {
    setIsDeleting(true);
    try {
      await deleteSavedFolder(folderId);
      queryClient.invalidateQueries({ queryKey: ["saved-folders"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile-posts"] });
      toast.success("Folder deleted");
      router.push(getSavedSettingsUrl());
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete folder");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handlePostUnsaved = (id: string) => {
    setPosts(prev => prev.filter(post => post.id !== id));
    setFolder(prev => prev ? { ...prev, post_count: Math.max(0, (prev.post_count || 1) - 1) } : null);
    queryClient.invalidateQueries({ queryKey: ["saved-folders"] });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          fetchPosts(false);
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, fetchPosts]);

  return (
    <div className="flex-1 w-full p-6 md:p-8 bg-white rounded-r-[24px]">
      <div className="w-full max-w-[666px]">
        {/* Navigation Header */}
        <div className="flex flex-col gap-[20px] mb-8 w-full max-w-[666px]">
          {/* Back Button */}
          <div className="flex flex-row items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-11 h-11 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors bg-white text-gray-700 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" strokeWidth={2} />
            </button>
            <div className="flex flex-col justify-center">
              <span className="text-[24px] font-[family-name:var(--font-poppins)] font-semibold text-black leading-tight">Saved</span>
              <span className="text-[14px] font-[family-name:var(--font-poppins)] text-gray-400 leading-tight">Collection</span>
            </div>
          </div>

          {/* Folder Details Card */}
          <div className="flex flex-row justify-between items-center bg-white border border-[#E0E7FF] rounded-[12px] p-2 w-full h-[60px] max-w-[666px]">
            <div className="flex flex-row items-center gap-[16px]">
              {isValidImageUrl(folder?.cover_image) ? (
                <img src={folder!.cover_image!} alt={folder!.name} className="w-[40px] h-[40px] rounded-full object-cover" />
              ) : (
                <div className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-orange-50">
                  <Folder className="w-5 h-5 text-orange-500" strokeWidth={2} />
                </div>
              )}
              <div className="flex flex-col gap-[4px]">
                <span className="text-[16px] font-[family-name:var(--font-poppins)] font-normal text-black leading-[24px]">{folder?.name || "Loading..."}</span>
                <span className="text-[12px] font-[family-name:var(--font-poppins)] font-normal text-[#6B7280] leading-[16px]">Post - {folder?.post_count || 0}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row items-center gap-[16px] px-2">
              <button onClick={() => setIsRenameModalOpen(true)} className="flex items-center justify-center hover:bg-gray-50 rounded-full transition-colors">
                <Pencil className="w-[20px] h-[20px] text-black" strokeWidth={1.5} />
              </button>
              <button onClick={() => setIsDeleteModalOpen(true)} className="flex items-center justify-center hover:bg-red-50 rounded-full transition-colors">
                <Trash2 className="w-[20px] h-[20px] text-[#FF6B6B]" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[24px]">
          {/* Main Content Area */}
          <div className="space-y-[24px]">
            {/* Posts List */}
            <div className="flex flex-col gap-[12px] p-[8px] rounded-[24px] w-full max-w-[648px]">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div
                    key={post.id}
                    className="self-stretch pb-[12px] border-b border-[#2C2C33] last:border-b-0 last:pb-0 flex flex-col justify-start items-start gap-[12px] w-full"
                  >
                    <SavedPostCard
                      key={post.id}
                      post={post}
                      folderId={folderId}
                      onUnsave={handlePostUnsaved}
                    />
                  </div>
                ))
              ) : (
                !loading && (
                  <div className="text-center py-20 bg-white rounded-[24px] border border-dashed border-border/60 w-full">
                    <p className="text-muted-foreground font-[family-name:var(--font-poppins)]">No saved posts in this folder.</p>
                  </div>
                )
              )}

              {/* Loading Sentinel */}
              {hasMore && (
               <div ref={observerTarget} className="flex justify-center py-8">
                  {loading && <Loader2 className="w-8 h-8 animate-spin text-primary" />}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rename Modal */}
      <CreateFolderModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        isEditing={true}
        folderId={folderId}
        initialName={folder?.name || ""}
        initialCoverImage={folder?.cover_image || ""}
        onSuccess={(updatedFolder) => {
          // The rename PUT only returns the updated name/cover_image — it doesn't
          // include an aggregated post_count. Merge instead of overwrite so we
          // don't clobber the post_count we already loaded with a missing field
          // (which rendered as 0 until a full refresh re-fetched the folder list).
          setFolder(prev => (prev ? { ...prev, ...updatedFolder, post_count: prev.post_count } : updatedFolder));
          queryClient.invalidateQueries({ queryKey: ["saved-folders"] });
          setIsRenameModalOpen(false);
        }}
      />

      <ActionConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete collection"
        description="Are you sure you want to delete this collection"
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="accent"
        onConfirm={handleDeleteFolder}
        isLoading={isDeleting}
        buttonWidthClass="w-[77px]"
        modalClassName="w-[237px] h-[150px]"
      />
    </div>
  );
}
