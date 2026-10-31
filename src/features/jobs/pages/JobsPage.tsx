import React, { use, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useJobs } from "../hooks/useJobs";
import { useJobOffers } from "../hooks/useJobOffers";
import { useJobStore } from "../store/job.store";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useFeatureFlags } from "@/context/FeatureFlagContext";
import { FeatureDisabledTooltip } from "@/components/feature-flags";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Job } from "../types/jobs.types";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import MyListingsDashboard from "../components/my-listings/MyListingsDashboard";
import { ApplyJobModal } from "../components/modals/ApplyJobModal";
import ExploreTab from "../components/tabs/ExploreTab";
import JobsErrorState from "../components/states/JobsErrorState";
import SavedJobsTab from "../components/tabs/SavedJobsTab";
import MyApplicationsTab from "../components/tabs/MyApplicationsTab";
import OffersTab from "../components/tabs/OffersTab";

interface JobsPageProps {
  searchParams?: any;
  isCompanyMode?: boolean;
}

export const JobsPage: React.FC<JobsPageProps> = ({ searchParams, isCompanyMode: propIsCompanyMode = false }) => {
  const router = useRouter();
  const { isCompany, activeProfile } = useActiveProfile();
  const { isFeatureActive } = useFeatureFlags();
  const isCompanyMode = propIsCompanyMode || (isCompany && !!activeProfile?.id);

  // Reactive URL search params
  const urlParams = useSearchParams();
  const urlSearch = urlParams?.get('search') || '';
  const urlLocation = urlParams?.get('location') || '';
  const urlTab = urlParams?.get('tab') || 'Explore';

  // Seed from SSR searchParams prop on first load
  let resolvedParams: any = null;
  if (searchParams) {
    if (typeof searchParams.then === "function") {
      resolvedParams = use(searchParams);
    } else {
      resolvedParams = searchParams;
    }
  }

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
    isError: isJobsError,
  } = useJobs("Explore", initialSearch, initialLocation);

  const {
    offers,
    isLoading: isOffersLoading,
    isError: isOffersError,
    handleAccept: handleOfferAccept,
    handleDecline: handleOfferDecline,
  } = useJobOffers();

  const isTabError = activeTab === "Offers" ? isOffersError : isJobsError;

  // Tab synchronization with URL
  useEffect(() => {
    if (urlTab && urlTab !== activeTab) {
      if (urlTab === "Saved" && !isFeatureActive("saved_jobs")) return;
      if (urlTab === "My Applications" && !isFeatureActive("enableApplicationTracking")) return;
      if (urlTab === "Offers" && !isFeatureActive("enableJobOffers")) return;

      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab, setActiveTab, isFeatureActive]);

  // Clear search and location filters from the URL on F5 reload
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

  // Reactively update filters when URL query changes (skip initial render)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setMultipleFilters({ search: urlSearch, location: urlLocation });
  }, [urlSearch, urlLocation, setMultipleFilters]);

  // Scroll restoration across tab switches
  useEffect(() => {
    const handleCaptureClick = () => {
      sessionStorage.setItem(`jobs_scroll_page_${activeTab}`, window.scrollY.toString());
    };
    window.addEventListener("click", handleCaptureClick, true);
    return () => {
      window.removeEventListener("click", handleCaptureClick, true);
    };
  }, [activeTab]);

  useEffect(() => {
    const comingFromDetail = sessionStorage.getItem("coming_from_job_detail") === "true";
    if (comingFromDetail) {
      const savedPageScroll = sessionStorage.getItem(`jobs_scroll_page_${activeTab}`);
      if (savedPageScroll) {
        let retries = 0;
        const scrollTarget = parseInt(savedPageScroll, 10);
        const scrollInterval = setInterval(() => {
          window.scrollTo(0, scrollTarget);
          retries++;
          if (Math.abs(window.scrollY - scrollTarget) < 5 || retries > 20) {
            clearInterval(scrollInterval);
            sessionStorage.removeItem("coming_from_job_detail");
            sessionStorage.removeItem(`jobs_scroll_page_${activeTab}`);
          }
        }, 50);
        return () => clearInterval(scrollInterval);
      }
    } else {
      sessionStorage.removeItem(`jobs_scroll_page_${activeTab}`);
    }
  }, [activeTab]);

  // Hide mobile HomeHeader search bar when the create-job wizard is active
  const urlView = urlParams?.get('view');
  const isFullScreenView = urlView === 'create-job' || urlView === 'view_listing' || urlView === 'view-listing';
  useEffect(() => {
    if (isFullScreenView) {
      document.body.dataset.hideSearch = 'true';
    } else {
      delete document.body.dataset.hideSearch;
    }
    return () => { delete document.body.dataset.hideSearch; };
  }, [isFullScreenView]);

  // Application & Modal states
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [withdrawJobId, setWithdrawJobId] = useState<string | null>(null);
  const [declineJobId, setDeclineJobId] = useState<string | null>(null);

  const selectedStatusFilter = useJobStore((state) => state.filters.selectedStatusFilter);
  const selectedDateFilter = useJobStore((state) => state.filters.selectedDateFilter);
  const setCandidateFilterValue = useJobStore((state) => state.setCandidateFilterValue);

  const setSelectedStatusFilter = (val: string) => setCandidateFilterValue('selectedStatusFilter', val);
  const setSelectedDateFilter = (val: string) => setCandidateFilterValue('selectedDateFilter', val);

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

  const tabs = [
    { id: "Explore", label: "Explore" },
    { id: "My Applications", label: "My applications", featureKey: "enableApplicationTracking" },
    { id: "Offers", label: "Offers", featureKey: "enableJobOffers" },
    { id: "Saved", label: "Save", featureKey: "saved_jobs" },
  ];

  if (activeTab === "My Listings" || isCompanyMode || isFullScreenView) {
    return (
      <div className={`w-full min-h-screen bg-ds-bg flex flex-col items-center ${isFullScreenView ? 'pt-0 pb-0 px-0' : 'pt-14 sm:pt-[60px] pb-16 px-4 sm:px-6 md:px-0'} relative select-text`}>
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
    <div className="w-full min-h-screen bg-ds-bg text-ds-text-primary font-dm-sans px-4 sm:px-6 md:px-8 pt-0 pb-6 sm:pb-8 md:pb-10 md:pr-[253px] select-text">
      {/* 800px Centered Main Jobs Container aligned exactly with Profile and Global Search */}
      <div className="w-full max-w-[800px] mx-auto flex flex-col items-center">
        {/* Sticky Top Navigation Bar matching Figma Frame 2609735 (w: 800px, h: 36px, gap: 20px, NO bottom divider) */}
        <div className="sticky top-[64px] z-30 w-full max-w-[800px] bg-ds-bg/95 backdrop-blur-md h-9 flex items-center justify-between gap-5 mb-5">
          {/* Left Tabs: Explore, My applications, Offers, Save (Frame 2609925 w:392px h:36px gap:12px) */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar h-9">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            // Precise width per tab from Figma CSS: Explore (81px), My applications (144px), Offers (71px), Save (60px)
            const tabWidthClass = 
              tab.id === "Explore" ? "w-[81px]" :
              tab.id === "My Applications" ? "w-[144px]" :
              tab.id === "Offers" ? "w-[71px]" : "w-[60px]";

            const tabButton = (
              <button
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`relative h-9 ${tabWidthClass} flex flex-col justify-center items-center text-sm sm:text-base font-medium font-dm-sans focus:outline-none transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive ? "text-ds-text-primary" : "text-ds-text-secondary hover:text-ds-text-primary"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-ds-accent shadow-[0px_2px_4px_0px_rgba(255,236,230,0.08)]" />
                )}
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

        {/* Right side: 'Posted jobs' pill button (Frame primary button with Icon w:133px h:36px padding:6px 12px gap:4px) */}
        <FeatureDisabledTooltip featureKey="enableMyListings">
          <button
            type="button"
            onClick={() => handleTabChange("My Listings")}
            className="w-[133px] h-9 px-3 py-1.5 bg-ds-surface-1 hover:bg-ds-surface-2 border-0 rounded-full inline-flex items-center justify-center gap-1 text-ds-text-primary font-dm-sans transition-colors shrink-0 cursor-pointer"
          >
            <span className="w-[89px] h-6 text-base font-medium font-dm-sans leading-6 text-ds-text-primary whitespace-nowrap text-center">
              Posted jobs
            </span>
            <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4 text-ds-text-primary shrink-0" />
          </button>
        </FeatureDisabledTooltip>
      </div>

      {/* Tab Content Views or Error State */}
      {isTabError ? (
        <JobsErrorState />
      ) : (
        <>
      {/* Explore Tab View (20px gap from top nav bar) */}
      <div className={`w-full max-w-[800px] ${activeTab === "Explore" ? "" : "hidden"}`}>
        <ExploreTab
          jobs={jobs}
          recommendedJobs={recommendedJobs}

          isLoading={isLoading}
          isRecommendationsLoading={isRecommendationsLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          loadMore={loadMore}
          filters={filters}
          setFilterValue={setFilterValue}
          setMultipleFilters={setMultipleFilters}
          toggleSave={toggleSave}
          onApplyClick={handleApplyClick}
          onWithdrawClick={handleWithdrawClick}
          onOfferAccept={handleOfferAccept}
          onOfferDecline={(id) => setDeclineJobId(id)}
        />
      </div>

      {/* Saved Tab View */}
      <div className={`w-full ${activeTab === "Saved" ? "" : "hidden"}`}>
        <SavedJobsTab
          jobs={jobs}
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          loadMore={loadMore}
          toggleSave={toggleSave}
          onApplyClick={handleApplyClick}
          onWithdrawClick={handleWithdrawClick}
          onOfferAccept={handleOfferAccept}
          onOfferDecline={(id) => setDeclineJobId(id)}
        />
      </div>

      {/* My Applications Tab View */}
      <div className={`w-full ${activeTab === "My Applications" ? "" : "hidden"}`}>
        <MyApplicationsTab
          jobs={jobs}
          applicationStats={applicationStats}
          isLoading={isLoading}
          isFetchingMore={isFetchingMore}
          hasMore={hasMore}
          loadMore={loadMore}
          selectedStatusFilter={selectedStatusFilter}
          setSelectedStatusFilter={setSelectedStatusFilter}
          selectedDateFilter={selectedDateFilter}
          setSelectedDateFilter={setSelectedDateFilter}
          onApplyClick={handleApplyClick}
          onWithdrawClick={handleWithdrawClick}
        />
      </div>

      {/* Offers Tab View */}
      <div className={`w-full ${activeTab === "Offers" ? "" : "hidden"}`}>
        <OffersTab
          offers={offers}
          isLoading={isOffersLoading}
          onAccept={handleOfferAccept}
          onDecline={handleOfferDecline}
        />
      </div>
        </>
      )}

      {/* Apply Job Modal */}
      <ApplyJobModal
        isOpen={applyingJob !== null}
        onClose={() => setApplyingJob(null)}
        onApply={async (resumeUrl, uploadedFile, resumeId, coverLetter) => {
          if (applyingJob) {
            await applyToJob(applyingJob.id, resumeUrl, uploadedFile, resumeId, coverLetter);
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
    </div>
  );
};

export default JobsPage;
