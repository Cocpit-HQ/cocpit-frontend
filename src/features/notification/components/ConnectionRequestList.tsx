import React from 'react'
import { ConnectionRequest } from '@/types/social'
import { ConnectionRequestCard } from './ConnectionRequestCard'
import { Skeleton } from '@/components/ui/skeleton'

interface ConnectionRequestListProps {
    requests: ConnectionRequest[]
    loading: boolean
    onAction: (requestId: string) => void
}

export const ConnectionRequestList: React.FC<ConnectionRequestListProps> = ({ requests, loading, onAction }) => {

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-[200px]" />
                            <Skeleton className="h-3 w-[150px]" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (requests.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                <p>No pending connection requests</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {requests.map(req => (
                <ConnectionRequestCard
                    key={req.id}
                    request={req}
                    onAction={() => onAction(req.id)}
                />
            ))}
        </div>
    )
}
