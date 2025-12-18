"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { MapPin, Briefcase, Calendar, Mail, Phone, Edit2, Plus, CheckCircle, GraduationCap, Settings } from "lucide-react"

import SuggestionsPanel from "@/components/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"

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
    const updateTheme = (matches: boolean) => setSystemTheme(matches ? "dark" : "light")
    updateTheme(mediaQuery.matches)
    const listener = (event: MediaQueryListEvent) => updateTheme(event.matches)
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }, [])

  return systemTheme
}

function ExperienceItem({
  isDark,
  title,
  company,
  duration,
  location,
  description,
}: {
  isDark: boolean
  title: string
  company: string
  duration: string
  location: string
  description: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-12 h-12 bg-[#7B5CFF] rounded-lg flex items-center justify-center">
        <Briefcase className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h3>
        <p className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{company}</p>
        <div className={`flex items-center gap-2 text-xs mb-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
          <span>{duration}</span>
          <span>•</span>
          <span>{location}</span>
        </div>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{description}</p>
      </div>
    </div>
  )
}

function SkillTag({ skill }: { skill: string }) {
  return (
    <span className="bg-[#5B7CFF]/20 text-[#5B7CFF] px-3 py-1.5 rounded-lg text-sm hover:bg-[#5B7CFF]/30 transition-all">
      {skill}
    </span>
  )
}

export default function ProfilePage() {
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

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#171c28]" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8">
              <div
                className={`${
                  isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
                } rounded-xl overflow-hidden border mb-6 relative`}
              >
                <div className="h-36 bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899] relative">
                  <button
                    onClick={() => router.push("/settings")}
                    className="absolute top-3 right-3 bg-transparent text-white p-2 rounded-full hover:bg-white/10 transition-all flex items-center gap-2 md:hidden"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button className="hidden md:flex absolute top-3 right-3 bg-[#5B7CFF] text-white px-4 py-2 rounded-lg hover:bg-[#4A6BEF] transition-all items-center gap-2 text-sm">
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>

                <div className="px-6 pb-6">
                  <div className="flex items-start justify-between -mt-14 mb-4">
                    <div
                      className={`w-32 h-32 rounded-full border-4 ${
                        isDark ? "border-[#242b3d]" : "border-white"
                      } bg-white overflow-hidden flex-shrink-0 relative`}
                    >
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button className="md:hidden mt-16 bg-[#5B7CFF] text-white px-4 py-2 rounded-lg hover:bg-[#4A6BEF] transition-all flex items-center gap-2 text-sm">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className={`text-2xl ${isDark ? "text-white" : "text-gray-900"}`}>Sally Liang</h1>
                      <CheckCircle className="w-5 h-5 text-[#5B7CFF] fill-[#5B7CFF]" />
                      <span className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>· 2nd</span>
                    </div>

                    <p className={`text-base mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Senior Financial Analyst at Johnson & Johnson
                    </p>

                    <div className={`flex items-center gap-2 text-xs mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      <span>Berkeley, California, United States</span>
                      <span>·</span>
                      <a href="#" className="text-[#5B7CFF] hover:underline">
                        Contact info
                      </a>
                    </div>

                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mb-4`}>500+ connections</p>
                  </div>
                </div>
              </div>

              <div
                className={`${
                  isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
                } rounded-xl border p-4 mb-6`}
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className={`text-xl mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>500+</p>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Connections</p>
                  </div>
                  <div className={`text-center border-l border-r ${isDark ? "border-[#2d3548]" : "border-gray-200"}`}>
                    <p className={`text-xl mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>1,234</p>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Profile Views</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-xl mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>87</p>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>Posts</p>
                  </div>
                </div>
              </div>

              <div
                className={`${
                  isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
                } rounded-xl border p-6 mb-6`}
              >
                <h2 className={`text-xl ${isDark ? "text-white" : "text-gray-900"} mb-4`}>About</h2>
                <p className={`text-sm leading-relaxed ${isDark ? "text-gray-400" : "text-gray-700"}`}>
                  Passionate product manager with 7+ years of experience building user-centric solutions that drive business growth.
                  Proven track record in agile development, user research, and cross-functional team leadership. Successfully launched 15+
                  features that improved user engagement by 40% and increased revenue by $2M annually.
                </p>
              </div>

              <div
                className={`${
                  isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
                } rounded-xl border p-6 mb-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl ${isDark ? "text-white" : "text-gray-900"}`}>Experience</h2>
                  <button className="text-[#5B7CFF] hover:underline text-sm">Add</button>
                </div>

                <div className="space-y-6">
                  <ExperienceItem
                    isDark={isDark}
                    title="Senior Product Manager"
                    company="TechCorp Inc."
                    duration="2021 - Present"
                    location="San Francisco, CA"
                    description="Leading product strategy and roadmap for core platform features. Managing cross-functional teams and driving product vision."
                  />
                  <ExperienceItem
                    isDark={isDark}
                    title="Product Manager"
                    company="StartupXYZ"
                    duration="2018 - 2021"
                    location="San Francisco, CA"
                    description="Launched 10+ features from concept to market. Collaborated with engineering and design teams to deliver user-centric solutions."
                  />
                </div>
              </div>

              <div
                className={`${
                  isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
                } rounded-xl border p-6 mb-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl ${isDark ? "text-white" : "text-gray-900"}`}>Skills</h2>
                  <button className="text-[#5B7CFF] hover:underline text-sm">Add</button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    "Product Strategy",
                    "User Research",
                    "Data Analysis",
                    "Agile Development",
                    "A/B Testing",
                    "Product Roadmapping",
                    "Stakeholder Management",
                    "UX Design",
                    "SQL",
                    "Python",
                    "Figma",
                    "Jira",
                  ].map((skill) => (
                    <SkillTag key={skill} skill={skill} />
                  ))}
                </div>
              </div>

              <div className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} rounded-xl border p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl ${isDark ? "text-white" : "text-gray-900"}`}>Education</h2>
                  <button className="text-[#5B7CFF] hover:underline text-sm">Add</button>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#5B7CFF] rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-1`}>
                      MBA in Business Administration
                    </h3>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mb-1`}>Stanford University</p>
                    <div className={`flex items-center gap-2 text-xs mb-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      <span>2016 - 2018</span>
                      <span>•</span>
                      <span>Stanford, CA</span>
                    </div>
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Focus on Product Management and Entrepreneurship
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-8 space-y-6">
                <SuggestionsPanel />
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </div>
  )
}

