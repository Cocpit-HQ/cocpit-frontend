"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { companyProfileService } from "../../services/companyprofile.service";
import { CompanyProfileData } from "../../types/company-profile.types";
import { Icon } from "@iconify/react";
import { EditAvatarModal, EditCoverModal } from "@/shared/commonComponents/Cocpitprofileupload";

interface CompanyProfileHeaderProps {
  data: CompanyProfileData;
  isOwnProfile: boolean;
  logoUrl?: string | null;
  coverUrl?: string | null;
  orgId?: string;
  onLogoChange?: React.Dispatch<React.SetStateAction<string | null>>;
  onCoverChange?: React.Dispatch<React.SetStateAction<string | null>>;
  onShareClick?: () => void;
}

export default function CompanyProfileHeader({ data, isOwnProfile, logoUrl, coverUrl, orgId, onLogoChange, onCoverChange, onShareClick }: CompanyProfileHeaderProps) {
  const params = useParams();
  const slug = params.slug as string || "nexsus-global-systems";
  
  const [modalType, setModalType] = useState<"logo" | "cover" | null>(null);

  const handleUploadSuccess = (url: string) => {
    if (modalType === "logo" && onLogoChange) {
      onLogoChange(url);
    } else if (modalType === "cover" && onCoverChange) {
      onCoverChange(url);
    }
  };

  // Utility to format numbers (e.g. 12500 -> 12.5k)
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => data.isFollowing 
      ? companyProfileService.unfollowOrganization(orgId!)
      : companyProfileService.followOrganization(orgId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["company", slug] });
      const previousProfile = queryClient.getQueryData(["company", slug]);
      queryClient.setQueryData(["company", slug], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          relationship: {
            ...(old.relationship || {}),
            is_following: !data.isFollowing
          }
        };
      });
      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["company", slug], context.previousProfile);
      }
    }
  });



  return (
    <div className="w-full">
      {/* 960 x 224 Header Frame (Cover + Logo/Buttons Row) */}
      <div className="relative w-full h-[224px] bg-white dark:bg-zinc-950 sm:rounded-t-2xl">
        
        {/* 1. Cover Banner (960x160) */}
        <div className="relative w-full h-[160px] bg-slate-900 overflow-hidden sm:rounded-t-2xl">
          <Image
            src={coverUrl || (data.entityType === "INSTITUTE" ? "/images/companyonboarding/AluminiCoverPage.png" : "/images/companyonboarding/companycoverphotoDefault.png")}
            alt="Cover"
            fill
            className="object-cover opacity-80"
            priority
          />
          
          {/* Cover Edit Icon */}
          {isOwnProfile && orgId && (
            <button 
              onClick={() => setModalType("cover")}
              className="absolute bottom-4 right-4 w-8 h-8 bg-[#1A73E8] rounded-full flex items-center justify-center text-white shadow-md z-10"
            >
              <Icon icon="iconoir:edit-pencil" width="24" height="24" />
            </button>
          )}
        </div>

        {/* 2. Logo & Buttons Row (Height 64px: from 160px to 224px) */}
        <div className="relative w-full h-[64px] pl-[30px] pr-[30px]">
          
          {/* Logo overlapping the cover */}
          <div className="absolute -top-12 left-[30px] w-[96px] h-[96px] bg-white rounded-xl border-2 border-white shadow-xl z-10 flex flex-col justify-center items-center">
            <Image
              src={logoUrl || (data.entityType === "INSTITUTE" ? "/images/companyonboarding/AluminiProfilePhoto.png" : "/images/companyonboarding/companyprofileDefault.jpg")}
              alt={`${data.name} Logo`}
              fill
              className="object-cover rounded-[10px]"
            />
            {/* Logo Edit Icon */}
            {isOwnProfile && orgId && (
              <button 
                onClick={() => setModalType("logo")}
                className="absolute bottom-[6px] right-[6px] w-8 h-8 bg-[#1A73E8] rounded-full flex items-center justify-center text-white shadow-md z-10"
              >
                <Icon icon="iconoir:edit-pencil" width="24" height="24" />
              </button>
            )}
          </div>

          {/* Action Buttons overlapping cover right edge (Only for own profile) */}
          {isOwnProfile && (
            <div className="absolute top-[14px] right-[30px] flex gap-[10px] z-10">
              <Link
                href={`/organization/${slug}/edit`}
                className="h-[36px] w-[140px] bg-[#1A73E8] text-white font-normal text-[14px] leading-[20px] rounded-[24px] hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
              >
                Edit page
              </Link>
              <button onClick={onShareClick} className="h-[36px] w-[140px] bg-transparent text-[#6B7280] border border-[#6B7280] font-normal text-[14px] leading-[20px] rounded-[24px] hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center">
                Share profile
              </button>
            </div>
          )}

        </div>
      </div>

      {/* 3. Info & Stats Area (Below the 224px Header Frame) */}
      <div className="w-full pl-[40px] pr-[40px] pt-[24px] pb-2">
        {/* Info & Stats Row (Frame 2608525) */}
        <div className="w-full flex flex-col md:flex-row justify-between items-start gap-[16px]">
          
          {/* Left Info (Frame 2608514) */}
          <div className="flex flex-col gap-[8px] w-full md:w-[608.4px]">
            
            {/* Name + tagline group (Frame 2608511) */}
            <div className="flex flex-col gap-0 w-full md:w-[608.4px]">
              {/* Title Block (Frame 2609085) */}
              <div className="flex items-center gap-[8px] w-full md:w-[608.4px] h-[32px]">
                <h1 className="text-[24px] font-semibold text-[#000000] dark:text-zinc-100 leading-[32px] w-fit tracking-tight">
                  {data.name}
                </h1>
                {data.isVerified && (
                  <div className="w-8 h-8 flex items-center justify-center relative">
                    <Icon icon="bitcoin-icons:verify-filled" className="text-[#1A73E8]" width="32" height="32" />
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
              <span>{data.industry}</span>
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
                  disabled={followMutation.isPending || !orgId}
                  className={`h-[36px] w-[140px] ${data.isFollowing ? 'bg-transparent text-[#6B7280] border border-[#6B7280]' : 'bg-[#1A73E8] text-white'} font-normal text-[14px] leading-[20px] rounded-[24px] hover:opacity-80 transition-colors shadow-sm flex items-center justify-center`}
                >
                  {followMutation.isPending ? "..." : data.isFollowing ? "Unfollow" : "Follow"}
                </button>
                <Link 
                  href={`/messaging?companyId=${orgId}`}
                  className="h-[36px] px-4 min-w-[120px] bg-transparent text-[#1A73E8] border border-[#1A73E8] font-normal text-[14px] leading-[20px] rounded-[24px] hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center"
                >
                  Message
                </Link>
                <button className="w-[36px] h-[36px] bg-transparent text-[#1A73E8] border border-[#1A73E8] rounded-full flex items-center justify-center hover:bg-blue-50 transition-colors shadow-sm">
                  <Icon icon="ph:dots-three-outline-vertical-light" className="w-[18px] h-[18px] text-[#1A73E8]" />
                </button>
              </div>
            )}
          </div>

          {/* Right Stats (Frame 2609070) */}
          <div className="flex gap-[40px] items-center w-[295.6px] h-[48px] mt-6 md:mt-0">
            {/* Following */}
            <div className="flex flex-col gap-[8px] w-[65.3px]">
              <span className="text-[14px] font-semibold leading-[20px] text-[#1A73E8] tracking-[0.14px]">{formatNumber(data.stats?.following || 0)}</span>
              <span className="text-[14px] font-medium leading-[20px] text-[#6B7280] tracking-[0.14px]">Following</span>
            </div>

            {/* Followers */}
            <div className="flex flex-col gap-[8px] w-[65.3px]">
              <span className="text-[14px] font-semibold leading-[20px] text-[#1A73E8] tracking-[0.14px]">{formatNumber(data.stats?.followers || 0)}</span>
              <span className="text-[14px] font-medium leading-[20px] text-[#6B7280] tracking-[0.14px]">Followers</span>
            </div>

            {/* Subscribers */}
            <div className="flex flex-col gap-[8px] w-[85px]">
              <span className="text-[14px] font-semibold leading-[20px] text-[#1A73E8] tracking-[0.14px]">{formatNumber(data.stats?.subscribers || 0)}</span>
              <span className="text-[14px] font-medium leading-[20px] text-[#6B7280] tracking-[0.14px]">Subscribers</span>
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
            const data = await companyProfileService.uploadLogo(orgId, file);
            handleUploadSuccess(data.url);
            queryClient.invalidateQueries({ queryKey: ["company", slug] });
            queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
          }}
          onDelete={async () => {
            await companyProfileService.deleteLogo(orgId);
            if (onLogoChange) onLogoChange(null);
            queryClient.invalidateQueries({ queryKey: ["company", slug] });
            queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
          }}
        />
      )}
      {orgId && modalType === "cover" && (
        <EditCoverModal
          isOpen={true}
          onClose={() => setModalType(null)}
          currentCoverUrl={coverUrl || null}
          onUpload={async (file) => {
            const data = await companyProfileService.uploadCover(orgId, file);
            handleUploadSuccess(data.url);
            queryClient.invalidateQueries({ queryKey: ["company", slug] });
            queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
          }}
          onDelete={async () => {
            await companyProfileService.deleteCover(orgId);
            if (onCoverChange) onCoverChange(null);
            queryClient.invalidateQueries({ queryKey: ["company", slug] });
            queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
          }}
        />
      )}
    </div>
  );
}
