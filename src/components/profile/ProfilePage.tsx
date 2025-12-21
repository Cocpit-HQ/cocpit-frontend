"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { MapPin, Briefcase, Calendar, Mail, Phone, Edit2, Plus, CheckCircle, GraduationCap, Settings, X, Trash2 } from "lucide-react"

import SuggestionsPanel from "@/components/SuggestionsPanel"
import { AppShell } from "@/components/layout/AppShell"
import type { Page, Theme } from "@/types/common"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import AddExperienceForm from "@/components/profile/AddExperienceForm";
import AddEducationForm from "@/components/profile/AddEducationForm";
import { SkillModal } from "@/components/profile/SkillModal";
import type { Experience, Education } from "@/types/entities"

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



function ExperienceItem({
  isDark,
  experience,
  onEdit,
}: {
  isDark: boolean
  experience: Experience
  onEdit: () => void
}) {
  return (
    <div className="flex gap-4 group relative">
      <div className="flex-shrink-0 w-12 h-12 bg-[#7B5CFF] rounded-lg flex items-center justify-center">
        <Briefcase className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{experience.title}</h3>
        <p className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{experience.company}</p>
        <div className={`flex items-center gap-2 text-xs mb-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
          <span>{experience.duration}</span>
          <span>•</span>
          <span>{experience.location}</span>
        </div>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{experience.description}</p>
      </div>
      <button onClick={onEdit} className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-opacity">
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function EducationItem({
  isDark,
  education,
  onEdit,
}: {
  isDark: boolean
  education: Education
  onEdit: () => void
}) {
  return (
    <div className="flex gap-4 group relative">
      <div className="flex-shrink-0 w-12 h-12 bg-[#5B7CFF] rounded-lg flex items-center justify-center">
        <GraduationCap className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-1`}>
          {education.school}
        </h3>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mb-1`}>{education.degree}, {education.fieldOfStudy}</p>
        <div className={`flex items-center gap-2 text-xs mb-2 ${isDark ? "text-gray-500" : "text-gray-500"}`}>
          <span>{education.duration}</span>
        </div>
        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          {education.description}
        </p>
      </div>
      <button onClick={onEdit} className="absolute top-0 right-0 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-opacity">
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function SkillTag({ skill, onDelete }: { skill: string, onDelete: (skill: string) => void }) {
  return (
    <div className="group relative bg-[#5B7CFF]/20 text-[#5B7CFF] px-3 py-1.5 rounded-lg text-sm hover:bg-[#5B7CFF]/30 transition-all">
      {skill}
      <button onClick={() => onDelete(skill)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

const initialSkills = [
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
];

const initialExperiences: Experience[] = [
  {
    id: 1,
    title: "Senior Product Manager",
    company: "TechCorp Inc.",
    duration: "2021 - Present",
    location: "San Francisco, CA",
    description: "Leading product strategy and roadmap for core platform features. Managing cross-functional teams and driving product vision.",
  },
  {
    id: 2,
    title: "Product Manager",
    company: "StartupXYZ",
    duration: "2018 - 2021",
    location: "San Francisco, CA",
    description: "Launched 10+ features from concept to market. Collaborated with engineering and design teams to deliver user-centric solutions.",
  },
];

const initialEducations: Education[] = [
  {
    id: 1,
    school: "Stanford University",
    degree: "MBA",
    fieldOfStudy: "Business Administration",
    duration: "2016 - 2018",
    description: "Focus on Product Management and Entrepreneurship",
  }
];

export default function ProfilePage() {
  const router = useRouter()
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddExperienceModalOpen, setIsAddExperienceModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);
  const [educations, setEducations] = useState<Education[]>(initialEducations);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(
    () => resolvedTheme === "dark",
    [resolvedTheme]
  )

  if (!mounted) {
    return null;
  }
  
  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const handleSaveSkills = (newSkills: string[]) => {
    setSkills(newSkills);
    setIsAddSkillModalOpen(false);
  };

  const handleDeleteSkill = (skillToDelete: string) => {
    setSkills(skills.filter(skill => skill !== skillToDelete));
  }

  const handleSaveExperience = (data: Partial<Experience>) => {
    if (editingExperience) {
      setExperiences(experiences.map(exp => exp.id === editingExperience.id ? { ...exp, ...data } : exp));
    } else {
      setExperiences([...experiences, { ...data, id: Date.now() } as Experience]);
    }
    setIsAddExperienceModalOpen(false);
    setEditingExperience(null);
  };

  const handleDeleteExperience = (id: number) => {
    setExperiences(experiences.filter(exp => exp.id !== id));
    setIsAddExperienceModalOpen(false);
    setEditingExperience(null);
  }

  const handleAddExperienceClick = () => {
    setEditingExperience(null);
    setIsAddExperienceModalOpen(true);
  }

  const handleEditExperienceClick = (experience: Experience) => {
    setEditingExperience(experience);
    setIsAddExperienceModalOpen(true);
  }

  const handleSaveEducation = (data: Partial<Education>) => {
    if (editingEducation) {
      setEducations(educations.map(edu => edu.id === editingEducation.id ? { ...edu, ...data } : edu));
    } else {
      setEducations([...educations, { ...data, id: Date.now() } as Education]);
    }
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  };

  const handleDeleteEducation = (id: number) => {
    setEducations(educations.filter(edu => edu.id !== id));
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  }

  const handleAddEducationClick = () => {
    setEditingEducation(null);
    setIsAddEducationModalOpen(true);
  }

  const handleEditEducationClick = (education: Education) => {
    setEditingEducation(education);
    setIsAddEducationModalOpen(true);
  }

  return (
    <div className={`min-h-screen ${isDark ? "bg-background" : "bg-[#F3F2EF]"}`}>
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
                  <button onClick={() => router.push('/profile/edit')} className="hidden md:flex absolute top-3 right-3 bg-[#5B7CFF] text-white px-4 py-2 rounded-lg hover:bg-[#4A6BEF] transition-all items-center gap-2 text-sm">
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
                    <button onClick={() => router.push('/profile/edit')} className="md:hidden mt-16 bg-[#5B7CFF] text-white px-4 py-2 rounded-lg hover:bg-[#4A6BEF] transition-all flex items-center gap-2 text-sm">
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
                  <button onClick={handleAddExperienceClick} className="text-[#5B7CFF] hover:underline text-sm">Add</button>
                </div>

                <div className="space-y-6">
                  {experiences.map(exp => (
                    <ExperienceItem
                      key={exp.id}
                      isDark={isDark}
                      experience={exp}
                      onEdit={() => handleEditExperienceClick(exp)}
                    />
                  ))}
                </div>
              </div>

              <div
                className={`${
                  isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"
                } rounded-xl border p-6 mb-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl ${isDark ? "text-white" : "text-gray-900"}`}>Skills</h2>
                  <button onClick={() => setIsAddSkillModalOpen(true)} className="text-[#5B7CFF] hover:underline text-sm">Add</button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <SkillTag key={skill} skill={skill} onDelete={handleDeleteSkill} />
                  ))}
                </div>
              </div>

              <div className={`${isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white border-gray-200"} rounded-xl border p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl ${isDark ? "text-white" : "text-gray-900"}`}>Education</h2>
                  <button onClick={handleAddEducationClick} className="text-[#5B7CFF] hover:underline text-sm">Add</button>
                </div>

                <div className="space-y-6">
                  {educations.map(edu => (
                    <EducationItem
                      key={edu.id}
                      isDark={isDark}
                      education={edu}
                      onEdit={() => handleEditEducationClick(edu)}
                    />
                  ))}
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

      <SkillModal 
        isOpen={isAddSkillModalOpen} 
        onClose={() => setIsAddSkillModalOpen(false)}
        initialSkills={skills}
        onSave={handleSaveSkills}
        isDark={isDark}
      />

      <Dialog open={isAddExperienceModalOpen} onOpenChange={setIsAddExperienceModalOpen}>
        <DialogContent className={isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
              {editingExperience ? "Edit Experience" : "Add Experience"}
            </DialogTitle>
            <DialogDescription>
              {editingExperience ? "Edit the details of your experience." : "Add a new experience to your profile."}
            </DialogDescription>
          </DialogHeader>
          <AddExperienceForm
            isDark={isDark}
            onSave={handleSaveExperience}
            onCancel={() => setIsAddExperienceModalOpen(false)}
            initialData={editingExperience}
            onDelete={handleDeleteExperience}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEducationModalOpen} onOpenChange={setIsAddEducationModalOpen}>
        <DialogContent className={isDark ? "bg-[#242b3d] border-[#2d3548]" : "bg-white"}>
          <DialogHeader>
            <DialogTitle className={isDark ? "text-white" : "text-gray-900"}>
              {editingEducation ? "Edit Education" : "Add Education"}
            </DialogTitle>
            <DialogDescription>
              {editingEducation ? "Edit the details of your education." : "Add a new education to your profile."}
            </DialogDescription>
          </DialogHeader>
          <AddEducationForm
            isDark={isDark}
            onSave={handleSaveEducation}
            onCancel={() => setIsAddEducationModalOpen(false)}
            initialData={editingEducation}
            onDelete={handleDeleteEducation}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

