"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { companyProfileService } from "../../services/companyprofile.service";
import { CompanyProfileData } from "../../types/company-profile.types";
import { Icon } from "@iconify/react";
import { useSocial } from "@/context/SocialContext";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { EditAvatarModal, EditCoverModal } from "@/shared/commonComponents/Cocpitprofileupload";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Link as LinkIcon, Info, Ban } from "lucide-react";
import { OrganizationStatsModal } from "./OrganizationStatsModal";
import { ReportModal } from "@/components/shared/ReportModal";

interface CompanyProfileHeaderProps {
  data: CompanyProfileData;
  isOwnProfile: boolean;
  canManageCompany?: boolean;
  logoUrl?: string | null;
  coverUrl?: string | null;
  orgId?: string;
  onShareClick?: () => void;
}

const formatIndustryType = (industry?: string | null) => {
  if (!industry) return '';
  return industry
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function CompanyProfileHeader({ data, isOwnProfile, canManageCompany = false, logoUrl, coverUrl, orgId, onShareClick }: CompanyProfileHeaderProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const sourcePostId = searchParams.get('sourcePostId') || undefined;
  const slug = params.slug as string || "nexsus-global-systems";

  const [modalType, setModalType] = useState<"logo" | "cover" | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsModalTab, setStatsModalTab] = useState<"followers" | "following" | "subscribers">("followers");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { toast } = useToast();
  const { syncFollowStatus } = useSocial();
  const { activeProfile } = useActiveProfile();

  // If viewing as a company, only admins/owners of that company can follow/unfollow
  const activeProfilePermissions: string[] = (activeProfile?.viewer_role_data?.permissions as string[]) || [];
  const activeIsOwner = activeProfilePermissions.includes('*');
  const activeIsAdmin = (activeProfile?.viewer_role_data?.name || '').toUpperCase() === 'ADMIN';
  const actingCompanyCanFollow = activeProfile?.type !== 'COMPANY' || activeIsOwner || activeIsAdmin;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link copied to clipboard" });
  };

  // Utility to format numbers (e.g. 12500 -> 12.5k)
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => {
      const actingAsCompany = activeProfile?.type === 'COMPANY' && activeProfile.id;
      if (actingAsCompany) {
        // Company following/unfollowing another org — use org-level endpoints
        return data.isFollowing
          ? companyProfileService.organizationUnfollowOrganization(activeProfile.id, orgId!)
          : companyProfileService.organizationFollowOrganization(activeProfile.id, orgId!, sourcePostId);
      }
      // Regular user following/unfollowing an org
      return data.isFollowing
        ? companyProfileService.unfollowOrganization(orgId!)
        : companyProfileService.followOrganization(orgId!, sourcePostId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["companyProfile", slug] });
      const previousProfile = queryClient.getQueryData(["companyProfile", slug]);
      queryClient.setQueryData(["companyProfile", slug], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          relationship: {
            ...(old.relationship || {}),
            is_following: !data.isFollowing
          }
        };
      });
      if (orgId) {
        syncFollowStatus(orgId, !data.isFollowing);
      }
      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["companyProfile", slug], context.previousProfile);
        if (orgId) {
          syncFollowStatus(orgId, !!data.isFollowing);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
      if (orgId) {
        queryClient.invalidateQueries({ queryKey: ["company_relationship", orgId] });
        queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
        queryClient.invalidateQueries({ queryKey: ["company_followers", orgId] });
        queryClient.invalidateQueries({ queryKey: ["profileStats"] });
        queryClient.invalidateQueries({ queryKey: ["following"] });
      }
      // If acting as company, also refresh the acting company's following list and the relationship
      if (activeProfile?.type === 'COMPANY' && activeProfile.id) {
        queryClient.invalidateQueries({ queryKey: ["org_following", activeProfile.id] });
        queryClient.invalidateQueries({ queryKey: ["org_followers", orgId] });
        // Invalidate the relationship so the follow button state re-fetches correctly
        queryClient.invalidateQueries({ queryKey: ["orgRelationship", orgId, activeProfile.id] });
      }
    }
  });

  const blockMutation = useMutation({
    mutationFn: () => data.isBlocked
      ? companyProfileService.unblockTarget(orgId!)
      : companyProfileService.blockTarget(orgId!),
    onSuccess: () => {
      toast({
        title: data.isBlocked ? "Organization unblocked" : "Organization blocked",
        description: data.isBlocked
          ? `You have unblocked ${data.name}`
          : `You have blocked ${data.name}`
      });
      queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
    },
    onError: (err: any) => {
      toast({
        title: "Action failed",
        description: err.response?.data?.message || "Failed to update block status",
        variant: "destructive"
      });
    }
  });

  const handleBlockToggle = () => {
    if (!orgId) return;
    blockMutation.mutate();
  };



  return (
    <div className="w-full">
      {/* 960 x 224 Header Frame (Cover + Logo/Buttons Row) */}
      <div className="relative w-full h-[224px] sm:rounded-2xl">

        {/* 1. Cover Banner (960x160) */}
        <div className="relative w-full h-[160px] overflow-hidden sm:rounded-[24px]">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt="Cover"
              fill
              className="object-cover opacity-80"
              priority
            />
          ) : (
            <div
              className="w-full h-full"
              style={{ background: 'linear-gradient(186.03deg, #EEF2FF 4.68%, #6366F1 332.65%)' }}
            />
          )}

          {/* Cover Edit Icon */}
          {canManageCompany && orgId && (
            <button
              onClick={() => setModalType("cover")}
              className="absolute bottom-4 right-4 w-8 h-8 bg-[#1A73E8] rounded-full flex items-center justify-center text-white shadow-md z-10"
            >
              <Icon icon="iconoir:edit-pencil" width="24" height="24" />
            </button>
          )}
        </div>

        {/* 2. Logo & Buttons Row (Height 64px: from 160px to 224px) */}
        <div className="relative w-full h-[64px] pl-[30px] pr-[30px] max-md:!px-4 max-md:!h-[36px]">

          {/* Logo overlapping the cover */}
          <div className="absolute -top-12 left-[30px] w-[96px] h-[96px] bg-white rounded-xl border-2 border-white shadow-xl z-10 flex flex-col justify-center items-center max-md:!left-4 max-md:!w-[72px] max-md:!h-[72px] max-md:!-top-9">
            <Image
              src={logoUrl || (data.entityType === "INSTITUTION" ? "/images/companyonboarding/AluminiProfilePhoto.png" : "/images/companyonboarding/companyprofileDefault.jpg")}
              alt={`${data.name} Logo`}
              fill
              className="object-cover rounded-[10px]"
            />
            {/* Logo Edit Icon */}
            {canManageCompany && orgId && (
              <button
                onClick={() => setModalType("logo")}
                className="absolute bottom-[6px] right-[6px] w-8 h-8 bg-[#1A73E8] rounded-full flex items-center justify-center text-white shadow-md z-10"
              >
                <Icon icon="iconoir:edit-pencil" width="24" height="24" />
              </button>
            )}
          </div>

          {/* Action Buttons overlapping cover right edge (Only for own profile) */}
          {canManageCompany && (
            <div className="absolute top-[14px] right-[30px] flex gap-[10px] z-10 max-md:!hidden">
              <Link
                href={`/organization/${slug}/edit`}
                className="h-[36px] w-[140px] bg-[#1A73E8] text-white font-normal text-[14px] leading-[20px] rounded-[24px] shadow-sm flex items-center justify-center"
              >
                Edit page
              </Link>
              <button onClick={onShareClick} className="h-[36px] w-[140px] bg-transparent text-[#6B7280] border border-[#6B7280] font-normal text-[14px] leading-[20px] rounded-[24px] shadow-sm flex items-center justify-center">
                Share profile
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 3. Info & Stats Area (Below the 224px Header Frame) */}
      <div className="w-full pl-[40px] pr-[40px] pt-[24px] pb-2 max-md:!px-4 max-md:!pt-2">
        {/* Info & Stats Row (Frame 2608525) */}
        <div className="w-full flex flex-col md:flex-row justify-between items-start gap-[16px]">

          {/* Left Info (Frame 2608514) */}
          <div className="flex flex-col gap-[8px] w-full md:w-[608.4px]">

            {/* Name + tagline group (Frame 2608511) */}
            <div className="flex flex-col gap-0 w-full md:w-[608.4px]">
              {/* Title Block (Frame 2609085) */}
              <div className="flex justify-between items-start w-full md:w-[608.4px]">
                <div className="flex items-center gap-[8px] h-[32px] max-md:!h-auto max-md:!flex-wrap max-w-[calc(100%-32px)]">
                  <h1 className="text-[24px] font-semibold text-[#000000] dark:text-zinc-100 leading-[32px] w-fit tracking-tight max-md:!text-[20px] max-md:!leading-[28px]">
                    {data.name}
                  </h1>
                  {data.isVerified && (
                    <div className="relative w-[20px] h-[19px] ml-1 flex-shrink-0">
                      <svg
                        width="20"
                        height="19"
                        viewBox="0 0 20 19"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          position: "absolute",
                          left: "calc(50% - 20px/2)",
                          top: "calc(50% - 19px/2 + 0.5px)",
                        }}
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M14.9213 0.802899C14.7227 0.501414 14.4301 0.266256 14.0842 0.13016C13.7383 -0.00593544 13.3564 -0.0361985 12.9916 0.0435849L10.4024 0.608624C10.1371 0.666566 9.86133 0.666566 9.59598 0.608624L7.00677 0.0435849C6.64196 -0.0361985 6.26004 -0.00593544 5.91417 0.13016C5.56831 0.266256 5.27571 0.501414 5.07711 0.802899L3.66586 2.94266C3.52186 3.16156 3.32745 3.34626 3.09705 3.48444L0.844813 4.82521C0.528028 5.01373 0.280873 5.29126 0.137654 5.61929C-0.0055644 5.94732 -0.0377425 6.30958 0.0455866 6.65577L0.640326 9.11841C0.701094 9.37007 0.701094 9.63154 0.640326 9.8832L0.0455866 12.3445C-0.0380663 12.6909 -0.0060502 13.0534 0.137184 13.3817C0.280418 13.71 0.527755 13.9878 0.844813 14.1764L3.09705 15.5172C3.32745 15.654 3.52186 15.8387 3.6673 16.0576L5.07855 18.1973C5.48464 18.8144 6.25939 19.1195 7.00677 18.9567L9.59598 18.3916C9.86133 18.3337 10.1371 18.3337 10.4024 18.3916L12.993 18.9567C13.3577 19.0361 13.7393 19.0057 14.0848 18.8696C14.4304 18.7335 14.7228 18.4986 14.9213 18.1973L16.3325 16.0576C16.4765 15.8387 16.6709 15.654 16.9013 15.5172L19.155 14.1764C19.4721 13.9875 19.7193 13.7095 19.8623 13.3809C20.0053 13.0523 20.0369 12.6896 19.9528 12.3431L19.3595 9.8832C19.2985 9.6311 19.2985 9.36914 19.3595 9.11704L19.9542 6.65577C20.038 6.30952 20.0062 5.94707 19.8633 5.61877C19.7203 5.29047 19.4732 5.01263 19.1564 4.82384L16.9028 3.48307C16.6727 3.34601 16.4782 3.16126 16.334 2.94266L14.9213 0.802899ZM14.1969 6.44918C14.286 6.29358 14.3081 6.11122 14.2585 5.94047C14.2089 5.76973 14.0916 5.6239 13.9311 5.53369C13.7707 5.44347 13.5797 5.4159 13.3983 5.45676C13.2169 5.49763 13.0592 5.60375 12.9585 5.7528L9.19276 11.8082L6.91893 9.73954C6.85147 9.67374 6.77076 9.62151 6.6816 9.58599C6.59244 9.55046 6.49666 9.53236 6.39997 9.53276C6.30329 9.53316 6.20768 9.55205 6.11885 9.58832C6.03002 9.62458 5.94979 9.67747 5.88293 9.74383C5.81608 9.81019 5.76399 9.88867 5.72975 9.97457C5.69551 10.0605 5.67983 10.1521 5.68365 10.2438C5.68747 10.3356 5.71071 10.4257 5.75198 10.5088C5.79325 10.5919 5.8517 10.6662 5.92386 10.7273L8.85291 13.3938C8.93131 13.465 9.02562 13.5185 9.12882 13.5502C9.23201 13.582 9.34142 13.5911 9.44887 13.5771C9.55632 13.563 9.65903 13.526 9.74933 13.469C9.83964 13.4119 9.91521 13.3362 9.97039 13.2474L14.1969 6.44918Z"
                          fill="#1A73E8"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                {isOwnProfile && (
                  <div className="hidden max-md:flex flex-shrink-0 mt-1">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <button className="w-8 h-8 flex items-center justify-center text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full outline-none focus:outline-none focus:ring-0">
                          <Icon icon="ph:dots-three-outline-vertical-light" width="24" height="24" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent side="right" align="end" className="w-48">
                        <DropdownMenuItem onClick={handleCopyLink} className="flex items-center justify-between px-4 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-[24px] outline-none group transition-colors">
                          <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Copy profile</span>
                          <LinkIcon className="w-6 h-6 text-black dark:text-zinc-400 group-focus:text-[#6366F1] transition-colors" />
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onShareClick} className="flex items-center justify-between px-4 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-[24px] outline-none group transition-colors">
                          <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Share profile</span>
                          <Icon icon="fluent:share-24-regular" className="w-6 h-6 text-black dark:text-zinc-400 group-focus:text-[#6366F1] transition-colors" />
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {/* Tagline */}
              <p className="text-[16px] font-normal leading-[24px] text-[#000000] dark:text-zinc-200 w-full md:w-[608.4px]">
                {data.tagline}
              </p>
            </div>

            {/* Meta Info (Frame 2609071) */}
            <div className="flex flex-wrap items-center gap-[8px] w-full md:w-[608.4px] text-[12px] text-[#6B7280] dark:text-zinc-400">
              <span>{formatIndustryType(data.industry)}</span>
              <span className="w-[2px] h-[2px] bg-[#6B7280] dark:bg-zinc-600 rounded-full" />
              <span>{data.location}</span>
              <span className="w-[2px] h-[2px] bg-[#6B7280] dark:bg-zinc-600 rounded-full" />
              <span>{data.employeeCount ? `${data.employeeCount}${String(data.employeeCount).toLowerCase().includes('member') ? '' : ' members'}` : ''}</span>
            </div>

            {/* Website Link */}
            <div className="w-full md:w-[608.4px] h-[18px] flex items-center">
              <a href={data.websiteUrl} target="_blank" rel="noreferrer" className="text-[12px] font-normal leading-[18px] text-[#1A73E8] hover:underline">
                {data.websiteUrl}
              </a>
            </div>

            {/* Action Buttons (Only for public view / !isOwnProfile) */}
            {!isOwnProfile && (
              <div className="flex gap-[10px] pt-2 items-center">
                <button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending || !orgId || !actingCompanyCanFollow}
                  title={!actingCompanyCanFollow ? "Only company admins/owners can follow on behalf of the company" : ""}
                  className={`h-[36px] w-[140px] ${data.isFollowing ? 'bg-transparent text-[#6B7280] border border-[#6B7280]' : 'bg-[#1A73E8] text-white'} font-normal text-[14px] leading-[20px] rounded-[24px] hover:opacity-80 transition-colors shadow-sm flex items-center justify-center ${!actingCompanyCanFollow ? 'opacity-50 cursor-default' : ''}`}
                >
                  {followMutation.isPending ? "..." : data.isFollowing ? "Unfollow" : "Follow"}
                </button>
                {data.showMessage !== false && (
                  <Link
                    href={`/messaging?companyId=${orgId}`}
                    className="h-[36px] px-4 min-w-[120px] bg-transparent text-[#1A73E8] border border-[#1A73E8] font-normal text-[14px] leading-[20px] rounded-[24px] hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center"
                  >
                    Message
                  </Link>
                )}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <button className="w-[36px] h-[36px] bg-transparent text-[#1A73E8] border border-[#1A73E8] rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm outline-none focus:outline-none focus:ring-0">
                      <Icon icon="ph:dots-three-outline-vertical-light" className="w-[18px] h-[18px] text-[#1A73E8]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-48">
                    <DropdownMenuItem onClick={onShareClick} className="flex items-center justify-between px-4 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-[24px] outline-none group transition-colors">
                      <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Share profile</span>
                      <Icon icon="fluent:share-24-regular" className="w-6 h-6 text-black dark:text-zinc-400 group-focus:text-[#6366F1] transition-colors" />
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsReportModalOpen(true)} className="flex items-center justify-between px-4 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-[24px] outline-none group transition-colors">
                      <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">Report profile</span>
                      <Info className="w-6 h-6 text-black dark:text-zinc-400 group-focus:text-[#6366F1] transition-colors" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleBlockToggle}
                      disabled={blockMutation.isPending}
                      className="flex items-center justify-between px-4 py-2 cursor-pointer focus:bg-[#EEF2FF] focus:text-[#6366F1] rounded-[24px] outline-none group transition-colors"
                    >
                      <span className="text-sm font-medium text-foreground group-focus:text-[#6366F1]">
                        {blockMutation.isPending ? "Updating..." : data.isBlocked ? "Unblock profile" : "Block profile"}
                      </span>
                      <Ban className="w-6 h-6 text-black dark:text-zinc-400 group-focus:text-[#6366F1] transition-colors" />
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Right Stats (Frame 2609070) */}
          <div className="flex gap-[40px] items-center w-[295.6px] h-[48px] mt-6 md:mt-0 max-md:!gap-2 max-md:!w-full max-md:!h-auto max-md:!justify-start">
            {/* Following */}
            <div
              onClick={() => {
                setStatsModalTab("following");
                setIsStatsModalOpen(true);
              }}
              className="flex flex-col gap-[8px] w-[65.3px] transition-opacity cursor-pointer hover:opacity-80 max-md:!w-auto max-md:!h-[56px] max-md:!flex-1 max-md:!items-center max-md:!justify-center max-md:!gap-0 max-md:!bg-white max-md:dark:!bg-zinc-950 max-md:!shadow-[0_0_4px_rgba(99,102,241,0.05)] max-md:!rounded-[24px] max-md:!py-[8px] max-md:!px-[10px]"
            >
              <span className="text-[14px] font-semibold leading-[20px] text-[#1A73E8] tracking-[0.14px]">{formatNumber(data.stats?.following || 0)}</span>
              <span className="text-[14px] font-medium leading-[20px] text-[#6B7280] tracking-[0.14px] max-md:!font-normal max-md:!text-[14px] max-md:!text-[#000000] max-md:dark:!text-zinc-100 max-md:!text-center">Following</span>
            </div>

            {/* Followers */}
            <div
              onClick={() => {
                setStatsModalTab("followers");
                setIsStatsModalOpen(true);
              }}
              className="flex flex-col gap-[8px] w-[65.3px] transition-opacity cursor-pointer hover:opacity-80 max-md:!w-auto max-md:!h-[56px] max-md:!flex-1 max-md:!items-center max-md:!justify-center max-md:!gap-0 max-md:!bg-white max-md:dark:!bg-zinc-950 max-md:!shadow-[0_0_4px_rgba(99,102,241,0.05)] max-md:!rounded-[24px] max-md:!py-[8px] max-md:!px-[10px]"
            >
              <span className="text-[14px] font-semibold leading-[20px] text-[#1A73E8] tracking-[0.14px]">{formatNumber(data.stats?.followers || 0)}</span>
              <span className="text-[14px] font-medium leading-[20px] text-[#6B7280] tracking-[0.14px] max-md:!font-normal max-md:!text-[14px] max-md:!text-[#000000] max-md:dark:!text-zinc-100 max-md:!text-center">Followers</span>
            </div>

            {/* Subscribers */}
            <div
              onClick={() => { setStatsModalTab("subscribers"); setIsStatsModalOpen(true); }}
              className="flex flex-col gap-[8px] w-[85px] cursor-pointer hover:opacity-80 transition-opacity max-md:!w-auto max-md:!h-[56px] max-md:!flex-1 max-md:!items-center max-md:!justify-center max-md:!gap-0 max-md:!bg-white max-md:dark:!bg-zinc-950 max-md:!shadow-[0_0_4px_rgba(99,102,241,0.05)] max-md:!rounded-[24px] max-md:!py-[8px] max-md:!px-[10px]"
            >
              <span className="text-[14px] font-semibold leading-[20px] text-[#1A73E8] tracking-[0.14px]">{formatNumber(data.stats?.subscribers || 0)}</span>
              <span className="text-[14px] font-medium leading-[20px] text-[#6B7280] tracking-[0.14px] max-md:!font-normal max-md:!text-[14px] max-md:!text-[#000000] max-md:dark:!text-zinc-100 max-md:!text-center">Subscribers</span>
            </div>
          </div>

        </div>
      </div>

      {orgId && modalType === "logo" && (
        <EditAvatarModal
          isOpen={true}
          onClose={() => setModalType(null)}
          currentAvatarUrl={logoUrl || null}
          onUpload={async (file) => {
            const objectUrl = URL.createObjectURL(file);
            const previousProfile = queryClient.getQueryData(["companyProfile", slug]);
            queryClient.setQueryData(["companyProfile", slug], (old: any) => {
              if (!old) return old;
              return { ...old, org: { ...old.org, logo_url: objectUrl } };
            });

            try {
              await companyProfileService.uploadLogo(orgId, file);
              queryClient.invalidateQueries({ queryKey: ["company", slug] });
              queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
            } catch (err) {
              queryClient.setQueryData(["companyProfile", slug], previousProfile);
              toast({ title: "Error", description: "Failed to upload logo", variant: "destructive" });
            }
          }}
          onDelete={async () => {
            const previousProfile = queryClient.getQueryData(["companyProfile", slug]);
            queryClient.setQueryData(["companyProfile", slug], (old: any) => {
              if (!old) return old;
              return { ...old, org: { ...old.org, logo_url: null } };
            });

            try {
              await companyProfileService.deleteLogo(orgId);
              queryClient.invalidateQueries({ queryKey: ["company", slug] });
              queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
            } catch (err) {
              queryClient.setQueryData(["companyProfile", slug], previousProfile);
              toast({ title: "Error", description: "Failed to delete logo", variant: "destructive" });
            }
          }}
        />
      )}
      {orgId && modalType === "cover" && (
        <EditCoverModal
          isOpen={true}
          onClose={() => setModalType(null)}
          currentCoverUrl={coverUrl || null}
          onUpload={async (file) => {
            const objectUrl = URL.createObjectURL(file);
            const previousProfile = queryClient.getQueryData(["companyProfile", slug]);
            queryClient.setQueryData(["companyProfile", slug], (old: any) => {
              if (!old) return old;
              return { ...old, org: { ...old.org, cover_url: objectUrl } };
            });

            try {
              await companyProfileService.uploadCover(orgId, file);
              queryClient.invalidateQueries({ queryKey: ["company", slug] });
              queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
            } catch (err) {
              queryClient.setQueryData(["companyProfile", slug], previousProfile);
              toast({ title: "Error", description: "Failed to upload cover", variant: "destructive" });
            }
          }}
          onDelete={async () => {
            const previousProfile = queryClient.getQueryData(["companyProfile", slug]);
            queryClient.setQueryData(["companyProfile", slug], (old: any) => {
              if (!old) return old;
              return { ...old, org: { ...old.org, cover_url: null } };
            });

            try {
              await companyProfileService.deleteCover(orgId);
              queryClient.invalidateQueries({ queryKey: ["company", slug] });
              queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
            } catch (err) {
              queryClient.setQueryData(["companyProfile", slug], previousProfile);
              toast({ title: "Error", description: "Failed to delete cover", variant: "destructive" });
            }
          }}
        />
      )}

      {orgId && (
        <OrganizationStatsModal
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          initialTab={statsModalTab}
          orgId={orgId}
          isOwnProfile={canManageCompany}
          showFollowersList={data.showFollowersList}
          showFollowingList={data.showFollowingList}
        />
      )}

      {orgId && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          targetType="COMPANY"
          targetId={orgId}
        />
      )}
    </div>
  );
}
