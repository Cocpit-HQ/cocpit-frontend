export interface BusinessProfileStats {
  following: number;
  followers: number;
  subscribers: number;
}
export type CompanyProfileStats = BusinessProfileStats;

export interface BusinessTeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
}
export type CompanyTeamMember = BusinessTeamMember;

export interface BusinessPost {
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
export type CompanyPost = BusinessPost;

export interface BusinessCommunityData {
  communityId: string;
  name: string;
  bannerUrl?: string;
  description?: string;
  isSubscribed: boolean;
  subscriberCount: number;
  isOwner?: boolean;
}
export type CompanyCommunityData = BusinessCommunityData;

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

export interface BusinessProfileData {
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
  email?: string;
  phoneNumber?: string;
  isEmailShow?: boolean;
  isMobileShow?: boolean;
  showMessage?: boolean;
  showFollowersList?: boolean;
  showFollowingList?: boolean;
  founded?: string;
  offices?: { city: string; address: string }[];
  specialties?: string[];
  keyOfferings?: { id?: string; icon: string; label?: string; content: string }[];
  stats?: BusinessProfileStats;
  coreTeam?: BusinessTeamMember[];
  posts?: BusinessPost[];
  entityType?: 'COMPANY' | 'INSTITUTION';
  isFollowing?: boolean;
  isSubscribed?: boolean;
  isBlocked?: boolean;
  community?: BusinessCommunityData;
  employeeGrowth?: EmployeeGrowthData;
}
export type CompanyProfileData = BusinessProfileData;
