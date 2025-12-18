"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Bookmark,
  Filter,
  X,
  Check,
  Plus,
  ArrowLeft
} from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"
import type { Job, JobFormData, JobListMode, JobStatus } from "@/types/jobs"

const jobs: Job[] = [
  // Open jobs (for "View Jobs" tab)
  {
    id: 1,
    title: "Senior Financial Analyst",
    company: "JPMorgan Chase",
    location: "New York, NY",
    type: "Full-time",
    postedTime: "2 days ago",
    applicants: 25,
    salary: "$125k - $155k",
    logo: "gradient-1",
  },
  {
    id: 2,
    title: "Business Analyst",
    company: "McKinsey & Company",
    location: "Boston, MA",
    type: "Full-time",
    postedTime: "3 days ago",
    applicants: 18,
    salary: "$110k - $140k",
    logo: "gradient-2",
  },
  {
    id: 3,
    title: "Product Manager",
    company: "Google",
    location: "San Francisco, CA",
    type: "Full-time",
    postedTime: "1 day ago",
    applicants: 40,
    salary: "$120k - $180k",
    logo: "gradient-3",
  },
  {
    id: 4,
    title: "Data Analyst",
    company: "Meta",
    location: "Remote",
    type: "Contract",
    postedTime: "3 days ago",
    applicants: 30,
    salary: "$110k - $130k",
    logo: "gradient-4",
  },
  // Offer cards (for "Offers" tab)
  {
    id: 5,
    title: "Senior Financial Analyst",
    company: "JPMorgan Chase",
    location: "New York, NY",
    type: "Full-time",
    postedTime: "Today",
    applicants: 0,
    salary: "$125k - $155k",
    logo: "gradient-5",
    isOffer: true,
  },
  {
    id: 6,
    title: "Business Analyst",
    company: "McKinsey & Company",
    location: "Boston, MA",
    type: "Full-time",
    postedTime: "1 day ago",
    applicants: 0,
    salary: "$110k - $140k",
    logo: "gradient-6",
    isOffer: true,
  },
  // My jobs (various statuses)
  {
    id: 7,
    title: "Senior Product Analyst",
    company: "Netflix",
    location: "New York, NY",
    type: "Full-time",
    postedTime: "Applied 2 days ago",
    applicants: 12,
    salary: "$130k - $150k",
    logo: "gradient-1",
    status: "applied",
  },
  {
    id: 8,
    title: "Product Designer",
    company: "Adobe",
    location: "Remote",
    type: "Full-time",
    postedTime: "Interview scheduled",
    applicants: 8,
    salary: "$120k - $140k",
    logo: "gradient-2",
    status: "in-progress",
  },
  {
    id: 9,
    title: "UX Researcher",
    company: "Spotify",
    location: "Remote",
    type: "Full-time",
    postedTime: "Closed 1 week ago",
    applicants: 60,
    salary: "$100k - $130k",
    logo: "gradient-3",
    status: "in-past",
  },
  {
    id: 10,
    title: "Product Owner",
    company: "Stripe",
    location: "San Francisco, CA",
    type: "Full-time",
    postedTime: "Saved yesterday",
    applicants: 0,
    salary: "$140k - $170k",
    logo: "gradient-4",
    status: "saved",
  },
]

const logoGradients: Record<string, string> = {
  "gradient-1": "from-blue-500 to-cyan-500",
  "gradient-2": "from-blue-600 to-indigo-600",
  "gradient-3": "from-gray-600 to-gray-800",
  "gradient-4": "from-red-500 to-red-600",
  "gradient-5": "from-green-500 to-emerald-500",
  "gradient-6": "from-pink-500 to-rose-500",
}

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

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"]
const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead/Manager"]

