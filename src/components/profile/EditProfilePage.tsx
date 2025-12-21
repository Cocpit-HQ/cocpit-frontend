"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { ArrowLeft, Save } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface EditProfilePageProps {
  isDark?: boolean
}

export default function EditProfilePage({ isDark: externalIsDark }: EditProfilePageProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const systemTheme = useSystemTheme()

  const internalIsDark = useMemo(
    () => theme === "dark" || (theme === "system" && systemTheme === "dark"),
    [systemTheme, theme]
  )

  const isDark = externalIsDark ?? internalIsDark

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  // Form State
  const [formData, setFormData] = useState({
    name: "Sally Liang",
    headline: "Senior Financial Analyst at Johnson & Johnson",
    jobTitle: "Senior Financial Analyst",
    company: "Johnson & Johnson",
    school: "Stanford University",
    degree: "MBA in Business Administration",
    location: "Berkeley, California, United States",
    about: "Passionate product manager with 7+ years of experience building user-centric solutions that drive business growth. Proven track record in agile development, user research, and cross-functional team leadership.",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSave = () => {
    // Logic to save profile data would go here
    console.log("Saving profile data:", formData)
    router.push("/profile")
  }

  const inputStyles = isDark
    ? bg-background border-[#2d3548] text-white placeholder-gray-500"
    : "bg-[#0b1020]/5 border-gray-300 text-gray-900 placeholder-gray-500"
  const labelStyles = `text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`

  return (
    <div className={`min-h-screen ${isDark ? bg-background" : "bg-[#F3F2EF]"}`}>
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className={`p-2 rounded-full hover:bg-opacity-10 hover:bg-gray-500 transition-all ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Edit Profile</h1>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className={isDark ? "border-[#2d3548] text-gray-300 hover:bg-background bg-transparent" : "border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90 transition-all gap-2 border-0">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Form Container */}
          <div className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} rounded-xl border p-6 md:p-8 shadow-sm`}>
            <div className="grid gap-6">
              
              <div className="grid gap-2">
                <Label htmlFor="name" className={labelStyles}>Full Name</Label>
                <Input id="name" value={formData.name} onChange={handleChange} className={inputStyles} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="headline" className={labelStyles}>Headline</Label>
                <Input id="headline" value={formData.headline} onChange={handleChange} className={inputStyles} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="jobTitle" className={labelStyles}>Job Title</Label>
                  <Input id="jobTitle" value={formData.jobTitle} onChange={handleChange} className={inputStyles} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company" className={labelStyles}>Company Name</Label>
                  <Input id="company" value={formData.company} onChange={handleChange} className={inputStyles} />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="school" className={labelStyles}>Education (School)</Label>
                  <Input id="school" value={formData.school} onChange={handleChange} className={inputStyles} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="degree" className={labelStyles}>Degree</Label>
                  <Input id="degree" value={formData.degree} onChange={handleChange} className={inputStyles} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location" className={labelStyles}>Location</Label>
                <Input id="location" value={formData.location} onChange={handleChange} className={inputStyles} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="about" className={labelStyles}>About</Label>
                <Textarea 
                  id="about" 
                  value={formData.about} 
                  onChange={handleChange} 
                  className={`${inputStyles} min-h-[150px]`} 
                />
              </div>

            </div>
          </div>

        </div>
      </AppShell>
    </div>
  )
}