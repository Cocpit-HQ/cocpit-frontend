
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import SuggestionsPanel from "@/components/SuggestionsPanel";
import PostCard from "./PostCard";
import FeedPost from "@/components/home/FeedPost";
import { ViewAvatarModal } from "@/components/profile/ViewAvatarModal";
import { SkillOverlap } from "@/components/profile/SkillOverlap";

// Optimized Components
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton";
import { ProfileHeader } from "@/components/profile/parts/ProfileHeader";
import { ProfileStats } from "@/components/profile/parts/ProfileStats";
import { ProfileAbout } from "@/components/profile/parts/ProfileAbout";
import { ProfileExperience, FormattedExperience } from "@/components/profile/parts/ProfileExperience";
import { ProfileEducation, FormattedEducation } from "@/components/profile/parts/ProfileEducation";
import { ProfileSkills } from "@/components/profile/parts/ProfileSkills";

// Optimized Hooks
import { useProfile } from "@/hooks/use-profile";
import { useProfilePosts } from "@/hooks/use-profile-posts";
import { useSocial } from "@/context/SocialContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { initialSkills as currentUserSkills } from "@/lib/data/profile";

interface PublicProfileProps {
  userId: string;
}

export default function PublicProfile({ userId }: PublicProfileProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { isFollowing, followUser, unfollowUser, startChat, isFollowLoading } = useSocial();
  const isMobile = useIsMobile();
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);

  // TanStack Query Hooks
  const { data: user, isLoading: isUserLoading, error: userError } = useProfile(userId);
  const { data: publicPosts, isLoading: isPostsLoading } = useProfilePosts(userId);

  const isOwnProfile = session?.user?.id === userId;
  const isUserFollowing = user ? isFollowing(user.id) : false;

  const handleFollowToggle = () => {
    if (!user) return;
    if (isUserFollowing) {
      unfollowUser(user.id);
    } else {
      followUser(user.id);
    }
  };

  const handleMessage = () => {
    if (!user) return;
    startChat(user.id);
  };

  if (isUserLoading) {
    return <ProfileSkeleton />;
  }

  if (userError || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-500">
          {userError ? "Failed to load profile" : "User not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-6 md:py-8 pb-20 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8">

            <ProfileHeader
              user={user}
              isOwnProfile={isOwnProfile}
              isUserFollowing={isUserFollowing}
              isFollowLoading={isFollowLoading(user.id)}
              onFollowToggle={handleFollowToggle}
              onMessage={handleMessage}
              onAvatarClick={() => setIsViewAvatarOpen(true)}
            />

            <ProfileStats
              connectionsCount={user.id === session?.user?.id ? 501 : 500} // Mock logic from original
              profileViewsCount="--"
              postsCount={publicPosts?.length || 0}
              isUserFollowing={isUserFollowing}
            />

            {/* Skill Overlap */}
            <SkillOverlap currentUserSkills={currentUserSkills} profileUserSkills={user.skills} />

            <ProfileAbout aboutText={user.about} />

            <ProfileExperience experiences={user.experiences as unknown as FormattedExperience[]} />

            <ProfileSkills
              skills={user.skills}
              experiences={user.experiences}
              posts={publicPosts || []}
            />

            <ProfileEducation educations={user.educations as unknown as FormattedEducation[]} />

            {/* Public Posts Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-foreground font-semibold">Posts</h2>
                <button
                  onClick={() => router.push(`/profile/${userId}/posts`)}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  See all posts
                </button>
              </div>
              <div>
                {isPostsLoading ? (
                  <div className="space-y-4">
                    {/* Simple Skeleton for posts if needed, or rely on main skeleton */}
                    <div className="h-40 bg-muted/20 animate-pulse rounded-xl" />
                  </div>
                ) : publicPosts && publicPosts.length > 0 ? (
                  isMobile ? (
                    <div className="grid grid-cols-2 gap-4">
                      {publicPosts.slice(0, 4).map((post) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          href={`/profile/${userId}/posts?focusPostId=${post.id}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {publicPosts.slice(0, 4).map((post) => (
                        <FeedPost
                          key={post.id}
                          {...post}
                          initialComments={post.commentData}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No recent public activity to show.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <SuggestionsPanel />
            </div>
          </div>
        </div>
      </div>

      <ViewAvatarModal
        isOpen={isViewAvatarOpen}
        onClose={() => setIsViewAvatarOpen(false)}
        avatarUrl={user?.avatar || null}
      />
    </div>
  );
}