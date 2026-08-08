"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "next-auth";
import { useQueryClient } from "@tanstack/react-query";

import { setActorRequestHeaders, trackActorMetric } from "@/lib/actor-context";
import { getActorContext, setActorContext } from "@/services/api/auth";
import { Company } from "@/services/organization.service";

type ProfileType = "USER" | "COMPANY";

interface ActiveProfile {
    type: ProfileType;
    entityType?: "COMPANY" | "INSTITUTION";
    id: string;
    name: string;
    slug?: string;
    avatar_url?: string;
    viewer_role_data?: { name: string; permissions: string[]; priority: number; is_owner?: boolean } | null;
    verification_status?: string;
}

interface ActiveProfileContextType {
    activeProfile: ActiveProfile | null;
    isLoading: boolean;
    switchProfile: (type: ProfileType, id: string) => void;
    isCompany: boolean;
    userCompanies: (Company & { role: string })[];
    switchableCompanies: (Company & { role: string })[];
    refreshCompanies: () => Promise<void>;
    refreshProfile?: () => Promise<void>;
}

const ActiveProfileContext = createContext<ActiveProfileContextType | undefined>(undefined);

const normalizeCompany = (company: Company & { role?: string }) => ({
    ...company,
    company_id: company.company_id || company.org_id!,
});

const createUserProfile = (user: User): ActiveProfile => ({
    type: "USER",
    id: user.id,
    name: user.name || "User",
    avatar_url: user.image || undefined,
});

const buildCompanyProfile = (company: Company & { viewer_role_data?: { name: string; permissions: string[]; priority: number; is_owner?: boolean } | null, verification_status?: string }): ActiveProfile => ({
    type: "COMPANY",
    entityType: company.entity_type as "COMPANY" | "INSTITUTION",
    id: company.org_id || company.company_id,
    name: company.name,
    slug: company.slug,
    avatar_url: company.logo_url,
    viewer_role_data: company.viewer_role_data || null,
    verification_status: company.verification_status,
});

