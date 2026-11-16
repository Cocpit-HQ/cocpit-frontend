"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { JobsIcon } from "@/components/icons";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BusinessProfileData } from "../../types/business-profile.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { saveJob, applyJob, withdrawApplication } from "@/features/jobs/services/jobs.service";
import { ApplyJobModal } from "@/features/jobs/components/modals/ApplyJobModal";
import { CocpitConfirmBox } from "@/shared/commonComponents/CocpitConfirmBox";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useActiveProfile } from "@/context/ActiveProfileContext";
import { useJobStore } from "@/store/job.store";

interface JobsTabProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
  canManageCompany?: boolean;
  viewerPermissions?: string[];
  isOrgAdminOrOwner?: boolean;
}

export interface BusinessJobItem {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  workMode: string;
  location: string;
  posted: string;
  salary: string;
  experience: string;
  isSaved?: boolean;
  isApplied?: boolean;
  applicationStatus?: string | null;
}

interface JobCardItemProps {
  job: BusinessJobItem;
  isSaved?: boolean;
  isOwner: boolean;
  isApplied: boolean;
  isShortlisted?: boolean;
  isAssociatedAdminOrOwner?: boolean;
  onApplyClick: (job: BusinessJobItem, e: React.MouseEvent) => void;
  onWithdrawClick: (job: BusinessJobItem, e: React.MouseEvent) => void;
  isBusinessViewer?: boolean;
  onToggleSave?: (jobId: string, currentSaved: boolean, e: React.MouseEvent) => void;
  onNavigate: (jobId: string) => void;
}

/**
 * Memoized single Job Card component.
 * Implements exact Figma layer specifications, 36px control heights,
 * 40px touch targets, and responsive mobile adaptation.
 */
