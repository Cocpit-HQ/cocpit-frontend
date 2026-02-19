"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useUserCompanies } from "@/hooks/useCompany";
import { Company } from "@/services/company.service";
import { User } from "next-auth";

type ProfileType = "USER" | "COMPANY";

interface ActiveProfile {
    type: ProfileType;
    id: string;
    name: string;
    slug?: string;
    avatar_url?: string;
}

interface ActiveProfileContextType {
    activeProfile: ActiveProfile | null;
    isLoading: boolean;
    switchProfile: (type: ProfileType, id: string) => void;
    isCompany: boolean;
    userCompanies: (Company & { role: string })[];
}

const ActiveProfileContext = createContext<ActiveProfileContextType | undefined>(undefined);

export function ActiveProfileProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const { data: companies = [], isLoading: companiesLoading } = useUserCompanies();
    const [activeProfile, setActiveProfile] = useState<ActiveProfile | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize profile from LocalStorage or Session
    useEffect(() => {
        if (status === "loading" || companiesLoading) return;

        if (status === "unauthenticated") {
            setActiveProfile(null);
            setIsInitialized(true);
            return;
        }

        if (!session?.user) return;

        const storedProfileId = localStorage.getItem("activeProfileId");
        const storedProfileType = localStorage.getItem("activeProfileType") as ProfileType;

        // Default to USER profile
        let initialProfile: ActiveProfile = {
            type: "USER",
            id: session.user.id,
            name: session.user.name || "User",
            avatar_url: session.user.image || undefined,
        };

        // If stored profile is COMPANY and user is a member, switch to it
        if (storedProfileType === "COMPANY" && storedProfileId) {
            const targetCompany = companies.find((c) => c.company_id === storedProfileId);
            if (targetCompany) {
                initialProfile = {
                    type: "COMPANY",
                    id: targetCompany.company_id,
                    name: targetCompany.name,
                    slug: targetCompany.slug,
                    avatar_url: targetCompany.logo_url,
                };
            }
        }

        // Only update if different to avoid loops (though strict equality check on object refs might trigger, ID check is safer)
        if (!activeProfile || activeProfile.id !== initialProfile.id) {
            setActiveProfile(initialProfile);
        }
        setIsInitialized(true);
    }, [session, status, companies, companiesLoading]);

    // Inject Company ID into Axios headers globally
    useEffect(() => {
        const { publicApi } = require("@/lib/axios");
        const api = require("@/lib/axios").default;

        if (activeProfile?.type === 'COMPANY') {
            api.defaults.headers.common['x-company-id'] = activeProfile.id;
            publicApi.defaults.headers.common['x-company-id'] = activeProfile.id;
        } else {
            delete api.defaults.headers.common['x-company-id'];
            delete publicApi.defaults.headers.common['x-company-id'];
        }
    }, [activeProfile]);

    const switchProfile = (type: ProfileType, id: string) => {
        if (type === "USER" && session?.user) {
            const userProfile: ActiveProfile = {
                type: "USER",
                id: session.user.id,
                name: session.user.name || "User",
                avatar_url: session.user.image || undefined,
            };
            setActiveProfile(userProfile);
            localStorage.setItem("activeProfileType", "USER");
            localStorage.setItem("activeProfileId", session.user.id);

            // Redirect to Feed
            router.push("/feed");

        } else if (type === "COMPANY") {
            const targetCompany = companies.find((c) => c.company_id === id);
            if (targetCompany) {
                const companyProfile: ActiveProfile = {
                    type: "COMPANY",
                    id: targetCompany.company_id,
                    name: targetCompany.name,
                    slug: targetCompany.slug,
                    avatar_url: targetCompany.logo_url,
                };
                setActiveProfile(companyProfile);
                localStorage.setItem("activeProfileType", "COMPANY");
                localStorage.setItem("activeProfileId", targetCompany.company_id);

                // Redirect to Company Dashboard/Page
                router.push(`/company/${targetCompany.slug}`);
            }
        }
    };

    const value = {
        activeProfile,
        isLoading: !isInitialized,
        switchProfile,
        isCompany: activeProfile?.type === "COMPANY",
        userCompanies: companies,
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
