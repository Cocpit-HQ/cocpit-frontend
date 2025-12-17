"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  Bookmark,
  Filter,
  Upload,
  X,
} from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"
import type { Job, JobFormData, JobListMode, JobStatus } from "@/types/jobs"

const jobs: Job[] = [
  // Open jobs (for \"View Jobs\" tab)
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
  // Offer cards (for \"Offers\" tab)
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

function useSystemTheme() {
  const [systemTheme, setSystemTheme] = useState<Theme>("light")

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const updateTheme = (matches: boolean) => {
      setSystemTheme(matches ? "dark" : "light")
    }

    updateTheme(mediaQuery.matches)
    const listener = (event: MediaQueryListEvent) => updateTheme(event.matches)
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  return systemTheme
}

export default function JobsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const systemTheme = useSystemTheme()

  const isDark = useMemo(
    () => theme === "dark" || (theme === "system" && systemTheme === "dark"),
    [systemTheme, theme]
  )

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [mode, setMode] = useState<JobListMode>("view")
  const [myJobsTab, setMyJobsTab] = useState<JobStatus>("in-progress")
  const [formData, setFormData] = useState<JobFormData>({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
    location: "",
    experience: "",
    jobType: "",
    salaryRange: "",
  })

  const handleChange =
    (field: keyof JobFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmitJob = () => {
    console.log("Job submission payload", formData)
    setShowUploadModal(false)
    setFormData({
      jobTitle: "",
      companyName: "",
      jobDescription: "",
      location: "",
      experience: "",
      jobType: "",
      salaryRange: "",
    })
  }

  const openJobs = jobs.filter((job) => !job.isOffer && !job.status)
  const offers = jobs.filter((job) => job.isOffer)
  const myJobs = jobs.filter((job) => job.status)
  const filteredMyJobs = myJobs.filter((job) => job.status === myJobsTab)

  const jobsToRender =
    mode === "offers" ? offers : mode === "my-jobs" ? filteredMyJobs : openJobs

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="jobs" navigateTo={navigateTo}>
        <div
          className={`${isDark ? "bg-[#1a1f2e] border-[#2d3548]" : "bg-white border-gray-200"} border-b sticky top-0 z-10`}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>Job Opportunities</h1>
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>Find your next career opportunity</p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2 text-sm md:text-base"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Job</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
          <div className="w-full max-w-none mb-6 md:mb-8">
            {/* Desktop search block */}
            <div
              className={`hidden md:block border rounded-2xl p-8 shadow-lg ${
                isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
              }`}
            >
              <h2 className={`text-center mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>
                Search for Jobs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Job title or keyword"
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
                <div className="relative">
                  <MapPin
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    className={`w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <button className="w-full max-w-4xl rounded-xl bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] px-16 py-5 text-lg text-white hover:opacity-90 transition-all">
                  Search Jobs
                </button>
              </div>
            </div>

            {/* Mobile search pill */}
            <div
              className={`md:hidden border rounded-2xl p-4 ${
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
                  Search jobs by title or location
                </span>
              </button>
            </div>
          </div>

          {/* Top-level tabs: View Jobs / My Jobs / Offers */}
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

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Job Type</label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                        isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    >
                      <option>All Types</option>
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Experience Level
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                        isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
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
                    <label className={`block text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Salary Range</label>
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
                    <label className={`block text-sm mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Date Posted</label>
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
                        <div className="flex gap-4">
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
                        <div className="flex gap-4">
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
                      <div className="flex gap-4">
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

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-[#5B7CFF]">{job.salary}</span>
                              <span
                                className={`text-sm ${
                                  isDark ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {job.applicants} applicants
                              </span>
                            </div>
                            <button className="px-6 py-2 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all">
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

      {/* Mobile search widget */}
      {showMobileSearch && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm md:hidden">
          <div
            className={`w-full max-w-md rounded-t-2xl p-4 pb-6 ${
              isDark ? "bg-[#242b3d]" : "bg-white"
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className={isDark ? "text-white" : "text-gray-900"}>Search jobs</h2>
              <button
                type="button"
                onClick={() => setShowMobileSearch(false)}
                className={`rounded-full p-2 ${
                  isDark
                    ? "text-gray-400 hover:bg-[#171c28]"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Job title or keyword"
                  className={`w-full rounded-lg border px-10 py-3 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                    isDark
                      ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              <div className="relative">
                <MapPin
                  className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <input
                  type="text"
                  placeholder="Location"
                  className={`w-full rounded-lg border px-10 py-3 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                    isDark
                      ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowMobileSearch(false)}
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
                onClick={() => setShowMobileSearch(false)}
                className="flex-1 rounded-lg bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile filters widget */}
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
              <div>
                <label
                  className={`mb-2 block text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Job Type
                </label>
                <select
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:border-[#5B7CFF] ${
                    isDark
                      ? "bg-[#171c28] border-[#2d3548] text-white"
                      : "bg-gray-50 border-gray-300 text-gray-900"
                  }`}
                >
                  <option>All Types</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Remote</option>
                </select>
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

      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`${isDark ? "bg-[#242b3d]" : "bg-white"} rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div
              className={`sticky top-0 ${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} border-b px-6 py-4 flex items-center justify-between`}
            >
              <h2 className={isDark ? "text-white" : "text-gray-900"}>Upload Job Posting</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-[#171c28] text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Job Title *</label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleChange("jobTitle")}
                    placeholder="e.g. Senior Product Designer"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Company Name *</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={handleChange("companyName")}
                    placeholder="e.g. Google"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Job Description *</label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={handleChange("jobDescription")}
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={6}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors resize-none ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={handleChange("location")}
                    placeholder="e.g. San Francisco, CA or Remote"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Experience Required *</label>
                  <select
                    value={formData.experience}
                    onChange={handleChange("experience")}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Select experience level</option>
                    <option value="Entry Level">Entry Level (0-2 years)</option>
                    <option value="Mid Level">Mid Level (3-5 years)</option>
                    <option value="Senior Level">Senior Level (6-10 years)</option>
                    <option value="Lead/Manager">Lead/Manager (10+ years)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Job Type *</label>
                  <select
                    value={formData.jobType}
                    onChange={handleChange("jobType")}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark ? "bg-[#171c28] border-[#2d3548] text-white" : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                  >
                    <option value="">Select job type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>Salary Range *</label>
                  <input
                    type="text"
                    value={formData.salaryRange}
                    onChange={handleChange("salaryRange")}
                    placeholder="e.g. $120k - $160k"
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-[#5B7CFF] transition-colors ${
                      isDark
                        ? "bg-[#171c28] border-[#2d3548] text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className={`flex-1 px-6 py-3 border rounded-lg transition-colors ${
                    isDark ? "border-[#2d3548] text-gray-300 hover:bg-[#171c28]" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitJob}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all"
                >
                  Post Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

