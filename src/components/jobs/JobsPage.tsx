"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter } from "lucide-react"

import { jobs } from "@/lib/data/jobs"
import { AppShell } from "@/components/layout/AppShell"
import { JobCard } from "@/components/jobs/JobCard"
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar"
import { JobSearchBar } from "@/components/jobs/JobSearchBar"
import { MobileJobSearch } from "@/components/jobs/MobileJobSearch"
import { MobileJobFilters } from "@/components/jobs/MobileJobFilters"
import { JobTabs } from "@/components/jobs/JobTabs"
import type { Page } from "@/types/common"
import type { JobListMode, JobStatus } from "@/types/jobs"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
  achievements: "/achievements",
}

export default function JobsPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const router = useRouter()
  // Removed useTheme logic - relying on CSS variables
  const [mounted, setMounted] = useState(false)

  // --- Tab State ---
  const [mode, setMode] = useState<JobListMode>("view")
  const [myJobsTab, setMyJobsTab] = useState<JobStatus>("in-progress")

  useEffect(() => {
    setMounted(true)
    const tab = searchParams?.tab
    const subtab = searchParams?.subtab

    if (tab === 'my-jobs') {
      setMode('my-jobs')
      if (subtab && ['in-progress', 'applied', 'in-past', 'saved'].includes(subtab as string)) {
        setMyJobsTab(subtab as JobStatus)
      }
    }
  }, [searchParams])

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  // --- Search State ---
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [searchKeywords, setSearchKeywords] = useState("")
  // Desktop Search Location State
  const [searchLocations, setSearchLocations] = useState<string[]>([])
  const [searchLocationInput, setSearchLocationInput] = useState("")

  // --- Sidebar Filter State ---
  const [filterJobTypes, setFilterJobTypes] = useState<string[]>([])
  const [filterLocations, setFilterLocations] = useState<string[]>([])
  const [filterLocationInput, setFilterLocationInput] = useState("")

  // --- Mobile UI State ---
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // --- Handlers ---

  // Desktop Search - Add Location Tag
  const handleAddSearchLocation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchLocationInput.trim()) {
      e.preventDefault()
      if (!searchLocations.includes(searchLocationInput.trim())) {
        setSearchLocations([...searchLocations, searchLocationInput.trim()])
      }
      setSearchLocationInput("")
    }
  }

  const handleRemoveSearchLocation = (loc: string) => {
    setSearchLocations(searchLocations.filter((l) => l !== loc))
  }

  const handleSearch = () => {
    setIsSearchExpanded(false)
    setShowMobileSearch(false)
    // Here you would trigger the actual search/filter logic
  }

  // Sidebar Filters - Job Type
  const toggleJobType = (type: string) => {
    setFilterJobTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  // Sidebar Filters - Location Tag
  const handleAddFilterLocation = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filterLocationInput.trim()) {
      e.preventDefault()
      if (!filterLocations.includes(filterLocationInput.trim())) {
        setFilterLocations([...filterLocations, filterLocationInput.trim()])
      }
      setFilterLocationInput("")
    }
  }

  const handleRemoveFilterLocation = (loc: string) => {
    setFilterLocations(filterLocations.filter((l) => l !== loc))
  }

  // Computed display string for collapsed search bar
  const collapsedSearchText = useMemo(() => {
    const parts = []
    if (searchKeywords) parts.push(searchKeywords)
    if (searchLocations.length > 0) parts.push(searchLocations.join(", "))
    return parts.join(" • ")
  }, [searchKeywords, searchLocations])

  // Filter the jobs based on mode/tabs (Simplified filtering for UI demo)
  const openJobs = jobs.filter((job) => !job.isOffer && !job.status)
  const offers = jobs.filter((job) => job.isOffer)
  const myJobs = jobs.filter((job) => job.status)
  const filteredMyJobs = myJobs.filter((job) => job.status === myJobsTab)

  const jobsToRender =
    mode === "offers" ? offers : mode === "my-jobs" ? filteredMyJobs : openJobs

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="jobs" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
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
            collapsedSearchText={collapsedSearchText}
          />

          {/* Mobile search pill */}
          <div
            className="md:hidden mb-6 border rounded-2xl p-4 bg-card border-border"
          >
            <button
              type="button"
              onClick={() => setShowMobileSearch(true)}
              className="flex w-full items-center gap-3 rounded-full border px-4 py-2 border-border bg-muted text-muted-foreground"
            >
              <Search className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-left flex-1">
                {collapsedSearchText || "Search jobs by title or location"}
              </span>
            </button>
          </div>

          <JobTabs
            mode={mode}
            setMode={setMode}
            myJobsTab={myJobsTab}
            setMyJobsTab={setMyJobsTab}
            offersCount={offers.length}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <JobFiltersSidebar
              filterJobTypes={filterJobTypes}
              toggleJobType={toggleJobType}
              filterLocations={filterLocations}
              filterLocationInput={filterLocationInput}
              setFilterLocationInput={setFilterLocationInput}
              handleAddFilterLocation={handleAddFilterLocation}
              handleRemoveFilterLocation={handleRemoveFilterLocation}
            />

            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-muted-foreground">{jobs.length} jobs found</p>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border px-3 py-2 text-sm md:hidden border-border text-muted-foreground hover:bg-muted"
                  onClick={() => setShowMobileFilters(true)}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>

              <div className="space-y-4">
                {jobsToRender.map((job) => (
                  <JobCard key={job.id} job={job} mode={mode} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppShell>

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
        filterJobTypes={filterJobTypes}
        toggleJobType={toggleJobType}
      />
    </div>
  )
}
