"use client"

import React, { useEffect, useState, use } from "react"
import { AppShell } from "@/components/layout/AppShell"
import { getPostById } from "@/services/api/posts"
import { FeedPost } from "@/features/feed/components/FeedPost"
import { mapBackendPostToFrontend } from "@/lib/mappers/feed.mapper"
import { Post } from "@/types/entities"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useActiveProfile } from "@/context/ActiveProfileContext"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default function SinglePostPage({ params }: PageProps) {
    // Use React.use() to unwrap params
    const { id } = use(params)

    const router = useRouter()
    const { data: session } = useSession()
    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { isCompany, activeProfile } = useActiveProfile()

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const backendPost = await getPostById(id)
                const mappedPost = mapBackendPostToFrontend(backendPost)
                setPost(mappedPost)
            } catch (err) {
                console.error("Failed to load post:", err)
                setError("Failed to load post. It may have been deleted.")
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchPost()
        }
    }, [id])

    const navigateTo = (page: string) => {
        const routes: Record<string, string> = {
            home: '/feed',
            network: '/showcase',
            events: '/events',
            profile: '/profile',
            settings: '/settings',
            jobs: '/jobs',
            analytics: '/analytics',
        }
        router.push(routes[page] ?? '/feed')
    }

    // Determine if current user is the post owner,
    // respecting the active account context (personal vs company)
    const isOwnPost = post
        ? post.isCompanyPost
            // Company post: owner only when acting as the same company
            ? isCompany && !!activeProfile && post.authorId?.toString() === activeProfile.id?.toString()
            // Personal post: owner only when acting as personal account
            : !isCompany && !!session?.user?.id && post.authorId?.toString() === session.user.id.toString()
        : false

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-2xl mx-auto py-6 px-0 md:px-4">
                <div className="mb-6 flex items-center gap-4 px-4">
                    <button
                        onClick={() => router.back()}
                        className="text-sm text-primary hover:underline"
                    >
                        &larr; Back
                    </button>
                    <h1 className="text-2xl font-bold">Post Details</h1>
                </div>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : error ? (
                    <div className="text-center py-10 text-destructive">{error}</div>
                ) : post ? (
                    <FeedPost
                        {...post}
                        isOwnPost={isOwnPost}
                    />
                ) : null}
            </div>
        </div>
    )
}
