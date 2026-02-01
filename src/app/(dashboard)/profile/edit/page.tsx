"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Page } from "@/types/common"
import { getProfile, updateProfile } from "@/services/api/profile"
import type { UpdateProfilePayload } from "@/types/user"
import { useToast } from "@/hooks/use-toast"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

export default function EditProfilePage() {
  const router = useRouter()
  const { toast } = useToast()

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  // Form State
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateProfilePayload>({
    full_name: "",
    headline: "",
    job_title: "",
    company_name: "",
    school: "",
    degree: "",
    location: "",
    about_text: "",
    mobile_number: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof UpdateProfilePayload, string>>>({})

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const profileData = await getProfile();
        const user = profileData.user;

        setFormData({
          full_name: user.name || "",
          headline: user.headline || "",
          job_title: user.job_title || "",
          company_name: user.company_name || "",
          school: user.school || user.latest_education?.school || "",
          degree: user.degree || user.latest_education?.degree || "",
          location: user.location || "",
          about_text: user.about_text || user.about || "",
          mobile_number: user.mobile_number || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load profile data."
        })
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [toast]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UpdateProfilePayload, string>> = {};
    let isValid = true;

    if (formData.full_name && formData.full_name.trim().length < 3) {
      newErrors.full_name = "Full name must be at least 3 characters";
      isValid = false;
    }
    if (formData.headline && formData.headline.length > 120) {
      newErrors.headline = "Headline cannot exceed 120 characters";
      isValid = false;
    }
    if (formData.job_title && formData.job_title.length > 80) {
      newErrors.job_title = "Job title cannot exceed 80 characters";
      isValid = false;
    }
    if (formData.company_name && formData.company_name.length > 80) {
      newErrors.company_name = "Company name cannot exceed 80 characters";
      isValid = false;
    }
    if (formData.school && formData.school.length > 100) {
      newErrors.school = "School cannot exceed 100 characters";
      isValid = false;
    }
    if (formData.degree && formData.degree.length > 100) {
      newErrors.degree = "Degree cannot exceed 100 characters";
      isValid = false;
    }
    if (formData.location && formData.location.length > 150) {
      newErrors.location = "Location cannot exceed 150 characters";
      isValid = false;
    }
    if (formData.about_text && formData.about_text.length > 500) {
      newErrors.about_text = "About section cannot exceed 500 characters";
      isValid = false;
    }

    if (!formData.mobile_number) {
      newErrors.mobile_number = "Mobile number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.mobile_number)) {
      newErrors.mobile_number = "Mobile number must be exactly 10 digits";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    // Map id to formData keys.
    // IDs in UI: name, headline, jobTitle, company, school, degree, location, about
    // Keys in formData: full_name, headline, job_title, company_name, school, degree, location, about_text

    let key: keyof UpdateProfilePayload | null = null;

    if (id === 'name') key = 'full_name';
    else if (id === 'headline') key = 'headline';
    else if (id === 'jobTitle') key = 'job_title';
    else if (id === 'company') key = 'company_name';
    else if (id === 'school') key = 'school';
    else if (id === 'degree') key = 'degree';
    else if (id === 'location') key = 'location';
    else if (id === 'about') key = 'about_text';
    else if (id === 'mobileNumber') key = 'mobile_number';

    if (key) {
      setFormData((prev) => ({ ...prev, [key!]: value }))
      // Clear error for this field
      if (errors[key]) {
        setErrors(prev => ({ ...prev, [key!]: undefined }))
      }
    }
  }

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await updateProfile(formData);
      toast({
        title: "Success",
        description: "Profile updated successfully",

      });
      router.push("/profile");
    } catch (error: any) {
      console.error("Failed to update profile", error);
      let message = "Failed to update profile. Please try again.";
      if (error.response?.status === 400 && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast({
        variant: "destructive",
        title: "Error",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Styles using semantic CSS variables that adapt to theme (Navy/Dark/Light)
  const inputStyles = "bg-background border-border text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
  const labelStyles = "text-sm font-medium text-foreground"
  const errorStyles = "text-xs text-destructive mt-1"

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-muted transition-all text-foreground"
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
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="bg-gradient-to-r from-[#5B7CFF] to-[#7B5CFF] text-white hover:opacity-90 transition-all gap-2 border-0 shadow-lg shadow-blue-500/20">
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-card border-border rounded-xl border p-6 md:p-8 shadow-sm">
          <div className="grid gap-6">

            <div className="grid gap-2">
              <Label htmlFor="name" className={labelStyles}>Full Name</Label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={handleChange}
                className={`${inputStyles} ${errors.full_name ? "border-destructive" : ""}`}
              />
              {errors.full_name && <p className={errorStyles}>{errors.full_name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="headline" className={labelStyles}>Headline</Label>
              <Input
                id="headline"
                value={formData.headline}
                onChange={handleChange}
                className={`${inputStyles} ${errors.headline ? "border-destructive" : ""}`}
              />
              {errors.headline && <p className={errorStyles}>{errors.headline}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mobileNumber" className={labelStyles}>Mobile Number <span className="text-destructive">*</span></Label>
              <Input
                id="mobileNumber"
                value={formData.mobile_number}
                onChange={handleChange}
                className={`${inputStyles} ${errors.mobile_number ? "border-destructive" : ""}`}
                placeholder="Enter 10 digit mobile number"
              />
              {errors.mobile_number && <p className={errorStyles}>{errors.mobile_number}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="jobTitle" className={labelStyles}>Job Title</Label>
                <Input
                  id="jobTitle"
                  value={formData.job_title}
                  onChange={handleChange}
                  className={`${inputStyles} ${errors.job_title ? "border-destructive" : ""}`}
                />
                {errors.job_title && <p className={errorStyles}>{errors.job_title}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company" className={labelStyles}>Company Name</Label>
                <Input
                  id="company"
                  value={formData.company_name}
                  onChange={handleChange}
                  className={`${inputStyles} ${errors.company_name ? "border-destructive" : ""}`}
                />
                {errors.company_name && <p className={errorStyles}>{errors.company_name}</p>}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="school" className={labelStyles}>Education (School)</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={handleChange}
                  className={`${inputStyles} ${errors.school ? "border-destructive" : ""}`}
                />
                {errors.school && <p className={errorStyles}>{errors.school}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="degree" className={labelStyles}>Degree</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className={`${inputStyles} ${errors.degree ? "border-destructive" : ""}`}
                />
                {errors.degree && <p className={errorStyles}>{errors.degree}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location" className={labelStyles}>Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={handleChange}
                className={`${inputStyles} ${errors.location ? "border-destructive" : ""}`}
              />
              {errors.location && <p className={errorStyles}>{errors.location}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="about" className={labelStyles}>About</Label>
              <Textarea
                id="about"
                value={formData.about_text}
                onChange={handleChange}
                className={`${inputStyles} min-h-[150px] ${errors.about_text ? "border-destructive" : ""}`}
              />
              {errors.about_text && <p className={errorStyles}>{errors.about_text}</p>}
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
