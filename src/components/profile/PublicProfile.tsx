"use client"

import React, { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, GraduationCap, CheckCircle, MessageCircle, UserPlus, UserCheck } from "lucide-react"

import { AppShell } from "@/components/layout/AppShell"
import SuggestionsPanel from "@/components/SuggestionsPanel"
import FeedPost from "@/components/home/FeedPost"
import { SkillOverlap } from "@/components/profile/SkillOverlap"
import { ProfileIdentityChips } from "@/components/profile/ProfileIdentityChips"
import { SkillProofPill } from "@/components/profile/SkillProofPill"
import { useSocial } from "@/context/SocialContext"
import { User } from "@/types/user"
import { Post } from "@/types/entities"
import { initialIdentity, initialSkills as currentUserSkills } from "@/lib/data/profile"
import type { Page } from "@/types/common"
import { getUserById } from '@/services/api/user'
import { getPublicProfilePosts } from '@/services/api/public-profile'
import { mapPublicPostToPost } from '@/lib/mappers/public-profile.mapper'
import { PublicUserProfileResponse } from "@/types/api"

interface PublicProfileProps {
  userId: string;
}

const transformUserData = (data: PublicUserProfileResponse): User => {
  const experiences = data.experiences.map(apiExp => {
    const startDate = new Date(apiExp.start_date);
    const endDate = apiExp.end_date ? new Date(apiExp.end_date) : null;

    const startMonth = startDate.toLocaleString('default', { month: 'short' });
    const startYear = startDate.getFullYear();
    const endMonth = endDate ? endDate.toLocaleString('default', { month: 'short' }) : '';
    const endYear = endDate ? endDate.getFullYear() : 'Present';

    let duration = `${startMonth} ${startYear} - `;
    if (endYear === 'Present') {
      duration += 'Present';
    } else {
      duration += `${endMonth} ${endYear}`;
    }

    return {
      experience_id: apiExp.experience_id,
      profile_id: '',
      title: apiExp.title,
      company_name: apiExp.company_name,
      start_date: apiExp.start_date,
      end_date: apiExp.end_date,
      employment_type: '',
      location: apiExp.location,
      description: apiExp.description,
      id: apiExp.experience_id,
      company: apiExp.company_name,
      duration,
    };
  });

  const educations = data.educations.map(apiEdu => {
    const startDate = new Date(apiEdu.start_date);
    const endDate = apiEdu.end_date ? new Date(apiEdu.end_date) : null;
    const startYear = startDate.getFullYear();
    const endYear = endDate ? endDate.getFullYear() : 'Present';

    return {
      education_id: apiEdu.education_id,
      profile_id: '',
      school_name: apiEdu.school_name,
      degree: apiEdu.degree,
      field_of_study: apiEdu.field_of_study,
      start_date: apiEdu.start_date,
      end_date: apiEdu.end_date,
      description: apiEdu.description,
      id: apiEdu.education_id,
      school: apiEdu.school_name,
      fieldOfStudy: apiEdu.field_of_study,
      duration: `${startYear} - ${endYear}`,
    }
  });

  return {
    id: data.id,
    name: data.full_name,
    headline: data.headline || '',
    avatar: data.avatar_url || '/assets/pngegg.png',
    location: data.location || '',
    about: data.about_text || '',
    skills: data.skills,
    experiences: experiences as any,
    educations: educations as any,
    connectionStatus: 'none',
    mutualConnections: 0,
  };
};

const routes: Record<string, string> = {
  home: "/feed",
  network: "/showcase",
  events: "/events",
  profile: "/profile",
  settings: "/settings",
  jobs: "/jobs",
  analytics: "/analytics",
}

function ReadOnlyExperienceItem({ experience }: { experience: any }) {
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
    </div>
  )
}

function ReadOnlyEducationItem({ education }: { education: any }) {
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
    </div>
  )
}

