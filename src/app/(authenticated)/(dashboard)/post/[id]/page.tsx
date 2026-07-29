"use client"

import React, { useEffect, useState, use } from "react"
import { getPostById } from "@/services/api/posts"
import { FeedPost } from "@/features/feed/components/FeedPost"
import { mapBackendPostToFrontend } from "@/lib/mappers/feed.mapper"
import { Post } from "@/types/entities"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { getPostMenuAccess } from "@/features/feed/utils/postMenuAccess"
import { ArrowLeft, Loader2 } from "lucide-react"

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default function SinglePostPage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const searchParams = useSearchParams()
    const showComments = searchParams.get("comments") === "true" || !!searchParams.get("commentId")
    const { data: session } = useSession()
    const [post, setPost] = useState<Post | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const { userCompanies } = useActiveProfile()

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const backendPost = await getPostById(id)
                const mappedPost = mapBackendPostToFrontend(backendPost)
                if (mappedPost.is_community_article && mappedPost.communityId) {
                    router.replace(`/channels/${mappedPost.communityId}/article/${mappedPost.id}`)
                    return
                }
                setPost(mappedPost)
            } catch (err: any) {
                if (err?.response?.status !== 404) {
                    console.error("Failed to load post:", err)
                }
                setError("Failed to load post. It may have been deleted.")
            } finally {
                setLoading(false)
            }
        }

        if (id) {
            fetchPost()
        }
    }, [id])

    const menuAccess = getPostMenuAccess({
        isCompanyPost: post?.isCompanyPost,
        companyId: post?.author_org_id,
        createdByUserId: post?.createdByUserId,
        currentUserId: session?.user?.id,
        userCompanies,
    })

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-[592px] mx-auto px-4 py-10">
                {/* Navigation Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors text-foreground"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-poppins)]">Post Details</h1>
                </div>

                <div className="flex flex-col gap-[24px]">
                    {/* Main Content Area */}
                    <div className="space-y-[24px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[24px] border border-border/40">
                                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                                <p className="text-muted-foreground font-[family-name:var(--font-poppins)]">Loading post details...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-card rounded-[24px] border border-destructive/20">
                                <p className="text-destructive font-medium font-[family-name:var(--font-poppins)]">{error}</p>
                                <button 
                                    onClick={() => router.back()}
                                    className="mt-4 px-6 py-2 bg-primary text-white rounded-full text-sm font-medium"
                                >
                                    Go Back
                                </button>
                            </div>
                        ) : post ? (
                            <div className="w-full bg-card rounded-[24px] overflow-hidden">
                                <FeedPost
                                    {...post}
                                    menuAccess={menuAccess}
                                    isFullContent={true}
                                    initialShowComments={showComments}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
