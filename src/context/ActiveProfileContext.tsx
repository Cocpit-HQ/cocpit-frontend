"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "next-auth";
import { useQueryClient } from "@tanstack/react-query";

import { JOB_KEYS } from "@/components/jobs/hooks/use-job-queries";
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
    viewer_role_data?: { name: string; permissions: string[]; priority: number } | null;
}

interface ActiveProfileContextType {
    activeProfile: ActiveProfile | null;
    isLoading: boolean;
    switchProfile: (type: ProfileType, id: string) => void;
    isCompany: boolean;
    userCompanies: (Company & { role: string })[];
    switchableCompanies: (Company & { role: string })[];
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

const buildCompanyProfile = (company: Company & { viewer_role_data?: { name: string; permissions: string[]; priority: number } | null }): ActiveProfile => ({
    type: "COMPANY",
    entityType: company.entity_type as "COMPANY" | "INSTITUTION",
    id: company.org_id || company.company_id,
    name: company.name,
    slug: company.slug,
    avatar_url: company.logo_url,
    viewer_role_data: company.viewer_role_data || null,
});

export function ActiveProfileProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [bootstrappedCompanies, setBootstrappedCompanies] = useState<(Company & { role: string })[]>([]);
    const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();
    const queryClient = useQueryClient();
    const companies = bootstrappedCompanies;
    const bootstrapLockRef = React.useRef<string | null>(null);

    const canSwitchToCompany = (company: Company & { viewer_role_data?: { permissions: string[] } | null }) => {
        const permissions = company?.viewer_role_data?.permissions || [];
        return permissions.includes("*") || permissions.includes("SWITCH_TO_COMPANY");
    };

    const switchableCompanies = companies.filter(canSwitchToCompany);

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
    }, [activeProfile]);

    const switchProfile = (type: ProfileType, id: string) => {
        const performSwitch = async () => {
            try {
                queryClient.invalidateQueries({ queryKey: JOB_KEYS.all });
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
                    router.push("/feed");
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
                router.push(`/organization/${targetCompany.slug}`);
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