const JobCardItem = React.memo(function JobCardItem({
  job,
  isSaved,
  isOwner,
  isApplied,
  isShortlisted,
  isAssociatedAdminOrOwner,
  onApplyClick,
  onWithdrawClick,
  isBusinessViewer = false,
  onToggleSave,
  onNavigate,
}: JobCardItemProps) {
  const [imgError, setImgError] = useState(false);

  const statusLower = (job.applicationStatus || '').toLowerCase();
  const isAccepted = statusLower === 'accepted';
  const isShortlistedStatus = statusLower === 'shortlisted' || Boolean(isShortlisted);

  const isShowJobDetails = Boolean(
    isOwner ||
    isBusinessViewer ||
    isShortlistedStatus ||
    isAccepted
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onNavigate(job.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onNavigate(job.id);
        }
      }}
      className="w-full max-w-[779px] p-3 flex flex-col items-start gap-3 bg-ds-bg border border-ds-border rounded-[16px] transition-colors duration-200 cursor-pointer group hover:border-ds-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
    >
      {/* ── Top row: 40px height with logo and bookmark ── */}
      <div className="w-full h-10 flex flex-row justify-between items-center p-0">
        {/* Company Logo: 40px x 40px, rounded-[8px] */}
        <div className="w-10 h-10 rounded-[8px] overflow-hidden shrink-0 flex items-center justify-center bg-ds-surface-1 border border-ds-border">
          {job.companyLogo && !imgError ? (
            <Image
              src={job.companyLogo}
              alt={job.company || "Company logo"}
              width={40}
              height={40}
              className="w-full h-full object-cover rounded-[8px]"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-base font-semibold text-ds-text-primary">
              {job.company ? job.company.charAt(0).toUpperCase() : "C"}
            </span>
          )}
        </div>

        {/* Bookmark/Save action button: 36px x 36px, rounded-[100px] */}
        {!isOwner && !isBusinessViewer && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave?.(job.id, Boolean(isSaved), e);
            }}
            className="w-9 h-9 rounded-[100px] flex items-center justify-center hover:bg-ds-surface-1 transition-colors cursor-pointer text-ds-text-primary border-none bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
            aria-label={isSaved ? "Remove from saved" : "Save job"}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={isSaved ? "currentColor" : "none"}
              xmlns="http://www.w3.org/2000/svg"
              className={`w-6 h-6 ${isSaved ? "text-ds-accent" : "text-ds-text-primary hover:text-ds-accent transition-colors"}`}
            >
              <path
                d="M5 6.2C5 5.07989 5 4.51984 5.21799 4.09202C5.40973 3.71569 5.71569 3.40973 6.09202 3.21799C6.51984 3 7.07989 3 8.2 3H15.8C16.9201 3 17.4802 3 17.908 3.21799C18.2843 3.40973 18.5903 3.71569 18.782 4.09202C19 4.51984 19 5.07989 19 6.2V21L12 17.5L5 21V6.2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* ── Content row: exact 2-column horizontal layout matching Figma ── */}
      <div className="w-full inline-flex justify-between items-center gap-4 p-0">
        {/* Left Column: Title, Company, Location, Posted time */}
        <div className="inline-flex flex-col justify-start items-start gap-1 min-w-0 flex-1">
          {/* Title & Company */}
          <div className="flex flex-col items-start gap-1 min-w-0 max-w-full">
            <h3 className="text-base font-medium font-['DM_Sans'] leading-6 text-ds-text-primary truncate max-w-full">
              {job.title}
            </h3>
            <span className="text-sm font-normal font-['DM_Sans'] leading-5 text-ds-text-secondary truncate max-w-full">
              {job.company}
            </span>
          </div>

          {/* Location row */}
          {(job.workMode || job.location) && (
            <div className="inline-flex items-center gap-1.5 min-h-[20px] flex-wrap max-w-full">
              {/* Location Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-ds-text-secondary shrink-0"
              >
                <path
                  d="M8 8.66667C8.73638 8.66667 9.33333 8.06971 9.33333 7.33333C9.33333 6.59695 8.73638 6 8 6C7.26362 6 6.66667 6.59695 6.66667 7.33333C6.66667 8.06971 7.26362 8.66667 8 8.66667Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 7.33333C13 11.3333 8 14.6667 8 14.6667C8 14.6667 3 11.3333 3 7.33333C3 5.99616 3.52678 4.71374 4.46447 3.77604C5.40215 2.83834 6.68457 2.31152 8 2.31152C9.31543 2.31152 10.5979 2.83834 11.5355 3.77604C12.4732 4.71374 13 5.99616 13 7.33333Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {job.workMode && (
                <span className="text-sm font-normal font-['DM_Sans'] leading-5 text-ds-text-secondary whitespace-nowrap">
                  {job.workMode}
                </span>
              )}
              {job.workMode && job.location && (
                <span className="w-1 h-1 rounded-full bg-stone-500 shrink-0" />
              )}
              {job.location && (
                <span className="text-sm font-normal font-['DM_Sans'] leading-5 text-ds-text-secondary truncate max-w-[140px] sm:max-w-[200px]">
                  {job.location}
                </span>
              )}
            </div>
          )}

          {/* Posted time */}
          {job.posted && (
            <span className="text-sm font-normal font-['DM_Sans'] leading-5 text-ds-text-secondary">
              {job.posted}
            </span>
          )}
        </div>

        {/* Right Column: Salary, Experience, and Action CTA */}
        <div className="inline-flex flex-col justify-center items-end gap-1 shrink-0">
          {job.salary && (
            <div className="text-right text-ds-text-primary text-base sm:text-lg font-semibold font-['DM_Sans'] leading-6 whitespace-nowrap">
              {job.salary}
            </div>
          )}
          {job.experience && (
            <div className="text-right text-ds-text-primary text-sm sm:text-base font-medium font-['DM_Sans'] leading-5 sm:leading-6 whitespace-nowrap">
              {job.experience}
            </div>
          )}

          {/* Action CTA Button */}
          {isShowJobDetails ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(job.id);
              }}
              className="px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-[0.98] text-white rounded-[100px] font-medium font-['DM_Sans'] text-sm sm:text-base leading-6 transition-all cursor-pointer inline-flex justify-center items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent mt-0.5"
            >
              Job details
            </button>
          ) : isApplied ? (
            <button
              type="button"
              onClick={(e) => onWithdrawClick(job, e)}
              className="px-3 py-1.5 bg-transparent hover:bg-ds-surface-1 border border-ds-border text-ds-text-primary rounded-[100px] font-medium font-['DM_Sans'] text-sm sm:text-base leading-6 transition-all cursor-pointer inline-flex justify-center items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent mt-0.5 active:scale-95"
            >
              Withdraw
            </button>
          ) : isAssociatedAdminOrOwner ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-block cursor-not-allowed"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-ds-accent text-white rounded-[100px] font-medium font-['DM_Sans'] text-sm sm:text-base leading-6 inline-flex justify-center items-center gap-2.5 mt-0.5 cursor-not-allowed pointer-events-none"
                    >
                      Apply now
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={6}
                  className="bg-ds-surface-2 text-ds-text-primary border border-ds-border text-xs px-2.5 py-1.5 rounded-md shadow-lg z-[100]"
                >
                  You cannot apply to the job posted by your associated company.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <button
              type="button"
              onClick={(e) => onApplyClick(job, e)}
              className="px-3 py-1.5 bg-ds-accent hover:opacity-90 active:scale-[0.98] text-white rounded-[100px] font-medium font-['DM_Sans'] text-sm sm:text-base leading-6 transition-all cursor-pointer inline-flex justify-center items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent mt-0.5"
            >
              Apply now
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default function JobsTab({
  data,
  isOwnProfile = false,
  canManageCompany,
  viewerPermissions,
  isOrgAdminOrOwner,
}: JobsTabProps) {
  const router = useRouter();
  const { activeProfile, userCompanies } = useActiveProfile();
  const isBusinessViewer = Boolean(activeProfile?.type === 'COMPANY');

  const queryClient = useQueryClient();
  const { appliedJobIds, withdrawnJobIds, addAppliedId, addWithdrawnId } = useJobStore();
  const [applyingJob, setApplyingJob] = useState<BusinessJobItem | null>(null);
  const [withdrawingJob, setWithdrawingJob] = useState<BusinessJobItem | null>(null);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  const handleApplyClick = useCallback((job: BusinessJobItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setApplyingJob(job);
  }, []);

  const handleApplySubmit = async (
    resumeUrlOrName: string,
    uploadedFile: File | null,
    resumeUrlToSend: string | null,
    coverLetter: string
  ) => {
    if (!applyingJob) return;
    try {
      let formData: FormData | undefined = undefined;
      let jsonBody: any = undefined;
      const sanitizedCoverLetter = coverLetter ? coverLetter.slice(0, 1000) : undefined;
      if (uploadedFile || resumeUrlToSend || sanitizedCoverLetter) {
        formData = new FormData();
        if (uploadedFile) {
          formData.append('resume', uploadedFile);
        } else if (resumeUrlToSend) {
          formData.append('resume_url', resumeUrlToSend);
          if (resumeUrlOrName) formData.append('resume_file_name', resumeUrlOrName);
        }
        if (sanitizedCoverLetter) formData.append('cover_note', sanitizedCoverLetter);
      } else if (resumeUrlOrName || resumeUrlToSend) {
        jsonBody = {
          resume_url: resumeUrlToSend || resumeUrlOrName,
          resume_file_name: resumeUrlOrName || null,
          cover_note: sanitizedCoverLetter,
        };
      }

      await applyJob(applyingJob.id, formData, jsonBody);
      addAppliedId(applyingJob.id);
      toast.success("Application submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["orgJobs", data.id] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "applied"] });
      setApplyingJob(null);
    } catch (error: any) {
      console.error("Failed to apply for job:", error);
      toast.error(error?.response?.data?.message || "Failed to submit application");
    }
  };

  const handleWithdrawClick = useCallback((job: BusinessJobItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setWithdrawingJob(job);
  }, []);

  const handleWithdrawConfirm = async () => {
    if (!withdrawingJob) return;
    try {
      setIsSubmittingWithdraw(true);
      await withdrawApplication(withdrawingJob.id);
      addWithdrawnId(withdrawingJob.id);
      toast.success("Application withdrawn successfully");
      queryClient.invalidateQueries({ queryKey: ["orgJobs", data.id] });
      queryClient.invalidateQueries({ queryKey: ["jobs", "applied"] });
      setWithdrawingJob(null);
    } catch (error: any) {
      console.error("Failed to withdraw application:", error);
      toast.error(error?.response?.data?.message || "Failed to withdraw application");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const isOwner = useMemo(() => Boolean(
    isOwnProfile ||
    canManageCompany ||
    (activeProfile?.type === 'COMPANY' && (activeProfile.id === data.id || activeProfile.id === (data as any)?.orgId || activeProfile.id === (data as any)?.org_id)) ||
    viewerPermissions?.includes("POST_JOBS") ||
    viewerPermissions?.includes("MANAGE_COMPANY_DETAILS") ||
    viewerPermissions?.includes("MANAGE_COMPANY") ||
    viewerPermissions?.includes("MANAGE_ORGANIZATION") ||
    viewerPermissions?.includes("MANAGE_JOBS") ||
    viewerPermissions?.includes("JOBS") ||
    viewerPermissions?.includes("*")
  ), [isOwnProfile, canManageCompany, activeProfile, data.id, (data as any)?.orgId, (data as any)?.org_id, viewerPermissions]);

  const isAssociatedCompanyAdminOrOwner = useMemo(() => Boolean(
    isOrgAdminOrOwner ||
    viewerPermissions?.includes("*") ||
    viewerPermissions?.includes("MANAGE_COMPANY") ||
    viewerPermissions?.includes("MANAGE_ORGANIZATION") ||
    viewerPermissions?.includes("POST_JOBS") ||
    userCompanies?.some((c) => {
      const matchId =
        (c.org_id && (c.org_id === data.id || c.org_id === (data as any).company_id)) ||
        (c.company_id && (c.company_id === data.id || c.company_id === (data as any).company_id)) ||
        (Boolean((c as any).id) && ((c as any).id === data.id || (c as any).id === (data as any).company_id));
      const matchSlug =
        c.slug && data.slug && c.slug.toLowerCase().trim() === data.slug.toLowerCase().trim();
      const matchName =
        c.name && data.name && c.name.toLowerCase().trim() === data.name.toLowerCase().trim();

      const isAssociated = matchId || matchSlug || matchName;
      if (!isAssociated) return false;

      const role = (c.role || "").toLowerCase().trim();
      const roleName = ((c as any).viewer_role_data?.name || "").toLowerCase().trim();
      const isOwnerFlag = (c as any).is_owner || (c as any).viewer_role_data?.is_owner;
      const perms = (c as any).viewer_role_data?.permissions || [];

      return (
        role === "owner" ||
        role === "admin" ||
        roleName === "owner" ||
        roleName === "admin" ||
        Boolean(isOwnerFlag) ||
        perms.includes("*") ||
        perms.includes("MANAGE_COMPANY") ||
        perms.includes("POST_JOBS")
      );
    })
  ), [isOrgAdminOrOwner, viewerPermissions, userCompanies, data.id, (data as any)?.company_id, data.slug, data.name]);

  const hasCreateJobPermission = Boolean(
    isOwnProfile && (
      canManageCompany ||
      viewerPermissions?.includes("*") ||
      viewerPermissions?.includes("MANAGE_COMPANY") ||
      viewerPermissions?.includes("POST_JOBS") ||
      viewerPermissions?.includes("MANAGE_JOBS") ||
      viewerPermissions?.includes("JOBS")
    )
  );

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleCreateJob = () => {
    const currentUrl = typeof window !== 'undefined'
      ? `${window.location.pathname}${window.location.search}`
      : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
    router.push(`/jobs?view=create-job&companyId=${data.id}&returnTo=${encodeURIComponent(currentUrl)}`);
  };

  const { data: jobsResponse, isLoading } = useQuery({
    queryKey: ["orgJobs", data.id],
    queryFn: () => businessProfileService.getOrgJobs(data.id, { scope: "public", limit: 10 }),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Local state for bookmark toggles with optimistic feedback
  const [savedStatus, setSavedStatus] = useState<Record<string, boolean>>({});

  const handleToggleSave = useCallback(
    async (jobId: string, currentSaved: boolean, e: React.MouseEvent) => {
      e.stopPropagation();
      const newStatus = !currentSaved;
      setSavedStatus((prev) => ({ ...prev, [jobId]: newStatus }));

      try {
        await saveJob(jobId, newStatus);
        toast.success(newStatus ? "Job saved to bookmarks" : "Job removed from bookmarks");
      } catch {
        setSavedStatus((prev) => ({ ...prev, [jobId]: currentSaved }));
        toast.error("Failed to update saved job");
      }
    },
    []
  );

  const handleNavigate = useCallback(
    (jobId: string) => {
      const currentUrl = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
      if (isOwner) {
        const returnParam = currentUrl ? `&returnTo=${encodeURIComponent(currentUrl)}` : '';
        router.push(`/jobs?view=view-listing&jobId=${jobId}${returnParam}`);
      } else {
        router.push(`/jobs/${jobId}?returnTo=${encodeURIComponent(currentUrl)}`);
      }
    },
    [router, isOwner, pathname, searchParams]
  );

  const rawList = useMemo(() => {
    return Array.isArray(jobsResponse)
      ? jobsResponse
      : Array.isArray(jobsResponse?.data)
      ? jobsResponse.data
      : Array.isArray(jobsResponse?.jobs)
      ? jobsResponse.jobs
      : [];
  }, [jobsResponse]);

  const mappedJobs: BusinessJobItem[] = useMemo(() => {
    return rawList.map((job: any) => {
      const id = job.job_id || job.id || "";
      const rawSalary =
        job.salary ||
        job.salary_display ||
        (job.salary_min && job.salary_max
          ? `$${job.salary_min >= 1000 ? Math.round(job.salary_min / 1000) : job.salary_min}-${job.salary_max >= 1000 ? `${Math.round(job.salary_max / 1000)}k` : job.salary_max}`
          : "");

      const rawExp = job.experience || job.experience_level || "";
      const experience = rawExp
        ? rawExp.toLowerCase().includes("experience")
          ? rawExp
          : `${rawExp} experience`
        : "";

      const rawTime = job.posted_at || job.created_at;
      const posted =
        typeof job.posted === "string"
          ? job.posted
          : rawTime
          ? dayjs(rawTime).fromNow()
          : "";

      return {
        id,
        title: job.title || "",
        company: job.company || job.company_name || data.name || "",
        companyLogo: job.company_logo || job.logo || data.logoUrl || "",
        workMode: job.work_mode || job.workMode || job.type || job.job_type || "",
        location: job.location || job.city || (data.location ? data.location.split(",")[0].trim() : ""),
        posted,
        salary: rawSalary,
        experience,
        isSaved: Boolean(job.is_saved ?? job.isSaved ?? false),
        isApplied: Boolean(job.is_applied ?? job.has_applied ?? job.hasApplied ?? false),
        applicationStatus: job.application_status || job.applicationStatus || null,
      };
    });
  }, [rawList, data.name, data.logoUrl, data.location]);

  const jobsToRender: BusinessJobItem[] = mappedJobs;

  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] px-4 sm:pl-5 sm:pr-0 flex flex-col gap-3 pb-12 font-sans">
        {[1, 2].map((idx) => (
          <div
            key={idx}
            className="w-full max-w-[779px] p-3 flex flex-col items-start gap-3 bg-ds-bg border border-ds-border rounded-[16px] animate-pulse"
          >
            {/* Top row skeleton */}
            <div className="w-full h-10 flex flex-row justify-between items-center">
              <div className="w-10 h-10 rounded-[8px] bg-ds-surface-1" />
              {!isOwner && <div className="w-6 h-6 rounded bg-ds-surface-1" />}
            </div>
            {/* Content row skeleton */}
            <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex flex-col items-start gap-3">
                <div className="flex flex-col gap-1.5">
                  <div className="w-32 h-5 bg-ds-surface-1 rounded" />
                  <div className="w-20 h-4 bg-ds-surface-1 rounded" />
                </div>
                <div className="w-40 h-4 bg-ds-surface-1 rounded" />
                <div className="w-16 h-4 bg-ds-surface-1 rounded" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="w-20 h-6 bg-ds-surface-1 rounded" />
                <div className="w-36 h-5 bg-ds-surface-1 rounded" />
                <div className="w-24 h-9 bg-ds-surface-1 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (jobsToRender.length === 0) {
    return (
      <div className="w-full max-w-[800px] px-4 sm:pl-5 sm:pr-0 py-10 flex flex-col justify-center items-center gap-4 font-sans">
        {/* Icon Circle */}
        <div className="p-3 bg-ds-surface-1 rounded-full flex items-center justify-center">
          <JobsIcon className="w-8 h-8 text-ds-text-secondary shrink-0" size={32} />
        </div>

        {/* Title & Description */}
        <div className="self-stretch flex flex-col justify-start items-center gap-1.5">
          <div className="text-center text-ds-text-primary text-base font-semibold leading-6">
            No jobs yet
          </div>
          <div className="w-80 max-w-full text-center text-ds-text-secondary text-sm font-normal leading-5">
            <>{data.name}<br />{"doesn't have any jobs yet"}</>
          </div>
        </div>

        {/* Create Job Action Button (Only shown on own profile) */}
        {isOwnProfile && (
          hasCreateJobPermission ? (
            <button
              type="button"
              onClick={handleCreateJob}
              className="px-3 py-1.5 rounded-[100px] border border-ds-border inline-flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 hover:bg-ds-surface-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
            >
              <Plus className="w-4 h-4 text-ds-text-primary shrink-0" />
              <span>Create job</span>
            </button>
          ) : (
            <TooltipProvider delayDuration={100}>
              <Tooltip enableTouch>
                <TooltipTrigger asChild>
                  <span className="inline-flex cursor-not-allowed" tabIndex={0}>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="px-3 py-1.5 rounded-[100px] border border-ds-border inline-flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6 pointer-events-none"
                    >
                      <Plus className="w-4 h-4 text-ds-text-primary shrink-0" />
                      <span>Create job</span>
                    </button>
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={6}
                  className="bg-ds-surface-2 text-ds-text-primary border border-ds-border text-xs px-2.5 py-1.5 rounded shadow-lg z-[100]"
                >
                  You don't have access
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        )}
      </div>
    );
  }

  return (
    /* Section - About Card: width: 800px; padding: 0px 0px 0px 20px (Desktop) / px-4 (Mobile); gap: 12px; */
    <div className="w-full max-w-[800px] px-4 sm:pl-5 sm:pr-0 flex flex-col gap-3 pb-12 font-sans">
      {jobsToRender.map((job) => {
        const isSaved = savedStatus[job.id] !== undefined ? savedStatus[job.id] : Boolean(job.isSaved);
        const isShortlisted = job.applicationStatus?.toLowerCase() === 'shortlisted';
        const statusLower = (job.applicationStatus || '').toLowerCase();
        const isTerminalStatus = statusLower === 'declined' || statusLower === 'rejected' || statusLower === 'withdrawn' || statusLower === 'expired';
        const isApplied = Boolean(
          (appliedJobIds.has(job.id) || job.isApplied) &&
          !withdrawnJobIds.has(job.id) &&
          !isTerminalStatus &&
          statusLower !== 'accepted'
        );

        return (
          <JobCardItem
            key={job.id}
            job={job}
            isSaved={isSaved}
            isOwner={isOwner}
            isApplied={isApplied}
            isShortlisted={isShortlisted}
            isAssociatedAdminOrOwner={isAssociatedCompanyAdminOrOwner}
            onApplyClick={handleApplyClick}
            onWithdrawClick={handleWithdrawClick}
            isBusinessViewer={isBusinessViewer}
            onToggleSave={handleToggleSave}
            onNavigate={handleNavigate}
          />
        );
      })}

      {/* Apply Job Modal */}
      <ApplyJobModal
        isOpen={Boolean(applyingJob)}
        onClose={() => setApplyingJob(null)}
        onApply={handleApplySubmit}
        jobTitle={applyingJob?.title || ""}
      />

      {/* Withdraw Application Confirmation Modal */}
      <CocpitConfirmBox
        isOpen={Boolean(withdrawingJob)}
        title="Are you sure you want to withdraw your application?"
        message="This cannot be undone"
        confirmText="Withdraw"
        cancelText="Cancel"
        onConfirm={handleWithdrawConfirm}
        onCancel={() => setWithdrawingJob(null)}
      />
    </div>
  );
}
