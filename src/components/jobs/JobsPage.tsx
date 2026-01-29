"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Plus, Search } from "lucide-react"

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
    filters
  } = useJobs()

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

  // Dummy handlers for legacy prop compatibility (since we use context now)
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
  const myFilteredJobs = myJobs.filter((job) => {
    if (myJobsTab === 'saved') {
      return job.isSaved;
    }
    return job.status === myJobsTab;
  })

  const jobsToRender =
    activeTab === "offers" ? offers : activeTab === "my-jobs" ? myFilteredJobs : openJobs

  if (!mounted) {
    return null
  }



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
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

          {activeTab === "dashboard" ? (
            <JobPostsDashboard />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <JobFiltersSidebar />

              <div className="lg:col-span-3">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-muted-foreground">{jobsToRender.length} jobs found</p>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm lg:hidden border-border text-muted-foreground hover:bg-muted"
                    onClick={() => setShowMobileFilters(true)}
                  >
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {jobsToRender.length > 0 ? (
                    jobsToRender.map((job) => (
                      <JobCard key={job.id} job={job} mode={activeTab} />
                    ))
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
    </div>
  )
}
