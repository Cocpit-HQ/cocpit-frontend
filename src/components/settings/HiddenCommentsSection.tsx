"use client"

import React, { useEffect, useState } from "react"
import { EyeOff, Eye } from "lucide-react"
import { getHiddenComments, unhideComment } from "@/services/api/posts"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

export function HiddenCommentsSection() {
  const [hiddenComments, setHiddenComments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isCompany, activeProfile } = useActiveProfile()

  useEffect(() => {
    const fetchHiddenComments = async () => {
      try {
        const companyId = isCompany ? activeProfile?.id : undefined
        const data = await getHiddenComments(companyId)
        setHiddenComments(data)
      } catch (error) {
        console.error("Failed to fetch hidden comments:", error)
        toast.error("Failed to load hidden comments")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHiddenComments()
  }, [isCompany, activeProfile?.id])

  const handleUnhide = async (commentId: string | number) => {
    try {
      const companyId = isCompany ? activeProfile?.id : undefined
      await unhideComment(commentId, companyId)
      setHiddenComments(prev => prev.filter(c => c.comment_id !== commentId))
      toast.success("Comment restored to your view")
    } catch (error) {
      console.error("Failed to unhide comment:", error)
      toast.error("Failed to unhide comment")
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (hiddenComments.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-xl border-border">
        <EyeOff className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">No hidden comments</h3>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Comments you hide from your view will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {hiddenComments.map((comment) => (
        <div key={comment.comment_id} className="flex items-start justify-between p-4 rounded-xl bg-card border border-border">
          <div className="flex gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
              <img src={comment.author_avatar || '/assets/pngegg.png'} alt={comment.author_name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">{comment.author_name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground/80 mt-1 line-clamp-2 break-words">
                {comment.content}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleUnhide(comment.comment_id)}
            className="ml-4 flex-shrink-0"
          >
            <Eye className="w-4 h-4 mr-2" />
            Unhide
          </Button>
        </div>
      ))}
    </div>
  )
}
