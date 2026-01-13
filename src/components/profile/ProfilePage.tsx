"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Briefcase, Calendar, Mail, Phone, Edit2, Plus, CheckCircle, GraduationCap, Settings, X, Trash2, Menu, LogOut, Pencil } from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddExperienceForm from "@/components/profile/AddExperienceForm";
import AddEducationForm from "@/components/profile/AddEducationForm";
import { SkillModal } from "@/components/profile/SkillModal";
import type { Experience, Education } from "@/types/entities"
import { ProfileIdentity } from "@/types/profile";
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips";
import { LivingResume } from "@/components/profile/LivingResume";
import { SkillProofPill } from "@/components/profile/SkillProofPill";
import { useFeed } from "@/context/FeedContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import FeedPost from "@/components/home/FeedPost";
import PostCard from "./PostCard";
import Link from "next/link";
import { getProfile, addExperience, deleteExperience, addEducation, deleteEducation, getUserPosts, addSkill, deleteSkill, uploadAvatar, deleteAvatar } from "@/services/api/profile"
import { deletePost as apiDeletePost } from "@/services/api/posts"
import { UserProfile, UserData, Skill, AddExperiencePayload, AddEducationPayload } from "@/types/user"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import type { Post } from "@/types/entities"
import { ViewAvatarModal } from "@/components/profile/ViewAvatarModal";
import { EditAvatarModal } from "@/components/profile/EditAvatarModal";

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
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
        <p className="text-sm mb-1 text-muted-foreground">{experience.company_name}</p>
        <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
          <span>{new Date(experience.start_date).getFullYear()} - {experience.end_date ? new Date(experience.end_date).getFullYear() : 'Present'}</span>
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
          {education.school_name}
        </h3>
        <p className="text-sm text-muted-foreground mb-1">{education.degree}, {education.field_of_study}</p>
        <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
          <span>{new Date(education.start_date).getFullYear()} - {education.end_date ? new Date(education.end_date).getFullYear() : 'Present'}</span>
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
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const { togglePostVisibility } = useFeed();
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);
  const isMobile = useIsMobile();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        setUser(profileData.user);
        setExperiences(profileData.experiences);
        setEducations(profileData.educations);
        setSkills(profileData.skills);
        setMounted(true);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await getUserPosts({ limit: 4 });
        const mappedPosts = response.posts.map(mapProfilePostToPost);
        setPreviewPosts(mappedPosts);
      } catch (error) {
        console.error("Failed to fetch profile posts", error);
      }
    };

    fetchProfile();
    fetchPosts();
  }, []);

  const handleDeletePost = async (id: string) => {
    // Optimistic update
    const previousPosts = [...previewPosts];
    setPreviewPosts((prev) => prev.filter((post) => post.id !== id));

    try {
      await apiDeletePost(id);
    } catch (error) {
      console.error("Failed to delete post", error);
      // Revert if failed
      setPreviewPosts(previousPosts);
    }
  };

  const handleToggleVisibility = (id: string) => {
    // Update local state
    setPreviewPosts(prev => prev.map(post =>
      post.id === id
        ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
        : post
    ));

    // Also update global feed context just in case
    togglePostVisibility(id);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await uploadAvatar(formData);
      setUser({ ...user, avatar: response.avatarUrl });
    } catch (error) {
      console.error("Failed to upload avatar", error);
      throw error; // Let the modal handle error UI if needed
    }
  };

  const handleAvatarDelete = async () => {
    if (!user) return;
    try {
      await deleteAvatar();
      setUser({ ...user, avatar: null });
    } catch (error) {
      console.error("Failed to delete avatar", error);
      throw error;
    }
  };

  if (!mounted) {
    return null;
  }
  
  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const handleLogout = async () => {
    await logout();
    router.push("/"); // Redirect to sign-in page
  };

  const handleSaveSkills = async (newSkills: string[]) => {
    try {
        const existingNames = skills.map(s => s.skill_name);
        const skillsToAdd = newSkills.filter(s => !existingNames.includes(s));

        const addedSkills: Skill[] = [];
        for (const skillName of skillsToAdd) {
            const res = await addSkill({ skill_name: skillName });
            addedSkills.push(res.skill);
        }

        setSkills([...skills, ...addedSkills]);
    } catch (error) {
        console.error("Failed to add skills", error);
    }
    setIsAddSkillModalOpen(false);
  };

  const handleDeleteSkill = async (skillName: string) => {
    // Find skill ID by name (since UI often deals with names in chips)
    const skill = skills.find(s => s.skill_name === skillName);
    if (!skill) return;

    try {
        await deleteSkill(skill.skill_id);
        setSkills(skills.filter(s => s.skill_id !== skill.skill_id));
    } catch (error) {
        console.error("Failed to delete skill", error);
    }
  }

  const handleSaveExperience = async (data: Partial<Experience>) => {
    if (editingExperience) {
      // TODO: Implement edit experience API if available, else just local for now or add endpoint
      setExperiences(experiences.map(exp => exp.experience_id === editingExperience.experience_id ? { ...exp, ...data } : exp));
    } else {
      try {
        const payload: AddExperiencePayload = {
          title: data.title!,
          company_name: data.company_name!,
          location: data.location!,
          start_date: data.start_date!,
          end_date: data.end_date!,
          is_current: !data.end_date,
          description: data.description!,
        };
        const response = await addExperience(payload);
        setExperiences([...experiences, response.experience]);
      } catch (error) {
        console.error("Failed to add experience", error);
      }
    }
    setIsAddExperienceModalOpen(false);
    setEditingExperience(null);
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await deleteExperience(id);
      setExperiences(experiences.filter(exp => exp.experience_id !== id));
    } catch (error) {
      console.error("Failed to delete experience", error);
    }
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

  const handleSaveEducation = async (data: Partial<Education>) => {
    if (editingEducation) {
      // TODO: Implement edit education
      setEducations(educations.map(edu => edu.education_id === editingEducation.education_id ? { ...edu, ...data } : edu));
    } else {
      try {
        const payload: AddEducationPayload = {
          school_name: data.school_name!,
          degree: data.degree!,
          field_of_study: data.field_of_study!,
          start_date: data.start_date!,
          description: data.description!,
        };
        if (data.end_date) {
            payload.end_date = data.end_date;
        }
        const response = await addEducation(payload);
        setEducations([...educations, response.education]);
      } catch (error) {
        console.error("Failed to add education", error);
      }
    }
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  };

  const handleDeleteEducation = async (id: string) => {
    try {
      await deleteEducation(id);
      setEducations(educations.filter(edu => edu.education_id !== id));
    } catch (error) {
      console.error("Failed to delete education", error);
    }
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

  const profileIdentity: ProfileIdentity = {
    openTo: user?.open_to?.[0] as "Full-time" | "Freelance" | "Consulting" | "Mentorship" || "Full-time",
    availability: user?.availability as "Immediate" | "30 Days" | "Casual Networking" || "Immediate",
    workPreference: user?.work_preference as "Remote" | "Hybrid" | "Onsite" || "Hybrid",
};

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto pt-0 md:pt-8 pb-20 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8">
              <div
                className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border"
              >
                <div className="h-36 bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899] relative">
                  <div className="absolute top-3 right-3 md:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="bg-transparent text-white p-2 rounded-full hover:bg-white/10 transition-all">
                          <Menu className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-black/50 backdrop-blur-sm border-white/20 text-white">
                        <DropdownMenuItem onSelect={() => router.push("/settings")}>
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push("/analytics")}>
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleLogout}>
                          <LogOut className="w-4 h-4 mr-2" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
                    <div className="relative group">
                      <div
                        className="w-32 h-32 rounded-full border-4 border-background bg-card overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() => setIsViewAvatarOpen(true)}
                      >
                        <img
                          src={user?.avatar ?? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Pencil Icon for Edit Avatar */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditAvatarOpen(true);
                        }}
                        className="absolute bottom-1 right-1 p-2 bg-background border border-border rounded-full text-muted-foreground hover:text-foreground shadow-sm md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                        aria-label="Edit Profile Picture"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    <button onClick={() => router.push('/profile/edit')} className="md:hidden mt-16 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 text-sm">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl text-foreground">{user?.name}</h1>
                      <CheckCircle className="w-5 h-5 text-primary fill-primary/10" />
                      <span className="text-sm text-muted-foreground">· 2nd</span>
                    </div>

                    <p className="text-base mb-2 text-foreground">
                      {user?.headline}
                    </p>

                    <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                      <span>{user?.location}</span>
                      <span>·</span>
                      <a href="#" className="text-primary hover:underline">
                        Contact info
                      </a>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">500+ connections</p>
                    <ProfileIdentityChips initialIdentity={profileIdentity} />
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
                    <p className="text-xl mb-1 text-foreground">{user?.profile_views}</p>
                    <p className="text-xs text-muted-foreground">Profile Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl mb-1 text-foreground">{user?.search_appearances}</p>
                    <p className="text-xs text-muted-foreground">Search Appearances</p>
                  </div>
                </div>
              </div>

              <LivingResume experiences={experiences} skills={skills.map(s => s.skill_name)} />

              <div
                className="rounded-xl border p-6 mb-4 bg-card border-border"
              >
                <h2 className="text-xl text-foreground mb-4">About</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {user?.about}
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
                      key={exp.experience_id}
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
                        key={skill.skill_id}
                        skill={skill.skill_name}
                        experiences={experiences}
                        posts={previewPosts}
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
                      key={edu.education_id}
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
                <div className="grid grid-cols-2 gap-4">
                  {previewPosts.map(post => (
                    isMobile ? (
                      <PostCard
                        key={post.id}
                        post={post}
                        isOwnPost={true}
                        onDelete={handleDeletePost}
                      />
                    ) : (
                      <FeedPost
                        key={post.id}
                        {...post}
                        initialComments={post.commentData}
                        isOwnPost={true}
                        onDelete={handleDeletePost}
                        onToggleVisibility={handleToggleVisibility}
                      />
                    )
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
        initialSkills={skills.map(s => s.skill_name)}
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
            onDelete={() => editingExperience && handleDeleteExperience(editingExperience.experience_id)}
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
            onDelete={() => editingEducation && handleDeleteEducation(editingEducation.education_id)}
          />
        </DialogContent>
      </Dialog>

      <ViewAvatarModal
        isOpen={isViewAvatarOpen}
        onClose={() => setIsViewAvatarOpen(false)}
        avatarUrl={user?.avatar || null}
      />

      <EditAvatarModal
        isOpen={isEditAvatarOpen}
        onClose={() => setIsEditAvatarOpen(false)}
        currentAvatarUrl={user?.avatar || null}
        onUpload={handleAvatarUpload}
        onDelete={handleAvatarDelete}
      />
    </div>
  )
}
