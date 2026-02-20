import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import * as api from "@/services/api/jobs";
import { JobFilters, MyJobsTab } from "@/types/jobs";
import { useActiveProfile } from "@/context/ActiveProfileContext";

// Helper to convert frontend filters to API params
const getSearchParams = (filters: JobFilters, searchKeywords: string): api.JobSearchParams => {
    return {
        ...filters,
        search: searchKeywords,
    };
};

export const JOB_KEYS = {
    all: ["jobs"] as const,
    feed: (filters: JobFilters, search: string) => [...JOB_KEYS.all, "feed", filters, search] as const,
    offers: (filters: JobFilters, search: string) => [...JOB_KEYS.all, "offers", filters, search] as const,
    myJobs: (tab: MyJobsTab, filters: JobFilters, search: string) => [...JOB_KEYS.all, "myJobs", tab, filters, search] as const,
    dashboard: (companyId: string | undefined | null, filters: JobFilters, search: string) => [...JOB_KEYS.all, "dashboard", companyId, filters, search] as const,
};

export function useInfiniteJobs(
    activeTab: "view" | "offers" | "my-jobs" | "dashboard",
    myJobsTab: MyJobsTab,
    filters: JobFilters,
    searchKeywords: string
) {
    const { status } = useSession();
    const isAuthenticated = status === "authenticated";
    const { activeProfile } = useActiveProfile();

    return useInfiniteQuery({
        queryKey: activeTab === "my-jobs"
            ? JOB_KEYS.myJobs(myJobsTab, filters, searchKeywords)
            : activeTab === "offers"
                ? JOB_KEYS.offers(filters, searchKeywords)
                : activeTab === "dashboard"
                    ? JOB_KEYS.dashboard(activeProfile?.id, filters, searchKeywords)
                    : JOB_KEYS.feed(filters, searchKeywords),

        queryFn: async ({ pageParam }) => {
            const params = {
                ...getSearchParams(filters, searchKeywords),
                limit: 10,
                cursor: pageParam as string | undefined,
            };

            if (activeTab === "view") {
                return api.getAllJobs(params);
            } else if (activeTab === "offers") {
                return api.getJobOffers(params);
            } else if (activeTab === "my-jobs") {
                if (myJobsTab === "saved") {
                    return api.getMySavedJobs(params);
                } else {
                    return api.getMyApplications(myJobsTab, params);
                }
            } else if (activeTab === "dashboard") {
                if (activeProfile?.type === 'COMPANY' && activeProfile.id) {
                    return api.getCompanyJobs(activeProfile.id, params);
                }
                return api.getMyCreatedJobs(params);
            }
            return [];
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.length < 10) return undefined;
            const lastItem = lastPage[lastPage.length - 1];

            // Determine cursor
            if (activeTab === "my-jobs") {
                if (myJobsTab === "saved") return lastItem.savedAt;
                return lastItem.appliedAt;
            }
            // For all others (view, offers, dashboard), backend usually sorts by created_at
            return lastItem.createdAt;
        },
        enabled: (activeTab !== "my-jobs" && activeTab !== "dashboard") || isAuthenticated,
    });
}

export function useJobMutations() {
    const queryClient = useQueryClient();

    const saveJobMutation = useMutation({
        mutationFn: async ({ jobId, isSaved }: { jobId: string; isSaved: boolean }) => {
            if (isSaved) {
                await api.saveJob(jobId);
            } else {
                await api.unsaveJob(jobId);
            }
        },
        onMutate: async ({ jobId, isSaved }) => {
            await queryClient.cancelQueries({ queryKey: JOB_KEYS.all });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: JOB_KEYS.all });
        },
    });

    const applyJobMutation = useMutation({
        mutationFn: async ({ jobId, formData }: { jobId: string; formData: FormData }) => {
            await api.applyToJob(jobId, formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: JOB_KEYS.all });
        },
    });

    return {
        saveJob: saveJobMutation,
        applyJob: applyJobMutation,
    };
}
