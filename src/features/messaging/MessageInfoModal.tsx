"use client"

import React, { useEffect, useState } from "react"
import { X, CheckCheck, Loader2 } from "lucide-react"
import Avatar from "@/components/shared/Avatar"
import api from "@/lib/axios"
import { format } from "date-fns" // Assuming date-fns is installed

interface MessageInfoModalProps {
    isOpen: boolean
    onClose: () => void
    messageId: string
    messageContent: string
    readAt?: string | null
    receiver?: {
        name: string
        avatar: string | null
    }
}

interface SeenByUser {
    user_id: string
    full_name: string
    avatar_url: string
    read_at: string
}

export default function MessageInfoModal({ isOpen, onClose, messageId, messageContent, readAt, receiver }: MessageInfoModalProps) {
    const [seenBy, setSeenBy] = useState<SeenByUser[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen && messageId) {
            setLoading(true)
            api.get(`/messages/${messageId}/seen-by`)
                .then(res => {
                    let data = res.data;
                    if (data.length === 0 && readAt && receiver) {
                        data = [{
                            user_id: 'other',
                            full_name: receiver.name,
                            avatar_url: receiver.avatar || '',
                            read_at: readAt
                        }];
                    }
                    setSeenBy(data);
                })
                .catch(err => {
                    console.error("Failed to fetch seen-by:", err);
                    if (readAt && receiver) {
                        setSeenBy([{
                            user_id: 'other',
                            full_name: receiver.name,
                            avatar_url: receiver.avatar || '',
                            read_at: readAt
                        }]);
                    } else {
                        setSeenBy([]);
                    }
                })
                .finally(() => setLoading(false))
        }
    }, [isOpen, messageId, readAt, receiver])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-l-lg rounded-r-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Message Info</h2>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-4 bg-muted/30 border-b border-border">
                    <p className="text-sm text-foreground bg-background p-3 rounded-lg border border-border shadow-sm inline-block max-w-full break-words">
                        {messageContent}
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-2 flex items-center gap-1">
                        <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> Read by
                    </h3>

                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : seenBy.length === 0 ? (
                        <div className="text-center p-4 text-sm text-muted-foreground">
                            Not read by anyone yet.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {seenBy.map((user) => (
                                <div key={user.user_id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                    <Avatar url={user.avatar_url} name={user.full_name} size="sm" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(user.read_at), "MMM d, h:mm a")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
