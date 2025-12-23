"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/AppShell"
import SuggestionsPanel from "@/components/SuggestionsPanel"
import type { Page } from "@/types/common"
import { Award, Briefcase, Star, Trophy, Building, Calendar } from "lucide-react"

// --- MOCK DATA (UNCHANGED) ---
const milestones = [
  {
    icon: Briefcase,
    title: "Promoted to Senior PM",
    company: "TechCorp Inc.",
    date: "Jan 2023",
  },
  {
    icon: Trophy,
    title: "Keynote Speaker at ProductCon",
    company: "Industry Conference",
    date: "Sep 2023",
  },
  {
    icon: Star,
    title: "Cross-functional Team Lead",
    company: "TechCorp Inc.",
    date: "May 2022",
  },
]

const projects = [
  {
    icon: Star,
    title: "AI Analytics Platform",
  },
  {
    icon: Briefcase,
    title: "Mobile App Revamp",
  },
  {
    icon: Trophy,
    title: "Internal Tools Overhaul",
  },
  {
    icon: Award,
    title: "Design System Implementation",
  },
]

const awards = [
  {
    icon: Award,
    title: "Innovator of the Year",
    description: "For outstanding contributions to product innovation.",
  },
  {
    icon: Trophy,
    title: "Top Performer Award",
    description: "Exceeding all quarterly performance targets.",
  },
]

// --- REUSABLE SUB-COMPONENTS ---

const SectionContainer = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="bg-card border border-border rounded-xl">
        <h2 className="text-xl font-semibold text-foreground p-6">{title}</h2>
        <div className="px-6 pb-6">{children}</div>
    </section>
);

const MilestoneCard = ({ item }: { item: typeof milestones[0] }) => {
  const Icon = item.icon;
  return (
    <div className="border border-border bg-card rounded-xl p-4 text-center flex flex-col items-center hover:border-primary transition-colors">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-bold text-foreground">{item.title}</h3>
        <p className="text-sm text-muted-foreground mt-1 flex items-center"><Building className="w-3 h-3 mr-1.5" /> {item.company}</p>
        <p className="text-sm text-muted-foreground mt-1 flex items-center"><Calendar className="w-3 h-3 mr-1.5" /> {item.date}</p>
    </div>
  );
};

const ProjectCard = ({ item }: { item: typeof projects[0] }) => {
  const Icon = item.icon;
  return (
    <div className="bg-muted/30 border border-border rounded-xl p-6 flex flex-col items-center justify-center text-center">
        <Icon className="w-8 h-8 text-muted-foreground mb-2" />
        <h3 className="font-semibold text-foreground">{item.title}</h3>
    </div>
  );
};

const AwardCard = ({ item }: { item: typeof awards[0] }) => {
    const Icon = item.icon;
    return (
        <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
                <h3 className="font-bold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            </div>
        </div>
    );
};

export default function AchievementsPage() {
  const router = useRouter();

  const navigateTo = (page: Page) => {
    const routes: Record<string, string> = { home: "/feed", network: "/showcase", events: "/events", profile: "/profile", settings: "/settings", jobs: "/jobs", analytics: "/analytics", achievements: "/achievements" };
    router.push(routes[page] ?? "/feed");
  };

  return (
    <div className="min-h-screen bg-background">
      <AppShell currentPage="achievements" navigateTo={navigateTo}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-20 md:pb-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            
            <main className="space-y-6 lg:col-span-8">
                <header>
                    <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Achievements</h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                      A summary of your professional milestones and recognitions.
                    </p>
                </header>

                <SectionContainer title="Career Milestones">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {milestones.map((item, index) => <MilestoneCard key={index} item={item} />)}
                    </div>
                </SectionContainer>

                <SectionContainer title="Project Accomplishments">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {projects.map((item, index) => <ProjectCard key={index} item={item} />)}
                    </div>
                </SectionContainer>

                <SectionContainer title="Recognition & Awards">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {awards.map((item, index) => <AwardCard key={index} item={item} />)}
                    </div>
                </SectionContainer>
            </main>

            <aside className="hidden lg:col-span-4 lg:block">
              <div className="sticky top-8 space-y-6">
                <SuggestionsPanel />
              </div>
            </aside>
            
          </div>
        </div>
      </AppShell>
    </div>
  );
};
