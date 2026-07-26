export interface CompanyProfileStats {
  following: number;
  followers: number;
  subscribers: number;
}

export interface CompanyTeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}

export interface CompanyPost {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  authorSubLabel: string;
  timestamp: string;
  content: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  sharesCount: number;
  likedBy: { name: string; isOthers: boolean }[];
  sampleLikerUsername?: string;
}

export interface CompanyCommunityData {
  communityId: string;
  name: string;
  bannerUrl?: string;
  description?: string;
  isSubscribed: boolean;
  subscriberCount: number;
  isOwner?: boolean;
}

export interface EmployeeGrowthTrendPoint {
  month_num: number;
  month: string;
  full_month: string;
  joins: number;
  departures: number;
  headcount: number;
}

export interface EmployeeGrowthData {
  percentage: string;
  growth_value: number;
  base_count: number;
  current_headcount: number;
  total_joins: number;
  max_y: number;
  y_ticks: number[];
  start_month: string;
  current_month: string;
  trend: EmployeeGrowthTrendPoint[];
}

export interface CompanyProfileData {
  id: string;
  _id?: string;
  orgId: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  coverUrl?: string;
  isVerified: boolean;
  tagline: string;
  industry: string;
  location: string;
  employeeCount: string;
  websiteUrl: string;
  description: string;
  slogan: string;
  socialLinks: { label: string; platform?: string; url: string }[];
  phoneNumber?: string;
  founded?: string;
  offices?: { city: string; address: string }[];
  specialties?: string[];
  keyOfferings?: { id?: string; icon: string; label?: string; content: string }[];
  stats?: CompanyProfileStats;
  coreTeam?: CompanyTeamMember[];
  posts?: CompanyPost[];
  entityType?: 'COMPANY' | 'INSTITUTE';
  isFollowing?: boolean;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  community?: CompanyCommunityData;
  employeeGrowth?: EmployeeGrowthData;
}
