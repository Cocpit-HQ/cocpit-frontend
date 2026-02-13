"use client"

import React, { useEffect, useState } from 'react'
import { Bookmark, Loader2 } from 'lucide-react'
import { getSavedPosts } from '@/services/api/savedPost'
import { Post } from '@/types/entities'
import FeedPost from '@/components/home/FeedPost'
import PostCard from '@/components/shared/PostCard'
import { motion, AnimatePresence } from 'framer-motion'

export function SavedPosts() {
    const [posts, setPosts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await getSavedPosts()
                if (response.success) {
                    setPosts(response.posts)
                    console.log("Saved Posts fetched:", response.posts)
                }
            } catch (error) {
                console.error("Failed to fetch saved posts:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchPosts()
    }, [])

    const handleUnsaveLocal = (postId: string) => {
        setPosts(prev => prev.filter(p => (p.post_id || p.id).toString() !== postId))
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-50" />
                <p className="mt-4 text-muted-foreground text-sm font-medium">Loading your saved content...</p>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="relative mb-6">
                    <Bookmark className="w-24 h-24 text-muted-foreground/10" />
                    <Bookmark className="absolute inset-0 w-24 h-24 text-muted-foreground/5 blur-xl" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No saved posts yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                    Posts you save will appear here. Tap the bookmark icon on any post in your feed to save it.
                </p>
            </div>
        )
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary/70">Gallery View</span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {posts.map((post) => (
                        <motion.div
                            key={post.post_id || post.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="h-full"
                        >
                            <PostCard
                                post={post}
                                onDelete={(id) => handleUnsaveLocal(id)}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}
