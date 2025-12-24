"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
import { ExtendedExperience } from "@/types/profile";
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips";
import { LivingResume } from "@/components/profile/LivingResume";
import { SkillProofPill } from "@/components/profile/SkillProofPill";
import { initialIdentity, initialExperiences, initialSkills } from "@/lib/data/profile";
import { useFeed } from "@/context/FeedContext";
import { initialEducations } from "@/lib/data/profile";
import FeedPost from "@/components/home/FeedPost";
import Link from "next/link";

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
  experience,
  onEdit,
}: {
  experience: Experience
  onEdit: () => void
}) {
  return (
    <div className="flex gap-4 group relative">
      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
        <Briefcase className="w-6 h-6 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold mb-1 text-foreground">{experience.title}</h3>
        <p className="text-sm mb-1 text-muted-foreground">{experience.company}</p>
        <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
          <span>{experience.duration}</span>
          <span>•</span>
          <span>{experience.location}</span>
        </div>
        <p className="text-sm text-muted-foreground">{experience.description}</p>
      </div>
      <button onClick={onEdit} className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-foreground transition-opacity">
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  )
}

function EducationItem({
  education,
  onEdit,
}: {
  education: Education
  onEdit: () => void
}) {
  return (
    <div className="flex gap-4 group relative">
      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
        <GraduationCap className="w-6 h-6 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground mb-1">
          {education.school}
        </h3>
        <p className="text-sm text-muted-foreground mb-1">{education.degree}, {education.fieldOfStudy}</p>
        <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
          <span>{education.duration}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {education.description}
        </p>
      </div>
      <button onClick={onEdit} className="absolute top-0 right-0 p-2 text-muted-foreground hover:text-foreground transition-opacity">
        <Edit2 className="w-4 h-4" />
      </button>
    </div>
  )
}


export default function ProfilePage() {
  const router = useRouter()
  // Removed useTheme
  const [mounted, setMounted] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddExperienceModalOpen, setIsAddExperienceModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [skills, setSkills] = useState<string[]>(initialSkills);
  const [experiences, setExperiences] = useState<ExtendedExperience[]>(initialExperiences);
  const [educations, setEducations] = useState<Education[]>(initialEducations);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const { posts } = useFeed();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      setExperiences(experiences.map(exp => exp.id === editingExperience.id ? { ...exp, ...data, skills: (exp as ExtendedExperience).skills || [] } : exp));
    } else {
      setExperiences([...experiences, { ...data, id: Date.now(), skills: [] } as ExtendedExperience]);
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
    <div className="min-h-screen bg-background">
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto py-6 md:py-8 pb-20 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8">
              <div
                className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border"
              >
                <div className="h-36 bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899] relative">
                  <button
                    onClick={() => router.push("/settings")}
                    className="absolute top-3 right-3 bg-transparent text-white p-2 rounded-full hover:bg-white/10 transition-all flex items-center gap-2 md:hidden"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <div className="hidden md:flex absolute top-3 right-3 gap-2">
                    <button onClick={() => router.push('/analytics')} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 text-sm border border-white/20">
                        View Analytics
                    </button>
                    <button onClick={() => router.push('/profile/edit')} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 text-sm border border-white/20">
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                    </button>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <div className="flex items-start justify-between -mt-14 mb-4">
                    <div
                      className="w-32 h-32 rounded-full border-4 border-background bg-card overflow-hidden flex-shrink-0 relative"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button onClick={() => router.push('/profile/edit')} className="md:hidden mt-16 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 text-sm">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl text-foreground">Sally Liang</h1>
                      <CheckCircle className="w-5 h-5 text-primary fill-primary/10" />
                      <span className="text-sm text-muted-foreground">· 2nd</span>
                    </div>

                    <p className="text-base mb-2 text-foreground">
                      Senior Financial Analyst at Johnson & Johnson
                    </p>

                    <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                      <span>Berkeley, California, United States</span>
                      <span>·</span>
                      <a href="#" className="text-primary hover:underline">
                        Contact info
                      </a>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">500+ connections</p>

                    <ProfileIdentityChips initialIdentity={initialIdentity} />
                  </div>
                </div>
              </div>

              <div
                className="rounded-xl border p-4 mb-6 bg-card border-border"
              >
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl mb-1 text-foreground">500+</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <div className="text-center border-l border-r border-border">
                    <p className="text-xl mb-1 text-foreground">1,234</p>
                    <p className="text-xs text-muted-foreground">Profile Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl mb-1 text-foreground">87</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                </div>
              </div>

              <LivingResume experiences={experiences} skills={skills} />

              <div
                className="rounded-xl border p-6 mb-4 bg-card border-border"
              >
                <h2 className="text-xl text-foreground mb-4">About</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Passionate product manager with 7+ years of experience building user-centric solutions that drive business growth.
                  Proven track record in agile development, user research, and cross-functional team leadership. Successfully launched 15+
                  features that improved user engagement by 40% and increased revenue by $2M annually.
                </p>
              </div>

              <div
                className="rounded-xl border p-6 mb-4 bg-card border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-foreground">Experience</h2>
                  <button onClick={handleAddExperienceClick} className="text-primary hover:underline text-sm">Add</button>
                </div>

                <div className="space-y-6">
                  {experiences.map(exp => (
                    <ExperienceItem
                      key={exp.id}
                      experience={exp}
                      onEdit={() => handleEditExperienceClick(exp)}
                    />
                  ))}
                </div>
              </div>

              <div
                className="rounded-xl border p-6 mb-4 bg-card border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-foreground">Skills</h2>
                  <button onClick={() => setIsAddSkillModalOpen(true)} className="text-primary hover:underline text-sm">Add</button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <SkillProofPill
                        key={skill}
                        skill={skill}
                        experiences={experiences}
                        posts={posts.filter(p => p.author === "Sally Liang")}
                        onDelete={handleDeleteSkill}
                    />
                  ))}
                </div>
              </div>

              <div className="rounded-xl border p-6 bg-card border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-foreground">Education</h2>
                  <button onClick={handleAddEducationClick} className="text-primary hover:underline text-sm">Add</button>
                </div>

                <div className="space-y-6">
                  {educations.map(edu => (
                    <EducationItem
                      key={edu.id}
                      education={edu}
                      onEdit={() => handleEditEducationClick(edu)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-foreground font-semibold">Latest Posts</h2>
                  <Link href="/profile/posts" className="text-sm text-primary hover:underline">
                    See all posts
                  </Link>
                </div>
                <div className="space-y-4">
                  {posts.filter(p => p.author === "Sally Liang").slice(0, 2).map(post => (
                    <FeedPost key={post.id} {...post} initialComments={post.commentData} />
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
      />

      <Dialog open={isAddExperienceModalOpen} onOpenChange={setIsAddExperienceModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingExperience ? "Edit Experience" : "Add Experience"}
            </DialogTitle>
            <DialogDescription>
              {editingExperience ? "Edit the details of your experience." : "Add a new experience to your profile."}
            </DialogDescription>
          </DialogHeader>
          <AddExperienceForm
            onSave={handleSaveExperience}
            onCancel={() => setIsAddExperienceModalOpen(false)}
            initialData={editingExperience}
            onDelete={handleDeleteExperience}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEducationModalOpen} onOpenChange={setIsAddEducationModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingEducation ? "Edit Education" : "Add Education"}
            </DialogTitle>
            <DialogDescription>
              {editingEducation ? "Edit the details of your education." : "Add a new education to your profile."}
            </DialogDescription>
          </DialogHeader>
          <AddEducationForm
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
