"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Filter, Plus, Search, Loader2 } from "lucide-react"
import { useInView } from "react-intersection-observer"

import { JobCard } from "@/components/jobs/JobCard"
import { GroupedOfferCard } from "@/components/jobs/company/GroupedOfferCard"
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar"
import { JobSearchBar } from "@/components/jobs/JobSearchBar"
import { MobileJobSearch } from "@/components/jobs/MobileJobSearch"
import { MobileJobFilters } from "@/components/jobs/MobileJobFilters"
import { CompanyJobTabs } from "@/components/jobs/company/CompanyJobTabs"
import { CreateJobModal } from "@/components/jobs/CreateJobModal"
import { JobPostsDashboard } from "@/components/jobs/dashboard/JobPostsDashboard"
import { useRecruiterJobs } from "@/features/jobs/hooks/useRecruiterJobs"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import { useCompanyPermissions } from "@/hooks/use-organization"
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

export default function CompanyJobsPage({ companyId, searchParams }: { companyId: string, searchParams: { [key: string]: string | string[] | undefined } }) {
    const router = useRouter()
    const searchParamsHook = useSearchParams()
    const [mounted, setMounted] = useState(false)

    const {
        activeTab,
        setActiveTab,
        searchKeywords,
        setSearchKeywords,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        jobs,
        myJobs
    } = useRecruiterJobs(companyId)

    const { activeProfile } = useActiveProfile()
    const { canPostJobs } = useCompanyPermissions(activeProfile)

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

        // In Company Mode, 'my-jobs' is the default if 'dashboard' or 'offers' isn't explicitly set
        if (tab === 'dashboard') {
            setActiveTab('dashboard')
        } else if (tab === 'offers' || tab === 'offered') {
            setActiveTab('offers')
        } else {
            setActiveTab('my-jobs')
        }
    }, [searchParamsHook, setActiveTab])

    // --- Search State ---
    const [isSearchExpanded, setIsSearchExpanded] = useState(false)
    const [searchLocations, setSearchLocations] = useState<string[]>([])
    const [searchLocationInput, setSearchLocationInput] = useState("")

    // --- Mobile UI State ---
    const [showMobileSearch, setShowMobileSearch] = useState(false)
    const [showMobileFilters, setShowMobileFilters] = useState(false)
    const [showCreateJob, setShowCreateJob] = useState(false)

    // Scroll behavior for mobile header
    const [isHeaderVisible, setIsHeaderVisible] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = (e: Event) => {
            const target = e.target as HTMLElement | Document;
            let currentScrollY = window.scrollY;

            if (target instanceof HTMLElement) {
                if (target.scrollHeight < window.innerHeight) return;
                currentScrollY = target.scrollTop;
            }

            if (currentScrollY <= 60) {
                setIsHeaderVisible(true);
                lastScrollY.current = currentScrollY;
                return;
            }

            if (Math.abs(lastScrollY.current - currentScrollY) <= 5) return;

            if (currentScrollY > lastScrollY.current) {
                setIsHeaderVisible(false);
            } else {
                setIsHeaderVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
        return () => window.removeEventListener('scroll', handleScroll, { capture: true });
    }, []);

    // Handlers
    const handleAddSearchLocation = () => { }
    const handleRemoveSearchLocation = () => { }
    const handleSearch = () => {
        setIsSearchExpanded(false)
        setShowMobileSearch(false)
    }

    // Filter jobs for Company Mode specifically
    // The backend already returns jobs for the company based on queryKey injected in `useInfiniteJobs` hook.
    // We just need to separate offers and non-offers if activeTab is "offers"
    // For company mode, `jobs` is the list of company jobs (unless activeTab is dashboard).
    const myCompanyJobs = (activeTab === "my-jobs" ? myJobs : jobs) || [];
    const openCompanyJobs = myCompanyJobs.filter(j => !j.is_offer);
    const offeredCompanyJobs = myCompanyJobs.filter(j => j.is_offer);

    const jobsToRender =
        activeTab === "offers" ? offeredCompanyJobs :
            activeTab === "my-jobs" ? openCompanyJobs : [];

    if (!mounted) {
        return null
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
                <div className={`sticky top-0 z-30 bg-background pt-6 pb-4 -mt-6 md:-mt-8 shadow-sm md:shadow-none -mx-4 md:-mx-8 px-4 md:px-8 transition-transform duration-300 ease-in-out ${!isHeaderVisible ? '-translate-y-full' : 'translate-y-0'
                    } md:translate-y-0`}>
                    <div className="mb-2 md:mb-4">
                        <h1 className="text-3xl font-bold text-foreground">Company Jobs</h1>
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
                            collapsedSearchText={searchKeywords || "Search company jobs"}
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
                                    {searchKeywords || "Search company jobs..."}
                                </span>
                            </button>

                            {canPostJobs && (
                                <button
                                    onClick={() => setShowCreateJob(true)}
                                    className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-sm"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <CompanyJobTabs
                                    mode={activeTab as any}
                                    setMode={(m) => {
                                        setActiveTab(m)
                                        const params = new URLSearchParams(searchParamsHook.toString())

                                        if (m === 'my-jobs') {
                                            params.delete('tab') // my-jobs defaults to no tab
                                        } else {
                                            params.set('tab', m)
                                        }

                                        params.delete('subtab') // Never have subtabs in company mode

                                        router.push(`/jobs?${params.toString()}`)
                                    }}
                                />
                            </div>

                            {/* Desktop Post Job Button */}
                            {canPostJobs && (
                                <div className="hidden md:block">
                                    <button
                                        onClick={() => setShowCreateJob(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Post a Job
                                    </button>
                                </div>
                            )}
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
                                                             activeTab === "offers" ? (
                                                                 <GroupedOfferCard key={job.id} job={job as any} />
                                                             ) : (
                                                                 <JobCard key={job.id} job={job as any} mode={"dashboard"} />
                                                             )
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
