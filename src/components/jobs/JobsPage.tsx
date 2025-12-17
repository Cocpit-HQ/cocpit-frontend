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

import { DarkSidebar } from "@/components/DarkSidebar"
import type { Page, Theme } from "@/types/common"
import type { Job, JobFormData } from "@/types/jobs"

const jobs: Job[] = [
  {
    id: 1,
    title: "Senior Product Designer",
    company: "Google",
    location: "Mountain View, CA",
    type: "Full-time",
    postedTime: "2 days ago",
    applicants: 42,
    salary: "$140k - $180k",
    logo: "gradient-1",
  },
  {
    id: 2,
    title: "UX Researcher",
    company: "Meta",
    location: "Menlo Park, CA",
    type: "Full-time",
    postedTime: "3 days ago",
    applicants: 28,
    salary: "$130k - $170k",
    logo: "gradient-2",
  },
  {
    id: 3,
    title: "Product Designer",
    company: "Apple",
    location: "Cupertino, CA",
    type: "Full-time",
    postedTime: "5 days ago",
    applicants: 67,
    salary: "$135k - $175k",
    logo: "gradient-3",
  },
  {
    id: 4,
    title: "Design System Lead",
    company: "Netflix",
    location: "Los Gatos, CA",
    type: "Full-time",
    postedTime: "1 week ago",
    applicants: 31,
    salary: "$150k - $190k",
    logo: "gradient-4",
  },
  {
    id: 5,
    title: "UI/UX Designer",
    company: "Spotify",
    location: "San Francisco, CA",
    type: "Full-time",
    postedTime: "1 week ago",
    applicants: 45,
    salary: "$120k - $160k",
    logo: "gradient-5",
  },
  {
    id: 6,
    title: "Lead Product Designer",
    company: "Airbnb",
    location: "San Francisco, CA",
    type: "Full-time",
    postedTime: "2 weeks ago",
    applicants: 53,
    salary: "$145k - $185k",
    logo: "gradient-6",
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

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <DarkSidebar navigateTo={navigateTo} currentPage="jobs" />

      <div className="ml-64 min-h-screen">
        <div
          className={`${isDark ? "bg-[#1a1f2e] border-[#2d3548]" : "bg-white border-gray-200"} border-b sticky top-0 z-10`}
        >
          <div className="max-w-7xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>Job Opportunities</h1>
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>Find your next career opportunity</p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Job</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="w-full max-w-none mb-12">
            <div
              className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} border rounded-2xl p-8 shadow-lg`}
            >
              <h2 className={`text-center mb-6 ${isDark ? "text-white" : "text-gray-900"}`}>Search for Jobs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
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
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
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
                <button className="px-16 py-5 text-lg bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-xl hover:opacity-90 transition-all w-full max-w-4xl">
                  Search Jobs
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
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
              <div className="mb-4">
                <p className={isDark ? "text-gray-400" : "text-gray-600"}>{jobs.length} jobs found</p>
              </div>

              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className={`${isDark ? "bg-[#242b3d] border-[#2d3548] hover:border-[#3d4558]" : "bg-white border-gray-200 hover:border-gray-300"} border rounded-xl p-6 transition-all`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${logoGradients[job.logo]} rounded-lg flex-shrink-0`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className={`mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{job.title}</h3>
                            <p className={`mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{job.company}</p>
                          </div>
                          <button
                            className={`p-2 rounded-full transition-colors flex-shrink-0 ${isDark ? "hover:bg-[#171c28]" : "hover:bg-gray-100"}`}
                          >
                            <Bookmark
                              className={`w-5 h-5 ${isDark ? "text-gray-400 hover:text-[#5B7CFF]" : "text-gray-500 hover:text-[#5B7CFF]"}`}
                            />
                          </button>
                        </div>

                        <div className={`flex flex-wrap gap-3 text-sm mb-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
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
                            <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{job.applicants} applicants</span>
                          </div>
                          <button className="px-6 py-2 bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white rounded-lg hover:opacity-90 transition-all">
                            Apply Now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

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

