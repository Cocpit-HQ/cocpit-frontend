"use client";

import React, { useEffect, useState } from "react";
import { Dialog, BareDialogContent, DialogTitle } from "@/components/ui/dialog";
import { getPostLikes, PostLikerInfo } from "@/services/api/posts";
import { followUser } from "@/services/api/social";
import { followCompany } from "@/services/api/social";
import Link from "next/link";
import { X, Loader2 } from "lucide-react";

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

/* Modal that shows who liked a post, with the ability to follow each liker */
export function LikesModal({ isOpen, onClose, postId }: LikesModalProps) {
  const [likers, setLikers] = useState<PostLikerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && postId) {
      setLoading(true);
      getPostLikes(postId)
        .then((res) => {
          setLikers(res.likes || []);
        })
        .catch((err) => {
          console.error("Failed to fetch post likes:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, postId]);

  // Handles following a user or organization with optimistic state update
  const handleFollow = async (liker: PostLikerInfo) => {
    // Optimistic update
    setLikers((prev) => 
      prev.map((l) => l.userId === liker.userId ? { ...l, isFollowing: true } : l)
    );

    try {
      if (liker.isOrganization && liker.organizationId) {
        await followCompany(liker.organizationId);
      } else if (liker.individualUserId) {
        await followUser(liker.individualUserId);
      } else {
        await followUser(liker.userId);
      }
    } catch (error) {
      console.error("Failed to follow user/company:", error);
      // Revert optimistic update on failure
      setLikers((prev) => 
        prev.map((l) => l.userId === liker.userId ? { ...l, isFollowing: false } : l)
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <BareDialogContent className="w-[400px] h-[348px] flex flex-col items-center p-3 gap-3 bg-ds-bg border border-ds-border rounded-[16px] shadow-xl outline-none">
        <DialogTitle className="sr-only">Likes</DialogTitle>
        
        {/* Header */}
        <div className="w-[376px] h-[56px] flex flex-col items-center gap-3 shrink-0">
          <div className="w-[376px] h-5 flex flex-row justify-end items-center gap-[10px] shrink-0">
            <button 
              onClick={onClose}
              aria-label="Close likes modal"
              className="w-5 h-5 flex items-center justify-center z-10 text-ds-text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded ds-focus-ring"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="font-['DM_Sans'] font-medium text-base leading-6 text-ds-text-primary">
            Likes
          </div>
        </div>

        {/* List */}
        <div className="w-[376px] h-[256px] flex flex-col items-start gap-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden shrink-0">
          {loading ? (
            <div className="w-full flex justify-center items-center py-8 h-full">
              <Loader2 className="w-6 h-6 animate-spin text-ds-accent" />
            </div>
          ) : likers.length > 0 ? (
            likers.map((liker) => {
              const profileUrl = liker.isOrganization
                ? `/organization/${liker.username}`
                : `/profile/${liker.username || liker.userId}`;

              return (
                <div
                  key={liker.userId}
                  className="w-[376px] h-9 flex flex-row justify-between items-center gap-2 shrink-0 group"
                >
                  {/* User info */}
                  <Link href={profileUrl} onClick={onClose} className="flex flex-row items-center gap-2 min-w-0 flex-1 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded ds-focus-ring">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                      {liker.avatar ? (
                        <img
                          src={liker.avatar}
                          alt={liker.fullName || liker.username || "Avatar"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full border border-ds-border bg-ds-surface-1 flex items-center justify-center text-ds-text-secondary">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="font-['DM_Sans'] font-normal text-sm leading-5 text-ds-text-primary truncate">
                      {liker.fullName || (liker.username ? `@${liker.username}` : "Unknown")}
                    </div>
                  </Link>

                  {/* Follow Button */}
                  {!liker.isSelf && !liker.isFollowing && (
                    <button 
                      onClick={() => handleFollow(liker)}
                      aria-label={`Follow ${liker.fullName || liker.username || 'user'}`}
                      className="h-6 px-1 flex items-center justify-center font-['DM_Sans'] font-medium text-base leading-6 text-ds-accent hover:opacity-80 transition-opacity text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded ds-focus-ring"
                    >
                      Follow
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center font-['DM_Sans'] text-ds-text-secondary text-sm">
              No likes yet
            </div>
          )}
        </div>

      </BareDialogContent>
    </Dialog>
  );
}
