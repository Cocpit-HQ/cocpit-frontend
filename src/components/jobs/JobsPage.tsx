"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Plus, Search, Loader2 } from "lucide-react"
import { useInView } from "react-intersection-observer"

import { AppShell } from "@/components/layout/AppShell"
import { JobCard } from "@/components/jobs/JobCard"
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar"
import { JobSearchBar } from "@/components/jobs/JobSearchBar"
import { MobileJobSearch } from "@/components/jobs/MobileJobSearch"
import { MobileJobFilters } from "@/components/jobs/MobileJobFilters"
import { JobTabs } from "@/components/jobs/JobTabs"
import { CreateJobModal } from "@/components/jobs/CreateJobModal"
import { JobPostsDashboard } from "@/components/jobs/dashboard/JobPostsDashboard"
import { useJobs } from "@/context/JobsContext"
import type { Page } from "@/types/common"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

export default function JobsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const router = useRouter()
  const searchParamsHook = useSearchParams()
  const [mounted, setMounted] = useState(false)

  const {
    filteredJobs,
    myJobs,
    activeTab,
    setActiveTab,
    myJobsTab,
    setMyJobsTab,
    searchKeywords,
    setSearchKeywords,
    filters,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useJobs()

  const { ref, inView } = useInView()

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  // Sync URL params with Context State
  useEffect(() => {
    setMounted(true)
    const tab = searchParamsHook.get('tab')
    const subtab = searchParamsHook.get('subtab')

    if (tab === 'my-jobs') {
      setActiveTab('my-jobs')
      if (subtab && ['in-progress', 'applied', 'in-past', 'saved'].includes(subtab as string)) {
        setMyJobsTab(subtab as any)
      }
    } else if (tab === 'offers') {
      setActiveTab('offers')
    } else if (tab === 'dashboard') {
      setActiveTab('dashboard')
    } else {
      setActiveTab('view')
    }
  }, [searchParamsHook, setActiveTab, setMyJobsTab])

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  // --- Search State ---
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchLocations, setSearchLocations] = useState<string[]>([])
  const [searchLocationInput, setSearchLocationInput] = useState("")

  // --- Mobile UI State ---
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showCreateJob, setShowCreateJob] = useState(false)

  // Handlers
  const handleAddSearchLocation = () => { }
  const handleRemoveSearchLocation = () => { }
  const handleSearch = () => {
    setIsSearchExpanded(false)
    setShowMobileSearch(false)
  }

  // Determine which jobs to render based on tabs
  // Correction: We WANT to show applied jobs in the main feed, so remove !job.status check
  const openJobs = filteredJobs.filter((job) => !job.isOffer)
  const offers = filteredJobs.filter((job) => job.isOffer)
  // We rely on the backend API to return the correct filtered list for the active tab.
  // Additional client-side filtering needed to split active/past based on task submission.
  const myFilteredJobs = myJobs.filter((job) => {
    if (activeTab !== "my-jobs") return true;

    // Logic for "applied" tab: Exclude if task submitted
    if (myJobsTab === "applied") {
      // If rejected, it shouldn't be here (backend usually handles, but double check)
      if (job.status === "rejected") return false;
      // If task IS submitted, it goes to Past
      if (job.applicationScreening?.required && job.applicationScreening.submittedAt) return false;
      return true;
    }

    // Logic for "in-past" tab: Include if rejected OR task submitted
    if (myJobsTab === "in-past") {
      if (job.status === "rejected") return true;
      if (job.applicationScreening?.required && job.applicationScreening.submittedAt) return true;
      // If Approved/Interview/Offer they might be 'in-progress'. 
      // User asked: "wait for status of approved or rejected" in "in past". 
      // Typically 'Approved' is 'In Progress', but user instruction was specific.
      // Assuming 'Approved' also goes to 'In Past' based on "wait for status of approved" phrase.
      if (job.status === "approved" || job.status === "interview" || job.status === "offer") return true;

      return false;
    }

    // Logic for "saved" - handled by backend mostly or separate list, but if in main list:
    if (myJobsTab === "saved") {
      return job.isSaved;
    }

    return true;
  });

  const jobsToRender =
    activeTab === "offers" ? offers : activeTab === "my-jobs" ? myFilteredJobs : openJobs

  if (!mounted) {
    return null
  }



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
        <div className="sticky top-0 z-30 bg-background pt-6 pb-4 -mt-6 md:-mt-8 shadow-sm md:shadow-none -mx-4 md:-mx-8 px-4 md:px-8">
          <div className="mb-2 md:mb-4">
            <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          </div>
          <div className="flex flex-col gap-4">
            <JobSearchBar
              isSearchExpanded={isSearchExpanded}
              setIsSearchExpanded={setIsSearchExpanded}
              searchKeywords={searchKeywords}
              setSearchKeywords={setSearchKeywords}
              searchLocations={searchLocations}
              searchLocationInput={searchLocationInput}
              setSearchLocationInput={setSearchLocationInput}
              handleAddSearchLocation={handleAddSearchLocation}
              handleRemoveSearchLocation={handleRemoveSearchLocation}
              handleSearch={handleSearch}
              collapsedSearchText={searchKeywords || "Search jobs"}
            />

            {/* Mobile search pill & Post Job Button */}
            <div className="md:hidden flex gap-3 mb-2">
              <button
                type="button"
                onClick={() => setShowMobileSearch(true)}
                className="flex-1 flex items-center gap-3 rounded-full border px-4 py-2 border-border bg-muted text-muted-foreground"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-left flex-1 truncate">
                  {searchKeywords || "Search jobs..."}
                </span>
              </button>

              <button
                onClick={() => setShowCreateJob(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-sm"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <JobTabs
                  mode={activeTab}
                  setMode={(m) => {
                    setActiveTab(m)
                    const params = new URLSearchParams(searchParamsHook.toString())

                    if (m === 'view') {
                      params.delete('tab')
                      params.delete('subtab')
                    } else {
                      params.set('tab', m)
                      // If switching to my-jobs, keep existing subtab or default?
                      // Ideally we keep current context's subtab if we have one
                      if (m === 'my-jobs' && myJobsTab) {
                        params.set('subtab', myJobsTab)
                      } else {
                        params.delete('subtab')
                      }
                    }

                    router.push(`/jobs?${params.toString()}`)
                  }}
                  myJobsTab={myJobsTab}
                  setMyJobsTab={(t) => {
                    setMyJobsTab(t)
                    const params = new URLSearchParams(searchParamsHook.toString())
                    params.set('tab', 'my-jobs')
                    params.set('subtab', t)
                    router.push(`/jobs?${params.toString()}`)
                  }}
                  offersCount={offers.length}
                />
              </div>

              {/* Desktop Post Job Button */}
              <div className="hidden md:block">
                <button
                  onClick={() => setShowCreateJob(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Post a Job
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {activeTab === "dashboard" ? (
            <JobPostsDashboard />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <JobFiltersSidebar />

              <div className="lg:col-span-3">
                {/* Mobile Header: Count + Filter Toggle */}
                <div className="mb-4 flex items-center justify-between lg:hidden">
                  <p className="text-muted-foreground">{jobsToRender.length} jobs found</p>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm border-border text-muted-foreground hover:bg-muted"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                </div>

                {/* Desktop Container: Fixed height, internal scroll */}
                <div className="lg:h-[calc(100vh-14rem)] lg:sticky lg:top-52">
                  <div className="relative h-full lg:bg-card lg:border lg:border-border lg:rounded-xl flex flex-col lg:overflow-hidden">

                    {/* Scrollable Content Area */}
                    <div className="flex-1 lg:overflow-y-auto lg:[&::-webkit-scrollbar]:hidden lg:p-6">
                      <div className="space-y-4">
                        {/* Header Content - Now Scrollable */}
                        <div className="hidden lg:block">
                          <p className="text-muted-foreground font-medium">{jobsToRender.length} jobs found</p>
                        </div>

                        {jobsToRender.length > 0 ? (
                          <>
                            {jobsToRender.map((job) => (
                              <JobCard key={job.id} job={job} mode={activeTab} />
                            ))}

                            {/* Infinite Scroll Trigger */}
                            {(hasNextPage || isFetchingNextPage) && (
                              <div ref={ref} className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </>
                        ) : isLoading ? (
                          // Initial Loading Skeleton
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border border-dashed">
                            <p>No jobs found matching your criteria.</p>
                            <button
                              onClick={() => {
                                setSearchKeywords("")
                                // clear filters via context if exposed or manual
                              }}
                              className="mt-2 text-primary hover:underline"
                            >
                              Clear filters
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Fade */}
                    <div className="hidden lg:block absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none z-10" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      <MobileJobSearch
        showMobileSearch={showMobileSearch}
        setShowMobileSearch={setShowMobileSearch}
        searchKeywords={searchKeywords}
        setSearchKeywords={setSearchKeywords}
        searchLocations={searchLocations}
        searchLocationInput={searchLocationInput}
        setSearchLocationInput={setSearchLocationInput}
        handleAddSearchLocation={handleAddSearchLocation}
        handleRemoveSearchLocation={handleRemoveSearchLocation}
        handleSearch={handleSearch}
      />

      <MobileJobFilters
        showMobileFilters={showMobileFilters}
        setShowMobileFilters={setShowMobileFilters}
      />

      <CreateJobModal
        open={showCreateJob}
        onOpenChange={setShowCreateJob}
      />
    </div >
  )
}
