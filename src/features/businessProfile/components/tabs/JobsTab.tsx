"use client";

import React, { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import { EmptyPostsIcon } from "@/components/icons";
import { useRouter } from "next/navigation";
import { BusinessProfileData } from "../../types/business-profile.types";
import { useQuery } from "@tanstack/react-query";
import { businessProfileService } from "../../services/businessProfile.service";
import { saveJob } from "@/features/jobs/services/jobs.service";
import { toast } from "sonner";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface JobsTabProps {
  data: BusinessProfileData;
  isOwnProfile?: boolean;
  canManageCompany?: boolean;
  viewerPermissions?: string[];
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
}

interface JobCardItemProps {
  job: BusinessJobItem;
  isSaved: boolean;
  isOwner: boolean;
  onToggleSave: (jobId: string, currentSaved: boolean, e: React.MouseEvent) => void;
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
  onToggleSave,
  onNavigate,
}: JobCardItemProps) {
  const [imgError, setImgError] = useState(false);

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
      {/* ── Top row: 40px height with logo and save bookmark ── */}
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

        {/* Bookmark Save Action: Only shown for public view (hidden for owner side) */}
        {!isOwner && (
          <button
            type="button"
            aria-label={isSaved ? "Unsave job" : "Save job"}
            onClick={(e) => onToggleSave(job.id, isSaved, e)}
            className="w-10 h-10 -mr-2 flex items-center justify-center cursor-pointer text-ds-text-primary hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent rounded"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 shrink-0"
            >
              {isSaved ? (
                <path
                  d="M17.25 3H6.75C6.35218 3 5.97064 3.15804 5.68934 3.43934C5.40804 3.72064 5.25 4.10218 5.25 4.5V21C5.25007 21.1338 5.28595 21.2652 5.35393 21.3805C5.42191 21.4958 5.51951 21.5909 5.63659 21.6557C5.75368 21.7206 5.88598 21.7529 6.01978 21.7494C6.15358 21.7458 6.284 21.7066 6.3975 21.6356L12 18.1341L17.6034 21.6356C17.7169 21.7063 17.8472 21.7454 17.9809 21.7488C18.1146 21.7522 18.2467 21.7198 18.3636 21.655C18.4806 21.5902 18.578 21.4952 18.646 21.3801C18.7139 21.2649 18.7499 21.1337 18.75 21V4.5C18.75 4.10218 18.592 3.72064 18.3107 3.43934C18.0294 3.15804 17.6478 3 17.25 3Z"
                  fill="currentColor"
                />
              ) : (
                <path
                  d="M17.25 3H6.75C6.35218 3 5.97064 3.15804 5.68934 3.43934C5.40804 3.72064 5.25 4.10218 5.25 4.5V21C5.25007 21.1338 5.28595 21.2652 5.35393 21.3805C5.42191 21.4958 5.51951 21.5909 5.63659 21.6557C5.75368 21.7206 5.88598 21.7529 6.01978 21.7494C6.15358 21.7458 6.284 21.7066 6.3975 21.6356L12 18.1341L17.6034 21.6356C17.7169 21.7063 17.8472 21.7454 17.9809 21.7488C18.1146 21.7522 18.2467 21.7198 18.3636 21.655C18.4806 21.5902 18.578 21.4952 18.646 21.3801C18.7139 21.2649 18.7499 21.1337 18.75 21V4.5C18.75 4.10218 18.592 3.72064 18.3107 3.43934C18.0294 3.15804 17.6478 3 17.25 3ZM17.25 19.6472L12.3966 16.6144C12.2773 16.5398 12.1397 16.5004 11.9991 16.5004C11.8585 16.5004 11.7208 16.5398 11.6016 16.6144L6.75 19.6472V4.5H17.25V19.6472Z"
                  fill="currentColor"
                />
              )}
            </svg>
          </button>
        )}
      </div>

      {/* ── Content row: content-driven height, naturally wraps on mobile ── */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-0">
        {/* Left Column: Title, Company, Location, Posted time */}
        <div className="flex flex-col items-start gap-3 min-w-0 flex-1">
          {/* Title & Company */}
          <div className="flex flex-col items-start gap-1 min-w-0 max-w-full">
            <h3 className="text-base font-medium leading-6 text-ds-text-primary truncate max-w-full">
              {job.title}
            </h3>
            <span className="text-sm font-normal leading-5 text-ds-text-secondary truncate max-w-full">
              {job.company}
            </span>
          </div>

          {/* Location row */}
          {(job.workMode || job.location) && (
            <div className="flex flex-row items-center gap-x-2 gap-y-1 min-h-[20px] flex-wrap max-w-full">
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
                  d="M8 1.5C5.51472 1.5 3.5 3.51472 3.5 6C3.5 9.5 8 14.5 8 14.5C8 14.5 12.5 9.5 12.5 6C12.5 3.51472 10.4853 1.5 8 1.5ZM8 8C6.89543 8 6 7.10457 6 6C6 4.89543 6.89543 4 8 4C9.10457 4 10 4.89543 10 6C10 7.10457 9.10457 8 8 8Z"
                  fill="currentColor"
                />
              </svg>
              {job.workMode && (
                <span className="text-sm font-normal leading-5 text-ds-text-secondary whitespace-nowrap">
                  {job.workMode}
                </span>
              )}
              {job.workMode && job.location && (
                <span className="w-1 h-1 rounded-full bg-ds-text-muted shrink-0" />
              )}
              {job.location && (
                <span className="text-sm font-normal leading-5 text-ds-text-secondary truncate max-w-[200px]">
                  {job.location}
                </span>
              )}
            </div>
          )}

          {/* Posted time */}
          {job.posted && (
            <span className="text-sm font-normal leading-5 text-ds-text-secondary">
              {job.posted}
            </span>
          )}
        </div>

        {/* Right Column: Salary, Experience, and Action CTA */}
        <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 sm:gap-2 pt-2.5 sm:pt-0 border-t border-ds-border/40 sm:border-t-0 shrink-0">
          {(job.salary || job.experience) && (
            <div className="flex flex-col items-start sm:items-end">
              {job.salary && (
                <span className="text-[18px] font-bold leading-6 text-ds-text-primary whitespace-nowrap">
                  {job.salary}
                </span>
              )}
              {job.experience && (
                <span className="text-sm sm:text-base font-medium leading-5 sm:leading-6 text-ds-text-primary whitespace-nowrap">
                  {job.experience}
                </span>
              )}
            </div>
          )}

          {/* Primary CTA Button: Standard 36px control height, 6px 12px padding, pill rounded */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate(job.id);
            }}
            className="h-[36px] px-3.5 py-1.5 bg-ds-accent hover:opacity-90 active:scale-[0.98] text-white rounded-full font-medium text-sm sm:text-base leading-6 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent shrink-0 ml-auto sm:ml-0"
          >
            {isOwner ? "Job details" : "Apply now"}
          </button>
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
}: JobsTabProps) {
  const router = useRouter();
  const isOwner = Boolean(
    isOwnProfile ||
    canManageCompany ||
    viewerPermissions?.includes("POST_JOBS") ||
    viewerPermissions?.includes("MANAGE_COMPANY_DETAILS") ||
    viewerPermissions?.includes("*")
  );
  const canManageJobs = Boolean(canManageCompany || viewerPermissions?.includes("POST_JOBS"));

  const { data: jobsResponse, isLoading } = useQuery({
    queryKey: ["orgJobs", data.id],
    queryFn: () => businessProfileService.getOrgJobs(data.id, { scope: "public", limit: 10 }),
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
      router.push(`/jobs/${jobId}`);
    },
    [router]
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
        id: job.job_id || job.id || "",
        title: job.title || "",
        company: job.company || job.company_name || data.name || "",
        companyLogo: job.company_logo || job.logo || data.logoUrl || "",
        workMode: job.work_mode || job.workMode || job.type || job.job_type || "",
        location: job.location || job.city || (data.location ? data.location.split(",")[0].trim() : ""),
        posted,
        salary: rawSalary,
        experience,
        isSaved: Boolean(job.is_saved ?? job.isSaved ?? false),
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
          <EmptyPostsIcon className="w-8 h-8 text-ds-text-secondary shrink-0" size={32} />
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

        {/* Create Job Action Button — owners only */}
        {canManageJobs && (
          <button
            type="button"
            onClick={() => router.push("/jobs")}
            className="px-3 py-1.5 rounded-[100px] border border-ds-border inline-flex justify-center items-center gap-2.5 text-ds-text-primary text-base font-medium leading-6 hover:bg-ds-surface-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
          >
            <Plus className="w-4 h-4 text-ds-text-primary shrink-0" />
            <span>Create job</span>
          </button>
        )}
      </div>
    );
  }

  return (
    /* Section - About Card: width: 800px; padding: 0px 0px 0px 20px (Desktop) / px-4 (Mobile); gap: 12px; */
    <div className="w-full max-w-[800px] px-4 sm:pl-5 sm:pr-0 flex flex-col gap-3 pb-12 font-sans">
      {jobsToRender.map((job) => {
        const isSaved = savedStatus[job.id] !== undefined ? savedStatus[job.id] : Boolean(job.isSaved);

        return (
          <JobCardItem
            key={job.id}
            job={job}
            isSaved={isSaved}
            isOwner={isOwner}
            onToggleSave={handleToggleSave}
            onNavigate={handleNavigate}
          />
        );
      })}
    </div>
  );
}


