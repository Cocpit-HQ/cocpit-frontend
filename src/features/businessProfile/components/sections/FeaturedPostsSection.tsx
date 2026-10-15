"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EmptyPostsIcon } from "@/components/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { BusinessProfileData } from "../../types/business-profile.types";
import { FeedPost } from "@/features/feed/components/FeedPost";
import { FeedPostCardSkeleton } from "@/features/feed/components/skeletons/FeedPostCardSkeleton";
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper";
import { getPostMenuAccess } from "@/features/feed/utils/postMenuAccess";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useUIStore } from "@/store/ui.store";
import { useShallow } from "zustand/react/shallow";
import type { Post } from "@/types/entities";
import { CreatePostModal } from "@/features/feed/components/create-post";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeaturedPostsSectionProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
  canManageCompany?: boolean;
  canManageOwnPosts?: boolean;
  onSeeAllClick?: () => void;
  currentUserId?: string;
  viewerPermissions?: string[];
}

export default function FeaturedPostsSection({
  data,
  isOwnProfile = false,
  canManageCompany = false,
  canManageOwnPosts = false,
  onSeeAllClick,
  currentUserId,
  viewerPermissions,
}: FeaturedPostsSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { activeProfile, userCompanies } = useActiveProfile();
  const hiddenPostIds = useUIStore(useShallow((s) => s.hiddenPostIds));
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const hasCreatePostPermission = Boolean(
    canManageCompany ||
    canManageOwnPosts ||
    viewerPermissions?.includes("*") ||
    viewerPermissions?.includes("MANAGE_COMPANY") ||
    viewerPermissions?.includes("CREATE_POST") ||
    viewerPermissions?.includes("CREATE_CONTENT")
  );

  // Detect mobile viewport (mobile: 1, desktop: 2)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { data: postsData, isLoading, refetch } = useQuery({
    queryKey: ["orgPostsFallback", data.id],
    queryFn: async () => {
      return businessProfileService.getOrganizationPosts(data.id, { limit: 6, preview: true });
    },
    enabled: Boolean(data.id),
    staleTime: 0,
    refetchOnMount: "always",
  });

  // Always sync latest posts when mounting the section
  useEffect(() => {
    if (data.id) {
      refetch();
    }
  }, [data.id, refetch]);

  const handleDeletePost = (postId: string) => {
    queryClient.setQueryData(["orgPostsFallback", data.id], (old: any) => {
      if (!old) return old;
      const filterArr = (arr: any[]) =>
        arr.filter((p: any) => String(p.post_id || p.id || p._id) !== String(postId));
      if (Array.isArray(old.posts)) return { ...old, posts: filterArr(old.posts) };
      if (Array.isArray(old.data)) return { ...old, data: filterArr(old.data) };
      if (Array.isArray(old)) return filterArr(old);
      return old;
    });
    queryClient.invalidateQueries({ queryKey: ["orgPostsFallback", data.id] });
    queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
    queryClient.invalidateQueries({ queryKey: ["orgProfile"] });
  };

  const handleToggleVisibilityPost = (postId: string) => {
    queryClient.invalidateQueries({ queryKey: ["orgPostsFallback", data.id] });
    queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
  };

  useEffect(() => {
    const handleSyncPosts = () => {
      queryClient.invalidateQueries({ queryKey: ["orgPostsFallback"] });
      queryClient.invalidateQueries({ queryKey: ["orgPosts"] });
      refetch();
    };
    const handlePostDeleted = (e: any) => {
      const deletedId = e.detail?.id;
      if (deletedId) {
        handleDeletePost(deletedId);
      }
    };
    window.addEventListener("postCreated", handleSyncPosts);
    window.addEventListener("postUpdated", handleSyncPosts);
    window.addEventListener("postDeleted", handlePostDeleted);
    return () => {
      window.removeEventListener("postCreated", handleSyncPosts);
      window.removeEventListener("postUpdated", handleSyncPosts);
      window.removeEventListener("postDeleted", handlePostDeleted);
    };
  }, [data.id, queryClient, refetch]);

  const rawPostsList = useMemo(() => {
    let rawList: any[] = [];
    if (postsData) {
      if (Array.isArray(postsData?.posts)) rawList = postsData.posts;
      else if (Array.isArray(postsData?.data?.posts)) rawList = postsData.data.posts;
      else if (Array.isArray(postsData?.data)) rawList = postsData.data;
      else if (Array.isArray(postsData)) rawList = postsData;
    }
    return rawList;
  }, [postsData]);

  const availablePosts: Post[] = useMemo(() => {
    return rawPostsList
      .filter((p: any) => {
        if (!p) return false;
        const vis = p.visibility || "public";
        if (!isOwnProfile && vis === "private") return false;
        return true;
      })
      .map((p: any) => {
        const post = mapProfilePostToPost(p);
        const avatar = post.authorAvatar || data.logoUrl;
        return {
          ...post,
          isCompanyPost: true,
          authorSlug: post.authorSlug || data.slug || "",
          authorAvatar: avatar !== "/images/companyonboarding/companyprofileDefault.jpg" ? avatar : undefined,
          authorHeadline: post.authorHeadline || data.tagline || data.industry,
        };
      });
  }, [rawPostsList, isOwnProfile, data.slug, data.logoUrl, data.tagline, data.industry]);

  const displayedPosts = useMemo(() => {
    const limit = isMobile ? 1 : 2;
    return availablePosts
      .filter((p) => !hiddenPostIds.includes(p.id?.toString()))
      .slice(0, limit);
  }, [availablePosts, hiddenPostIds, isMobile]);

  // Loading skeleton
  if (isLoading && !postsData) {
    return (
      <div className="w-full max-w-[800px] px-5 flex flex-col items-center gap-5">
        <div className="self-stretch w-full flex justify-between items-center h-6">
          <div className="w-32 h-5 bg-ds-surface-1 rounded animate-pulse" />
        </div>
        <div className="self-stretch w-full flex flex-col sm:flex-row justify-start items-start gap-6">
          <div className="flex-1 w-full">
            <FeedPostCardSkeleton className="!mx-0 !ml-0" />
          </div>
          <div className="flex-1 w-full hidden sm:block">
            <FeedPostCardSkeleton className="!mx-0 !ml-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[800px] px-5 flex flex-col items-center gap-5">
        {/* Header */}
        <div className="self-stretch w-full flex justify-between items-center h-6">
          <h2 className="text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
            Featured Posts
          </h2>
        </div>

        {displayedPosts.length === 0 ? (
          /* Empty State */
          <div className="w-full py-8 flex flex-col justify-center items-center gap-4">
            {/* Icon Circle */}
            <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center">
              <EmptyPostsIcon className="w-8 h-8 text-ds-text-secondary shrink-0" size={32} />
            </div>

            {/* Title & Description */}
            <div className="self-stretch flex flex-col justify-start items-center gap-1.5">
              <div className="text-center text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
                No posts yet
              </div>
              <div className="w-80 max-w-full text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                {isOwnProfile || canManageCompany || canManageOwnPosts
                  ? "Share your thoughts, articles, or updates with your network."
                  : `${data.name || "Company"} doesn’t have any posts yet.`}
              </div>
            </div>

            {/* Create Post Action Button */}
            {(isOwnProfile || hasCreatePostPermission) && (
              hasCreatePostPermission ? (
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("scroll-/feed", "0");
                    router.push("/feed");
                  }}
                  className="px-3 py-1.5 rounded-[100px] border border-ds-border inline-flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-1 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-ds-text-primary shrink-0" />
                  <span>Create post</span>
                </button>
              ) : (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-not-allowed" tabIndex={0}>
                        <button
                          type="button"
                          disabled
                          aria-disabled="true"
                          className="px-3 py-1.5 rounded-[100px] border border-ds-border inline-flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 opacity-50 cursor-not-allowed pointer-events-none"
                        >
                          <Plus className="w-4 h-4 text-ds-text-primary shrink-0" />
                          <span>Create post</span>
                        </button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      sideOffset={6}
                      className="bg-ds-surface-2 text-ds-text-primary border border-ds-border text-xs px-2.5 py-1.5 rounded shadow-lg z-[100]"
                    >
                      You don't have access to this screen
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            )}
          </div>
        ) : (
          <>
            {/* 2 Cards Grid: canonical FeedPost matching profile layout */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              {displayedPosts.map((post) => (
                <div key={post.id} className="w-full">
                  <FeedPost
                    {...post}
                    isProfileView={true}
                    sessionId="featured-posts"
                    initialComments={post.commentData}
                    menuAccess={getPostMenuAccess({
                      isCompanyPost: true,
                      companyId: data.id,
                      createdByUserId: (post as any).createdByUserId,
                      currentUserId,
                      explicitPermissions: viewerPermissions,
                      userCompanies,
                      activeProfile,
                    })}
                    onDelete={handleDeletePost}
                    onToggleVisibility={handleToggleVisibilityPost}
                    priority={false}
                    onRepostWithThoughts={(postToQuote) => {
                      useUIStore.getState().setSharedPostData(postToQuote);
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        useUIStore.getState().setActiveModal("create-post");
                      } else {
                        router.push("/feed");
                      }
                    }}
                  />
                </div>
              ))}
            </div>

            {/* See all CTA */}
            {onSeeAllClick && (
              <button
                type="button"
                onClick={onSeeAllClick}
                className="self-center text-center text-ds-accent text-xs font-medium font-['DM_Sans'] leading-4 hover:opacity-85 transition-opacity cursor-pointer select-none"
              >
                See all
              </button>
            )}
          </>
        )}
      </div>

      {isCreatePostModalOpen && (
        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          companyId={data.id}
          companyName={data.name}
          companyLogo={data.logoUrl}
          onPostCreated={() => {
            setIsCreatePostModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["orgPostsFallback", data.id] });
            queryClient.invalidateQueries({ queryKey: ["orgPosts", data.id] });
            queryClient.invalidateQueries({ queryKey: ["orgProfile"] });
          }}
        />
      )}
    </>
  );
}
