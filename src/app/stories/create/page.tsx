"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import { CreateStoryForm } from "@/components/showcase/CreateStoryForm"

function CreateStoryContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const sharedPostId = searchParams.get("shared_post_id")

    return (
        <div className="flex flex-col h-screen bg-black text-white">
            <div className="p-4 flex items-center">
                <Link href="/feed">
                    <Button variant="ghost" size="icon" className="text-white">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </Link>
                <h1 className="ml-4 font-bold text-lg">Add to Story</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-lg mx-auto">
                <CreateStoryForm
                    onCancel={() => router.back()}
                    onCreated={() => router.push('/feed')} // Or navigate to stories view
                    sharedPostId={sharedPostId}
                />
            </div>
        </div>
    )
}

export default function CreateStoryPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Loading...</div>}>
            <CreateStoryContent />
        </Suspense>
    )
}
