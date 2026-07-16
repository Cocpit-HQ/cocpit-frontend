"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { CompanyProfileData } from "../../../types/company-profile.types";
import { companyProfileService } from "../../../services/companyprofile.service";

interface CommunitySectionProps {
  data: CompanyProfileData;
}

export default function CommunitySection({ data }: CommunitySectionProps) {
  const queryClient = useQueryClient();
  const params = useParams();
  const slug = params.slug as string || "nexsus-global-systems";
  const community = data.community;

  const subscribeMutation = useMutation({
    mutationFn: () => {
      if (!community) return Promise.resolve();
      return community.isSubscribed
        ? companyProfileService.unsubscribeCommunity(community.communityId)
        : companyProfileService.subscribeCommunity(community.communityId);
    },
    onMutate: async () => {
      if (!community) return;
      await queryClient.cancelQueries({ queryKey: ["companyProfile", slug] });
      const previousProfile = queryClient.getQueryData(["companyProfile", slug]);
      
      queryClient.setQueryData(["companyProfile", slug], (old: any) => {
        if (!old) return old;
        const newIsSubscribed = !community.isSubscribed;
        const countDiff = newIsSubscribed ? 1 : -1;
        return {
          ...old,
          org: {
            ...old.org,
            subscribers_count: Math.max(0, (old.org?.subscribers_count || 0) + countDiff)
          },
          community_details: {
            ...old.community_details,
            is_subscribed: newIsSubscribed,
            subscriber_count: Math.max(0, (old.community_details?.subscriber_count || 0) + countDiff)
          }
        };
      });
      
      return { previousProfile };
    },
    onError: (err, variables, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["companyProfile", slug], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["companyProfile", slug] });
    }
  });

  if (!community) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "0px",
        gap: "16px",
        width: "960px",
        borderRadius: "24px",
        flex: "none",
        alignSelf: "stretch",
        flexGrow: 0,
      }}
      className="bg-white dark:bg-zinc-950 max-md:!w-full max-md:!h-auto max-md:!px-4 max-md:!mx-auto"
    >
      {/* Frame 2609076: Header */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "32px",
          flex: "none",
          alignSelf: "stretch",
          flexGrow: 0,
        }}
        className="max-md:!w-full max-md:!h-auto"
      >
        <h2
          style={{
            width: "147px",
            height: "32px",
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            fontSize: "24px",
            lineHeight: "32px",
            display: "flex",
            alignItems: "center",
            flex: "none",
            flexGrow: 0,
          }}
          className="text-black dark:text-white"
        >
          Channel
        </h2>
      </div>

      {/* Frame 2609101: Content row */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          padding: "0px",
          gap: "16px",
          width: "920px",
          height: "100px",
          flex: "none",
          alignSelf: "stretch",
          flexGrow: 0,
        }}
        className="max-md:!flex-col max-md:!w-full max-md:!h-auto max-md:!gap-4"
      >
        {/* Subtract: Banner Image */}
        <div
          style={{
            width: "178px",
            height: "100px",
            position: "relative",
            borderRadius: "24px",
            overflow: "hidden",
            flex: "none",
            flexGrow: 0,
          }}
          className="max-md:!w-full max-md:!h-[150px]"
        >
          <Image
            src={community.bannerUrl || "/images/companyonboarding/companycoverphotoDefault.png"}
            alt="Newsletter Cover"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Frame 2609102: Details Column */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            padding: "0px",
            gap: "8px",
            width: "726px",
            height: "100px",
            flex: "none",
            flexGrow: 1,
          }}
          className="max-md:!w-full max-md:!h-auto max-md:!items-center max-md:!text-center"
        >
          {/* Frame 2609103: Text Details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "0px",
              gap: "4px",
              width: "auto",
              height: "52px",
              flex: "none",
              flexGrow: 0,
            }}
          >
            <span
              style={{
                width: "auto",
                height: "24px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: "16px",
                lineHeight: "24px",
                display: "flex",
                alignItems: "center",
                flex: "none",
                flexGrow: 0,
              }}
              className="text-black dark:text-white"
            >
              {community.name}
            </span>
            <span
              style={{
                width: "auto",
                height: "24px",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 400,
                fontSize: "12px",
                lineHeight: "24px",
                display: "flex",
                alignItems: "center",
                flex: "none",
                flexGrow: 0,
              }}
              className="text-[#6B7280] dark:text-zinc-400"
            >
              {community.subscriberCount || 0} Subscriber
            </span>
          </div>

          {/* Frame 2608519: Subscribe Button */}
          {!community.isOwner && (
            <button
              onClick={() => subscribeMutation.mutate()}
              disabled={subscribeMutation.isPending || !community.communityId}
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                padding: "8px 16px",
                gap: "10px",
                width: "142px",
                height: "40px",
                border: "1px solid #1A73E8",
                borderRadius: "24px",
                flex: "none",
                flexGrow: 0,
                cursor: subscribeMutation.isPending ? "not-allowed" : "pointer",
              }}
              className={`transition-colors ${community.isSubscribed ? "bg-[#EFF4FF] hover:bg-blue-100 dark:bg-zinc-900 dark:hover:bg-zinc-800" : "bg-white hover:bg-blue-50 dark:bg-transparent dark:hover:bg-zinc-900"}`}
            >
              <span
                style={{
                  width: "auto",
                  height: "20px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 400,
                  fontSize: "14px",
                  lineHeight: "20px",
                  textAlign: "center",
                  color: "#1A73E8",
                  flex: "none",
                  flexGrow: 0,
                }}
              >
                {subscribeMutation.isPending ? "..." : (community.isSubscribed ? "Unsubscribe" : "Subscribe")}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