export function ActiveProfileProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [bootstrappedCompanies, setBootstrappedCompanies] = useState<(Company & { role: string })[]>([]);
    const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(() => {
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("cocpit_active_profile");
            if (stored) {
                try { return JSON.parse(stored); } catch (e) {}
            }
        }
        return null;
    });
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const companies = bootstrappedCompanies;
    const bootstrapLockRef = React.useRef<string | null>(null);

    const canSwitchToCompany = (company: Company & { viewer_role_data?: { permissions: string[] | string } | null }) => {
        return true;
    };

    const switchableCompanies = companies.filter(canSwitchToCompany);

    const refreshProfile = React.useCallback(async () => {
        if (!session?.user) return;
        const userProfile = createUserProfile(session.user as any);
        try {
            const actorContext = await getActorContext();
            const normalizedCompanies = actorContext.organizations.map((company) => normalizeCompany(company)) as (Company & { role: string })[];
            
            // Deduplicate by ID to prevent key collisions in UI
            const uniqueCompanies = Array.from(
                new Map(normalizedCompanies.map(c => [c.org_id || c.company_id, c])).values()
            );
            setBootstrappedCompanies(uniqueCompanies);

            let nextProfile = userProfile;
            if (actorContext.actor.type === "ORGANIZATION") {
                const targetCompany = normalizedCompanies.find(
                    (company) => (company.org_id || company.company_id) === actorContext.actor.id
                );
                if (targetCompany && canSwitchToCompany(targetCompany)) {
                    nextProfile = buildCompanyProfile(targetCompany);
                }
            }
            setActiveProfile(nextProfile);
        } catch (error) {
            console.warn("[ActorContext] Refresh profile failed.", error);
        }
    }, [session]);

    useEffect(() => {
        if (status === "loading") return;

        if (status === "unauthenticated") {
            setActorRequestHeaders(null);
            bootstrapLockRef.current = null;
            queueMicrotask(() => {
                setActiveProfile(null);
                setBootstrappedCompanies([]);
                setIsInitialized(true);
            });
            return;
        }

        const sessionId = (session?.user as any)?.accessToken || session?.user?.email;
        if (!session?.user || !sessionId) return;

        // CRITICAL GUARD: Skip if already bootstrapped OR in progress for this session
        // We only block if we are ALREADY initialized for this sessionId.
        // If we aren't initialized yet, we MUST allow the bootstrap to run,
        // even if the ref was set by a previous (possibly cancelled) attempt.
        if (isInitialized && bootstrapLockRef.current === sessionId) {
            return;
        }

        // Lock immediately to prevent race conditions from session reference changes
        bootstrapLockRef.current = sessionId;
        let isCancelled = false;

        const initializeProfile = async () => {
            const userProfile = createUserProfile(session.user as any);
            trackActorMetric("bootstrap_start", {
                mode: "canonical",
                sessionId: sessionId.substring(0, 10) + "...",
            });

            try {
                const actorContext = await getActorContext();
                if (isCancelled) return;

                const normalizedCompanies = actorContext.organizations.map((company) => normalizeCompany(company)) as (Company & { role: string })[];

                // Deduplicate by ID to prevent key collisions in UI
                const uniqueCompanies = Array.from(
                    new Map(normalizedCompanies.map(c => [c.org_id || c.company_id, c])).values()
                );

                setBootstrappedCompanies(uniqueCompanies);

                let nextProfile = userProfile;
                if (actorContext.actor.type === "ORGANIZATION") {
                    const targetCompany = normalizedCompanies.find(
                        (company) => (company.org_id || company.company_id) === actorContext.actor.id
                    );

                    if (targetCompany && canSwitchToCompany(targetCompany)) {
                        nextProfile = buildCompanyProfile(targetCompany);
                    }
                }

                setActiveProfile(nextProfile);
                setIsInitialized(true);
                trackActorMetric("bootstrap_complete", {
                    mode: "canonical",
                    actorType: actorContext.actor.type,
                    source: actorContext.source,
                    organizations: normalizedCompanies.length,
                });
            } catch (error) {
                console.warn("[ActorContext] Bootstrap endpoint failed. Falling back to user profile.", error);
                trackActorMetric("bootstrap_fallback", { reason: "bootstrap_error" });
                if (isCancelled) return;

                setBootstrappedCompanies([]);
                setActiveProfile(userProfile);
                setIsInitialized(true);
            }
        };

        void initializeProfile();

        return () => {
            isCancelled = true;
        };
    }, [session, status]);

    useEffect(() => {
        setActorRequestHeaders(activeProfile ? { type: activeProfile.type, id: activeProfile.id } : null);
        if (activeProfile) {
            sessionStorage.setItem("cocpit_active_profile", JSON.stringify(activeProfile));
        } else {
            sessionStorage.removeItem("cocpit_active_profile");
        }
    }, [activeProfile]);

    useEffect(() => {
        if (activeProfile?.type === "USER" && session?.user) {
            setActiveProfile(prev => {
                if (!prev) return null;
                if (prev.avatar_url !== session.user.image || prev.name !== session.user.name) {
                    return {
                        ...prev,
                        name: session.user.name || "User",
                        avatar_url: session.user.image || undefined,
                    };
                }
                return prev;
            });
        }
    }, [session?.user?.image, session?.user?.name, activeProfile?.type]);

    /**
     * Re-pulls the org membership list from the bootstrap endpoint.
     * `bootstrappedCompanies` is plain component state (not React Query), so it
     * never notices membership changes made elsewhere — e.g. accepting a team
     * invite adds a new org, but the switcher won't show it until this runs.
     */
    const refreshCompanies = async () => {
        try {
            const actorContext = await getActorContext();
            const normalizedCompanies = actorContext.organizations.map((company) => normalizeCompany(company)) as (Company & { role: string })[];
            const uniqueCompanies = Array.from(
                new Map(normalizedCompanies.map(c => [c.org_id || c.company_id, c])).values()
            );
            setBootstrappedCompanies(uniqueCompanies);
        } catch (error) {
            console.warn("[ActorContext] Failed to refresh org membership list.", error);
        }
    };

    useEffect(() => {
        const handleRefreshEvent = () => {
            void refreshCompanies();
        };
        if (typeof window !== "undefined") {
            window.addEventListener("cocpit:refresh-actor-context", handleRefreshEvent);
        }
        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("cocpit:refresh-actor-context", handleRefreshEvent);
            }
        };
    }, []);

    // Listen for membership revocation / block events to evict org actor if blocked
    useEffect(() => {
        if (typeof window === "undefined" || !session?.user) return;

        const checkEviction = (targetId?: string, isBlocked?: boolean) => {
            const currentUserId = (session.user as any).id || session.user.email;
            if (
                activeProfile?.type === "COMPANY" &&
                isBlocked &&
                (targetId === currentUserId || targetId === activeProfile.id)
            ) {
                console.warn("[ActorContext] Membership revoked or organization blocked. Evicting actor to personal user profile.");
                switchProfile("USER", currentUserId);
            }
        };

        const handleBlockEvent = (e: any) => {
            const detail = e.detail || {};
            checkEviction(detail.targetId, detail.isBlocked);
        };

        const handleStorageEvent = (e: StorageEvent) => {
            if (e.key === "cocpit_block_event" && e.newValue) {
                try {
                    const payload = JSON.parse(e.newValue);
                    checkEviction(payload.targetId, payload.isBlocked);
                } catch (err) {}
            }
        };

        window.addEventListener("cocpit:block_status_changed", handleBlockEvent);
        window.addEventListener("storage", handleStorageEvent);

        return () => {
            window.removeEventListener("cocpit:block_status_changed", handleBlockEvent);
            window.removeEventListener("storage", handleStorageEvent);
        };
    }, [activeProfile?.type, activeProfile?.id, session?.user]);


    const switchProfile = (type: ProfileType, id: string) => {
        const performSwitch = async () => {
            try {
                queryClient.invalidateQueries({ queryKey: ["jobs"] });
                queryClient.invalidateQueries({ queryKey: ["feed"] });
                queryClient.invalidateQueries({ queryKey: ["grouped-stories"] });
                queryClient.invalidateQueries({ queryKey: ["events"] });
                queryClient.invalidateQueries({ queryKey: ["conversations"] });
                queryClient.invalidateQueries({ queryKey: ["messages"] });
                queryClient.invalidateQueries({ queryKey: ["notifications"] });
                queryClient.invalidateQueries({ queryKey: ["connection-requests"] });

                trackActorMetric("switch_start", { type, id });

                if (type === "USER" && session?.user) {
                    const userProfile = createUserProfile(session.user as any);

                    await setActorContext({ type: "USER" });

                    setActiveProfile(userProfile);
                    trackActorMetric("switch_complete", { type: "USER", id: session.user.id });
                    window.location.href = "/feed";
                    return;
                }

                if (type !== "COMPANY") return;

                const targetCompany = companies.find((company) => (company.org_id || company.company_id) === id);
                if (!targetCompany || !canSwitchToCompany(targetCompany)) return;

                await setActorContext({
                    type: "ORGANIZATION",
                    id: targetCompany.org_id || targetCompany.company_id,
                });

                const companyProfile = buildCompanyProfile(targetCompany);
                setActiveProfile(companyProfile);
                trackActorMetric("switch_complete", { type: "COMPANY", id: companyProfile.id });
                window.location.href = `/organization/${targetCompany.slug}`;
            } catch (error) {
                console.error("[ActorContext] Failed to switch actor.", error);
                trackActorMetric("switch_error", { type, id });
            }
        };

        void performSwitch();
    };

    const value = {
        activeProfile,
        isLoading: !isInitialized,
        switchProfile,
        isCompany: activeProfile?.type === "COMPANY",
        userCompanies: companies,
        switchableCompanies,
        refreshCompanies,
        refreshProfile,
    };

    return (
        <ActiveProfileContext.Provider value={value}>
            {children}
        </ActiveProfileContext.Provider>
    );
}

export function useActiveProfile() {
    const context = useContext(ActiveProfileContext);
    if (context === undefined) {
        throw new Error("useActiveProfile must be used within an ActiveProfileProvider");
    }
    return context;
}
