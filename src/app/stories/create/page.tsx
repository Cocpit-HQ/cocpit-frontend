"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"

function CreateStoryContent() {
    const searchParams = useSearchParams()
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

            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-lg border border-gray-800 flex flex-col items-center justify-center p-8">
                    {sharedPostId ? (
                        <>
                            <p className="text-xl font-bold mb-2">Shared Post Preview</p>
                            <p className="text-sm text-gray-400 mb-6">Post ID: {sharedPostId}</p>
                            <div className="p-4 bg-gray-800 rounded-lg w-full">
                                <p className="text-xs text-center text-gray-500">Post card rendering would happen here</p>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-400">Camera / Gallery View</p>
                    )}
                </div>

                <p className="mt-8 text-sm text-gray-400 max-w-md">
                    This is a placeholder for the Story Editor. The sharing flow successfully reached here with the correct parameters.
                </p>
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
