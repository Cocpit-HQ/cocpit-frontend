import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import Avatar from '@/components/shared/Avatar'
import { Button } from '@/components/ui/button'
import { handleConnectionRequest } from '@/services/api/social'
import { companyService } from '@/services/organization.service'
import { toast } from 'sonner'
import { ConnectionRequest } from '@/types/social'
import { cn } from '@/lib/utils'

interface ConnectionRequestCardProps {
    request: ConnectionRequest
    onAction?: (requestId: string, action: 'connected' | 'rejected') => void
}

export const ConnectionRequestCard: React.FC<ConnectionRequestCardProps> = ({ request, onAction }) => {
    const router = useRouter()
    const queryClient = useQueryClient()
    const [loading, setLoading] = useState(false)

    const handleAction = async (action: 'connected' | 'rejected') => {
        setLoading(true)
        try {
            if (request.isCompanyRequest) {
                // For company requests, sender_id is the company_id
                await companyService.handleConnectionRequest(request.sender_id, action === 'connected' ? 'accepted' : 'rejected')
            } else {
                await handleConnectionRequest(request.id, action)
            }

            toast.success(action === 'connected' ? "Connection accepted" : "Connection rejected")

            // Invalidate caches so button state + counts update immediately
            queryClient.invalidateQueries({ queryKey: ['relationship', request.sender_id] })
            queryClient.invalidateQueries({ queryKey: ['company_relationship', request.sender_id] })
            queryClient.invalidateQueries({ queryKey: ['profile', request.sender_id] })
            queryClient.invalidateQueries({ queryKey: ['connectionCount', request.sender_id] })
            queryClient.invalidateQueries({ queryKey: ['followersCount', request.sender_id] })
            queryClient.invalidateQueries({ queryKey: ['profileStats', request.sender_id] })
            queryClient.invalidateQueries({ queryKey: ['myProfile'] })
            queryClient.invalidateQueries({ queryKey: ['pendingRequests'] })

            onAction?.(request.id, action)
        } catch (err) {
            console.error("Failed to handle request:", err)
            toast.error("Failed to process request")
        } finally {
            setLoading(false)
        }
    }

    const navigateToProfile = () => {
        if (request.isCompanyRequest && request.sender.slug) {
            router.push(`/organization/${request.sender.slug}`)
        } else if (request.isCompanyRequest) {
            router.push(`/organization/${request.sender_id}`) // Fallback if slug missing
        } else {
            router.push(`/profile/${request.sender_id}`)
        }
    }

    return (
        <div className="p-4 border border-ds-border rounded-lg bg-ds-surface-1 hover:border-ds-accent/50 transition-all flex items-center justify-between gap-4 font-['DM_Sans']">
            <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={navigateToProfile}>
                <Avatar
                    url={request.sender.avatar || undefined}
                    name={request.sender.name}
                    size="lg"
                    isCompany={request.isCompanyRequest}
                />
                <div>
                    <h3 className="ds-text-secondary-2 font-['DM_Sans'] text-ds-text-primary">{request.sender.name}</h3>
                    <p className="ds-text-secondary font-['DM_Sans'] text-ds-text-secondary line-clamp-1">{request.sender.headline || "No headline"}</p>
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
