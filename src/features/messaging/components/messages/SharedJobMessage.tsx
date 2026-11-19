"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message } from "@/types/messaging";
import { Job } from "@/types/jobs";
import { getJobById } from "@/services/api/jobs";
import { useQuery } from "@tanstack/react-query";
import { useSocial } from "@/context/SocialContext";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { BriefcaseIcon } from "@/components/icons";
import { X } from "lucide-react";
import UnavailableContentCard from "../ui/UnavailableContentCard";

export const safeGetJobById = async (
  id: string,
): Promise<Job | { notFound: boolean; message: string }> => {
  try {
    const job = await getJobById(id);
    const raw = job as any;
    if (
      !job ||
      raw.is_active === false ||
      raw.is_deactivated === true ||
      raw.is_deleted === true ||
      raw.recruiter_name === "Unknown User" ||
      raw.recruiter_name === "Unknown user" ||
      raw.recruiter_name === "Deactivated User" ||
      raw.recruiter_deactivated === true
    ) {
      return { notFound: true, message: "Job not found" };
    }
    return job;
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.message || "Job not found";
    return { notFound: true, message: msg };
  }
};

export function JobApplicationContextCard({
  entityType,
  entityId,
  conversationId,
  isMe = false,
  message,
}: {
  entityType: "job" | "offer";
  entityId: string;
  conversationId?: string;
  isMe?: boolean;
  message?: Message;
}) {
  const router = useRouter();
  const { isBlocked } = useSocial();
  const {
    data: job,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["jobContext", entityType, entityId],
    queryFn: async () => {
      const jobData = await safeGetJobById(entityId);
      if (jobData && !("notFound" in jobData)) {
        return jobData;
      }
      if (entityType === "offer") {
        const { getOfferDetail } = await import("@/services/api/offers");
        const data = await getOfferDetail(entityId).catch(() => null);
        if (
          data &&
          data.job_id &&
          data.sent_by_name !== "Unknown User" &&
          data.sent_by_name !== "Unknown user" &&
          data.sent_by_name !== "Deactivated User" &&
          !(data as any).is_deactivated
        ) {
          return safeGetJobById(data.job_id);
        }
      }
      return { notFound: true, message: "Job or offer unavailable" };
    },
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });

  const wrapperClass =
    "box-border flex flex-row items-center p-2 gap-2.5 w-full sm:w-fit min-w-0 sm:min-w-[219px] max-w-[340px] h-[58px] border border-[var(--ds-border)] rounded-[16px] bg-[var(--ds-bg)] cursor-pointer hover:bg-[var(--ds-surface-1)]/50 transition-colors select-none";

  if (loading) {
    return (
      <div className={cn(wrapperClass, "animate-pulse cursor-default")}>
        <div className="flex flex-row items-center p-0 gap-2 h-10 w-full min-w-0">
          <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] shrink-0" />
          <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0">
            <div className="h-3.5 bg-[var(--ds-surface-1)] rounded w-3/4" />
            <div className="h-2.5 bg-[var(--ds-surface-1)] rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const rawJob = job as any;

  const isNotFound =
    !job ||
    (typeof job === "object" && "notFound" in job) ||
    !rawJob.title ||
    rawJob.is_active === false ||
    rawJob.recruiter_name === "Deactivated User" ||
    rawJob.recruiter_name === "Unknown User" ||
    rawJob.recruiter_name === "Unknown user" ||
    rawJob.is_deactivated === true;
  const isSenderOwnJobBlocked = Boolean(
    message?.senderId &&
    isBlocked(message.senderId) &&
    (!rawJob?.posterId ||
      String(rawJob.posterId) === String(message.senderId) ||
      String(rawJob.recruiter_id) === String(message.senderId) ||
      (message.senderName && (rawJob?.recruiter_name || rawJob?.company_name) &&
        (message.senderName.trim().toLowerCase() === rawJob?.recruiter_name?.trim().toLowerCase() ||
         message.senderName.trim().toLowerCase() === rawJob?.company_name?.trim().toLowerCase())))
  );

  const isJobBlocked = Boolean(
    (rawJob &&
      ((rawJob.companyId && isBlocked(rawJob.companyId)) ||
        (rawJob.posterId && isBlocked(rawJob.posterId)) ||
        (rawJob.company_id && isBlocked(rawJob.company_id)) ||
        (rawJob.poster_id && isBlocked(rawJob.poster_id)) ||
        (rawJob.recruiter_id && isBlocked(rawJob.recruiter_id)))) ||
      isSenderOwnJobBlocked
  );

  if (error || isNotFound || isJobBlocked) {
    return <UnavailableContentCard isMe={isMe} />;
  }

  const jobId = (job as any).jobId || job.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const returnTo = conversationId
      ? `/messaging?conversationId=${conversationId}`
      : "/messaging";
    router.push(`/jobs/${jobId}?returnTo=${encodeURIComponent(returnTo)}`);
  };

  const getCity = (loc?: string) => {
    if (!loc) return "Remote";
    const city = loc.split(",")[0].trim();
    return city || loc;
  };

  const companyName = job.company || rawJob.company_name || "";
  const workMode = job.workMode || rawJob.work_mode || "Hybrid";
  const exp = job.experience || rawJob.experience_level || "0-2Yrs";

  return (
    <div
      className={wrapperClass}
      onClick={handleClick}
    >
      <div className="flex flex-row items-center p-0 gap-2 h-10 w-full min-w-0">
        {/* Frame 2609815: Icon Box */}
        <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0">
          <BriefcaseIcon className="w-5 h-5 text-[var(--ds-text-primary)]" size={20} />
        </div>

        {/* Frame 2609957: Text Box */}
        <div className="flex flex-col justify-center items-start p-0 h-10 min-w-0 flex-1 overflow-hidden">
          {/* Frame 2609814: Title • Org */}
          <div className="h-6 flex flex-row items-center min-w-0 max-w-full">
            <span className="font-['DM_Sans'] font-medium text-sm sm:text-base leading-6 text-[var(--ds-text-primary)] truncate shrink-0 max-w-[140px] sm:max-w-[180px]">
              {job.title}
            </span>
            {companyName && (
              <>
                <span className="font-['DM_Sans'] font-medium text-sm sm:text-base leading-6 text-[var(--ds-text-secondary)] mx-1 shrink-0">
                  •
                </span>
                <span className="font-['DM_Sans'] font-medium text-sm sm:text-base leading-6 text-[var(--ds-text-secondary)] truncate min-w-0">
                  {companyName}
                </span>
              </>
            )}
          </div>

          {/* Subtitle: Type • Location • Experience */}
          <div className="h-4 flex flex-row items-center min-w-0 max-w-full">
            <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-secondary)] truncate">
              {[workMode, getCity(job.location), exp].filter(Boolean).join(" • ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobInputContextCard({
  entityId,
  entityType = "job",
  onDismiss,
}: {
  entityId: string;
  entityType?: "job" | "offer" | "event";
  onDismiss: () => void;
}) {
  const { data: job, isLoading } = useQuery({
    queryKey: ["jobContext", entityType, entityId],
    queryFn: async () => {
      const jobData = await safeGetJobById(entityId);
      if (jobData && !("notFound" in jobData)) {
        return jobData;
      }
      if (entityType === "offer") {
        const { getOfferDetail } = await import("@/services/api/offers");
        const data = await getOfferDetail(entityId).catch(() => null);
        if (data && data.job_id) {
          return safeGetJobById(data.job_id);
        }
      }
      return null;
    },
    staleTime: 60000,
  });

  const isJobObj = Boolean(job && typeof job === "object" && !("notFound" in job));
  const validJob = isJobObj ? (job as Job) : null;
  const rawJob = validJob as any;
  const companyName = validJob?.company || rawJob?.company_name || "";
  const workMode = validJob?.workMode || rawJob?.work_mode || "Hybrid";
  const exp = validJob?.experience || rawJob?.experience_level || "0-2Yrs";
  const getCity = (loc?: string) => {
    if (!loc) return "Remote";
    const city = loc.split(",")[0].trim();
    return city || loc;
  };

  const title = validJob?.title || (entityType === "offer" ? "Job Offer Context" : "Job Application Context");

  return (
    <div className="box-border flex flex-row items-center p-2 gap-2.5 w-full self-stretch h-[58px] border border-[var(--ds-border)] rounded-[16px] bg-transparent relative select-none mb-1.5 shrink-0 transition-all">
      <div className="flex flex-row items-center p-0 gap-2 h-10 w-full min-w-0">
        {/* Frame 2609815: Icon Box */}
        <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0">
          <BriefcaseIcon className="w-5 h-5 text-[var(--ds-text-primary)]" size={20} />
        </div>

        {/* Frame 2609957: Text Box */}
        <div className="flex flex-col justify-center items-start p-0 h-10 min-w-0 flex-1 overflow-hidden">
          {/* Frame 2609814: Title • Org */}
          <div className="h-6 flex flex-row items-center min-w-0 max-w-full">
            <span className="font-['DM_Sans'] font-medium text-sm sm:text-base leading-6 text-[var(--ds-text-primary)] truncate shrink-0 max-w-[280px]">
              {isLoading ? "Loading job..." : title}
            </span>
            {companyName && (
              <>
                <span className="font-['DM_Sans'] font-medium text-sm sm:text-base leading-6 text-[var(--ds-text-secondary)] mx-1 shrink-0">
                  •
                </span>
                <span className="font-['DM_Sans'] font-medium text-sm sm:text-base leading-6 text-[var(--ds-text-secondary)] truncate min-w-0">
                  {companyName}
                </span>
              </>
            )}
          </div>

          {/* Subtitle: Type • Location • Experience */}
          <div className="h-4 flex flex-row items-center min-w-0 max-w-full">
            <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-secondary)] truncate">
              {isLoading
                ? "This context will be attached to your first message"
                : [workMode, getCity(validJob?.location), exp].filter(Boolean).join(" • ")}
            </span>
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-[var(--ds-text-muted)] hover:text-[var(--ds-text-primary)] p-1 rounded-full transition-colors shrink-0"
          aria-label="Remove job context"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export const JobCardSkeleton = () => {
  return (
    <div className="border rounded-xl p-4 w-[320px] max-w-full bg-white dark:bg-zinc-900 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 shrink-0"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
};

export const JobCard = ({
  job,
  onClick,
}: {
  job: Job;
  onClick: (e: React.MouseEvent) => void;
}) => {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer border rounded-xl p-4 w-[340px] max-w-full bg-chat-shared-card-bg dark:bg-zinc-900 hover:shadow-md transition"
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0 overflow-hidden">
          {job.companyLogo ? (
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon icon="mynaui:briefcase-business" className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 dark:text-zinc-100 truncate">
            {job.title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
            {job.company}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate">
            {job.location}
            {job.workMode ? ` • ${job.workMode}` : ""}
            {job.type ? ` • ${job.type}` : ""}
          </p>
          {job.experience && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {job.experience}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end justify-end shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(e);
            }}
            className="text-blue-600 dark:text-blue-400 text-xs font-medium mt-auto"
          >
            View job
          </button>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 mt-3 border-t border-gray-100 dark:border-zinc-800 pt-2">
        {job.postedTime || job.createdAt || "Just now"}
      </p>
    </div>
  );
};

export const JobPreview = ({
  jobId,
  conversationId,
}: {
  jobId: string;
  conversationId?: string;
}) => {
  const [job, setJob] = useState<
    Job | { notFound: boolean; message: string } | null
  >(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    safeGetJobById(jobId).then((data) => {
      if (mounted) {
        setJob(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const wrapperClass =
    "box-border flex flex-row items-center p-2 gap-2.5 min-w-[219px] max-w-[340px] w-fit h-[58px] border border-[var(--ds-border)] rounded-[16px] bg-[var(--ds-bg)] cursor-pointer hover:bg-[var(--ds-surface-1)]/50 transition-colors select-none mb-2";

  if (loading) {
    return (
      <div className={cn(wrapperClass, "animate-pulse cursor-default")}>
        <div className="flex flex-row items-center p-0 gap-2 h-10 w-full min-w-0">
          <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] shrink-0" />
          <div className="flex flex-col justify-center gap-1.5 flex-1 min-w-0">
            <div className="h-3.5 bg-[var(--ds-surface-1)] rounded w-3/4" />
            <div className="h-2.5 bg-[var(--ds-surface-1)] rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  const isNotFound = job && typeof job === "object" && "notFound" in job;

  if (!job || isNotFound) {
    const errMsg = isNotFound ? (job as any).message : "Job not found";
    return (
      <div className={cn(wrapperClass, "cursor-default opacity-80")}>
        <div className="flex flex-row items-center p-0 gap-2 h-10 w-full min-w-0">
          <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0">
            <BriefcaseIcon className="w-5 h-5 text-[var(--ds-text-secondary)]" size={20} />
          </div>
          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="font-['DM_Sans'] text-xs text-[var(--ds-text-muted)] italic truncate">
              {errMsg}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const rawJob = job as any;
  const getCity = (loc?: string) => {
    if (!loc) return "Remote";
    const city = loc.split(",")[0].trim();
    return city || loc;
  };

  const companyName = job.company || rawJob.company_name || "";
  const workMode = job.workMode || rawJob.work_mode || "Hybrid";
  const exp = job.experience || rawJob.experience_level || "0-2Yrs";

  return (
    <div
      className={wrapperClass}
      onClick={(e) => {
        e.stopPropagation();
        const returnTo = conversationId
          ? `/messaging?conversationId=${conversationId}`
          : "/messaging";
        router.push(`/jobs/${jobId}?returnTo=${encodeURIComponent(returnTo)}`);
      }}
    >
      <div className="flex flex-row items-center p-0 gap-2 h-10 w-full min-w-0">
        {/* Frame 2609815: Icon Box */}
        <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] flex items-center justify-center shrink-0">
          <BriefcaseIcon className="w-5 h-5 text-[var(--ds-text-primary)]" size={20} />
        </div>

        {/* Frame 2609957: Text Box */}
        <div className="flex flex-col justify-center items-start p-0 h-10 min-w-0 flex-1 overflow-hidden">
          {/* Frame 2609814: Title • Org */}
          <div className="h-6 flex flex-row items-center min-w-0 max-w-full">
            <span className="font-['DM_Sans'] font-medium text-base leading-6 text-[var(--ds-text-primary)] truncate shrink-0 max-w-[180px]">
              {job.title}
            </span>
            {companyName && (
              <>
                <span className="font-['DM_Sans'] font-medium text-base leading-6 text-[var(--ds-text-secondary)] mx-1 shrink-0">
                  •
                </span>
                <span className="font-['DM_Sans'] font-medium text-base leading-6 text-[var(--ds-text-secondary)] truncate min-w-0">
                  {companyName}
                </span>
              </>
            )}
          </div>

          {/* Subtitle: Type • Location • Experience */}
          <div className="h-4 flex flex-row items-center min-w-0 max-w-full">
            <span className="font-['DM_Sans'] font-normal text-xs leading-4 text-[var(--ds-text-secondary)] truncate">
              {[workMode, getCity(job.location), exp].filter(Boolean).join(" • ")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const JobOfferContextMessage = ({ jobId }: { jobId: string }) => {
  const [job, setJob] = useState<
    Job | { notFound: boolean; message: string } | null
  >(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    safeGetJobById(jobId).then((data) => {
      if (mounted) {
        setJob(data);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [jobId]);

  const getCityName = (loc: string) => {
    if (!loc) return "";
    if (loc.includes(",")) {
      return loc.split(",")[0].trim();
    }
    return loc.split(" ")[0];
  };

  if (loading) {
    return (
      <div className="w-full max-w-[740px] border border-[#EEF2FF] dark:border-zinc-800 rounded-[24px] p-[16px] bg-slate-50/50 dark:bg-zinc-900/50 animate-pulse flex flex-col md:flex-row justify-between items-center gap-[12px] mr-auto my-3 min-h-[116px]">
        <div className="flex flex-col items-start gap-[8px] flex-1">
          <div className="h-[24px] bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
        </div>
        <div className="flex flex-col items-start gap-[12px] shrink-0 w-[152px]">
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-[20px] bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const isNotFound = job && typeof job === "object" && "notFound" in job;

  if (!job || isNotFound) {
    const errMsg = isNotFound ? (job as any).message : "Job not found";
    return (
      <div className="w-full max-w-[740px] min-h-[116px] border border-[#EEF2FF] dark:border-zinc-800 rounded-[24px] p-[16px] bg-white dark:bg-zinc-950 flex items-center gap-3 mr-auto my-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-gray-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"
          />
        </svg>
        <p className="font-['Poppins'] font-normal text-[14px] text-[#6B7280] italic">
          {errMsg}
        </p>
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push(`/jobs/${jobId}`)}
      className="w-full max-w-[740px] border border-[#EEF2FF] dark:border-zinc-800 rounded-[24px] p-[16px] bg-white dark:bg-zinc-950 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer flex flex-col md:flex-row justify-between items-center gap-[12px] mr-auto my-3 min-h-[116px]"
    >
      <div className="flex flex-col items-start gap-[8px] min-w-0">
        <h3 className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-black dark:text-zinc-100 m-0 truncate">
          {job.title}
        </h3>
        <p className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-[#6B7280] m-0 truncate">
          {job.company}
        </p>
        <span className="font-['Poppins'] font-semibold text-[14px] leading-[20px] text-[#6B7280] m-0">
          {job.type || "Full time"}
        </span>
      </div>

      <div className="flex flex-col items-start gap-[12px] shrink-0">
        <div className="flex flex-row items-center gap-[8px]">
          <Icon
            icon="hugeicons:job-search"
            className="w-[20px] h-[20px] text-black dark:text-zinc-100 shrink-0"
            style={{ strokeWidth: "1.5px" }}
          />
          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black dark:text-zinc-100">
            {job.experience || "0-2Yrs"}
          </span>
        </div>
        <div className="flex flex-row items-center gap-[8px]">
          <Icon
            icon="hugeicons:location-05"
            className="w-[20px] h-[20px] text-black dark:text-zinc-100 shrink-0"
            style={{ strokeWidth: "1.5px" }}
          />
          <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black dark:text-zinc-100">
            {job.workMode
              ? `${job.workMode} - ${getCityName(job.location)}`
              : getCityName(job.location)}
          </span>
        </div>
        {job.salary && job.salary !== "Competitive" && (
          <div className="flex flex-row items-center gap-[8px]">
            <Icon
              icon="hugeicons:money-bag-02"
              className="w-[20px] h-[20px] text-black dark:text-zinc-100 shrink-0"
              style={{ strokeWidth: "1.5px" }}
            />
            <span className="font-['Poppins'] font-normal text-[14px] leading-[20px] text-black dark:text-zinc-100">
              {job.salary}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobApplicationContextCard;

