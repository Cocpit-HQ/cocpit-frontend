import React, { use, useEffect, useRef } from "react";
import { useJobs } from "../hooks/useJobs";
import { useJobStore } from "@/store/job.store";
import { useShallow } from "zustand/react/shallow";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { FeatureDisabledTooltip } from "@/components/feature-flags";
import RecommendedJobCard from "../components/RecommendedJobCard";
import { toast } from 'sonner';
import RecommendedJobCardSkeleton from "../components/skeletons/RecommendedJobCardSkeleton";
import JobCardSkeleton from "../components/skeletons/JobCardSkeleton";
import JobList from "../components/JobList";
import JobFilters from "../components/JobFilters";
import { Icon } from "@iconify/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useRouter, useSearchParams } from "next/navigation";
import MyListingsDashboard from "../components/my-listings/MyListingsDashboard";
import { ApplyJobModal } from "../components/ApplyJobModal";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import { Job } from "../types/jobs.types";
import { OfferCard } from "../components/OfferCard";
import OfferCardSkeleton from "../components/skeletons/OfferCardSkeleton";
import { useJobOffers } from "../hooks/useJobOffers";
const getStatusBgClass = (status: string = "") => {
  switch (status.toLowerCase()) {
    case "applied":
      return "bg-[#EEF2FF]";
    case "shortlisted":
      return "bg-[#EEF2FF]";
    case "in-review":
      return "bg-[#FEF3C7]";
    case "declined":
      return "bg-[#FEE2E2]";
    default:
      return "bg-[#EEF2FF]";
  }
};

interface JobsPageProps {
  searchParams?: any;
  isCompanyMode?: boolean; // Kept for backwards compatibility if needed, but we will override
}

