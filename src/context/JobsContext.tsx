"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { jobs as initialJobsData } from "@/lib/data/jobs";
import type {
  Job,
  JobsContextType,
  JobFilters,
  MyJobsTab,
  JobListMode,
  WorkMode,
  CompanyType
} from "@/types/jobs";

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

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to parse salary string and return avg
const parseSalaryAvg = (salary: string): number => {
  if (!salary) return 0;
  // matches $120k or $100,000
  const matches = salary.match(/(\d+)/g);
  if (!matches) return 0;

  const values = matches.map(m => parseInt(m));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  // If value is small (e.g. 120), assume k
  if (avg < 1000) return avg * 1000;
  return avg;
}

// Enhance initial mock data with new fields
const enhancedInitialJobs: Job[] = initialJobsData.map(job => {
  return {
    ...job,
    matchScore: getRandomInt(60, 98),
    workMode: ["Remote", "Hybrid", "Onsite"][getRandomInt(0, 2)] as WorkMode,
    companyType: ["Startup", "MNC", "Product-based", "Service-based"][getRandomInt(0, 3)] as CompanyType,
    industry: ["Technology", "Finance", "Healthcare", "Education"][getRandomInt(0, 3)],
    experience: ["Entry Level", "Mid Level", "Senior Level", "Lead / Manager"][getRandomInt(0, 3)],
    easyApply: Math.random() > 0.5,
    activelyHiring: Math.random() > 0.3,
    recruiterInsight: `Recruiter usually responds in ${getRandomInt(1, 5)} days`,
    description: "We are looking for a talented individual to join our growing team. You will be working on cutting-edge technologies and solving complex problems.",
    aboutCompany: "We are a leading company in our industry, dedicated to innovation and excellence.",
    skills: ["React", "TypeScript", "Node.js", "Design Systems"],
    applicationTimeline: job.status === 'applied' ? [
      { status: "Applied", date: "2 days ago", completed: true },
      { status: "Under Review", completed: false },
      { status: "Interview", completed: false },
      { status: "Offer", completed: false }
    ] : job.status === 'in-progress' ? [
      { status: "Applied", date: "1 week ago", completed: true },
      { status: "Under Review", date: "3 days ago", completed: true },
      { status: "Interview", completed: true },
      { status: "Offer", completed: false }
    ] : []
  };
});

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFilters>(INITIAL_FILTERS);
  const [searchKeywords, setSearchKeywords] = useState("");
  const [activeTab, setActiveTab] = useState<JobListMode>("view");
  const [myJobsTab, setMyJobsTab] = useState<MyJobsTab>("in-progress");
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage or mock data
  useEffect(() => {
    const savedJobs = localStorage.getItem("jobs_data");
    if (savedJobs) {
      try {
        setJobs(JSON.parse(savedJobs));
      } catch (e) {
        console.error("Failed to parse jobs from localStorage", e);
        setJobs(enhancedInitialJobs);
      }
    } else {
      setJobs(enhancedInitialJobs);
    }
    setMounted(true);
  }, []);

  // Persist changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("jobs_data", JSON.stringify(jobs));
    }
  }, [jobs, mounted]);

  const addJob = (newJob: Job) => {
    // Add realistic random data for the new job
    const jobWithMockData: Job = {
        ...newJob,
        id: Date.now(),
        postedTime: "Just now",
        applicants: 0,
        logo: `gradient-${getRandomInt(1, 6)}`,
        matchScore: getRandomInt(60, 99),
        recruiterInsight: "Recruiter actively reviewing",
        applicationTimeline: []
    };
    setJobs(prev => [jobWithMockData, ...prev]);
  };

  const applyToJob = (jobId: number) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return {
          ...job,
          status: "applied",
          applicationTimeline: [
            { status: "Applied", date: "Just now", completed: true },
            { status: "Under Review", completed: false },
            { status: "Interview", completed: false },
            { status: "Offer", completed: false }
          ]
        };
      }
      return job;
    }));
  };

  const saveJob = (jobId: number) => {
    setJobs(prev => prev.map(job => {
      if (job.id === jobId) {
        return { ...job, isSaved: !job.isSaved };
      }
      return job;
    }));
  };

  const updateFilters = (newFilters: Partial<JobFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchKeywords("");
  };

  const filteredJobs = useMemo(() => {
    let result = jobs;

    // 1. Filter by Search Keywords
    if (searchKeywords.trim()) {
      const lowerQuery = searchKeywords.toLowerCase();
      result = result.filter(job =>
        job.title.toLowerCase().includes(lowerQuery) ||
        job.company.toLowerCase().includes(lowerQuery) ||
        job.description?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Sidebar Filters
    if (filters.jobType.length > 0) {
      result = result.filter(job => filters.jobType.some(t => job.type.includes(t)));
    }

    if (filters.locations.length > 0) {
       result = result.filter(job => filters.locations.some(l => job.location.toLowerCase().includes(l.toLowerCase())));
    }

    if (filters.workMode.length > 0) {
      result = result.filter(job => job.workMode && filters.workMode.includes(job.workMode));
    }

    if (filters.companyType.length > 0) {
      result = result.filter(job => job.companyType && filters.companyType.includes(job.companyType));
    }

    if (filters.industry.length > 0) {
      result = result.filter(job => job.industry && filters.industry.includes(job.industry));
    }

    if (filters.easyApply) {
      result = result.filter(job => job.easyApply);
    }

    if (filters.activelyHiring) {
      result = result.filter(job => job.activelyHiring);
    }

    // 3. Experience Filter
    if (filters.experience && filters.experience !== "All Levels") {
      result = result.filter(job => job.experience === filters.experience);
    }

    // 4. Date Posted Filter
    if (filters.datePosted && filters.datePosted !== "Any Time") {
      result = result.filter(job => {
        const time = job.postedTime.toLowerCase();
        if (filters.datePosted === "Past 24 hours") {
          return time.includes("hour") || time === "just now" || (time.includes("1 day") && !time.includes("days"));
        }
        if (filters.datePosted === "Past week") {
           // Includes hours, days up to 7
           if (time.includes("hour") || time === "just now") return true;
           if (time.includes("day")) {
             const days = parseInt(time.match(/\d+/)?.[0] || "0");
             return days <= 7;
           }
           return false;
        }
        if (filters.datePosted === "Past month") {
           if (time.includes("hour") || time === "just now" || time.includes("day") || time.includes("week")) return true;
           // If it says "1 month", maybe? But stick to weeks.
           return false;
        }
        return true;
      });
    }

    // 5. Salary Filter
    if (filters.salaryRange && filters.salaryRange !== "Any") {
      result = result.filter(job => {
        const avg = parseSalaryAvg(job.salary);
        if (avg === 0) return true; // Keep if unknown? Or filter out? Let's keep.

        switch (filters.salaryRange) {
          case "$0 - $50k": return avg < 50000;
          case "$50k - $100k": return avg >= 50000 && avg < 100000;
          case "$100k - $150k": return avg >= 100000 && avg < 150000;
          case "$150k+": return avg >= 150000;
          default: return true;
        }
      });
    }

    return result;
  }, [jobs, searchKeywords, filters]);

  const myJobs = useMemo(() => {
    return jobs.filter(job => job.status || job.isSaved);
  }, [jobs]);

  return (
    <JobsContext.Provider value={{
      jobs,
      addJob,
      applyToJob,
      saveJob,
      filters,
      updateFilters,
      filteredJobs,
      searchKeywords,
      setSearchKeywords,
      resetFilters,
      myJobs,
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
