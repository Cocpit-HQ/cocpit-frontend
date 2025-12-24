"use client";

import React, { useState } from "react";
import { useFeed } from "@/context/FeedContext";
import FeedPost from "@/components/home/FeedPost";
import { Post } from "@/types/entities";

interface ProfilePostsProps {
  authorName: string;
}

export function ProfilePosts({ authorName }: ProfilePostsProps) {
  const { posts } = useFeed();
  const [activeTab, setActiveTab] = useState<"posts" | "achievements" | "insights">("posts");

  const authorPosts = posts.filter((post) => post.author === authorName);

  return (
    <div className="mt-8">
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "posts"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "achievements"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Achievements
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "insights"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Insights
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === "posts" && (
          <div className="space-y-4">
            {authorPosts.length > 0 ? (
              authorPosts.map((post) => (
                <FeedPost key={post.id} {...post} initialComments={post.commentData} />
              ))
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-xl">
                <p className="text-muted-foreground">No posts yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Mock Achievements */}
             <div className="bg-card border border-border p-4 rounded-xl flex gap-4 items-center">
                <div className="w-12 h-12 bg-yellow-500/10 text-yellow-600 rounded-full flex items-center justify-center font-bold text-xl">
                    🏆
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Top Contributor</h4>
                    <p className="text-sm text-muted-foreground">Awarded for high engagement in 2023</p>
                </div>
             </div>
             <div className="bg-card border border-border p-4 rounded-xl flex gap-4 items-center">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                    🚀
                </div>
                <div>
                    <h4 className="font-semibold text-foreground">Product Launch</h4>
                    <p className="text-sm text-muted-foreground">Shipped 5 major features</p>
                </div>
             </div>
          </div>
        )}

        {activeTab === "insights" && (
            <div className="bg-muted/30 p-8 rounded-xl text-center">
                <p className="text-muted-foreground">Detailed post insights coming soon.</p>
            </div>
        )}
      </div>
    </div>
  );
}
