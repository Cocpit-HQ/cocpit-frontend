"use client"
import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, LogOut, Edit2, CheckCircle, GraduationCap, Briefcase, Pencil, Plus, Building2 } from "lucide-react"
import Link from "next/link"

import SuggestionsPanel from "@/components/home/SuggestionsPanel"
import type { Page } from "@/types/common"
import { CompanyRoleModal } from "@/components/profile/parts/CompanyRoleModal"
import { CompanyRolesList } from "@/components/profile/parts/CompanyRolesList"
import { UniversalShareModal } from "@/components/share/UniversalShareModal"
import { MoreVertical, Share2, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AddExperienceForm from "@/components/profile/AddExperienceForm"
import AddEducationForm from "@/components/profile/AddEducationForm"
import { SkillModal } from "@/components/profile/SkillModal"
import type { Experience, Education } from "@/types/entities"
import { ProfileIdentity } from "@/types/profile"
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips"
import { LivingResume } from "@/components/profile/LivingResume"
import { SkillProofPill } from "@/components/profile/SkillProofPill"
import { useFeed } from "@/hooks/use-feed"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/hooks/use-auth"
import { useActiveProfile } from "@/context/ActiveProfileContext"
import FeedPost from "@/components/home/FeedPost"
import PostCard from "@/components/shared/PostCard"
import { getUserPosts } from "@/services/api/profile"
import { deletePost as apiDeletePost } from "@/services/api/posts"
import { UserData, Skill, AddSkillsPayload } from "@/types/user"
import { mapProfilePostToPost } from "@/lib/mappers/profile.mapper"
import type { Post } from "@/types/entities"
import { ViewAvatarModal } from "@/components/profile/ViewAvatarModal"
import { EditAvatarModal } from "@/components/profile/EditAvatarModal"
import EditCoverPhoto from "@/components/profile/EditCoverPhoto"
import { ProfileSkeleton } from "@/components/profile/ProfileSkeleton"
import { EditableExperienceItem } from "@/components/profile/parts/EditableExperienceItem"
import { EditableEducationItem } from "@/components/profile/parts/EditableEducationItem"
import { ContactInfoModal } from "@/components/profile/ContactInfoModal"
import { FollowListModal } from "@/components/profile/FollowListModal"
import { getProfileStats } from "@/services/api/social"
import { useQuery } from "@tanstack/react-query"
import { ProfileSwitcher } from "@/components/layout/ProfileSwitcher"

// New Hooks
import { useMyProfile, useExperienceMutations, useEducationMutations, useSkillMutations, useAvatarMutations } from "@/components/profile/hooks/use-my-profile"

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

export default function ProfilePage() {
  const router = useRouter()

  // New TanStack Query Hook
  const { data: profileData, isLoading } = useMyProfile();

  // Mutation Hooks
  const expMutations = useExperienceMutations();
  const eduMutations = useEducationMutations();
  const skillMutations = useSkillMutations();
  const avatarMutations = useAvatarMutations();

  // Live profile stats (includes company follows in following_count)
  const { data: profileStats } = useQuery({
    queryKey: ['profileStats', profileData?.user?.id],
    queryFn: () => getProfileStats(profileData!.user.id),
    enabled: !!profileData?.user?.id,
    staleTime: 1000 * 30,
  });

  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [isAddExperienceModalOpen, setIsAddExperienceModalOpen] = useState(false);
  const [isAddEducationModalOpen, setIsAddEducationModalOpen] = useState(false);
  const [isViewAvatarOpen, setIsViewAvatarOpen] = useState(false);
  const [isEditAvatarOpen, setIsEditAvatarOpen] = useState(false);
  const [isContactInfoModalOpen, setIsContactInfoModalOpen] = useState(false);
  const [isFollowListModalOpen, setIsFollowListModalOpen] = useState(false);
  const [activeFollowTab, setActiveFollowTab] = useState<"followers" | "following" | "connections">("followers");

  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);

  const [selectedRole, setSelectedRole] = useState<import("@/types/user").CompanyRole | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const handleRoleClick = (role: import("@/types/user").CompanyRole) => {
    setSelectedRole(role);
    setIsRoleModalOpen(true);
  };

  const { togglePostVisibility } = useFeed(false);
  const { isCompany } = useActiveProfile();
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { logout } = useAuth();

  const experiences = profileData?.experiences || [];
  const educations = profileData?.educations || [];
  const skills = profileData?.skills || [];

  // Merge company_roles into user object for ProfileHeader
  const user = profileData?.user ? {
    ...profileData.user,
    company_roles: profileData.company_roles || [],
  } : undefined;

  // Update cover image when profile loads
  useEffect(() => {
    if (profileData?.user.cover_image) {
      setCoverImage(profileData.user.cover_image);
    }
  }, [profileData]);

  // Keep posts separate for now as it uses different pagination logic
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await getUserPosts({ limit: 4 });
        const mappedPosts = response.posts.map(mapProfilePostToPost);
        setPreviewPosts(mappedPosts);
      } catch (error) {
        console.error("Failed to fetch profile posts", error);
      }
    };
    fetchPosts();
  }, []);

  const handleDeletePost = async (id: string) => {
    const previousPosts = [...previewPosts];
    setPreviewPosts((prev) => prev.filter((post) => post.id !== id));
    try {
      await apiDeletePost(id);
    } catch (error) {
      console.error("Failed to delete post", error);
      setPreviewPosts(previousPosts);
    }
  };

  const handleToggleVisibility = (id: string) => {
    setPreviewPosts(prev => prev.map(post =>
      post.id === id
        ? { ...post, visibility: post.visibility === 'private' ? 'public' : 'private' }
        : post
    ));
    togglePostVisibility(id);
  };

  const handleAvatarUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    await avatarMutations.upload.mutateAsync(formData);
  };

  const handleAvatarDelete = async () => {
    await avatarMutations.remove.mutateAsync();
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const [isSavingSkills, setIsSavingSkills] = useState(false);

  const handleSaveSkills = async (newSkills: string[]) => {
    setIsSavingSkills(true);
    try {
    const normalizedNewSkills = newSkills.map(s => s.trim()).filter(s => s !== "");
    const currentSkillNames = skills.map(s => s.name);

    const skillsToAdd = normalizedNewSkills.filter(newSkill =>
      !currentSkillNames.some(curr => curr.toLowerCase() === newSkill.toLowerCase())
    );

    const skillsToRemove = skills.filter(curr =>
      !normalizedNewSkills.some(newSkill => newSkill.toLowerCase() === curr.name.toLowerCase())
    );

    if (skillsToAdd.length > 0) {
      await skillMutations.add.mutateAsync({ name: skillsToAdd });
    }

    if (skillsToRemove.length > 0) {
      // Execute serially or parallel? Parallel is fine.
      await Promise.all(skillsToRemove.map(s => skillMutations.remove.mutateAsync(s.skill_id)));
    }

    setIsAddSkillModalOpen(false);
    toast.success("Skills updated successfully");
    } catch (error: any) {
      console.error("Failed to save skills", error);
      toast.error(error.response?.data?.message || "Failed to save skills. Please try again.");
    } finally {
      setIsSavingSkills(false);
    }
  };

  const handleDeleteSkill = (skillName: string) => {
    const skill = skills.find(s => s.name === skillName);
    if (skill) {
      skillMutations.remove.mutate(skill.skill_id);
    }
  }

  const handleSaveExperience = async (data: Partial<Experience>) => {
    if (editingExperience) {
      await expMutations.update.mutateAsync({
        id: editingExperience.experience_id,
        payload: {
          title: data.title,
          company_name: data.company_name,
          location: data.location,
          start_date: data.start_date,
          end_date: data.end_date,
          is_current: !data.end_date,
          description: data.description,
        }
      });
    } else {
      await expMutations.add.mutateAsync({
        title: data.title!,
        company_name: data.company_name!,
        location: data.location!,
        start_date: data.start_date!,
        end_date: data.end_date!,
        is_current: !data.end_date,
        description: data.description!,
      });
    }
    setIsAddExperienceModalOpen(false);
    setEditingExperience(null);
  };

  const handleDeleteExperience = async (id: string) => {
    await expMutations.remove.mutateAsync(id);
    setIsAddExperienceModalOpen(false);
    setEditingExperience(null);
  }

  const handleSaveEducation = async (data: Partial<Education>) => {
    if (editingEducation) {
      await eduMutations.update.mutateAsync({
        id: editingEducation.education_id,
        payload: {
          school_name: data.school_name,
          degree: data.degree,
          field_of_study: data.field_of_study,
          start_date: data.start_date,
          end_date: data.end_date,
          description: data.description,
        }
      });
    } else {
      const payload: any = {
        school_name: data.school_name!,
        degree: data.degree!,
        field_of_study: data.field_of_study!,
        start_date: data.start_date!,
        description: data.description!,
      };
      if (data.end_date) payload.end_date = data.end_date;
      await eduMutations.add.mutateAsync(payload);
    }
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  };

  const handleDeleteEducation = async (id: string) => {
    await eduMutations.remove.mutateAsync(id);
    setIsAddEducationModalOpen(false);
    setEditingEducation(null);
  }

  const profileIdentity: ProfileIdentity = {
    openTo: (user?.open_to as any) || "Full-time",
    availability: (user?.availability as any) || "Immediate",
    workPreference: (user?.work_preference as any) || "Hybrid",
  };

  const latestEducation = user?.latest_education || educations[0] || null;
  const latestExperience = experiences[0] || null;

  const scrollToEducation = () => {
    document.getElementById("education-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToExperience = () => {
    document.getElementById("experience-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const openFollowList = (tab: "followers" | "following" | "connections") => {
    setActiveFollowTab(tab);
    setIsFollowListModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto pt-0 md:pt-8 pb-20 md:pb-12 px-4 md:px-0">
        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-1 md:gap-2">
              <div className="w-full">
                <div className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border">

                  <EditCoverPhoto coverImage={coverImage} setCoverImage={setCoverImage}>
                    <div className="absolute top-3 right-3 md:hidden z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-white/30 transition-all border border-white/20 flex items-center justify-center">
                            <MoreVertical className="w-5 h-5" />
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
                        Edit Profile
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="bg-white/20 backdrop-blur-md text-white p-2 rounded-lg hover:bg-white/30 transition-all border border-white/20 flex items-center justify-center">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setIsShareModalOpen(true)} className="cursor-pointer">
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.href);
                              toast.success("Profile link copied");
                            }}
                            className="cursor-pointer"
                          >
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Copy Profile Link
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

                      <div className="md:hidden mt-16 flex gap-2">
                        <button onClick={() => router.push('/profile/edit')} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 text-sm">
                          <Edit2 className="w-4 h-4" />
                          Edit Profile
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="bg-background border border-border p-2 rounded-lg flex items-center justify-center">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIsShareModalOpen(true)} className="cursor-pointer">
                              <Share2 className="w-4 h-4 mr-2" />
                              Share Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(window.location.href);
                                toast.success("Profile link copied");
                              }}
                              className="cursor-pointer"
                            >
                              <LinkIcon className="w-4 h-4 mr-2" />
                              Copy Profile Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="hidden md:flex flex-col items-end mt-16">
                        <button
                          onClick={() => setIsContactInfoModalOpen(true)}
                          className="text-primary hover:underline font-medium text-sm"
                        >
                          Contact info
                        </button>
                      </div>
                    </div>


                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h1 className="text-2xl font-semibold text-foreground">{user?.name}</h1>
                          <CheckCircle className="w-5 h-5 text-primary fill-primary/10 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">· 2nd</span>
                        </div>

                        {user?.account_name && (
                          <p className="text-sm text-muted-foreground mb-1.5 truncate max-w-xs">@{user.account_name}</p>
                        )}

                        {/* Company Roles */}
                        {user?.company_roles && user.company_roles.length > 0 && (
                          <div className="mb-3">
                            <CompanyRolesList
                              roles={user.company_roles}
                              isOwnProfile={true}
                              onRoleClick={handleRoleClick}
                            />
                          </div>
                        )}

                        <p className="text-base mb-2 text-foreground">
                          {user?.headline}
                        </p>

                        <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                          <span className="text-muted-foreground">{user?.location}</span>
                        </div>

                        <button onClick={() => openFollowList("connections")} className="text-sm text-primary hover:underline font-medium mb-4">
                          {(user?.connections_count || 0) > 500 ? "500+" : user?.connections_count} connections
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        {/* Latest Education/Experience display logic */}
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

                {/* Stats & Resume */}
                <div className="rounded-xl border p-4 mb-6 bg-card border-border">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors" onClick={() => openFollowList("followers")}>
                      <p className="text-xl font-semibold mb-1 text-foreground">{profileStats?.followers_count ?? user?.followers_count ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Followers</p>
                    </div>
                    <div className="text-center border-l border-r border-border cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors" onClick={() => openFollowList("following")}>
                      <p className="text-xl font-semibold mb-1 text-foreground">{profileStats?.following_count ?? user?.following_count ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Following</p>
                    </div>
                    <div className="text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors" onClick={() => openFollowList("connections")}>
                      <p className="text-xl font-semibold mb-1 text-foreground">{profileStats?.connections_count ?? user?.connections_count ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Connections</p>
                    </div>
                  </div>
                </div>



                <LivingResume experiences={experiences} skills={skills.map(s => s.name)} />

                {/* About */}
                <div className="rounded-xl border p-6 mb-4 bg-card border-border">
                  <h2 className="text-xl text-foreground mb-4">About</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {user?.about}
                  </p>
                </div>

                {/* Experience Section */}
                <div id="experience-section" className="rounded-xl border p-6 mb-4 bg-card border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-foreground">Experience</h2>
                    <button onClick={() => { setEditingExperience(null); setIsAddExperienceModalOpen(true); }} className="text-primary hover:underline text-sm">Add</button>
                  </div>
                  <div className="space-y-6">
                    {experiences.map(exp => (
                      <EditableExperienceItem
                        key={exp.experience_id}
                        experience={exp}
                        onEdit={() => { setEditingExperience(exp); setIsAddExperienceModalOpen(true); }}
                      />
                    ))}
                  </div>
                </div>

                {/* Skills Section */}
                <div className="rounded-xl border p-6 mb-4 bg-card border-border">
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

                {/* Education Section */}
                <div id="education-section" className="rounded-xl border p-6 bg-card border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-foreground">Education</h2>
                    <button onClick={() => { setEditingEducation(null); setIsAddEducationModalOpen(true); }} className="text-primary hover:underline text-sm">Add</button>
                  </div>
                  <div className="space-y-6">
                    {educations.map(edu => (
                      <EditableEducationItem
                        key={edu.education_id}
                        education={edu}
                        onEdit={() => { setEditingEducation(edu); setIsAddEducationModalOpen(true); }}
                      />
                    ))}
                  </div>
                </div>

                {/* Posts Section */}
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
                          isOwnPost={!isCompany}
                          onDelete={handleDeletePost}
                        />
                      ) : (
                        <FeedPost
                          key={post.id}
                          {...post}
                          initialComments={post.commentData}
                          isOwnPost={!isCompany}
                          onDelete={handleDeletePost}
                          onToggleVisibility={handleToggleVisibility}
                          isProfileView={true}
                        />
                      )
                    ))}
                  </div>
                </div>
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
        loading={isSavingSkills}
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

      <FollowListModal
        isOpen={isFollowListModalOpen}
        onClose={() => setIsFollowListModalOpen(false)}
        initialTab={activeFollowTab}
        userId={user?.id || ""}
      />

      <ContactInfoModal
        isOpen={isContactInfoModalOpen}
        onClose={() => setIsContactInfoModalOpen(false)}
        user={user}
        isOwnProfile={true}
      />

      <CompanyRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        role={selectedRole}
        isOwnProfile={true}
      />

      <UniversalShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        entityId={user?.id || ""}
        entityType="profile"
        entityName={user?.name || ""}
        entityUrl={`/profile/${user?.account_name || user?.id}`}
      />
    </div>
  )
}