export default function PublicProfile({ userId }: PublicProfileProps) {
  const router = useRouter()
  const { isFollowing, followUser, unfollowUser, startChat } = useSocial()
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicPosts, setPublicPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  useEffect(() => {
    if (typeof userId === 'string') {
      const fetchUser = async () => {
        setLoading(true);
        setError(null);
        try {
          const userData = await getUserById(userId);
          setUser(transformUserData(userData));
        } catch (err) {
          setError('Failed to load user profile.');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [userId]);

  useEffect(() => {
    if (typeof userId === 'string') {
      const fetchPosts = async () => {
        setLoadingPosts(true)
        try {
          // Fetch 'All' category for initial view
          const data = await getPublicProfilePosts(userId, 'All')
          const mappedPosts = data.posts.map(mapPublicPostToPost)
          setPublicPosts(mappedPosts)
        } catch (err) {
          console.error("Failed to fetch public posts:", err)
        } finally {
          setLoadingPosts(false)
        }
      }
      fetchPosts()
    }
  }, [userId])

  const isUserFollowing = user ? isFollowing(user.id) : false;

  const navigateTo = (page: Page) => {
    router.push(routes[page] ?? "/feed")
  }

  const handleFollowToggle = () => {
    if (!user) return;
    if (isUserFollowing) {
      unfollowUser(user.id);
    } else {
      followUser(user.id);
    }
  }

  const handleMessage = () => {
    if (!user) return;
    startChat(user.id);
  }

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg font-medium">Loading profile...</div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg text-red-500">{error}</div>
        </div>
    );
  }

  if (!user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="text-lg">User not found.</div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="profile" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto py-6 md:py-8 pb-20 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-8">
              {/* Header Card */}
              <div className="rounded-xl overflow-hidden border mb-4 relative bg-card border-border">
                <div className="h-36 bg-gradient-to-r from-[#4169E1] via-[#A855F7] to-[#EC4899] relative"></div>

                <div className="px-6 pb-6">
                  <div className="flex items-start justify-between -mt-14 mb-4">
                    <div className="w-32 h-32 rounded-full border-4 border-background bg-card overflow-hidden flex-shrink-0 relative">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-16 flex gap-2">
                        <button
                            onClick={handleMessage}
                            className="bg-background hover:bg-muted text-foreground border border-input px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Message
                        </button>
                        <button
                            onClick={handleFollowToggle}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
                                isUserFollowing
                                ? "bg-muted text-foreground hover:bg-muted/80"
                                : "bg-primary text-primary-foreground hover:opacity-90"
                            }`}
                        >
                            {isUserFollowing ? (
                                <>
                                    <UserCheck className="w-4 h-4" />
                                    Following
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-4 h-4" />
                                    Follow
                                </>
                            )}
                        </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl text-foreground">{user.name}</h1>
                      <CheckCircle className="w-5 h-5 text-primary fill-primary/10" />
                      {user.connectionStatus !== 'none' && (
                         <span className="text-sm text-muted-foreground">· {user.connectionStatus === 'connected' ? '1st' : '2nd'}</span>
                      )}
                    </div>

                    <p className="text-base mb-2 text-foreground">
                      {user.headline}
                    </p>

                    <div className="flex items-center gap-2 text-xs mb-2 text-muted-foreground">
                      <span>{user.location}</span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">{user.mutualConnections} mutual connections</p>

                    {/* Identity Chips - Read Only */}
                    <ProfileIdentityChips initialIdentity={initialIdentity} readOnly />
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="rounded-xl border p-4 mb-6 bg-card border-border">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl mb-1 text-foreground">{isUserFollowing ? "501" : "500"}+</p>
                    <p className="text-xs text-muted-foreground">Connections</p>
                  </div>
                  <div className="text-center border-l border-r border-border">
                    <p className="text-xl mb-1 text-foreground">--</p>
                    <p className="text-xs text-muted-foreground">Profile Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl mb-1 text-foreground">{publicPosts.length}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                </div>
              </div>

              {/* Skill Overlap - Differentiator */}
              <SkillOverlap currentUserSkills={currentUserSkills} profileUserSkills={user.skills} />

              {/* About */}
              <div className="rounded-xl border p-6 mb-4 bg-card border-border">
                <h2 className="text-xl text-foreground mb-4">About</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {user.about}
                </p>
              </div>

              {/* Experience */}
              {user.experiences.length > 0 && (
                <div className="rounded-xl border p-6 mb-4 bg-card border-border">
                    <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-foreground">Experience</h2>
                    </div>

                    <div className="space-y-6">
                    {user.experiences.map((exp: any) => (
                        <ReadOnlyExperienceItem
                            key={exp.id}
                            experience={exp}
                        />
                    ))}
                    </div>
                </div>
              )}

              {/* Skills */}
              {user.skills.length > 0 && (
                  <div className="rounded-xl border p-6 mb-4 bg-card border-border">
                    <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-foreground">Skills</h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill) => (
                         <SkillProofPill
                            key={skill}
                            skill={skill}
                            experiences={user.experiences as any[]}
                            posts={publicPosts}
                            readOnly
                        />
                    ))}
                    </div>
                </div>
              )}

              {/* Education */}
              {user.educations.length > 0 && (
                <div className="rounded-xl border p-6 bg-card border-border">
                    <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl text-foreground">Education</h2>
                    </div>

                    <div className="space-y-6">
                    {user.educations.map((edu: any) => (
                        <ReadOnlyEducationItem
                            key={edu.id}
                            education={edu}
                        />
                    ))}
                    </div>
                </div>
              )}

              {/* Public Posts */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl text-foreground font-semibold">Posts</h2>
                  <button
                    onClick={() => router.push(`/profile/${userId}/posts`)}
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    See all posts
                  </button>
                </div>
                <div className="space-y-4">
                  {loadingPosts ? (
                    <div className="text-center py-4 text-muted-foreground">Loading posts...</div>
                  ) : publicPosts.length > 0 ? (
                      publicPosts.slice(0, 4).map(post => (
                        <FeedPost key={post.id} {...post} initialComments={post.commentData} />
                      ))
                  ) : (
                      <p className="text-muted-foreground text-sm">No recent public activity to show.</p>
                  )}
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