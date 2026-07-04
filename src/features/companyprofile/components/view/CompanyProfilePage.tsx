"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { companyService } from "@/services/organization.service";
import { CompanyProfileData } from "../../types/company-profile.types";
import CompanyProfileHeader from "./CompanyProfileHeader";
import CompanyProfileTabs from "./CompanyProfileTabs";

// Mock Data to develop the UI
const MOCK_COMPANY_DATA: CompanyProfileData = {
  id: "c-123",
  name: "Nexsus Global Systems",
  isVerified: true,
  tagline: "SaaS and Fintech Solutions",
  industry: "Technology",
  location: "Mumbai, Maharashtra, India",
  employeeCount: "1 - 50 Members",
  websiteUrl: "https://www.nexsus.com",
  description: "Nexsus Global Systems is a global leader in AI-driven operational excellence. Our mission is to bridge the gap between complex data systems and human-centric decision making.",
  slogan: "Innovating the infrastructure of tomorrow, today.",
  socialLinks: [
    { label: "technova.io", url: "https://technova.io" },
    { label: "twitter", url: "https://twitter.com/nexsus" }
  ],
  stats: {
    following: 120,
    followers: 12500, // format as 12.5K later
    subscribers: 989
  },
  coreTeam: [
    { id: "1", name: "Emma", role: "HR", avatarUrl: "https://i.pravatar.cc/150?u=emma" },
    { id: "2", name: "James", role: "Manager", avatarUrl: "https://i.pravatar.cc/150?u=james" },
    { id: "3", name: "Sophia", role: "SMM", avatarUrl: "https://i.pravatar.cc/150?u=sophia" },
    { id: "4", name: "Michael", role: "Content man...", avatarUrl: "https://i.pravatar.cc/150?u=michael" }
  ],
  posts: [],
  entityType: "COMPANY"
};

const MOCK_EDUCATION_DATA: CompanyProfileData = {
  id: "e-456",
  name: "Westbridge University",
  isVerified: true,
  tagline: "Empowering future leaders through innovation, research, and excellence in education.",
  industry: "Higher Education",
  location: "Mumbai, Maharashtra, India",
  employeeCount: "1 - 50 Members",
  websiteUrl: "https://www.westbridge.edu",
  description: "Westbridge University is dedicated to academic excellence and preparing students to become leaders in their fields.",
  slogan: "Excellence in Education, Leadership in Life.",
  socialLinks: [
    { label: "westbridge.edu", url: "https://www.westbridge.edu" }
  ],
  stats: {
    following: 120,
    followers: 12500,
    subscribers: 989
  },
  coreTeam: [
    { id: "1", name: "Alex Rivera", role: "Principal Engineer", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
    { id: "2", name: "Jordan Smyth", role: "VP Engineering", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
    { id: "3", name: "David Miller", role: "Senior Engineer", avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" }
  ],
  posts: [],
  entityType: "INSTITUTE"
};

interface CompanyProfilePageProps {
  isOwnProfile?: boolean;
}

export default function CompanyProfilePage({ isOwnProfile = false }: CompanyProfilePageProps) {
  const params = useParams();
  const slug = (params?.slug as string) || "nexsus-global-systems";

  const { data: company } = useQuery({
    queryKey: ["company", slug],
    queryFn: () => companyService.getCompany(slug),
    retry: false,
  });

  const isEdu = slug === "westbridge-university" || company?.entity_type === "INSTITUTION";
  const baseMock = isEdu ? MOCK_EDUCATION_DATA : MOCK_COMPANY_DATA;

  const data: CompanyProfileData = company ? {
    ...baseMock,
    id: company.company_id || company.org_id || baseMock.id,
    name: company.name || baseMock.name,
    tagline: company.headline || company.slogan || baseMock.tagline,
    industry: company.industry || (isEdu ? "Higher Education" : baseMock.industry),
    location: company.location || baseMock.location,
    employeeCount: company.size || baseMock.employeeCount,
    websiteUrl: company.website || baseMock.websiteUrl,
    description: company.description || baseMock.description,
    slogan: company.slogan || baseMock.slogan,
    entityType: isEdu ? "INSTITUTE" : "COMPANY",
  } : baseMock;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-poppins pb-20">
      {/* Container max width 960px, shifted to align with the 998px header search box */}
      <div 
        style={{ marginLeft: "max(0px, calc((100% - 998px) / 2))" }}
        className="w-full max-w-[960px] sm:px-4 md:px-0 pt-[20px]"
      >

        {/* Header Section */}
        <CompanyProfileHeader data={data} isOwnProfile={isOwnProfile} />

        {/* Tabs and Content Section */}
        <div className="mt-4 pl-[40px] pr-0">
          <CompanyProfileTabs data={data} isOwnProfile={isOwnProfile} />
        </div>

      </div>
    </div>
  );
}
