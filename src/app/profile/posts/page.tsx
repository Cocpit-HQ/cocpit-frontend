"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useFeed } from "@/context/FeedContext";
import FeedPost from "@/components/home/FeedPost";
import { AppShell } from "@/components/layout/AppShell";
import type { Page } from "@/types/common";

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
};

type TabType = 'All' | 'Professional' | 'Personal';

export default function ProfilePostsPage() {
  const router = useRouter();
  const { posts } = useFeed();
  const [activeTab, setActiveTab] = useState<TabType>('All');

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed");
  };

  const userPosts = posts.filter(p => p.author === "Sally Liang");

  const filteredPosts = userPosts.filter(post => {
    if (activeTab === 'All') return true;
    return post.category === activeTab;
  });

  const tabs: TabType[] = ['All', 'Professional', 'Personal'];

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-3xl mx-auto py-6 md:py-8 pb-20 md:pb-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-muted transition-colors text-foreground"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">All Posts</h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                        activeTab === tab
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                    }`}
                >
                    {tab}
                </button>
            ))}
          </div>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
                filteredPosts.map(post => (
                    <div key={post.id} id={`post-${post.id}`}>
                      <FeedPost {...post} initialComments={post.commentData} />
                    </div>
                ))
            ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                    <p className="text-muted-foreground">No posts found in this category.</p>
                </div>
            )}
          </div>
        </div>
      </AppShell>
    </div>
  );
}
