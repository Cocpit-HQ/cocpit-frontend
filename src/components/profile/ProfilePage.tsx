"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Briefcase, Calendar, Mail, Phone, Edit2, Plus, CheckCircle, GraduationCap, Settings, X, Trash2, Menu, LogOut, Pencil, Loader2 } from "lucide-react"

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
import { getProfile, addExperience, updateExperience, deleteExperience, addEducation, updateEducation, deleteEducation, getUserPosts, addSkills, deleteSkill, uploadAvatar, deleteAvatar } from "@/services/api/profile"
import { deletePost as apiDeletePost } from "@/services/api/posts"
import { UserProfile, UserData, AddExperiencePayload, AddEducationPayload, AddSkillsPayload, SkillResponse, Skill } from "@/types/user"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import type { Post } from "@/types/entities"
import { ViewAvatarModal } from "@/components/profile/ViewAvatarModal";
import { EditAvatarModal } from "@/components/profile/EditAvatarModal";
import EditCoverPhoto from "@/components/profile/EditCoverPhoto";

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
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [isDeletingSkill, setIsDeletingSkill] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [user, setUser] = useState<UserData | null>(null);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const { togglePostVisibility } = useFeed();
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileData = await getProfile();
        setUser(profileData.user);
        setCoverImage(profileData.user.cover_image || null);
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

  // Removed blocking render to allow sidebar to persist
  // if (!mounted) { return null; }

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const handleLogout = async () => {
    await logout();
    router.push("/"); // Redirect to sign-in page
  };

  const handleSaveSkills = async (newSkills: string[]) => {
    try {
      // Normalize input: trim and filter empty
      const normalizedNewSkills = newSkills
        .map(s => s.trim())
        .filter(s => s !== "");

      // Get current skills to compare
      const currentSkillNames = skills.map(s => s.name);

      // Determine skills to add (case-insensitive check for robustness)
      const skillsToAdd = normalizedNewSkills.filter(newSkill =>
        !currentSkillNames.some(curr => curr.toLowerCase() === newSkill.toLowerCase())
      );

      // Determine skills to remove (if user removed them in modal)
      // Note: This assumes newSkills represents the COMPLETE desired state.
      const skillsToRemove = skills.filter(curr =>
        !normalizedNewSkills.some(newSkill => newSkill.toLowerCase() === curr.name.toLowerCase())
      );

      console.log("Skills diff:", { toAdd: skillsToAdd, toRemove: skillsToRemove });

      let updatedSkills = [...skills];

      // 1. Add new skills
      if (skillsToAdd.length > 0) {
        // Remove 'Payload' suffix usage if I renamed it back or keep it simple
        const skillsPayload: AddSkillsPayload = { name: skillsToAdd };
        const response = await addSkills(skillsPayload);
        // Backend returns the FULL list of added skills (or just the ones added?)
        // Response type is { skills: SkillResponse[] }
        // We accumulate them
        const addedSkillsList = response.skills || [];
        // Avoid duplicates in state if backend returns partial
        updatedSkills = [...updatedSkills, ...addedSkillsList];
      }

      // 2. Delete removed skills
      if (skillsToRemove.length > 0) {
        const deletePromises = skillsToRemove.map(skill => deleteSkill(skill.skill_id));
        await Promise.all(deletePromises);
        // Remove from local state
        const removedIds = new Set(skillsToRemove.map(s => s.skill_id));
        updatedSkills = updatedSkills.filter(s => !removedIds.has(s.skill_id));
      }

      // If no changes, just close
      if (skillsToAdd.length === 0 && skillsToRemove.length === 0) {
        setIsAddSkillModalOpen(false);
        return;
      }

      // Update state with final list
      // We might need to refresh from server to be 100% sure, but optimistic/accumulated is faster
      // Let's re-fetch profile or just setSkills
      // If addSkills returns new skills only, we merged them.
      // If delete works, we removed them.

      // However, addSkills response might effectively be "the skills added".
      // Let's rely on updatedSkills construction.
      setSkills(updatedSkills);
      setIsAddSkillModalOpen(false);

    } catch (error: any) {
      console.error("Failed to save skills", error);
      if (error.response) {
        console.error("Server Error Details:", error.response.data);
        alert(`Failed to save skills: ${error.response.data.message || "Unknown error"}`);
      }
    }
  };

  const handleDeleteSkill = (skillName: string) => {
    const skill = skills.find(s => s.name === skillName);
    if (skill) {
      setSkillToDelete(skill);
    }
  }

  const confirmDeleteSkill = async () => {
    if (!skillToDelete) return;

    setIsDeletingSkill(true);
    try {
      await deleteSkill(skillToDelete.skill_id);
      setSkills(prev => prev.filter(s => s.skill_id !== skillToDelete.skill_id));
    } catch (error) {
      console.error("Failed to delete skill", error);
      alert("Failed to delete skill. Please try again.");
    } finally {
      setIsDeletingSkill(false);
      setSkillToDelete(null);
    }
  };

  const handleSaveExperience = async (data: Partial<Experience>) => {
    if (editingExperience) {
      try {
        const payload: Partial<AddExperiencePayload> = {
          title: data.title,
          company_name: data.company_name,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date,
          is_current: !data.end_date,
          description: data.description,
        };
        const response = await updateExperience(editingExperience.experience_id, payload);
        setExperiences(experiences.map(exp =>
          exp.experience_id === editingExperience.experience_id ? response.experience : exp
        ));
      } catch (error) {
        console.error("Failed to update experience", error);
      }
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
      try {
        const payload: Partial<AddEducationPayload> = {
          school_name: data.school_name,
          degree: data.degree,
          field_of_study: data.field_of_study,
          start_date: data.start_date,
          end_date: data.end_date,
          description: data.description,
        };

        const response = await updateEducation(editingEducation.education_id, payload);
        setEducations(educations.map(edu =>
          edu.education_id === editingEducation.education_id ? response.education : edu
        ));
      } catch (error) {
        console.error("Failed to update education", error);
      }
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
    setIsAddExperienceModalOpen(false);
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
    openTo: (user?.open_to as "Full-time" | "Freelance" | "Consulting" | "Mentorship") || "Full-time",
    availability: user?.availability as "Immediate" | "30 Days" | "Casual Networking" || "Immediate",
    workPreference: user?.work_preference as "Remote" | "Hybrid" | "Onsite" || "Hybrid",
  };

  const isLoading = !mounted || !user;

  const latestEducation = user?.latest_education || educations[0] || null;
  const latestExperience = experiences[0] || null;

  const scrollToEducation = () => {
    const educationSection = document.getElementById("education-section");
    if (educationSection) {
      educationSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToExperience = () => {
    const experienceSection = document.getElementById("experience-section");
    if (experienceSection) {
      experienceSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto pt-0 md:pt-8 pb-20 md:pb-12">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8">
              <div
                className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border"
              >
                <EditCoverPhoto coverImage={coverImage} setCoverImage={setCoverImage}>
                  <div className="absolute top-3 right-3 md:hidden z-10">
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
                  <div className="hidden md:flex absolute top-3 right-3 gap-2 z-10">
                    <button onClick={() => router.push('/analytics')} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 text-sm border border-white/20">
                      View Analytics
                    </button>
                    <button onClick={() => router.push('/profile/edit')} className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-all flex items-center gap-2 text-sm border border-white/20">
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                </EditCoverPhoto>


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

                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 mr-4">
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

                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      {latestEducation && (
                        <div onClick={scrollToEducation} className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors max-w-[280px]">
                          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-6 h-6 text-yellow-600" />
                          </div>
                          <span className="text-sm font-semibold text-foreground hover:underline line-clamp-2">
                            {/* @ts-ignore */}
                            {latestEducation.school_name || latestEducation.school || 'University'}
                          </span>
                        </div>
                      )}

                      {latestExperience && (
                        <div onClick={scrollToExperience} className="hidden md:flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg transition-colors max-w-[280px]">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-6 h-6 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-foreground hover:underline line-clamp-2">
                            {latestExperience.company_name}
                          </span>
                        </div>
                      )}
                    </div>

                  </div>

                  <ProfileIdentityChips initialIdentity={profileIdentity} />
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

              <LivingResume experiences={experiences} skills={skills.map(s => s.name)} />

              <div
                className="rounded-xl border p-6 mb-4 bg-card border-border"
              >
                <h2 className="text-xl text-foreground mb-4">About</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {user?.about}
                </p>
              </div>

              <div
                id="experience-section"
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
                  {skills.map((skill: any, index) => {
                    const skillName = skill.name || (typeof skill === 'string' ? skill : '');
                    if (!skillName) return null;
                    return (
                      <SkillProofPill
                        key={skill.skill_id || `skill-${index}`}
                        skill={skillName}
                        experiences={experiences}
                        posts={previewPosts}
                        onDelete={handleDeleteSkill}
                      />
                    );
                  })}
                </div>
              </div>

              <div id="education-section" className="rounded-xl border p-6 bg-card border-border">
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
                        isProfileView={true}
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
        )}
      </div>

      <SkillModal
        isOpen={isAddSkillModalOpen}
        onClose={() => setIsAddSkillModalOpen(false)}
        initialSkills={skills.map(s => s.name)}
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

      <Dialog open={!!skillToDelete} onOpenChange={(open) => !open && setSkillToDelete(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{skillToDelete?.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setSkillToDelete(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              disabled={isDeletingSkill}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteSkill}
              disabled={isDeletingSkill}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              {isDeletingSkill ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  )
}
