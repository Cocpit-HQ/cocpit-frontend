"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import * as api from "@/services/api/jobs";
import type {
  Job,
  JobsContextType,
  JobFilters,
  MyJobsTab,
  JobListMode
} from "@/types/jobs";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this exists, if not I'll implement a simple one or just direct effect

// Fallback if hook doesn't exist
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession(); // Get auth status
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]); // Separated myJobs for the "my-jobs" tab

  const [filters, setFilters] = useState<JobFilters>(INITIAL_FILTERS);
  const [searchKeywords, setSearchKeywords] = useState("");
  const [activeTab, setActiveTab] = useState<JobListMode>("view");
  const [myJobsTab, setMyJobsTab] = useState<MyJobsTab>("in-progress");
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search and filters to prevent rapid API calls
  const debouncedSearch = useDebounceValue(searchKeywords, 500);
  const debouncedFilters = useDebounceValue(filters, 500);

  // Fetch Jobs based on active tab and filters
  const fetchJobs = useCallback(async () => {
    if (status === "loading") return; // Wait for session to initialize

    setIsLoading(true);
    try {
      let data: Job[] = [];
      const filterParams = { ...debouncedFilters, search: debouncedSearch };

      if (activeTab === "view") {
        data = await api.getAllJobs(filterParams);
        setJobs(data);
      } else if (activeTab === "offers") {
        data = await api.getJobOffers(filterParams);
        setJobs(data);
      } else if (activeTab === "my-jobs") {
        // For my-jobs, we fetch based on subtab
        if (myJobsTab === "saved") {
          data = await api.getMySavedJobs();
        } else {
          // 'applied', 'in-progress', 'in-past'
          data = await api.getMyApplications(myJobsTab);
        }
        setMyJobs(data);
        // We don't overwrite main 'jobs' here to preserve the feed? 
        // Actually, JobsPage renders 'filteredJobs' or 'myJobs' based on tab.
        // Let's keep them separate as per original context interface which had 'myJobs' and 'jobs'.
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
      // Optional: Add toast error here
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, myJobsTab, debouncedFilters, debouncedSearch, status]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Helper to update a job in all state lists
  const updateJobInState = (jobId: string, updater: (job: Job) => Job) => {
    setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? updater(j) : j));
    setMyJobs(prevMyJobs => prevMyJobs.map(j => j.id === jobId ? updater(j) : j));
  };

  const addJob = async (newJob: Job) => {
    // Just trigger a refetch for now to be safe
    fetchJobs();
  };

  const applyToJob = async (jobId: string) => {
    // Optimistically update status to 'applied' in all lists
    updateJobInState(jobId, (j) => ({ ...j, status: 'applied', applicants: (j.applicants || 0) + 1, hasApplied: true }));

    // Refetch to ensure all tabs are in sync with server state
    // This is important because the backend join returns the actual application status
    setTimeout(() => {
      fetchJobs();
    }, 500); // Small delay to allow backend to process the application
  };

  const saveJob = async (jobId: string) => {
    // Find the current job to know its current state
    // We must read it BEFORE the optimistic update to know the 'old' state
    const currentJob = jobs.find(j => j.id === jobId) || myJobs.find(j => j.id === jobId);
    if (!currentJob) return;

    // The desired new state is the opposite of the current state
    const newIsSaved = !currentJob.isSaved;

    // Optimistic Update
    updateJobInState(jobId, (j) => ({ ...j, isSaved: newIsSaved }));

    try {
      // Use the local variable 'newIsSaved' which is guaranteed to be correct
      if (newIsSaved) {
        await api.saveJob(jobId);
      } else {
        await api.unsaveJob(jobId);
      }

      // Refetch to ensure "Saved" tab and main feed are in sync
      setTimeout(() => {
        fetchJobs();
      }, 300);
    } catch (error) {
      console.error("Failed to save/unsave job", error);
      // Rollback
      updateJobInState(jobId, (j) => ({ ...j, isSaved: !newIsSaved }));
    }
  };

  const updateFilters = (newFilters: Partial<JobFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchKeywords("");
  };

  // 'filteredJobs' was previously result of client-side filtering.
  // Now 'jobs' IS the filtered result from server (when tab is view/offers).
  // So we just return jobs.
  const filteredJobs = jobs;

  return (
    <JobsContext.Provider value={{
      jobs, // Main feed jobs
      addJob,
      applyToJob,
      saveJob,
      filters,
      updateFilters,
      filteredJobs,
      searchKeywords,
      setSearchKeywords,
      resetFilters,
      myJobs, // My jobs list
      activeTab,
      setActiveTab,
      myJobsTab,
      setMyJobsTab
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