export const JobsPage: React.FC<JobsPageProps> = ({ searchParams, isCompanyMode: propIsCompanyMode = false }) => {
  const router = useRouter();
  const { isCompany, activeProfile } = useActiveProfile();
  const { flags, isFeatureActive } = useFeatureFlags();
  const isCompanyMode = propIsCompanyMode || (isCompany && !!activeProfile?.id);


  // Use reactive useSearchParams so the list updates on every client-side navigation
  const urlParams = useSearchParams();
  const urlSearch = urlParams?.get('search') || '';
  const urlLocation = urlParams?.get('location') || '';
  const urlTab = urlParams?.get('tab') || 'Explore';

  // Also read from the SSR searchParams prop as the initial seed (for first load)
  let resolvedParams: any = null;
  if (searchParams) {
    if (typeof searchParams.then === "function") {
      resolvedParams = use(searchParams);
    } else {
      resolvedParams = searchParams;
    }
  }

  // Prefer reactive urlParams, fall back to SSR prop on initial server render
  const initialSearch =
    urlSearch || (typeof resolvedParams?.search === "string" ? resolvedParams.search : "");
  const initialLocation =
    urlLocation || (typeof resolvedParams?.location === "string" ? resolvedParams.location : "");

  const {
    jobs,
    recommendedJobs,
    isLoading,
    isRecommendationsLoading,
    isFetchingMore,
    hasMore,
    loadMore,
    activeTab,
    setActiveTab,
    filters,
    setFilterValue,
    setMultipleFilters,
    toggleSave,
    applyToJob,
    withdrawJob,
    respondToOffer,
    applicationStats,
  } = useJobs("Explore", initialSearch, initialLocation);

  // Sync tab from URL query param to Zustand store
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      if (urlTab === "Saved" && !isFeatureActive("saved_jobs")) return;
      if (urlTab === "My Applications" && !isFeatureActive("enableApplicationTracking")) return;
      if (urlTab === "Offers" && !isFeatureActive("enableJobOffers")) return;

      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab, setActiveTab, isFeatureActive]);

  // Clear search and location filters from the URL on F5 page refresh (reload)
  useEffect(() => {
    const navigationEntry = window.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (navigationEntry?.type === 'reload') {
      const params = new URLSearchParams(window.location.search);
      if (params.has('search') || params.has('location')) {
        params.delete('search');
        params.delete('location');
        const newQuery = params.toString();
        router.replace(newQuery ? `/jobs?${newQuery}` : '/jobs');
      }
    }
  }, [router]);

  // Redirect away from disabled tabs
  useEffect(() => {
    if (activeTab === "Saved" && !isFeatureActive("saved_jobs")) {
      handleTabChange("Explore");
    }
    if (activeTab === "My Applications" && !isFeatureActive("enableApplicationTracking")) {
      handleTabChange("Explore");
    }
    if (activeTab === "Offers" && !isFeatureActive("enableJobOffers")) {
      handleTabChange("Explore");
    }
  }, [activeTab, isFeatureActive]);


  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tabId);
    router.replace(`/jobs?${params.toString()}`);
  };

  // Reactively update filters when URL search params change (e.g. "Find jobs" click from header)
  // Skip the initial render — useJobs is already seeded with initialSearch/initialLocation
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Single atomic update → single fetchJobs call
    setMultipleFilters({ search: urlSearch, location: urlLocation });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearch, urlLocation]);

  const {
    offers,
    isLoading: isOffersLoading,
    handleAccept: handleOfferAccept,
    handleDecline: handleOfferDecline,
  } = useJobOffers();

  const urlSubTab = urlParams?.get('subTab');
  const [activeFilter, setActiveFilter] = React.useState<'All' | 'Current' | 'Decline' | 'Expired'>(
    (urlSubTab as any) || 'All'
  );
  const [mobileFilterOpen, setMobileFilterOpen] = React.useState(false);
  const [isAppFilterDrawerOpen, setIsAppFilterDrawerOpen] = React.useState(false);

  useEffect(() => {
    if (urlSubTab && ['All', 'Current', 'Decline', 'Expired'].includes(urlSubTab)) {
      setActiveFilter(urlSubTab as any);
    }
  }, [urlSubTab]);

  const handleSubTabChange = (subTab: 'All' | 'Current' | 'Decline' | 'Expired') => {
    setActiveFilter(subTab);
    const params = new URLSearchParams(window.location.search);
    params.set("subTab", subTab);
    router.replace(`/jobs?${params.toString()}`);
  };

  const filteredOffers = React.useMemo(() => {
    if (activeFilter === 'All') return offers;
    if (activeFilter === 'Current') return offers.filter(o => o.status === 'pending');
    if (activeFilter === 'Decline') return offers.filter(o => o.status === 'declined');
    if (activeFilter === 'Expired') return offers.filter(o => o.status === 'expired');
    return offers;
  }, [offers, activeFilter]);

  const [applyingJob, setApplyingJob] = React.useState<Job | null>(null);
  const [withdrawJobId, setWithdrawJobId] = React.useState<string | null>(null);
  const [declineJobId, setDeclineJobId] = React.useState<string | null>(null);
  const selectedStatusFilter = useJobStore((state: any) => state.filters.selectedStatusFilter);
  const selectedDateFilter = useJobStore((state: any) => state.filters.selectedDateFilter);
  const setCandidateFilterValue = useJobStore((state: any) => state.setCandidateFilterValue);

  const setSelectedStatusFilter = (val: string) => setCandidateFilterValue('selectedStatusFilter', val);
  const setSelectedDateFilter = (val: string) => setCandidateFilterValue('selectedDateFilter', val);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] =
    React.useState<boolean>(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const dateFilteredJobs = React.useMemo(() => {
    let result = jobs;

    const parseJobDate = (job: Job): number => {
      // 1. If it's My Applications tab, use applied_at (raw timestamp) or parse applied_date_display
      if (activeTab === "My Applications") {
        if (job.applied_at) {
          const t = new Date(job.applied_at).getTime();
          if (!isNaN(t)) return t;
        }
        // Fallback to parsing applied_date_display (e.g. "Applied 15h ago")
        if (job.applied_date_display) {
          const cleanStr = job.applied_date_display.replace(/^[Aa]pplied\s+/, "");
          const t = new Date(cleanStr).getTime();
          if (!isNaN(t)) return t;

          const str = cleanStr.toLowerCase();
          if (
            str.includes("hour") ||
            str.includes("h ") ||
            str.endsWith("h") ||
            str.includes("minute") ||
            str.includes("m ") ||
            str.endsWith("m") ||
            str.includes("today") ||
            str.includes("now")
          ) {
            return Date.now();
          } else if (str.includes("day")) {
            const days = parseInt(str) || 1;
            return Date.now() - days * 24 * 60 * 60 * 1000;
          } else if (str.includes("week")) {
            const weeks = parseInt(str) || 1;
            return Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
          } else if (str.includes("month")) {
            const months = parseInt(str) || 1;
            return Date.now() - months * 30 * 24 * 60 * 60 * 1000;
          }
        }
      }

      // 2. Otherwise (Explore or fallback), use created_at (raw timestamp) or parse posted_at
      if (job.created_at) {
        const t = new Date(job.created_at).getTime();
        if (!isNaN(t)) return t;
      }

      if (job.posted_at) {
        const t = new Date(job.posted_at).getTime();
        if (!isNaN(t)) return t;

        const str = job.posted_at.toLowerCase();
        if (
          str.includes("hour") ||
          str.includes("h ") ||
          str.endsWith("h") ||
          str.includes("minute") ||
          str.includes("m ") ||
          str.endsWith("m") ||
          str.includes("today") ||
          str.includes("now")
        ) {
          return Date.now();
        } else if (str.includes("day")) {
          const days = parseInt(str) || 1;
          return Date.now() - days * 24 * 60 * 60 * 1000;
        } else if (str.includes("week")) {
          const weeks = parseInt(str) || 1;
          return Date.now() - weeks * 7 * 24 * 60 * 60 * 1000;
        } else if (str.includes("month")) {
          const months = parseInt(str) || 1;
          return Date.now() - months * 30 * 24 * 60 * 60 * 1000;
        }
      }

      return Date.now();
    };

    const dp = selectedDateFilter.toLowerCase();
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    if (dp === "today") {
      result = result.filter(j => (now - parseJobDate(j)) <= DAY);
    } else if (dp === "last 7 days") {
      result = result.filter(j => (now - parseJobDate(j)) <= 7 * DAY);
    } else if (dp === "last 30 days") {
      result = result.filter(j => (now - parseJobDate(j)) <= 30 * DAY);
    }

    return result;
  }, [jobs, selectedDateFilter, activeTab]);

  const filteredJobs = React.useMemo(() => {
    // The backend now handles status filtering for My Applications.
    return dateFilteredJobs;
  }, [dateFilteredJobs]);

  const appliedCount = React.useMemo(() => {
    return jobs.filter(
      (job) => job.application_status?.toLowerCase() === "applied",
    ).length;
  }, [jobs]);

  const shortlistedCount = React.useMemo(() => {
    return jobs.filter(
      (job) => job.application_status?.toLowerCase() === "shortlisted",
    ).length;
  }, [jobs]);

  const handleApplyClick = (jobId: string) => {
    if (!isFeatureActive("enableJobApplications")) {
      toast.error("Job applications are temporarily paused by administration.");
      return;
    }
    const jobToApply = jobs.find((j) => j.id === jobId);
    if (jobToApply) {
      setApplyingJob(jobToApply);
    }
  };

  const handleWithdrawClick = (jobId: string) => {
    setWithdrawJobId(jobId);
  };

  const handleDeclineClick = (jobId: string) => {
    setDeclineJobId(jobId);
  };

  // Recommended jobs are retrieved directly from useJobs hook

  React.useEffect(() => {
    const handleCaptureClick = () => {
      sessionStorage.setItem(
        `jobs_scroll_page_${activeTab}`,
        window.scrollY.toString(),
      );
    };
    window.addEventListener("click", handleCaptureClick, true);
    return () => {
      window.removeEventListener("click", handleCaptureClick, true);
    };
  }, [activeTab]);

  React.useEffect(() => {
    const comingFromDetail =
      sessionStorage.getItem("coming_from_job_detail") === "true";

    if (comingFromDetail) {
      const savedPageScroll = sessionStorage.getItem(
        `jobs_scroll_page_${activeTab}`,
      );

      if (savedPageScroll) {
        let retries = 0;
        const scrollTarget = parseInt(savedPageScroll, 10);

        const scrollInterval = setInterval(() => {
          window.scrollTo(0, scrollTarget);
          retries++;

          // Check if we successfully reached the target scroll coordinate,
          // or if we timed out (20 retries = 1000ms)
          if (Math.abs(window.scrollY - scrollTarget) < 5 || retries > 20) {
            clearInterval(scrollInterval);
            sessionStorage.removeItem("coming_from_job_detail");
            sessionStorage.removeItem(`jobs_scroll_page_${activeTab}`);
          }
        }, 50);

        return () => clearInterval(scrollInterval);
      }
    } else {
      // Clear any stored scroll positions to avoid persistent clutter
      sessionStorage.removeItem(`jobs_scroll_page_${activeTab}`);
    }
  }, [activeTab]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsFilterDropdownOpen(false);
      }
    };
    if (isFilterDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  // Tabs layout specification
  const tabs = [
    { id: "Explore", label: "Explore" },
    { id: "My Applications", label: "My Applications", featureKey: "enableApplicationTracking" },
    { id: "Offers", label: "Offers", featureKey: "enableJobOffers" },
    { id: "Saved", label: "Saved", featureKey: "saved_jobs" },
  ];


  // Hide mobile HomeHeader search bar when the create-job wizard is active
  const urlView = urlParams?.get('view');
  useEffect(() => {
    if (urlView === 'create-job') {
      document.body.dataset.hideSearch = 'true';
    } else {
      delete document.body.dataset.hideSearch;
    }
    return () => { delete document.body.dataset.hideSearch; };
  }, [urlView]);

  if (activeTab === "My Listings" || isCompanyMode) {
    return (
      <div className={`w-full max-w-[998px] mx-auto min-h-screen bg-white ${isCompanyMode ? "dark:bg-[#0F1115]" : "dark:bg-[#0B0F19]"} pt-[20px] pb-6 px-4 md:px-0 flex flex-col gap-[20px]`}>
        <MyListingsDashboard
          isCompanyMode={isCompanyMode}
          onBack={() => {
            if (isCompanyMode) {
              router.push("/feed");
            } else {
              handleTabChange("Explore");
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-[998px] mx-auto bg-white dark:bg-[#0B0F19] pb-16 px-4 md:px-0 flex flex-col items-center gap-[24px] border-slate-100/50 dark:border-[#2E3445]/50 rounded-3xl ${activeTab === "Explore" ? "" : "pt-6"
        }`}
    >
      {/* Sticky Header Section */}
      <div className="sticky top-[72px] z-30 w-[calc(100%+32px)] md:w-full -mx-4 px-4 md:mx-0 md:px-0 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md flex flex-col gap-[24px] pt-4 md:pt-6 pb-2">
        {/* Hero Banner */}
        {activeTab === "Explore" && jobs.length > 0 && (
          <div className="hidden md:flex w-full h-auto min-h-[136px] px-6 md:px-8 py-6 bg-[#EEF2FF] dark:bg-[#1C2340] border border-[#E0E7FF] dark:border-[#252E54] rounded-[24px] flex-col justify-center items-start box-border flex-none self-stretch overflow-hidden">
            <div className="w-full flex flex-col items-start flex-none self-stretch">
              <div className="w-full font-['Poppins'] font-semibold text-2xl md:text-3xl lg:text-[32px] leading-tight md:leading-[40px] flex items-center text-[#6366F1] dark:text-[#818CF8] flex-none self-stretch">
                Your next career move,
                <br />
                made simple.
              </div>
            </div>
          </div>
        )}

        {/* Mobile Posted Jobs Card */}
        <div className="w-full flex md:hidden bg-white dark:bg-[#0B0F19] rounded-[16px] border border-gray-200 dark:border-[#2E3445] p-4 flex-col gap-1 shadow-sm mt-2 mb-1">
          <h4 className="text-black dark:text-[#F9FAFB] font-semibold text-[15px] font-['Poppins']">Posted jobs</h4>
          <p className="text-gray-500 dark:text-[#9CA3AF] text-[13px] font-['Poppins'] mb-2">Manage and track your active job postings</p>
          <FeatureDisabledTooltip featureKey="enableMyListings">
            <button
              onClick={() => handleTabChange("My Listings")}
              className="w-[140px] h-9 px-4 border border-[#6366F1] dark:border-[#818CF8] rounded-full text-[#6366F1] dark:text-[#818CF8] font-semibold text-sm flex items-center justify-between hover:bg-[#EEF2FF] dark:hover:bg-[#1C2340] transition-colors"
            >
              Posted jobs <Icon icon="lucide:chevron-right" className="w-4 h-4" />
            </button>
          </FeatureDisabledTooltip>
        </div>

        {/* Tabs navigation row */}
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center pb-2 pt-2 gap-4 sticky top-[72px] z-30 bg-white dark:bg-[#0B0F19]">
          <div className="flex overflow-x-auto no-scrollbar md:flex-wrap justify-start items-center gap-2 md:gap-4 w-full md:w-auto pb-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const tabButton = (
                <button
                  onClick={() => handleTabChange(tab.id)}
                  className={`h-10 px-4 md:px-5 py-1.5 rounded-3xl flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border ${isActive
                    ? "bg-[#EEF2FF] dark:bg-[#1C2340] border-transparent text-[#6366F1] dark:text-[#818CF8]"
                    : "bg-white dark:bg-[#0B0F19] border-[#6366F1]/30 dark:border-[#818CF8]/30 hover:border-[#6366F1] dark:hover:border-[#818CF8] text-[#6366F1]/70 dark:text-[#818CF8]/70 hover:text-[#6366F1] dark:hover:text-[#818CF8]"
                    }`}
                >
                  {tab.label}
                </button>
              );

              if (tab.featureKey) {
                return (
                  <FeatureDisabledTooltip key={tab.id} featureKey={tab.featureKey}>
                    {tabButton}
                  </FeatureDisabledTooltip>
                );
              }

              return (
                <React.Fragment key={tab.id}>
                  {tabButton}
                </React.Fragment>
              );
            })}
          </div>

          {/* My Listings tab link */}
          <FeatureDisabledTooltip featureKey="enableMyListings">
            <button
              onClick={() => handleTabChange("My Listings")}
              className={`hidden md:flex h-10 px-4 md:px-5 py-1.5 rounded-3xl justify-center items-center gap-2 text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border w-auto ${activeTab === "My Listings"
                ? "bg-[#EEF2FF] dark:bg-[#1C2340] border-transparent text-[#6366F1] dark:text-[#818CF8]"
                : "bg-white dark:bg-[#0B0F19] border-[#6366F1]/30 dark:border-[#818CF8]/30 hover:border-[#6366F1] dark:hover:border-[#818CF8] text-[#6366F1]/70 dark:text-[#818CF8]/70 hover:text-[#6366F1] dark:hover:text-[#818CF8]"
                }`}
            >
              <span>Posted jobs</span>
              <Icon icon="lucide:chevron-right" className="w-4 h-4" />
            </button>
          </FeatureDisabledTooltip>
        </div>
      </div>

      {/* AI Recommended Jobs - Only show under Explore tab */}
      {activeTab === "Explore" && (isRecommendationsLoading || recommendedJobs.length > 0) && (
        <div className="w-full flex flex-col gap-[20px]">
          <div className="flex justify-start items-center">
            <h3 className="text-black dark:text-[#F9FAFB] text-lg font-semibold font-['Poppins'] leading-6">
              AI recommended jobs
            </h3>
          </div>

          {/* Recommended jobs container */}
          <div className="w-full flex flex-row justify-start items-start gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1">
            {isRecommendationsLoading ? (
              [1, 2, 3].map((n) => (
                <RecommendedJobCardSkeleton key={n} />
              ))
            ) : (
              recommendedJobs.map((job) => (
                <RecommendedJobCard
                  key={job.id}
                  job={job}
                  onClick={(j) => router.push(`/jobs/${j.id}`)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* My Applications Tab */}
      <div className={`w-full ${activeTab === "My Applications" ? "" : "hidden"}`}>
        {(jobs.length === 0 && selectedStatusFilter === "All" && selectedDateFilter === "All time" && !isLoading) ? (
          <div className="h-[706px] flex flex-col justify-center items-center gap-4 w-full animate-in fade-in duration-300">
            <Icon icon="hugeicons:job-search" className="size-20 text-black dark:text-[#F9FAFB] flex-shrink-0" />
            <div className="flex flex-col justify-start items-center gap-2">
              <div className="text-center justify-center text-black dark:text-[#F9FAFB] text-base font-medium font-['Poppins'] leading-6">
                No jobs applications yet
              </div>
              <div className="w-80 text-center justify-center text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">
                New job applications will appear here when you apply
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-[24px]">
            {/* Stats Cards Row */}
            <div className="w-full flex flex-row gap-2 sm:gap-[24px]">
              {/* Card 1: Total Applied */}
              <div className="flex-1 min-h-[94px] p-2 sm:p-[16px] bg-[#FFFFFF] dark:bg-[#0B0F19] border border-[#EEF2FF] dark:border-[#2E3445] rounded-[24px] flex flex-col justify-center items-start gap-1 sm:gap-[8px]">
                <div className="text-[#6366F1] dark:text-[#818CF8] text-[24px] font-semibold font-['Poppins'] leading-[32px]">
                  {selectedDateFilter !== "All time"
                    ? dateFilteredJobs.length
                    : (applicationStats.totalApplied || jobs.length)}
                </div>
                <div className="text-[#000000] dark:text-[#F9FAFB] text-xs sm:text-[14px] font-normal font-['Poppins'] leading-[20px] text-left">
                  Total Applied
                </div>
              </div>
              {/* Card 2: Shortlisted */}
              <div className="flex-1 min-h-[94px] p-2 sm:p-[16px] bg-[#FFFFFF] dark:bg-[#0B0F19] border border-[#EEF2FF] dark:border-[#2E3445] rounded-[24px] flex flex-col justify-center items-start gap-1 sm:gap-[8px]">
                <div className="text-[#6366F1] dark:text-[#818CF8] text-[24px] font-semibold font-['Poppins'] leading-[32px]">
                  {selectedDateFilter !== "All time"
                    ? dateFilteredJobs.filter(
                      (job) => job.application_status?.toLowerCase() === "shortlisted"
                    ).length
                    : (applicationStats.shortlisted || 0)}
                </div>
                <div className="text-[#000000] dark:text-[#F9FAFB] text-xs sm:text-[14px] font-normal font-['Poppins'] leading-[20px] text-left">
                  Shortlisted
                </div>
              </div>
            </div>

            {/* Filter Section Container */}
            <div className="w-full flex flex-col gap-[16px]">
              {/* Top Filter Row */}
              <div className="w-full min-h-[40px] flex flex-col sm:flex-row justify-between items-start sm:items-center relative gap-2">
                <span className="font-['Poppins'] text-[14px] font-normal text-[#000000] dark:text-[#F9FAFB] leading-[20px]">
                  Tracking {selectedDateFilter !== "All time" ? dateFilteredJobs.length : (applicationStats.totalApplied || jobs.length)} active job applications across your network.
                </span>
                <div ref={dropdownRef} className="relative flex items-center gap-2">
                  {/* Mobile Trigger */}
                  <button
                    onClick={() => setIsAppFilterDrawerOpen(true)}
                    className="md:hidden h-[40px] px-2 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-[#1C2340] rounded-full transition-all border border-transparent text-black dark:text-[#F9FAFB]"
                  >
                    <Icon icon="iconoir:filter-list" className="w-[24px] h-[24px]" />
                  </button>

                  {/* Desktop Date Trigger */}
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className={`hidden md:flex h-[40px] px-4 items-center justify-center gap-1.5 hover:bg-slate-100 dark:hover:bg-[#1C2340] rounded-full transition-all border ${selectedDateFilter !== "All time"
                        ? "border-[#6366F1]/30 dark:border-[#818CF8]/30 bg-[#EEF2FF] dark:bg-[#1C2340] text-[#6366F1] dark:text-[#818CF8]"
                        : "border-transparent text-black dark:text-[#F9FAFB]"
                      }`}
                  >
                    <Icon
                      icon="iconoir:filter-list"
                      className="w-[24px] h-[24px]"
                    />
                    {selectedDateFilter !== "All time" && (
                      <span className="text-[14px] font-semibold font-['Poppins'] capitalize">
                        {selectedDateFilter}
                      </span>
                    )}
                  </button>

                  {/* Filter Options Dropdown */}
                  {isFilterDropdownOpen && (
                    <div className="absolute right-0 top-[44px] z-50 w-48 p-2 bg-white dark:bg-[#0B0F19] rounded-tl-3xl rounded-bl-3xl rounded-br-3xl outline outline-1 outline-offset-[-1px] outline-indigo-200 dark:outline-[#818CF8]/30 inline-flex flex-col justify-start items-center overflow-hidden shadow-lg">
                      <div
                        onClick={() => {
                          setSelectedDateFilter("All time");
                          setIsFilterDropdownOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white dark:bg-[#0B0F19] rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2E3445]"
                      >
                        <div
                          className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${selectedDateFilter === "All time"
                            ? "text-indigo-500 dark:text-[#818CF8]"
                            : "text-gray-500 dark:text-[#9CA3AF]"
                            }`}
                        >
                          All time
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          setSelectedDateFilter("today");
                          setIsFilterDropdownOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white dark:bg-[#0B0F19] rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2E3445]"
                      >
                        <div
                          className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${selectedDateFilter === "today"
                            ? "text-indigo-500 dark:text-[#818CF8]"
                            : "text-gray-500 dark:text-[#9CA3AF]"
                            }`}
                        >
                          Today
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          setSelectedDateFilter("last 7 days");
                          setIsFilterDropdownOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white dark:bg-[#0B0F19] rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2E3445]"
                      >
                        <div
                          className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${selectedDateFilter === "last 7 days"
                            ? "text-indigo-500 dark:text-[#818CF8]"
                            : "text-gray-500 dark:text-[#9CA3AF]"
                            }`}
                        >
                          Last 7 days
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          setSelectedDateFilter("last 30 days");
                          setIsFilterDropdownOpen(false);
                        }}
                        className="self-stretch px-4 py-2 bg-white dark:bg-[#0B0F19] rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#2E3445]"
                      >
                        <div
                          className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${selectedDateFilter === "last 30 days"
                            ? "text-indigo-500 dark:text-[#818CF8]"
                            : "text-gray-500 dark:text-[#9CA3AF]"
                            }`}
                        >
                          Last 30 days
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter Chips Row (Desktop Only) */}
              <div className="hidden md:flex w-full flex-row flex-wrap items-center gap-[8px] border-b border-transparent">
                {["All", "Applied", "Shortlisted", "In review", "Declined"].map(
                  (chip) => {
                    const isSelected =
                      selectedStatusFilter.toLowerCase() === chip.toLowerCase();
                    return (
                      <div
                        key={chip}
                        onClick={() => setSelectedStatusFilter(chip)}
                        className={`font-['Poppins'] text-[14px] leading-[20px] px-[16px] py-[8px] cursor-pointer transition-all border-b-2 ${isSelected
                          ? "text-[#6366F1] dark:text-[#818CF8] font-semibold border-[#6366F1] dark:border-[#818CF8]"
                          : "text-[#000000] dark:text-[#F9FAFB] font-normal border-transparent hover:text-[#6366F1]/80 dark:hover:text-[#818CF8]/80"
                          }`}
                      >
                        {chip}
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            {/* Mobile Filter Drawer */}
            <Drawer open={isAppFilterDrawerOpen} onOpenChange={setIsAppFilterDrawerOpen}>
              <DrawerContent className="bg-white dark:bg-[#0B0F19] border-t border-indigo-100 dark:border-[#2E3445] rounded-t-[24px] z-[100] h-[85vh]">
                <DrawerTitle className="sr-only">Filters</DrawerTitle>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#2E3445] mb-2 flex-shrink-0">
                  <h2 className="text-lg font-semibold font-['Poppins'] text-black dark:text-[#F9FAFB]">Filters</h2>
                  <button
                    onClick={() => {
                      setSelectedDateFilter("All time");
                      setSelectedStatusFilter("All");
                    }}
                    className="text-sm text-indigo-500 dark:text-[#818CF8] hover:underline font-['Poppins']"
                  >
                    Clear all
                  </button>
                </div>
                <div className="px-5 overflow-y-auto flex-1 pb-24">
                  <Accordion type="multiple" defaultValue={["date", "status"]} className="w-full">
                    <AccordionItem value="date" className="border-b border-gray-100 dark:border-[#2E3445]">
                      <AccordionTrigger className="font-['Poppins'] font-semibold text-base text-black dark:text-[#F9FAFB] hover:no-underline py-4">
                        Date applied
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-3 pb-4">
                        {[
                          { label: "All time", value: "All time" },
                          { label: "Today", value: "today" },
                          { label: "Last 7 days", value: "last 7 days" },
                          { label: "Last 30 days", value: "last 30 days" },
                        ].map((opt) => (
                          <label key={opt.value} className="flex items-center gap-3 cursor-pointer group py-1">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedDateFilter === opt.value ? "border-indigo-500 dark:border-[#818CF8]" : "border-gray-300 dark:border-gray-600"
                              }`}>
                              {selectedDateFilter === opt.value && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 dark:bg-[#818CF8]" />}
                            </div>
                            <input
                              type="radio"
                              className="hidden"
                              checked={selectedDateFilter === opt.value}
                              onChange={() => setSelectedDateFilter(opt.value)}
                            />
                            <span className="text-sm text-black dark:text-[#F9FAFB] font-['Poppins']">{opt.label}</span>
                          </label>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="status" className="border-none">
                      <AccordionTrigger className="font-['Poppins'] font-semibold text-base text-black dark:text-[#F9FAFB] hover:no-underline py-4">
                        Status
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-3 pb-4">
                        {["All", "Applied", "Shortlisted", "In review", "Declined"].map((status) => (
                          <label key={status} className="flex items-center gap-3 cursor-pointer group py-1">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedStatusFilter.toLowerCase() === status.toLowerCase() ? "bg-indigo-500 border-indigo-500 dark:bg-[#818CF8] dark:border-[#818CF8]" : "border-gray-300 dark:border-gray-600"
                              }`}>
                              {selectedStatusFilter.toLowerCase() === status.toLowerCase() && <Icon icon="lucide:check" className="w-3.5 h-3.5 text-white dark:text-[#0B0F19]" />}
                            </div>
                            <input
                              type="radio"
                              className="hidden"
                              checked={selectedStatusFilter.toLowerCase() === status.toLowerCase()}
                              onChange={() => setSelectedStatusFilter(status)}
                            />
                            <span className="text-sm text-black dark:text-[#F9FAFB] font-['Poppins']">{status}</span>
                          </label>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#0B0F19] border-t border-gray-100 dark:border-[#2E3445]">
                  <button
                    onClick={() => setIsAppFilterDrawerOpen(false)}
                    className="w-full py-3 rounded-xl bg-indigo-500 dark:bg-[#818CF8] text-white dark:text-[#0B0F19] font-semibold font-['Poppins'] shadow-sm active:scale-95 transition-transform"
                  >
                    Show Results
                  </button>
                </div>
              </DrawerContent>
            </Drawer>

            {/* Applications list */}
            <div className="w-full flex flex-col">
              <div className="w-full flex flex-col gap-[12px]">
                {isLoading ? (
                  <div className="w-full flex flex-col gap-4 py-4">
                    {[1, 2, 3].map((n) => (
                      <JobCardSkeleton key={n} />
                    ))}
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12 text-[#6B7280] dark:text-[#9CA3AF] font-['Poppins']">
                    No applications in this category.
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    // Render company logo
                    const renderCompanyLogo = () => {
                      if (job.company_logo === "coreloom") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center overflow-hidden border border-indigo-100 flex-shrink-0">
                            <Icon
                              icon="solar:globus-linear"
                              className="w-[24px] h-[24px] text-[#6366F1]"
                            />
                          </div>
                        );
                      }
                      if (job.company_logo === "prismforge") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-[#FFE4E6] flex items-center justify-center overflow-hidden border border-rose-100 flex-shrink-0">
                            <Icon
                              icon="solar:fire-linear"
                              className="w-[24px] h-[24px] text-rose-500"
                            />
                          </div>
                        );
                      }
                      if (job.company_logo === "mindstack") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-[#ECFDF5] flex items-center justify-center overflow-hidden border border-emerald-100 flex-shrink-0">
                            <Icon
                              icon="solar:atom-linear"
                              className="w-[24px] h-[24px] text-emerald-500"
                            />
                          </div>
                        );
                      }
                      if (job.company_logo === "sphere") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
                            <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
                          </div>
                        );
                      }
                      return (
                        <div className="w-[56px] h-[40px] rounded-[24px] bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0">
                          <Icon
                            icon="hugeicons:job-search"
                            className="w-[20px] h-[20px] text-indigo-500"
                          />
                        </div>
                      );
                    };

                    return (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="w-full h-auto p-4 md:p-[16px] gap-4 md:gap-[12px] rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between transition-colors bg-white dark:bg-[#0B0F19] hover:bg-slate-50/50 dark:hover:bg-[#2E3445]/50 cursor-pointer border border-[#EEF2FF] dark:border-[#2E3445] md:border-transparent md:dark:border-transparent"
                      >
                        {/* Left: Logo + Info */}
                        <div className="flex flex-row items-center gap-[8px] w-full md:flex-1 min-w-0">
                          {renderCompanyLogo()}
                          <div className="flex flex-col gap-1 md:gap-[8px] min-w-0">
                            <span className="text-[#000000] dark:text-[#F9FAFB] text-[16px] font-medium font-['Poppins'] leading-[24px] truncate">
                              {job.title}
                            </span>
                            <span className="text-[#6B7280] dark:text-[#9CA3AF] text-[14px] font-normal font-['Poppins'] leading-[20px] truncate">
                              {job.company}
                            </span>
                          </div>
                        </div>

                        {/* Middle-left: Applied date */}
                        <div className="w-full md:flex-1 md:min-w-[120px] flex items-center justify-start md:justify-center text-[#6B7280] dark:text-[#9CA3AF] text-[14px] font-normal font-['Poppins'] leading-[20px]">
                          <span className="md:hidden font-semibold mr-2 text-black dark:text-[#F9FAFB]">Applied:</span>
                          {job.applied_date_display ||
                            `Applied ${job.posted_at}`}
                        </div>

                        {/* Middle-right: Status */}
                        <div className="w-full md:flex-1 md:min-w-[120px] flex items-center justify-start md:justify-center">
                          <span className="md:hidden font-semibold mr-2 text-black dark:text-[#F9FAFB]">Status:</span>
                          <span className="text-[#000000] dark:text-[#F9FAFB] text-[14px] font-normal font-['Poppins'] leading-[20px] text-left md:text-center">
                            {job.application_status?.toLowerCase() === "in-review"
                              ? "In review"
                              : job.application_status?.toLowerCase() === "declined"
                                ? "Declined"
                                : job.application_status || "Applied"}
                          </span>
                        </div>

                        {/* Right: Actions */}
                        <div
                          className="w-full md:w-[120px] flex items-center justify-start md:justify-end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.application_status?.toLowerCase() === "declined" ||
                            job.application_status?.toLowerCase() === "rejected" ? (
                            <div className="hidden md:block w-[120px]" />
                          ) : job.is_available === false ? (
                            <span className="text-[#EF4444] dark:text-[#F87171] text-[14px] font-normal font-['Poppins'] text-left md:text-center leading-[20px] w-full md:w-[120px]">
                              This job is no
                              <br className="hidden md:inline" /> longer available
                            </span>
                          ) : job.application_status?.toLowerCase() ===
                            "shortlisted" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (job.org_id) {
                                  router.push(`/messaging?companyId=${job.org_id}&jobContext=${job.id}`);
                                } else {
                                  router.push(`/messaging?userId=${job.recruiter_id}&jobContext=${job.id}`);
                                }
                              }}
                              className="w-full md:w-[120px] h-[40px] bg-[#6366F1] dark:bg-[#818CF8] border border-white dark:border-[#0B0F19] rounded-[24px] text-white dark:text-[#F9FAFB] font-['Poppins'] text-[14px] font-normal leading-[20px] flex items-center justify-center hover:bg-[#6366F1]/90 dark:hover:bg-[#818CF8]/90 transition-all active:scale-95 shadow-sm"
                            >
                              Chat
                            </button>
                          ) : job.application_status?.toLowerCase() === "withdrawn" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyClick(job.id);
                              }}
                              className="w-full md:w-[120px] h-[40px] border border-[#6B7280] dark:border-[#9CA3AF] rounded-[24px] bg-transparent text-[#6B7280] dark:text-[#9CA3AF] font-['Poppins'] text-[14px] font-normal leading-[20px] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-[#2E3445] transition-all active:scale-95"
                            >
                              Apply
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWithdrawClick(job.id);
                              }}
                              className="w-full md:w-[120px] h-[40px] border border-[#6B7280] dark:border-[#9CA3AF] rounded-[24px] bg-transparent text-[#6B7280] dark:text-[#9CA3AF] font-['Poppins'] text-[14px] font-normal leading-[20px] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-[#2E3445] transition-all active:scale-95"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Load More Button */}
                {hasMore && (
                  <div className="w-full flex justify-center py-4">
                    <button
                      onClick={loadMore}
                      disabled={isFetchingMore}
                      className="h-10 px-6 rounded-[24px] border border-[#6366F1] dark:border-[#818CF8] bg-transparent text-[#6366F1] dark:text-[#818CF8] font-['Poppins'] text-[14px] font-semibold leading-[20px] flex items-center justify-center hover:bg-[#EEF2FF] dark:hover:bg-[#1C2340] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-default"
                    >
                      {isFetchingMore ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Offers Tab */}
      <div className={`w-full ${activeTab === "Offers" ? "" : "hidden"}`}>
        <div className="w-full flex flex-col gap-[20px]">
          {/* Header & Sub-tabs */}
          <div className="w-full flex flex-col items-start gap-4">
            <div className="w-full flex justify-between items-center">
              <h3 className="text-black dark:text-[#F9FAFB] text-xl font-bold font-['Poppins'] leading-8">
                Official Job Offers
              </h3>
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2E3445] transition-colors outline-none"
              >
                <Icon icon="iconoir:filter-list" className="w-6 h-6 text-black dark:text-[#F9FAFB]" />
              </button>
            </div>

            {/* Desktop Only Sub-tabs */}
            <div className="hidden md:flex w-full flex-row items-start gap-4 h-[36px] p-0">
              {(['All', 'Current', 'Decline', 'Expired'] as const).map((subTab) => {
                const isActive = activeFilter === subTab;
                return (
                  <button
                    key={subTab}
                    onClick={() => handleSubTabChange(subTab)}
                    className={`flex flex-row justify-center items-center px-4 py-2 gap-[10px] h-[36px] box-border font-['Poppins'] text-sm leading-5 transition-all ${isActive
                        ? 'text-[#6366F1] font-semibold border-b border-[#6366F1] drop-shadow-[0_1px_4px_rgba(99,102,241,0.08)]'
                        : 'text-black dark:text-[#F9FAFB] font-normal rounded-3xl hover:bg-gray-50 dark:hover:bg-[#2E3445]'
                      }`}
                  >
                    {subTab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Filter Drawer */}
          <Drawer open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
            <DrawerContent className="bg-white dark:bg-[#0B0F19] border-t border-indigo-100 dark:border-[#2E3445] rounded-t-[24px] z-[80] pb-8 pt-4">
              <DrawerTitle className="sr-only">Filter Offers</DrawerTitle>
              <div className="flex flex-col px-4">
                {(['All', 'Current', 'Decline', 'Expired'] as const).map((subTab) => (
                  <button
                    key={subTab}
                    onClick={() => {
                      handleSubTabChange(subTab);
                      setMobileFilterOpen(false);
                    }}
                    className={`w-full py-4 px-4 text-left font-['Poppins'] text-base transition-colors rounded-xl ${activeFilter === subTab
                        ? 'text-indigo-500 dark:text-[#818CF8] font-medium bg-indigo-50/50 dark:bg-[#1C2340]'
                        : 'text-gray-600 dark:text-[#9CA3AF] hover:bg-gray-50 dark:hover:bg-[#1C2340]'
                      }`}
                  >
                    {subTab}
                  </button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>

          {/* Offers list */}
          <div className="w-full flex flex-col gap-6 mt-2">
            {isOffersLoading ? (
              <div className="w-full flex flex-col gap-6">
                {[1, 2, 3].map(n => (
                  <OfferCardSkeleton key={n} />
                ))}
              </div>
            ) : filteredOffers.length === 0 ? (
              <div className="h-[706px] flex flex-col justify-center items-center gap-4 w-full animate-in fade-in duration-300">
                <Icon icon="hugeicons:gift" className="size-20 text-black dark:text-[#F9FAFB] flex-shrink-0" />
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="text-center justify-center text-black dark:text-[#F9FAFB] text-base font-medium font-['Poppins'] leading-6">
                    {activeFilter === 'All' ? 'No job offers yet' : 'No offers found'}
                  </div>
                  <div className="w-80 text-center justify-center text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">
                    {activeFilter === 'All'
                      ? 'Job offers from recruiters and hiring teams will appear here when they match your profile.'
                      : 'There are no offers in this category.'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex flex-col gap-6 w-full">
                  {filteredOffers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      onAccept={handleOfferAccept}
                      onDecline={handleOfferDecline}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Tab */}
      <div className={`w-full ${activeTab === "Saved" ? "" : "hidden"}`}>
        <div className="w-full flex flex-col gap-[20px]">
          {/* Saved Jobs List container */}
          <div className="w-full">
            {isLoading ? (
              <div className="w-full flex flex-col gap-4 py-4">
                {[1, 2, 3].map((n) => (
                  <JobCardSkeleton key={n} />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="h-[706px] flex flex-col justify-center items-center gap-4 w-full animate-in fade-in duration-300">
                <Icon icon="hugeicons:job-search" className="size-20 text-black dark:text-[#F9FAFB] flex-shrink-0" />
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="text-center justify-center text-black dark:text-[#F9FAFB] text-base font-medium font-['Poppins'] leading-6">
                    No saved jobs yet
                  </div>
                  <div className="w-80 text-center justify-center text-gray-500 dark:text-[#9CA3AF] text-xs font-normal font-['Poppins'] leading-4">
                    New saved jobs will appear here when you save them
                  </div>
                </div>
              </div>
            ) : (
              <JobList
                jobs={jobs}
                isSavedTab={true}
                isLoading={isLoading}
                isFetchingMore={isFetchingMore}
                hasMore={hasMore}
                loadMore={loadMore}
                onSave={toggleSave}
                onApply={handleApplyClick}
                onWithdraw={handleWithdrawClick}
                onSelect={(j) => router.push(`/jobs/${j.id}`)}
                onAccept={handleOfferAccept}
                onDecline={handleOfferDecline}
              />
            )}
          </div>
        </div>
      </div>

      {/* Explore Tab */}
      <div className={`w-full ${activeTab === "Explore" ? "" : "hidden"}`}>
        <div className="w-full flex flex-col gap-[20px]">
          <h3 className="text-black dark:text-[#F9FAFB] text-lg font-semibold font-['Poppins'] leading-6">
            All jobs
          </h3>

          <JobFilters
            filters={filters}
            onFilterChange={setFilterValue}
            onClearFilters={() => {
              setFilterValue("job_type", "");
              setFilterValue("work_mode", "");
              setFilterValue("experience", "");
              setFilterValue("salary_range", "");
              setFilterValue("date_posted", "");
              setFilterValue("industry", "");
            }}
          />

          {/* Job List container */}
          <div className="w-full">
            <JobList
              jobs={jobs}
              isLoading={isLoading}
              isFetchingMore={isFetchingMore}
              hasMore={hasMore}
              loadMore={loadMore}
              onSave={toggleSave}
              onApply={handleApplyClick}
              onWithdraw={handleWithdrawClick}
              onSelect={(j) => router.push(`/jobs/${j.id}`)}
              onAccept={handleOfferAccept}
              onDecline={handleOfferDecline}
            />
          </div>
        </div>
      </div>

      {/* Apply Job Modal */}
      <ApplyJobModal
        isOpen={applyingJob !== null}
        onClose={() => setApplyingJob(null)}
        onApply={(resumeUrl, uploadedFile, resumeId, coverLetter) => {
          if (applyingJob) {
            applyToJob(applyingJob.id, resumeUrl, uploadedFile, resumeId, coverLetter);
            setApplyingJob(null);
          }
        }}
        jobTitle={applyingJob?.title}
      />

      {/* Withdraw Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={withdrawJobId !== null}
        title="Are you sure you want to withdraw your application?"
        message="This cannot be undone"
        confirmText="Withdraw"
        cancelText="Cancel"
        onConfirm={() => {
          if (withdrawJobId) {
            withdrawJob(withdrawJobId);
            setWithdrawJobId(null);
          }
        }}
        onCancel={() => setWithdrawJobId(null)}
      />

      {/* Decline Offer Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={declineJobId !== null}
        title="Are you sure you want to decline this offer?"
        message="This cannot be undone"
        confirmText="Decline"
        cancelText="Cancel"
        onConfirm={() => {
          if (declineJobId) {
            respondToOffer(declineJobId, "decline");
            setDeclineJobId(null);
          }
        }}
        onCancel={() => setDeclineJobId(null)}
      />
    </div>
  );
};

export default JobsPage;

// Force recompile to clear Turbopack cache issue
