import React, { use, useEffect, useRef } from "react";
import { useJobs } from "../hooks/useJobs";
import RecommendedJobCard from "../components/RecommendedJobCard";
import RecommendedJobCardSkeleton from "../components/skeletons/RecommendedJobCardSkeleton";
import JobList from "../components/JobList";
import JobFilters from "../components/JobFilters";
import { Icon } from "@iconify/react";
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
}

export const JobsPage: React.FC<JobsPageProps> = ({ searchParams }) => {
  const router = useRouter();

  // Use reactive useSearchParams so the list updates on every client-side navigation
  const urlParams = useSearchParams();
  const urlSearch = urlParams?.get('search') || '';
  const urlLocation = urlParams?.get('location') || '';

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
    isLoading,
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

  const [applyingJob, setApplyingJob] = React.useState<Job | null>(null);
  const [withdrawJobId, setWithdrawJobId] = React.useState<string | null>(null);
  const [declineJobId, setDeclineJobId] = React.useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] =
    React.useState<string>("All");
  const [selectedDateFilter, setSelectedDateFilter] =
    React.useState<string>("All time");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] =
    React.useState<boolean>(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const filteredJobs = React.useMemo(() => {
    let result = jobs;

    const parseJobDate = (postedAt: string): number => {
      const t = new Date(postedAt).getTime();
      if (!isNaN(t)) return t;
      // Fallback for dummy data
      const str = postedAt.toLowerCase();
      if (str.includes("hour") || str.includes("minute") || str.includes("today")) {
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
      return Date.now();
    };

    const dp = selectedDateFilter.toLowerCase();
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    if (dp === "today") {
      result = result.filter(j => (now - parseJobDate(j.posted_at)) <= DAY);
    } else if (dp === "last 7 days") {
      result = result.filter(j => (now - parseJobDate(j.posted_at)) <= 7 * DAY);
    } else if (dp === "last 30 days") {
      result = result.filter(j => (now - parseJobDate(j.posted_at)) <= 30 * DAY);
    }

    if (selectedStatusFilter !== "All") {
      result = result.filter((job) => {
        let status = job.application_status?.toLowerCase() || "";
        if (selectedStatusFilter.toLowerCase() === "in review" && status === "in-review") return true;
        return status === selectedStatusFilter.toLowerCase();
      });
    }

    return result;
  }, [jobs, selectedStatusFilter, selectedDateFilter]);

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

  // Filter recommended jobs for the horizontal carousel
  const recommendedJobs = jobs.filter((j) => j.is_recommended);

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

      const timer = setTimeout(() => {
        if (savedPageScroll) {
          window.scrollTo(0, parseInt(savedPageScroll, 10));
        }

        // Clean up from sessionStorage after applying the restored scroll values
        sessionStorage.removeItem("coming_from_job_detail");
        sessionStorage.removeItem(`jobs_scroll_page_${activeTab}`);
      }, 50);
      return () => clearTimeout(timer);
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
    { id: "My applications", label: "My applications" },
    { id: "Offers", label: "Offers" },
    { id: "Saved", label: "Saved" },
  ];

  if (activeTab === "My listings") {
    return (
      <div className="w-full max-w-[998px] mx-auto min-h-screen bg-white pt-[20px] pb-6 px-4 md:px-0 flex flex-col gap-[20px]">
        <MyListingsDashboard onBack={() => setActiveTab("Explore")} />
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-[998px] mx-auto bg-white pb-[40px] px-4 md:px-0 flex flex-col items-center gap-[24px] border-slate-100/50 rounded-3xl ${
        activeTab === "Explore" ? "" : "pt-6"
      }`}
    >
      {/* Hero Banner */}
      {activeTab === "Explore" && jobs.length > 0 && (
        <div className="w-full h-auto min-h-[136px] px-6 md:px-8 py-6 bg-[#EEF2FF] border border-[#E0E7FF] rounded-[24px] flex flex-col justify-center items-start box-border flex-none self-stretch overflow-hidden">
          <div className="w-full flex flex-col items-start flex-none self-stretch">
            <div className="w-full font-['Poppins'] font-semibold text-2xl md:text-3xl lg:text-[32px] leading-tight md:leading-[40px] flex items-center text-[#6366F1] flex-none self-stretch">
              Your next career move,
              <br />
              made simple.
            </div>
          </div>
        </div>
      )}

      {/* Tabs navigation row */}
      <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center pb-2 pt-2 gap-4 sticky top-[72px] z-30 bg-white">
        <div className="flex flex-wrap justify-start items-center gap-2 md:gap-4 w-full md:w-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`h-10 px-4 md:px-5 py-1.5 rounded-3xl flex justify-center items-center text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border ${
                  isActive
                    ? "bg-[#EEF2FF] border-transparent text-[#6366F1]"
                    : "bg-white border-[#6366F1]/30 hover:border-[#6366F1] text-[#6366F1]/70 hover:text-[#6366F1]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* My listings tab link */}
        <button
          onClick={() => setActiveTab("My listings")}
          className={`h-10 px-4 md:px-5 py-1.5 rounded-3xl flex justify-center items-center gap-2 text-sm font-semibold font-['Poppins'] transition-all duration-200 active:scale-95 border w-full md:w-auto ${
            activeTab === "My listings"
              ? "bg-[#EEF2FF] border-transparent text-[#6366F1]"
              : "bg-white border-[#6366F1]/30 hover:border-[#6366F1] text-[#6366F1]/70 hover:text-[#6366F1]"
          }`}
        >
          <span>My listings</span>
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </button>
      </div>

      {/* AI Recommended Jobs - Only show under Explore tab */}
      {activeTab === "Explore" && (isLoading || recommendedJobs.length > 0) && (
        <div className="w-full flex flex-col gap-[20px]">
          <div className="flex justify-start items-center">
            <h3 className="text-black text-lg font-semibold font-['Poppins'] leading-6">
              AI recommended jobs
            </h3>
          </div>

          {/* Recommended jobs container */}
          <div className="w-full flex flex-row justify-start items-start gap-4 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ">
            {isLoading ? (
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

      {/* Tab content conditional rendering */}
      {activeTab === "My applications" ? (
        jobs.length === 0 ? (
          <div className="h-[706px] flex flex-col justify-center items-center gap-4 w-full animate-in fade-in duration-300">
            <Icon icon="hugeicons:job-search" className="size-20 text-black flex-shrink-0" />
            <div className="flex flex-col justify-start items-center gap-2">
              <div className="text-center justify-center text-black text-base font-medium font-['Poppins'] leading-6">
                No jobs applications yet
              </div>
              <div className="w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">
                New job applications will appear here when you apply
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-[24px]">
          {/* Stats Cards Row */}
          <div className="w-full flex flex-col md:flex-row gap-4 md:gap-[24px]">
            {/* Card 1: Total Applied */}
            <div className="flex-1 min-h-[94px] p-[16px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[24px] flex flex-col justify-center items-start gap-[8px]">
              <div className="text-[#6366F1] text-[24px] font-semibold font-['Poppins'] leading-[32px]">
                {applicationStats.totalApplied || 0}
              </div>
              <div className="text-[#000000] text-[14px] font-normal font-['Poppins'] leading-[20px]">
                Total Applied
              </div>
            </div>
            {/* Card 2: Shortlisted */}
            <div className="flex-1 min-h-[94px] p-[16px] bg-[#FFFFFF] border border-[#EEF2FF] rounded-[24px] flex flex-col justify-center items-start gap-[8px]">
              <div className="text-[#6366F1] text-[24px] font-semibold font-['Poppins'] leading-[32px]">
                {applicationStats.shortlisted || 0}
              </div>
              <div className="text-[#000000] text-[14px] font-normal font-['Poppins'] leading-[20px]">
                Shortlisted
              </div>
            </div>
          </div>

          {/* Filter Section Container */}
          <div className="w-full flex flex-col gap-[16px]">
            {/* Top Filter Row */}
            <div className="w-full min-h-[40px] flex flex-col sm:flex-row justify-between items-start sm:items-center relative gap-2">
              <span className="font-['Poppins'] text-[14px] font-normal text-[#000000] leading-[20px]">
                Tracking {applicationStats.totalApplied || jobs.length} active job applications across your network.
              </span>
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="w-[56px] h-[40px] flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors"
                >
                  <Icon
                    icon="iconoir:filter-list"
                    className="w-[24px] h-[24px] text-black"
                  />
                </button>

                {/* Filter Options Dropdown */}
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-[44px] z-50 w-48 p-2 bg-white rounded-tl-3xl rounded-bl-3xl rounded-br-3xl outline outline-1 outline-offset-[-1px] outline-indigo-200 inline-flex flex-col justify-start items-center overflow-hidden shadow-lg">
                    <div
                      onClick={() => {
                        setSelectedDateFilter("All time");
                        setIsFilterDropdownOpen(false);
                      }}
                      className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50"
                    >
                      <div
                        className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${
                          selectedDateFilter === "All time"
                            ? "text-indigo-500"
                            : "text-gray-500"
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
                      className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50"
                    >
                      <div
                        className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${
                          selectedDateFilter === "today"
                            ? "text-indigo-500"
                            : "text-gray-500"
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
                      className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50"
                    >
                      <div
                        className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${
                          selectedDateFilter === "last 7 days"
                            ? "text-indigo-500"
                            : "text-gray-500"
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
                      className="self-stretch px-4 py-2 bg-white rounded-3xl inline-flex justify-start items-center gap-2.5 cursor-pointer hover:bg-slate-50"
                    >
                      <div
                        className={`text-center justify-start text-sm font-normal font-['Poppins'] leading-5 ${
                          selectedDateFilter === "last 30 days"
                            ? "text-indigo-500"
                            : "text-gray-500"
                        }`}
                      >
                        Last 30 days
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Filter Chips Row */}
            <div className="w-full flex flex-row flex-wrap items-center gap-[8px] border-b border-transparent">
              {["All", "Applied", "Shortlisted", "In review", "Declined"].map(
                (chip) => {
                  const isSelected =
                    selectedStatusFilter.toLowerCase() === chip.toLowerCase();
                  return (
                    <div
                      key={chip}
                      onClick={() => setSelectedStatusFilter(chip)}
                      className={`font-['Poppins'] text-[14px] leading-[20px] px-[16px] py-[8px] cursor-pointer transition-all border-b-2 ${
                        isSelected
                          ? "text-[#6366F1] font-semibold border-[#6366F1]"
                          : "text-[#000000] font-normal border-transparent hover:text-[#6366F1]/80"
                      }`}
                    >
                      {chip}
                    </div>
                  );
                },
              )}
            </div>
          </div>

          {/* Applications list */}
          <div className="w-full flex flex-col">
            <div className="w-full flex flex-col gap-[12px]">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12 text-[#6B7280] font-['Poppins']">
                    No applications in this category.
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    // Render company logo
                    const renderCompanyLogo = () => {
                      if (job.company_logo === "coreloom") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-[#E0E7FF] flex items-center justify-center overflow-hidden border border-indigo-100 pt-[6px] pb-[6px] pr-[8px]">
                            <Icon
                              icon="solar:globus-linear"
                              className="w-[24px] h-[24px] text-[#6366F1]"
                            />
                          </div>
                        );
                      }
                      if (job.company_logo === "prismforge") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-[#FFE4E6] flex items-center justify-center overflow-hidden border border-rose-100 pt-[6px] pb-[6px] pr-[8px]">
                            <Icon
                              icon="solar:fire-linear"
                              className="w-[24px] h-[24px] text-rose-500"
                            />
                          </div>
                        );
                      }
                      if (job.company_logo === "mindstack") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-[#ECFDF5] flex items-center justify-center overflow-hidden border border-emerald-100 pt-[6px] pb-[6px] pr-[8px]">
                            <Icon
                              icon="solar:atom-linear"
                              className="w-[24px] h-[24px] text-emerald-500"
                            />
                          </div>
                        );
                      }
                      if (job.company_logo === "sphere") {
                        return (
                          <div className="w-[56px] h-[40px] rounded-[24px] bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 pt-[6px] pb-[6px] pr-[8px]">
                            <div className="w-[20px] h-[20px] rounded-full bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-sm" />
                          </div>
                        );
                      }
                      return (
                        <div className="w-[56px] h-[40px] rounded-[24px] bg-indigo-50 flex items-center justify-center border border-indigo-100 flex-shrink-0 pt-[6px] pb-[6px] pr-[8px]">
                          <Icon
                            icon="lucide:briefcase"
                            className="w-[20px] h-[20px] text-indigo-500"
                          />
                        </div>
                      );
                    };

                    return (
                      <div
                        key={job.id}
                        onClick={() => router.push(`/jobs/${job.id}`)}
                        className="w-full h-auto p-4 md:p-[16px] gap-4 md:gap-[12px] rounded-[24px] flex flex-col md:flex-row items-start md:items-center justify-between transition-colors bg-white hover:bg-slate-50/50 cursor-pointer border border-[#EEF2FF] md:border-transparent"
                      >
                        {/* Left: Logo + Info */}
                        <div className="flex flex-row items-center gap-[8px] w-full md:flex-1 min-w-0">
                          {renderCompanyLogo()}
                          <div className="flex flex-col gap-1 md:gap-[8px] min-w-0">
                            <span className="text-[#000000] text-[16px] font-medium font-['Poppins'] leading-[24px] truncate">
                              {job.title}
                            </span>
                            <span className="text-[#6B7280] text-[14px] font-normal font-['Poppins'] leading-[20px] truncate">
                              {job.company}
                            </span>
                          </div>
                        </div>

                        {/* Middle-left: Applied date */}
                        <div className="w-full md:flex-1 md:min-w-[120px] flex items-center justify-start md:justify-center text-[#6B7280] text-[14px] font-normal font-['Poppins'] leading-[20px]">
                          <span className="md:hidden font-semibold mr-2 text-black">Applied:</span>
                          {job.applied_date_display ||
                            `Applied ${job.posted_at}`}
                        </div>

                        {/* Middle-right: Status */}
                        <div className="w-full md:flex-1 md:min-w-[120px] flex items-center justify-start md:justify-center">
                          <span className="md:hidden font-semibold mr-2 text-black">Status:</span>
                          <span className="text-[#000000] text-[14px] font-normal font-['Poppins'] leading-[20px] text-left md:text-center">
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
                          {job.application_status?.toLowerCase() === "declined" ? (
                            <div className="hidden md:block w-[120px]" />
                          ) : job.application_status?.toLowerCase() === "in-review" ? (
                            <span className="text-[#EF4444] text-[14px] font-normal font-['Poppins'] text-left md:text-center leading-[20px] w-full md:w-[120px]">
                              This job is no
                              <br className="hidden md:inline" /> longer available
                            </span>
                          ) : job.is_available === false ? (
                            <span className="text-[#EF4444] text-[14px] font-normal font-['Poppins'] text-left md:text-center leading-[20px] w-full md:w-[120px]">
                              This job is no
                              <br className="hidden md:inline" /> longer available
                            </span>
                          ) : job.application_status?.toLowerCase() ===
                            "shortlisted" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push("/messaging");
                              }}
                              className="w-full md:w-[120px] h-[40px] bg-[#6366F1] border border-white rounded-[24px] text-white font-['Poppins'] text-[14px] font-normal leading-[20px] flex items-center justify-center hover:bg-[#6366F1]/90 transition-all active:scale-95 shadow-sm"
                            >
                              Chat
                            </button>
                          ) : job.application_status?.toLowerCase() === "withdrawn" ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyClick(job.id);
                              }}
                              className="w-full md:w-[120px] h-[40px] border border-[#6B7280] rounded-[24px] bg-transparent text-[#6B7280] font-['Poppins'] text-[14px] font-normal leading-[20px] flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95"
                            >
                              Apply
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWithdrawClick(job.id);
                              }}
                              className="w-full md:w-[120px] h-[40px] border border-[#6B7280] rounded-[24px] bg-transparent text-[#6B7280] font-['Poppins'] text-[14px] font-normal leading-[20px] flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95"
                            >
                              Withdraw
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )
      ) : activeTab === "Offers" ? (
        <div className="w-full flex flex-col gap-[20px]">
          {/* Header */}
          <div className="flex justify-start items-center">
            <h3 className="text-black text-xl font-bold font-['Poppins'] leading-8">
              Official Job Offers
            </h3>
          </div>

          {/* Offers list */}
          <div className="w-full flex flex-col gap-6">
            {isOffersLoading ? (
              <div className="w-full flex flex-col gap-6">
                {[1, 2, 3].map(n => (
                  <OfferCardSkeleton key={n} />
                ))}
              </div>
            ) : offers.length === 0 ? (
              <div className="h-[706px] flex flex-col justify-center items-center gap-4 w-full animate-in fade-in duration-300">
                <Icon icon="hugeicons:gift" className="size-20 text-black flex-shrink-0" />
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="text-center justify-center text-black text-base font-medium font-['Poppins'] leading-6">
                    No job offers yet
                  </div>
                  <div className="w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">
                    Job offers from recruiters and hiring teams will appear here when they match your profile.
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex flex-col gap-6 w-full">
                  {offers.map((offer) => (
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
      ) : activeTab === "Saved" ? (
        <div className="w-full flex flex-col gap-[20px]">
          {/* Saved Jobs List container */}
          <div className="w-full">
            {jobs.length === 0 ? (
              <div className="h-[706px] flex flex-col justify-center items-center gap-4 w-full animate-in fade-in duration-300">
                <Icon icon="hugeicons:job-search" className="size-20 text-black flex-shrink-0" />
                <div className="flex flex-col justify-start items-center gap-2">
                  <div className="text-center justify-center text-black text-base font-medium font-['Poppins'] leading-6">
                    No saved jobs yet
                  </div>
                  <div className="w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">
                    New saved jobs will appear here when you save them
                  </div>
                </div>
              </div>
            ) : (
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
              />
            )}
          </div>
        </div>
      ) : (
        /* Original All Jobs View for Explore tab */
        <div className="w-full flex flex-col gap-[20px]">
          {jobs.length === 0 ? (
            <div className="h-[706px] flex flex-col justify-center items-center gap-4 w-full animate-in fade-in duration-300">
              <Icon icon="hugeicons:job-search" className="size-20 text-black flex-shrink-0" />
              <div className="flex flex-col justify-start items-center gap-2">
                <div className="text-center justify-center text-black text-base font-medium font-['Poppins'] leading-6">No jobs available yet</div>
                <div className="w-80 text-center justify-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">New jobs will appear here when they become available.</div>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-black text-lg font-semibold font-['Poppins'] leading-6">
                {activeTab === "Explore" ? "All jobs" : `${activeTab} jobs`}
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
                  setFilterValue("location_type", "");
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
                />
              </div>
            </>
          )}
        </div>
      )}

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
