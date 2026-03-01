"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useSocket } from "@/context/SocketContext"
import {
    getActiveSession,
    claimSession as claimSessionApi,
    releaseSession as releaseSessionApi,
    takeoverSession as takeoverSessionApi,
    ChatSession,
} from "@/services/api/messaging"

interface UseChatSessionResult {
    /** The active session, or null if none */
    session: ChatSession | null
    /** Whether the feature is enabled for this company */
    featureEnabled: boolean
    /** Whether the current user is the handler */
    isMySession: boolean
    /** Loading state for initial fetch */
    isLoading: boolean
    /** Loading state for actions (claim/release/takeover) */
    isActionLoading: boolean
    /** Error message from the last action */
    actionError: string | null
    /** Whether the session was lost (timeout/takeover) mid-send */
    sessionLost: boolean
    /** Clear the sessionLost flag */
    clearSessionLost: () => void
    /** Claim the conversation */
    claim: () => Promise<void>
    /** Release (end) the current session */
    release: () => Promise<void>
    /** Force takeover the current session */
    takeover: () => Promise<void>
    /** Re-fetch the active session from server */
    refetchSession: () => Promise<void>
}

export function useChatSession(conversationId: string | undefined): UseChatSessionResult {
    const { data: authSession } = useSession()
    const { activeProfile } = useActiveProfile()
    const { socket } = useSocket()

    const userId = authSession?.user?.id
    const companyId = activeProfile?.type === "COMPANY" ? activeProfile.id : undefined

    const [session, setSession] = useState<ChatSession | null>(null)
    const [featureEnabled, setFeatureEnabled] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isActionLoading, setIsActionLoading] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)
    const [sessionLost, setSessionLost] = useState(false)

    const isMySession = !!(session && userId && session.handler_user_id === userId)

    // Fetch active session
    const refetchSession = useCallback(async () => {
        if (!conversationId || !companyId || conversationId === 'new') {
            setSession(null)
            setFeatureEnabled(conversationId === 'new') // Assume enabled for new, or handle differently
            return
        }
        try {
            const data = await getActiveSession(conversationId, companyId)
            setSession(data.session)
            setFeatureEnabled(data.featureEnabled)
        } catch (err) {
            console.error("Failed to fetch session:", err)
        }
    }, [conversationId, companyId])

    // Initial fetch
    useEffect(() => {
        if (!companyId || !conversationId || conversationId === 'new') {
            setSession(null)
            setFeatureEnabled(conversationId === 'new')
            return
        }
        setIsLoading(true)
        refetchSession().finally(() => setIsLoading(false))
    }, [conversationId, companyId, refetchSession])

    // Socket listeners — re-fetch on any session event
    useEffect(() => {
        if (!socket || !companyId || !conversationId) return

        const handleSessionEvent = (payload: { conversationId: string }) => {
            if (payload.conversationId === conversationId) {
                refetchSession()
            }
        }

        const handleTakeoverForced = (payload: { conversationId: string; oldSessionId: string; newHandlerName: string }) => {
            if (payload.conversationId === conversationId) {
                setSessionLost(true)
                refetchSession()
            }
        }

        socket.on("session_claimed", handleSessionEvent)
        socket.on("session_released", handleSessionEvent)
        socket.on("session_activity", handleSessionEvent)
        socket.on("session_takeover_forced", handleTakeoverForced)

        return () => {
            socket.off("session_claimed", handleSessionEvent)
            socket.off("session_released", handleSessionEvent)
            socket.off("session_activity", handleSessionEvent)
            socket.off("session_takeover_forced", handleTakeoverForced)
        }
    }, [socket, conversationId, companyId, refetchSession])

    // Claim
    const claim = useCallback(async () => {
        if (!conversationId || !companyId || conversationId === 'new') return
        setIsActionLoading(true)
        setActionError(null)
        try {
            await claimSessionApi(conversationId, companyId)
            await refetchSession()
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to claim conversation"
            setActionError(msg)
        } finally {
            setIsActionLoading(false)
        }
    }, [conversationId, companyId, refetchSession])

    // Release
    const release = useCallback(async () => {
        if (!session) return
        setIsActionLoading(true)
        setActionError(null)
        try {
            await releaseSessionApi(session.session_id)
            await refetchSession()
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to release session"
            setActionError(msg)
        } finally {
            setIsActionLoading(false)
        }
    }, [session, refetchSession])

    // Takeover
    const takeover = useCallback(async () => {
        if (!conversationId || !companyId || conversationId === 'new') return
        setIsActionLoading(true)
        setActionError(null)
        try {
            await takeoverSessionApi(conversationId, companyId)
            setSessionLost(false)
            await refetchSession()
        } catch (err: any) {
            const msg = err?.response?.data?.message || "Failed to takeover session"
            setActionError(msg)
        } finally {
            setIsActionLoading(false)
        }
    }, [conversationId, companyId, refetchSession])

    const clearSessionLost = useCallback(() => setSessionLost(false), [])

    return {
        session,
        featureEnabled,
        isMySession,
        isLoading,
        isActionLoading,
        actionError,
        sessionLost,
        clearSessionLost,
        claim,
        release,
        takeover,
        refetchSession,
    }
}
