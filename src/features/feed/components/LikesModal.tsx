"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPostLikes, PostLikerInfo } from "@/services/api/posts";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface LikesModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] w-[90%] max-h-[80vh] p-6 rounded-[24px] bg-white flex flex-col gap-0 overflow-hidden shadow-xl border-none">
        <DialogHeader className="p-0 pb-4 flex flex-col items-center justify-center border-b border-slate-100">
          <DialogTitle className="text-center text-lg font-medium font-['Poppins'] leading-6 text-black">
            Likes
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : likers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 font-['Poppins'] text-sm">
              No likes yet
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {likers.map((liker) => {
                const profileUrl = liker.isOrganization
                  ? `/organization/${liker.username}`
                  : `/profile/${liker.username || liker.userId}`;

                return (
                  <Link
                    key={liker.userId}
                    href={profileUrl}
                    onClick={onClose}
                    className="self-stretch h-12 flex justify-start items-center gap-4 px-2 rounded-xl hover:bg-slate-50 transition-colors w-full"
                  >
                    <div className="w-8 h-8 relative overflow-hidden flex-shrink-0">
                      {liker.avatar ? (
                        <img
                          src={liker.avatar}
                          alt={liker.fullName || liker.username || "User Avatar"}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-[1.5px] border-indigo-500 bg-indigo-50/5 flex items-center justify-center text-indigo-500">
                          <svg
                            className="w-5 h-5 text-indigo-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
                      <div className="text-left text-slate-800 text-base font-normal font-['Poppins'] leading-6 truncate w-full">
                        {liker.fullName || (liker.username ? `@${liker.username}` : "Unknown")}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
