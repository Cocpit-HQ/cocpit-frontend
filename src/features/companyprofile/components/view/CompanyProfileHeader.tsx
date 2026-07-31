"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
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
          : companyProfileService.organizationFollowOrganization(activeProfile.id, orgId!);
      }
      // Regular user following/unfollowing an org
      return data.isFollowing
        ? companyProfileService.unfollowOrganization(orgId!)
        : companyProfileService.followOrganization(orgId!);
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
                    <div className="w-8 h-8 flex items-center justify-center relative">
                      <Icon icon="bitcoin-icons:verify-filled" className="text-[#1A73E8]" width="32" height="32" />
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
              <span>{data.employeeCount}</span>
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
                  className={`h-[36px] w-[140px] ${data.isFollowing ? 'bg-transparent text-[#6B7280] border border-[#6B7280]' : 'bg-[#1A73E8] text-white'} font-normal text-[14px] leading-[20px] rounded-[24px] hover:opacity-80 transition-colors shadow-sm flex items-center justify-center ${!actingCompanyCanFollow ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {followMutation.isPending ? "..." : data.isFollowing ? "Unfollow" : "Follow"}
                </button>
                <Link 
                  href={`/messaging?companyId=${orgId}`}
                  className="h-[36px] px-4 min-w-[120px] bg-transparent text-[#1A73E8] border border-[#1A73E8] font-normal text-[14px] leading-[20px] rounded-[24px] hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center"
                >
                  Message
                </Link>
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
              onClick={() => { setStatsModalTab("following"); setIsStatsModalOpen(true); }}
              className="flex flex-col gap-[8px] w-[65.3px] cursor-pointer hover:opacity-80 transition-opacity max-md:!w-auto max-md:!h-[56px] max-md:!flex-1 max-md:!items-center max-md:!justify-center max-md:!gap-0 max-md:!bg-white max-md:dark:!bg-zinc-950 max-md:!shadow-[0_0_4px_rgba(99,102,241,0.05)] max-md:!rounded-[24px] max-md:!py-[8px] max-md:!px-[10px]"
            >
              <span className="text-[14px] font-semibold leading-[20px] text-[#1A73E8] tracking-[0.14px]">{formatNumber(data.stats?.following || 0)}</span>
              <span className="text-[14px] font-medium leading-[20px] text-[#6B7280] tracking-[0.14px] max-md:!font-normal max-md:!text-[14px] max-md:!text-[#000000] max-md:dark:!text-zinc-100 max-md:!text-center">Following</span>
            </div>

            {/* Followers */}
            <div 
              onClick={() => { setStatsModalTab("followers"); setIsStatsModalOpen(true); }}
              className="flex flex-col gap-[8px] w-[65.3px] cursor-pointer hover:opacity-80 transition-opacity max-md:!w-auto max-md:!h-[56px] max-md:!flex-1 max-md:!items-center max-md:!justify-center max-md:!gap-0 max-md:!bg-white max-md:dark:!bg-zinc-950 max-md:!shadow-[0_0_4px_rgba(99,102,241,0.05)] max-md:!rounded-[24px] max-md:!py-[8px] max-md:!px-[10px]"
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