export default function JobsPage() {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = resolvedTheme === "dark"

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

  // --- Tab State ---
  const [mode, setMode] = useState<JobListMode>("view")
  const [myJobsTab, setMyJobsTab] = useState<JobStatus>("in-progress")

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
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="jobs" navigateTo={navigateTo}>
        {/* Header */}
        {/* <div
          className={`${isDark ? "bg-[#1a1f2e] border-[#2d3548]" : "bg-white border-gray-200"} border-b sticky top-0 z-10`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>Job Opportunities</h1>
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>Find your next career opportunity</p>
              </div>

              
            </div>
          </div>
        </div> */}

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">

          {/* Desktop Search Section (Redesigned) */}
          <div className="hidden md:block w-full max-w-4xl mx-auto mb-8">
            <div
              className={`transition-all duration-300 ease-in-out border rounded-2xl shadow-lg overflow-hidden ${
                isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
              }`}
            >
              {!isSearchExpanded ? (
                // Collapsed State
                <div
                  onClick={() => setIsSearchExpanded(true)}
                  className="cursor-pointer p-6 flex items-center gap-4 hover:opacity-95"
                >
                  <Search className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                  <div className={`flex-1 text-lg ${!collapsedSearchText ? "text-gray-400" : "text-gray-400 opacity-70"}`}>
                    {collapsedSearchText || "Search by title, skill, or company..."}
                  </div>
                  <button className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white px-8 py-2 rounded-xl text-sm font-medium">
                    Search
                  </button>
                </div>
              ) : (
                // Expanded State
                <div className="p-6">
                  <div className="flex flex-col gap-4">
                     <div className="flex gap-4 items-start">
                        {/* Keyword Input */}
                        <div className="flex-1">
                          <label className={`block text-xs font-medium mb-1.5 ml-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Keywords
                          </label>
                          <div className={`flex items-center gap-3 px-4 py-3 border rounded-xl ${
                            isDark ? "bg-[#171c28] border-[#2d3548]" : "bg-gray-50 border-gray-300"
                          }`}>
                            <Search className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                            <input
                              autoFocus
                              type="text"
                              value={searchKeywords}
                              onChange={(e) => setSearchKeywords(e.target.value)}
                              placeholder="Job title, keywords, or company"
                              className={`w-full bg-transparent focus:outline-none ${
                                isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Location Input (Multi-select) */}
                        <div className="flex-1">
                          <label className={`block text-xs font-medium mb-1.5 ml-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            Locations
                          </label>
                          <div className={`flex flex-wrap items-center gap-2 px-4 py-2 border rounded-xl min-h-[50px] ${
                             isDark ? "bg-[#171c28] border-[#2d3548]" : "bg-gray-50 border-gray-300"
                          }`}>
                            <MapPin className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />

                            {/* Selected Locations Tags */}
                            {searchLocations.map((loc, idx) => (
                              <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${
                                isDark ? "bg-[#2d3548] text-blue-300" : "bg-blue-50 text-blue-700"
                              }`}>
                                {loc}
                                <button onClick={() => handleRemoveSearchLocation(loc)} className="hover:opacity-70">
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}

                            <input
                              type="text"
                              value={searchLocationInput}
                              onChange={(e) => setSearchLocationInput(e.target.value)}
                              onKeyDown={handleAddSearchLocation}
                              placeholder={searchLocations.length === 0 ? "Type city & hit Enter..." : "Add another..."}
                              className={`flex-1 bg-transparent min-w-[120px] focus:outline-none py-1 ${
                                isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                              }`}
                            />
                          </div>
                        </div>
                     </div>

                     <div className="flex justify-end pt-2">
                       <button
                          onClick={handleSearch}
                          className="w-full md:w-auto px-12 py-3 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-xl font-medium hover:opacity-90 transition-all shadow-md"
                        >
                          Search Jobs
                        </button>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile search pill */}
          <div
            className={`md:hidden mb-6 border rounded-2xl p-4 ${
              isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
            }`}
          >
            <button
              type="button"
              onClick={() => setShowMobileSearch(true)}
              className={`flex w-full items-center gap-3 rounded-full border px-4 py-2 ${
                isDark
                  ? "border-[#2d3548] bg-[#171c28] text-gray-300"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              <Search className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-left flex-1">
                {collapsedSearchText || "Search jobs by title or location"}
              </span>
            </button>
          </div>

          {/* Top-level tabs */}
          <div className="mb-4 md:mb-6 flex gap-2 overflow-x-auto rounded-full bg-transparent">
            {[
              { id: "view" as JobListMode, label: "View Jobs" },
              { id: "my-jobs" as JobListMode, label: "My Jobs" },
              { id: "offers" as JobListMode, label: "Offers", badge: offers.length },
            ].map((tab) => {
              const isActive = mode === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] text-white shadow-md"
                      : isDark
                        ? "bg-[#1f2937] text-gray-300 hover:bg-[#111827]"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-semibold text-white">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* My Jobs sub-tabs */}
          {mode === "my-jobs" && (
            <div className="mb-6 flex gap-2 overflow-x-auto">
              {(
                [
                  { id: "in-progress", label: "In Progress" },
                  { id: "applied", label: "Applied" },
                  { id: "in-past", label: "In Past" },
                  { id: "saved", label: "Saved" },
                ] as const
              ).map((tab) => {
                const isActive = myJobsTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setMyJobsTab(tab.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] text-white"
                        : isDark
                          ? "bg-[#1f2937] text-gray-300 hover:bg-[#111827]"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Desktop sidebar filters */}
            <div className="hidden md:block lg:col-span-1">
              <div
                className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} border rounded-xl p-6 sticky top-32`}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5 text-[#5B7CFF]" />
                  <h3 className={isDark ? "text-white" : "text-gray-900"}>Filters</h3>
                </div>

                <div className="space-y-6">
                  {/* Job Type - Multi Select */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Job Type</label>
                    <div className="space-y-2">
                      {JOB_TYPES.map((type) => {
                         const isSelected = filterJobTypes.includes(type)
                         return (
                           <label key={type} className="flex items-center gap-3 cursor-pointer group">
                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                               isSelected
                                ? "bg-[#5B7CFF] border-[#5B7CFF]"
                                : isDark ? "border-[#2d3548] bg-[#171c28]" : "border-gray-300 bg-white"
                             }`}>
                               {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                             </div>
                             <input
                               type="checkbox"
                               className="hidden"
                               checked={isSelected}
                               onChange={() => toggleJobType(type)}
                             />
                             <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{type}</span>
                           </label>
                         )
                      })}
                    </div>
                  </div>

                  {/* Location - Tag Input */}
                  <div>
                    <label className={`block text-sm font-medium mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Location
                    </label>
                    <div className={`flex flex-wrap gap-2 p-2 border rounded-lg min-h-[42px] ${
                      isDark ? "bg-[#171c28] border-[#2d3548]" : "bg-gray-50 border-gray-300"
                    }`}>
                       {filterLocations.map((loc, idx) => (
                          <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                            isDark ? "bg-[#2d3548] text-blue-300" : "bg-blue-50 text-blue-700"
                          }`}>
                            {loc}
                            <button onClick={() => handleRemoveFilterLocation(loc)} className="hover:opacity-70">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                       ))}
                       <input
                          type="text"
                          value={filterLocationInput}
                          onChange={(e) => setFilterLocationInput(e.target.value)}
                          onKeyDown={handleAddFilterLocation}
                          placeholder={filterLocations.length === 0 ? "Type city..." : "Add..."}
                          className={`flex-1 bg-transparent text-sm focus:outline-none min-w-[60px] ${
                            isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                          }`}
                       />
                    </div>
                    <p className="text-[10px] mt-1 text-gray-500">Press Enter to add location</p>
                  </div>

                  {/* Experience Level (Kept as select for now, but matched style) */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Experience Level
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                        isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    >
                      <option>All Levels</option>
                      {EXPERIENCE_LEVELS.map(level => (
                        <option key={level}>{level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Salary Range</label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                        isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    >
                      <option>Any</option>
                      <option>$80k - $100k</option>
                      <option>$100k - $130k</option>
                      <option>$130k - $160k</option>
                      <option>$160k+</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Date Posted</label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                        isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    >
                      <option>Any Time</option>
                      <option>Past 24 hours</option>
                      <option>Past week</option>
                      <option>Past month</option>
                    </select>
                  </div>

                  <button className="w-full px-4 py-2 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all">
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="mb-4 flex items-center justify-between">
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>{jobs.length} jobs found</p>
                <button
                  type="button"
                  className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm md:hidden ${
                    isDark
                      ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28]"
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setShowMobileFilters(true)}
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </button>
              </div>

              <div className="space-y-4">
                {jobsToRender.map((job) => {
                  const baseCardClasses = `${
                    isDark
                      ? "bg-[#242b3d] border-[#2d3548] hover:border-[#3d4558]"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  } border rounded-xl p-6 transition-all`

                  // Offers layout
                  if (mode === "offers" || job.isOffer) {
                    return (
                      <div key={job.id} className={baseCardClasses}>
                        <div className="mb-3 flex items-center justify-between text-xs">
                          <span className="rounded-full bg-pink-500/15 px-3 py-1 text-[11px] font-medium text-pink-300">
                            Direct Offer
                          </span>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                          <div
                            className={`h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br ${logoGradients[job.logo]}`}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                              {job.title}
                            </h3>
                            <p className={`mb-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                              {job.company}
                            </p>
                            <div className={`mb-3 flex flex-wrap gap-3 text-xs ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {job.type}
                              </span>
                            </div>
                            <p className="mb-4 text-sm text-[#A5B4FC]">{job.salary}</p>
                            <div className="flex flex-col gap-3 md:flex-row">
                              <button className="flex-1 rounded-full bg-gradient-to-r from-[#5B7CFF] to-[#F472B6] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                                Accept Offer
                              </button>
                              <button
                                className={`flex-1 rounded-full border px-4 py-2 text-sm font-semibold ${
                                  isDark
                                    ? "border-red-500/40 text-red-300 hover:bg-red-500/10"
                                    : "border-red-500/60 text-red-600 hover:bg-red-50"
                                }`}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // My Jobs layout
                  if (mode === "my-jobs" && job.status) {
                    const secondary =
                      job.status === "applied"
                        ? "Withdraw"
                        : job.status === "in-progress"
                          ? "View Details"
                          : job.status === "saved"
                            ? "Remove"
                            : "View Details"

                    return (
                      <div key={job.id} className={baseCardClasses}>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div
                            className={`h-12 w-12 flex-shrink-0 rounded-lg bg-gradient-to-br ${logoGradients[job.logo]}`}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                              {job.title}
                            </h3>
                            <p className={`mb-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                              {job.company}
                            </p>
                            <div className={`mb-2 flex items-center gap-2 text-xs ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}>
                              <MapPin className="h-4 w-4" />
                              <span>{job.location}</span>
                            </div>
                            <p className={`mb-4 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                              {job.postedTime}
                            </p>
                            <div className="flex flex-col gap-3 sm:flex-row">
                              <button className="flex-1 rounded-full bg-[#111827] px-4 py-2 text-sm font-medium text-white hover:bg-[#1f2937]">
                                View Details
                              </button>
                              <button
                                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
                                  secondary === "Withdraw"
                                    ? "bg-red-600 text-white hover:bg-red-700"
                                    : isDark
                                      ? "border border-[#2d3548] text-gray-300 hover:bg-[#171c28]"
                                      : "border border-gray-300 text-gray-700 hover:bg-gray-100"
                                }`}
                              >
                                {secondary}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  // Default open job listing layout (View Jobs)
                  return (
                    <div
                      key={job.id}
                      className={baseCardClasses}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div
                          className={`w-16 h-16 bg-gradient-to-br ${logoGradients[job.logo]} rounded-lg flex-shrink-0`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                                {job.title}
                              </h3>
                              <p className={`mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                {job.company}
                              </p>
                            </div>
                            <button
                              className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                                isDark ? "hover:bg-[#171c28]" : "hover:bg-gray-100"
                              }`}
                            >
                              <Bookmark
                                className={`w-5 h-5 ${
                                  isDark
                                    ? "text-gray-400 hover:text-[#5B7CFF]"
                                    : "text-gray-500 hover:text-[#5B7CFF]"
                                }`}
                              />
                            </button>
                          </div>

                          <div
                            className={`flex flex-wrap gap-3 text-sm mb-3 ${
                              isDark ? "text-gray-400" : "text-gray-600"
                            }`}
                          >
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {job.type}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {job.postedTime}
                            </span>
                          </div>

                          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <span className="text-sm text-[#5B7CFF]">{job.salary}</span>
                              <span
                                className={`text-sm ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {job.applicants} applicants
                              </span>
                            </div>
                            <button className="px-6 py-2 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all text-center">
                              Apply Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </AppShell>

      {/* Mobile search widget - UPDATED */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
           {/* Mobile Header with Back Arrow */}
           <div className={`p-4 border-b flex items-center gap-3 ${
              isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
           }`}>
             <button
               onClick={() => setShowMobileSearch(false)}
               className={`p-2 rounded-full ${
                 isDark ? "text-gray-400 hover:bg-[#171c28]" : "text-gray-600 hover:bg-gray-100"
               }`}
             >
               <ArrowLeft className="w-6 h-6" />
             </button>
             <h2 className={`text-lg font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Search Jobs</h2>
           </div>

          <div className={`flex-1 p-4 overflow-y-auto ${isDark ? "bg-[#171c28]" : "bg-gray-50"}`}>
            <div className="space-y-6">

              {/* Keywords Input */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Keywords
                </label>
                <div className={`relative ${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-300"} border rounded-xl`}>
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                  <input
                    type="text"
                    value={searchKeywords}
                    onChange={(e) => setSearchKeywords(e.target.value)}
                    placeholder="Job title, keywords, or company"
                    className={`w-full bg-transparent pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#5B7CFF] rounded-xl ${
                      isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
              </div>

              {/* Locations Input (Multi-select) */}
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Locations
                </label>
                <div className={`flex flex-wrap items-center gap-2 p-3 border rounded-xl min-h-[50px] ${
                  isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-300"
                }`}>
                  <MapPin className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />

                  {/* Selected Locations Tags */}
                  {searchLocations.map((loc, idx) => (
                    <span key={idx} className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${
                      isDark ? "bg-[#171c28] text-blue-300 border border-[#2d3548]" : "bg-blue-50 text-blue-700"
                    }`}>
                      {loc}
                      <button onClick={() => handleRemoveSearchLocation(loc)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  <input
                    type="text"
                    value={searchLocationInput}
                    onChange={(e) => setSearchLocationInput(e.target.value)}
                    onKeyDown={handleAddSearchLocation}
                    placeholder={searchLocations.length === 0 ? "Type city & hit Enter..." : "Add..."}
                    className={`flex-1 bg-transparent min-w-[100px] focus:outline-none py-1 text-sm ${
                      isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                    }`}
                  />
                </div>
                <p className={`text-[10px] mt-1.5 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                  Type a city name and press Enter to add it
                </p>
              </div>

              <button
                type="button"
                onClick={handleSearch}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] px-4 py-3.5 text-base font-medium text-white hover:opacity-90 shadow-md"
              >
                Search Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile filters widget - UPDATED */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:hidden">
          <div
            className={`w-full max-w-md rounded-t-2xl p-4 pb-6 ${
              isDark ? "bg-[#242b3d]" : "bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className={isDark ? "text-white" : "text-gray-900"}>Filters</h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className={`rounded-full p-2 ${
                  isDark
                    ? "text-gray-400 hover:bg-[#171c28]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">

              {/* Job Type Multi-select (Matched Desktop Logic) */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Job Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                   {JOB_TYPES.map((type) => {
                      const isSelected = filterJobTypes.includes(type)
                      return (
                        <label key={type} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                           ? "border-[#5B7CFF] bg-[#5B7CFF]/5"
                           : isDark ? "border-[#2d3548] bg-[#171c28]" : "border-gray-200 bg-gray-50"
                        }`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                            isSelected
                             ? "bg-[#5B7CFF] border-[#5B7CFF]"
                             : isDark ? "border-[#2d3548] bg-[#242b3d]" : "border-gray-300 bg-white"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isSelected}
                            onChange={() => toggleJobType(type)}
                          />
                          <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{type}</span>
                        </label>
                      )
                   })}
                </div>
              </div>

              <div>
                <label
                  className={`mb-2 block text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Experience Level
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                    isDark
                      ? "bg-[#171c28] border-[#2d3548] text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                >
                  <option>All Levels</option>
                  <option>Entry Level</option>
                  <option>Mid Level</option>
                  <option>Senior Level</option>
                  <option>Lead/Manager</option>
                </select>
              </div>

              <div>
                <label
                  className={`mb-2 block text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Salary Range
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                    isDark
                      ? "bg-[#171c28] border-[#2d3548] text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                >
                  <option>Any</option>
                  <option>$80k - $100k</option>
                  <option>$100k - $130k</option>
                  <option>$130k - $160k</option>
                  <option>$160k+</option>
                </select>
              </div>

              <div>
                <label
                  className={`mb-2 block text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Date Posted
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                    isDark
                      ? "bg-[#171c28] border-[#2d3548] text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                >
                  <option>Any Time</option>
                  <option>Past 24 hours</option>
                  <option>Past week</option>
                  <option>Past month</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm ${
                  isDark
                    ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28]"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 rounded-lg bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
