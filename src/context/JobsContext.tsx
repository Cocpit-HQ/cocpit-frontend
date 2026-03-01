"use client";

import React, { createContext, useContext, useState } from "react";
import type {
  Job,
  JobsContextType,
  JobFilters,
  MyJobsTab,
  JobListMode
} from "@/types/jobs";
import { useInfiniteJobs, useJobMutations, JOB_KEYS } from "@/components/jobs/hooks/use-job-queries";
import { useDebounce } from "@/hooks/use-debounce";
import { useQueryClient } from "@tanstack/react-query";

const JobsContext = createContext<JobsContextType | undefined>(undefined);

const INITIAL_FILTERS: JobFilters = {
  jobType: [],
  experience: "All Levels",
  salaryRange: "Any",
  datePosted: "Any Time",
  workMode: [],
  companyType: [],
  industry: [],
  easyApply: false,
  activelyHiring: false,
  locations: [],
};

// Simple debounce hook for local state if not available, but user has it.
// Assuming useDebounce is (value, delay) => debouncedValue

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<JobFilters>(INITIAL_FILTERS);
  const [searchKeywords, setSearchKeywords] = useState("");
  const [activeTab, setActiveTab] = useState<JobListMode>("view");
  const [myJobsTab, setMyJobsTab] = useState<MyJobsTab>("applied");

  // Debounce inputs to prevent rapid refetching
  const debouncedSearch = useDebounce(searchKeywords, 500);
  const debouncedFilters = useDebounce(filters, 500);

  // React Query Hook
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteJobs(activeTab, myJobsTab, debouncedFilters, debouncedSearch);

  // Mutations
  const { saveJob: saveJobMutation, applyJob: applyJobMutation } = useJobMutations();

  // Helper: Flatten paginated data
  const jobs = data?.pages.flatMap((page) => page) || [];

  // Separation of myJobs vs jobs:
  // `jobs` contains data for key tabs (Feed/Offers). 
  // `myJobsTab` and `activeTab` control what is fetched.

  // Creating a safe proxy:
  const isMyJobsTab = activeTab === "my-jobs";

  // If we are on 'my-jobs', `jobs` has the data for my jobs.
  // If we are on 'view', `jobs` has feed data.

  const currentJobsList = jobs;

  const addJob = (newJob: Job) => {
    // TODO: Implement optimistic update or mutation
  };

  // Provide access to query client for manual invalidation
  const queryClient = useQueryClient();

  const applyToJob = async (jobId: string) => {
    // This function is called by QuickApplyModal AFTER a successful API call.
    // We strictly need to invalidate the cache to reflect the new "Applied" status.
    await queryClient.invalidateQueries({ queryKey: JOB_KEYS.all });
  };

  const saveJob = (jobId: string) => {
    // Toggle save status
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      saveJobMutation.mutate({ jobId, isSaved: !job.isSaved });
    }
  };

  const updateFilters = (newFilters: Partial<JobFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchKeywords("");
  };

  return (
    <JobsContext.Provider value={{
      jobs: isMyJobsTab ? [] : currentJobsList, // "Main feed jobs"
      addJob,
      applyToJob,
      saveJob,
      filters,
      updateFilters,
      filteredJobs: currentJobsList, // Used by JobsPage
      searchKeywords,
      setSearchKeywords,
      resetFilters,
      myJobs: isMyJobsTab ? currentJobsList : [], // "My jobs list"
      activeTab,
      setActiveTab,
      myJobsTab,
      setMyJobsTab,
      isLoading,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage: () => fetchNextPage(),
    }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobsProvider");
  }
  return context;
}
