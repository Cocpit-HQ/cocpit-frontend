import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { handleConnectionRequest } from '@/services/api/social'
import { toast } from 'sonner'
import { ConnectionRequest } from '@/types/social'
import { cn } from '@/lib/utils'

interface ConnectionRequestCardProps {
    request: ConnectionRequest
    onAction?: (requestId: string, action: 'connected' | 'rejected') => void
}

export const ConnectionRequestCard: React.FC<ConnectionRequestCardProps> = ({ request, onAction }) => {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleAction = async (action: 'connected' | 'rejected') => {
        setLoading(true)
        try {
            await handleConnectionRequest(request.id, action)
            toast.success(action === 'connected' ? "Connection accepted" : "Connection rejected")
            onAction?.(request.id, action)
        } catch (err) {
            console.error("Failed to handle request:", err)
            toast.error("Failed to process request")
        } finally {
            setLoading(false)
        }
    }

    const navigateToProfile = () => {
        router.push(`/profile/${request.sender_id}`)
    }

    return (
        <div className="p-4 border rounded-lg bg-card hover:border-primary/50 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={navigateToProfile}>
                <Avatar
                    url={request.sender.avatar || undefined}
                    name={request.sender.name}
                    size="lg"
                />
                <div>
                    <h3 className="font-semibold text-foreground hover:underline">{request.sender.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{request.sender.headline || "No headline"}</p>
                    {/* Potential Mutual connections count here if available */}
                </div>
            </div>

            <div className="flex gap-2 shrink-0">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAction('rejected')}
                    disabled={loading}
                >
                    Reject
                </Button>
                <Button
                    size="sm"
                    onClick={() => handleAction('connected')}
                    disabled={loading}
                >
                    Accept
                </Button>
            </div>
        </div>
    )
}
