"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface EditProfilePageProps {}

export default function EditProfilePage({}: EditProfilePageProps) {
  const router = useRouter()

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

  const inputStyles = "bg-input border-border text-foreground placeholder-muted-foreground"
  const labelStyles = "text-sm font-medium text-foreground"

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-muted/50 transition-all text-foreground"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="border-border text-muted-foreground hover:bg-muted bg-transparent"
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
          <div className="bg-card border-border rounded-xl border p-6 md:p-8 shadow-sm">
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
