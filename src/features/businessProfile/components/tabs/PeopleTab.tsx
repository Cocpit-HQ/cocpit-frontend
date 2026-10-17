"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BusinessProfileData } from "../../types/business-profile.types";
import { Search } from "lucide-react";
import { useQuery, keepPreviousData, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { useDebounce } from "@/hooks/use-debounce";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { sendConnectionRequest, cancelConnectionRequest } from "@/services/api/connections";
import { companyService } from "@/services/organization.service";
import { useSocial } from "@/context/SocialContext";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { EmptyPostsIcon } from "@/components/icons";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";

interface PeopleTabProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
}

export default function PeopleTab({ data, isOwnProfile }: PeopleTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isEdu =
    data.entityType === "INSTITUTION" ||
    (data as any)?.entity_type === "INSTITUTION" ||
    Boolean((data as any)?.institution_type) ||
    ["school", "college", "university", "coaching", "tuition", "higher education"].includes(((data as any)?.industry || "").toLowerCase().trim());
  const { activeProfile, isCompany } = useActiveProfile();
  const { syncFollowStatus, notifyFollowEvent } = useSocial();
  const isCompanyActor = Boolean(isCompany || activeProfile?.type === "COMPANY");
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [unfollowConfirmEmp, setUnfollowConfirmEmp] = useState<any | null>(null);
  const [optimisticActions, setOptimisticActions] = useState<Record<string, "connect" | "withdraw" | "message">>({});
  const [optimisticFollows, setOptimisticFollows] = useState<Record<string, boolean>>({});

  const { data: peopleData, isLoading } = useQuery({
    queryKey: ["orgPeople", data.id, debouncedSearch, isEdu],
    queryFn: () =>
      isEdu
        ? businessProfileService.getOrgAlumni(data.id, { page: 1, limit: 20, search: debouncedSearch })
        : businessProfileService.getOrgPeople(data.id, { page: 1, limit: 20, search: debouncedSearch }),
    placeholderData: keepPreviousData,
  });

  let distributions: any[] = [];
  if (peopleData?.insights) {
    const mapItems = (arr: any[]) =>
      (arr || []).map((item: any) => ({
        label: item.name || item.label || item._id || "",
        value: item.percentage ?? item.value ?? 0,
      }));

    distributions = [
      {
        title: "Location Distribution",
        items: mapItems(peopleData.insights.locationDistribution || peopleData.insights.location_distribution),
      },
      {
        title: "Top Skills",
        items: mapItems(peopleData.insights.topSkills || peopleData.insights.top_skills),
      },
      {
        title: "Role Distribution",
        items: mapItems(peopleData.insights.roleDistribution || peopleData.insights.role_distribution),
      },
      isEdu
        ? {
            title: "Current Employer Breakdown",
            items: mapItems(
              peopleData.insights.currentEmployerBreakdown ||
              peopleData.insights.current_employer_breakdown ||
              peopleData.insights.currentEmployer ||
              peopleData.insights.employerBreakdown
            ),
          }
        : {
            title: "Education Breakdown",
            items: mapItems(
              peopleData.insights.educationBreakdown || peopleData.insights.education_breakdown
            ),
          },
    ].filter((dist) => dist.items && dist.items.length > 0);
  }

  const currentUserIdStr = String(
    session?.user?.id ||
    (session?.user as any)?.user_id ||
    (session?.user as any)?.sub ||
    ""
  ).toLowerCase();

  const handleFollow = async (emp: any) => {
    const actingOrgId = activeProfile?.id;
    if (!actingOrgId) return;
    const empId = emp.id;
    try {
      setFollowLoadingId(empId);
      setOptimisticFollows((prev) => ({ ...prev, [empId]: true }));
      syncFollowStatus(empId, true);
      notifyFollowEvent(empId, true);
      await businessProfileService.organizationFollowUser(actingOrgId, empId);
      toast.success(`Followed ${emp.name}`);
      queryClient.invalidateQueries({ queryKey: ["orgPeople", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orgPeoplePreview", data.id] });
      queryClient.invalidateQueries({ queryKey: ["org_following", actingOrgId] });
      queryClient.invalidateQueries({ queryKey: ["org_followers", actingOrgId] });
    } catch (error: any) {
      setOptimisticFollows((prev) => ({ ...prev, [empId]: false }));
      syncFollowStatus(empId, false);
      notifyFollowEvent(empId, false);
      const msg = error?.response?.data?.message || "Failed to follow";
      toast.error(msg);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleUnfollow = async (emp: any) => {
    const actingOrgId = activeProfile?.id;
    if (!actingOrgId) return;
    const empId = emp.id;
    try {
      setFollowLoadingId(empId);
      setOptimisticFollows((prev) => ({ ...prev, [empId]: false }));
      syncFollowStatus(empId, false);
      notifyFollowEvent(empId, false);
      await businessProfileService.organizationUnfollowUser(actingOrgId, empId);
      toast.success(`Unfollowed ${emp.name}`);
      queryClient.invalidateQueries({ queryKey: ["orgPeople", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orgPeoplePreview", data.id] });
      queryClient.invalidateQueries({ queryKey: ["org_following", actingOrgId] });
      queryClient.invalidateQueries({ queryKey: ["org_followers", actingOrgId] });
    } catch (error: any) {
      setOptimisticFollows((prev) => ({ ...prev, [empId]: true }));
      syncFollowStatus(empId, true);
      notifyFollowEvent(empId, true);
      const msg = error?.response?.data?.message || "Failed to unfollow";
      toast.error(msg);
    } finally {
      setFollowLoadingId(null);
    }
  };

  const handleConfirmUnfollow = async () => {
    if (!unfollowConfirmEmp) return;
    const target = unfollowConfirmEmp;
    setUnfollowConfirmEmp(null);
    await handleUnfollow(target);
  };

  const getActionForEmp = (emp: any): "empty" | "connect" | "withdraw" | "message" | "follow" | "unfollow" => {
    const empId = String(emp.user_id || emp.id || emp._id || "").toLowerCase();

    if (isCompanyActor) {
      if (empId && activeProfile?.id && empId === activeProfile.id.toLowerCase()) {
        return "empty";
      }
      if (empId in optimisticFollows) {
        return optimisticFollows[empId] ? "unfollow" : "follow";
      }
      const isFollowing = Boolean(emp.is_following || emp.isFollowing);
      return isFollowing ? "unfollow" : "follow";
    }

    // Check optimistic override first
    if (optimisticActions[empId]) {
      return optimisticActions[empId];
    }

    // Check if the member is the current logged-in user
    if (empId && currentUserIdStr && (empId === currentUserIdStr || emp.account_name?.toLowerCase() === currentUserIdStr)) {
      return "empty";
    }

    // 1. Direct boolean flags
    if (emp.is_connected === true || emp.isConnected === true) {
      return "message";
    }

    // 2. Normalized connection / relationship status strings
    const status = String(
      emp.connection_request_status ||
      emp.connection_status ||
      emp.connectionStatus ||
      emp.relationship_status ||
      emp.relationship ||
      emp.status ||
      ""
    ).toLowerCase().trim();

    const sender = String(
      emp.connection_request_sender ||
      emp.sender ||
      emp.connection_sender ||
      ""
    ).toLowerCase().trim();

    if (status === "connected") {
      return "message";
    }

    if (status === "pending_sent") {
      return "withdraw";
    }

    if (status === "pending") {
      if (sender === "them") {
        return "withdraw";
      }
      return "withdraw";
    }

    return "connect";
  };

  const rawList = peopleData?.people || peopleData?.alumni || [];
  const filteredList = searchQuery.trim()
    ? rawList.filter((emp: any) => {
        const q = searchQuery.toLowerCase().trim();
        const name = (emp.full_name || emp.name || "").toLowerCase();
        const role = (emp.headline || emp.role_display || emp.title || emp.role || "").toLowerCase();
        return name.includes(q) || role.includes(q);
      })
    : rawList;

  const employeesList = filteredList.map((emp: any) => {
    const empId = String(emp.user_id || emp.id || emp._id || "");
    const action = getActionForEmp(emp);

    return {
      id: empId,
      name: emp.full_name || emp.name || "Unknown",
      role: emp.headline || emp.role_display || emp.title || emp.role || "",
      avatar: emp.avatar_url || emp.avatar || emp.profile_image || null,
      account_name: emp.account_name || empId,
      action,
      connection_request_id: emp.connection_request_id || emp.request_id || emp.connectionRequestId || null,
      is_connected: emp.is_connected || emp.isConnected || action === "message",
    };
  });

  const handleConnect = async (emp: any) => {
    const empId = emp.id;
    try {
      setConnectingId(empId);
      setOptimisticActions((prev) => ({ ...prev, [empId]: "withdraw" }));

      if (isCompany && activeProfile?.id) {
        try {
          await companyService.sendConnectionRequest(activeProfile.id, empId);
        } catch {
          await sendConnectionRequest(empId);
        }
      } else {
        await sendConnectionRequest(empId);
      }

      toast.success("Connection request sent");
      queryClient.invalidateQueries({ queryKey: ["orgPeople", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orgPeoplePreview", data.id] });
    } catch (error: any) {
      setOptimisticActions((prev) => {
        const next = { ...prev };
        delete next[empId];
        return next;
      });
      const msg = error?.response?.data?.message || "Failed to send connection request";
      toast.error(msg);
    } finally {
      setConnectingId(null);
    }
  };

  const handleWithdraw = async (emp: any) => {
    const empId = emp.id;
    try {
      setWithdrawingId(empId);
      setOptimisticActions((prev) => ({ ...prev, [empId]: "connect" }));

      if (isCompany && activeProfile?.id) {
        try {
          await companyService.cancelConnectionRequest(activeProfile.id, empId);
        } catch {
          const reqId = emp.connection_request_id || empId;
          await cancelConnectionRequest(reqId);
        }
      } else {
        const reqId = emp.connection_request_id || empId;
        await cancelConnectionRequest(reqId);
      }

      toast.success("Connection request withdrawn");
      queryClient.invalidateQueries({ queryKey: ["orgPeople", data.id] });
      queryClient.invalidateQueries({ queryKey: ["orgPeoplePreview", data.id] });
    } catch (error: any) {
      setOptimisticActions((prev) => {
        const next = { ...prev };
        delete next[empId];
        return next;
      });
      const msg = error?.response?.data?.message || "Failed to withdraw request";
      toast.error(msg);
    } finally {
      setWithdrawingId(null);
    }
  };

  const renderEmployeeRow = (emp: any) => (
    <div
      key={emp.id}
      className="self-stretch rounded-xl flex items-center justify-between min-h-[44px] sm:min-h-[40px] gap-2 py-1 hover:bg-[var(--ds-surface-1)]/40 transition-colors"
    >
      {/* Avatar & Info */}
      <Link
        href={`/profile/${emp.account_name}`}
        className="flex-1 flex items-center justify-start gap-2 min-w-0 no-underline rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
      >
        <Avatar className="size-8 rounded-full shrink-0">
          <AvatarImage src={emp.avatar || ""} alt={emp.name} className="object-cover" />
          <AvatarFallback className="bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] font-medium text-xs">
            {emp.name?.charAt(0)?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col justify-between items-start min-w-0 flex-1 h-9">
          <span
            className="text-left text-[var(--ds-text-primary)] ds-text-body-2 truncate w-full"
            title={emp.name}
          >
            {emp.name}
          </span>
          <span
            className="text-left text-[var(--ds-text-secondary)] ds-text-meta truncate w-full"
            title={emp.role}
          >
            {emp.role || "Member"}
          </span>
        </div>
      </Link>

      {/* Action Button */}
      <div className="shrink-0 ml-2 sm:ml-3">
        {emp.action === "follow" && (
          <button
            type="button"
            onClick={() => handleFollow(emp)}
            disabled={followLoadingId === emp.id}
            aria-label={`Follow ${emp.name}`}
            className="w-24 h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] rounded-[100px] flex justify-center items-center gap-2 transition-all cursor-pointer text-white ds-text-body-1 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          >
            {followLoadingId === emp.id ? "..." : "Follow"}
          </button>
        )}

        {emp.action === "unfollow" && (
          <button
            type="button"
            onClick={() => setUnfollowConfirmEmp(emp)}
            disabled={followLoadingId === emp.id}
            aria-label={`Unfollow ${emp.name}`}
            className="w-24 h-9 px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2 transition-all cursor-pointer text-[var(--ds-text-primary)] ds-text-body-1 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          >
            {followLoadingId === emp.id ? "..." : "Unfollow"}
          </button>
        )}

        {emp.action === "connect" && (
          <button
            type="button"
            onClick={() => handleConnect(emp)}
            disabled={connectingId === emp.id}
            aria-label={`Connect with ${emp.name}`}
            className="w-24 h-9 px-3 py-1.5 bg-[var(--ds-accent)] hover:opacity-90 active:scale-[0.98] rounded-[100px] flex justify-center items-center gap-2 transition-all cursor-pointer text-white ds-text-body-1 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          >
            {connectingId === emp.id ? "..." : "Connect"}
          </button>
        )}

        {emp.action === "withdraw" && (
          <button
            type="button"
            onClick={() => handleWithdraw(emp)}
            disabled={withdrawingId === emp.id}
            aria-label={`Withdraw connection request to ${emp.name}`}
            className="w-24 h-9 px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2 transition-all cursor-pointer text-[var(--ds-text-primary)] ds-text-body-1 disabled:opacity-60 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          >
            {withdrawingId === emp.id ? "..." : "Withdraw"}
          </button>
        )}

        {emp.action === "message" && (
          <Link
            href={`/messaging?userId=${emp.id}`}
            aria-label={`Message ${emp.name}`}
            className="w-24 h-9 px-3 py-1.5 rounded-[100px] border border-[var(--ds-border)] hover:bg-[var(--ds-surface-1)] active:scale-[0.98] flex justify-center items-center gap-2 transition-all no-underline text-[var(--ds-text-primary)] ds-text-body-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
          >
            Message
          </Link>
        )}

        {emp.action === "empty" && <div className="w-24" />}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] px-4 sm:px-0 sm:pl-5 flex flex-col justify-start items-start gap-4 pb-12 animate-pulse">
        <div className="self-stretch flex flex-col justify-start items-start gap-1">
          <div className="h-6 w-48 bg-[var(--ds-surface-1)] rounded-md" />
          <div className="h-4 w-36 bg-[var(--ds-surface-1)] rounded-md" />
        </div>
        <div className="self-stretch flex flex-col gap-5 w-full">
          <div className="self-stretch flex justify-between items-center h-10">
            <div className="w-72 h-10 bg-[var(--ds-surface-1)] rounded-md" />
            <div className="w-24 h-10 bg-[var(--ds-surface-1)] rounded-3xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-[var(--ds-surface-1)] rounded-3xl p-3" />
            ))}
          </div>
          <div className="flex flex-col gap-3 w-full">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-[var(--ds-surface-1)] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (employeesList.length === 0 && !searchQuery) {
    return (
      <div className="w-full max-w-[800px] px-4 sm:px-0 sm:pl-5 py-10 flex flex-col items-center justify-center gap-4 text-center font-['DM_Sans']">
        {/* Icon Circle */}
        <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center">
          <EmptyPostsIcon className="w-8 h-8 text-ds-text-secondary shrink-0" size={32} />
        </div>

        {/* Title & Description */}
        <div className="w-full max-w-[400px] flex flex-col items-center gap-1.5 text-center">
          <div className="text-center text-ds-text-primary text-base font-semibold font-['DM_Sans'] leading-6">
            {isEdu ? "No alumni yet" : "No people yet"}
          </div>
          <div className="w-80 max-w-full text-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
            {isEdu ? (
              <>{data.name}<br />{"doesn't have any alumni yet"}</>
            ) : (
              <>{data.name}<br />{"doesn't have any associates yet"}</>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalCount = peopleData?.meta?.total ?? peopleData?.total ?? employeesList.length;

  return (
    <div className="w-full max-w-[800px] px-4 sm:px-0 sm:pl-5 flex flex-col justify-start items-start gap-4 pb-12 font-['DM_Sans']">
      {/* Title & Subtitle */}
      <div className="self-stretch flex flex-col justify-start items-start gap-1">
        <h2 className="text-left text-[var(--ds-text-primary)] ds-text-body-1">
          {isEdu ? "Students at this institute" : "People at this company"}
        </h2>
        <p className="text-left text-[var(--ds-text-secondary)] ds-text-small">
          {isEdu ? "find and explore alumni and current students" : "find and explore employees"}
        </p>
      </div>

      <div className="self-stretch flex flex-col justify-start items-start gap-5 w-full">
        {/* Search & Count Row */}
        <div className="self-stretch flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 w-full">
          {/* Search Input */}
          <div className="w-full sm:w-72 h-10 px-3 py-1.5 border-b border-[var(--ds-text-primary)] flex justify-between items-center gap-2 focus-within:border-[var(--ds-accent)] transition-colors">
            <input
              type="text"
              placeholder="Search"
              aria-label="Search employees"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[var(--ds-text-primary)] placeholder:text-[var(--ds-text-muted)] ds-text-body flex-1 min-w-0"
            />
            <Search className="size-5 text-[var(--ds-text-primary)] shrink-0" />
          </div>

          {/* Count Badge */}
          <div className="h-8 sm:h-10 px-3 sm:px-4 py-1.5 sm:py-2 rounded-3xl flex justify-end sm:justify-center items-center gap-2.5 shrink-0 self-end sm:self-auto">
            <span className="text-center text-[var(--ds-text-secondary)] font-poppins text-sm leading-4">
              {isEdu ? `${totalCount} Alumni` : `${totalCount} Associates`}
            </span>
          </div>
        </div>

        {/* Distribution Breakdown Cards */}
        {distributions.length > 0 && (
          <div className="self-stretch grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {distributions.map((dist: any, idx: number) => (
              <div
                key={idx}
                className="flex-1 rounded-3xl flex flex-col justify-start items-start gap-3 sm:gap-5"
              >
                <div className="self-stretch flex flex-col justify-start items-start">
                  <div
                    className="self-stretch text-left text-[var(--ds-text-primary)] font-poppins text-sm font-medium leading-5 tracking-tight truncate"
                    title={dist.title}
                  >
                    {dist.title}
                  </div>
                </div>

                <div className="self-stretch flex flex-col justify-start items-start gap-3 w-full">
                  {dist.items.slice(0, 3).map((item: any, itemIdx: number) => (
                    <div
                      key={itemIdx}
                      className="self-stretch flex flex-col justify-start items-start gap-2 w-full"
                    >
                      <div className="self-stretch flex justify-between items-start gap-2">
                        <span
                          className="text-left text-[var(--ds-text-secondary)] font-poppins text-xs font-normal leading-4 truncate max-w-[140px]"
                          title={item.label}
                        >
                          {item.label}
                        </span>
                        <span className="text-right text-[var(--ds-text-secondary)] font-poppins text-xs font-normal leading-4 shrink-0">
                          {item.value}%
                        </span>
                      </div>

                      <div className="self-stretch flex flex-col justify-start items-start relative w-full">
                        <div className="self-stretch h-1.5 bg-[var(--ds-surface-2)] rounded-lg overflow-hidden relative w-full">
                          <div
                            className="h-full bg-[var(--ds-accent)] rounded-lg transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {distributions.length === 0 && employeesList.length === 0 && searchQuery && (
          <div className="w-full text-center py-10 text-[var(--ds-text-muted)] ds-text-secondary">
            No matches found for &quot;{searchQuery}&quot;
          </div>
        )}

        {/* People List */}
        <div className="w-full max-w-[780px] flex flex-col justify-start items-start gap-3">
          {employeesList.map((emp: any) => renderEmployeeRow(emp))}
        </div>
      </div>

      {/* Confirmation Modal for Unfollow */}
      {unfollowConfirmEmp && (
        <ActionConfirmModal
          isOpen={!!unfollowConfirmEmp}
          onClose={() => setUnfollowConfirmEmp(null)}
          onConfirm={handleConfirmUnfollow}
          type="unfollow"
          targetName={unfollowConfirmEmp.name}
          title="Unfollow this account?"
          description="You’ll no longer see their updates in your following feed"
          confirmText="Unfollow"
          isLoading={followLoadingId === unfollowConfirmEmp.id}
        />
      )}
    </div>
  );
}


