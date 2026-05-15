"use client"

import React from "react"
import { ChatSession } from "@/services/api/messaging"

interface SessionBannerProps {
    session: ChatSession | null
    featureEnabled: boolean
    isMySession: boolean
    isActionLoading: boolean
    actionError: string | null
    sessionLost: boolean
    onClaim: () => void
    onRelease: () => void
    onTakeover: () => void
    onClearSessionLost: () => void
}

export function SessionBanner({
    session,
    featureEnabled,
    isMySession,
    isActionLoading,
    actionError,
    sessionLost,
    onClaim,
    onRelease,
    onTakeover,
    onClearSessionLost,
}: SessionBannerProps) {
    if (!featureEnabled) return null

    // Session lost banner (takeover/timeout while sending)
    if (sessionLost) {
        return (
            <div className="px-4 py-2.5 bg-destructive/15 border-b border-destructive/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">⚠️</span>
                    <span className="text-sm text-destructive font-medium truncate">
                        Session was taken over or timed out
                    </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={() => { onClearSessionLost(); onClaim(); }}
                        disabled={isActionLoading}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isActionLoading ? 'Reclaiming...' : 'Reclaim'}
                    </button>
                    <button
                        onClick={onClearSessionLost}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        )
    }

    // Error display
    if (actionError) {
        return (
            <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
                <p className="text-xs text-destructive text-center">{actionError}</p>
            </div>
        )
    }

    // No active session — unclaimed
    if (!session) {
        return (
            <div className="px-4 py-2.5 bg-muted/50 border-b border-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">
                        No one is handling this conversation
                    </span>
                </div>
                <button
                    onClick={onClaim}
                    disabled={isActionLoading}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                >
                    {isActionLoading ? 'Claiming...' : 'Claim'}
                </button>
            </div>
        )
    }

    // My session — active
    if (isMySession) {
        return (
            <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium truncate">
                        You are handling this conversation
                    </span>
                </div>
                <button
                    onClick={onRelease}
                    disabled={isActionLoading}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-muted/80 transition-colors disabled:opacity-50 shrink-0"
                >
                    {isActionLoading ? 'Releasing...' : 'Release'}
                </button>
            </div>
        )
    }

    // Someone else's session
    return (
        <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-sm text-amber-700 dark:text-amber-400 truncate">
                    Handled by <span className="font-medium">{session.handler_name_snapshot}</span>
                    {session.handler_role_name_snapshot && (
                        <span className="text-xs opacity-70"> ({session.handler_role_name_snapshot})</span>
                    )}
                </span>
            </div>
            <button
                onClick={onTakeover}
                disabled={isActionLoading}
                className="px-3 py-1 text-xs font-medium rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50 shrink-0"
            >
                {isActionLoading ? 'Taking over...' : 'Force Takeover'}
            </button>
        </div>
    )
}
