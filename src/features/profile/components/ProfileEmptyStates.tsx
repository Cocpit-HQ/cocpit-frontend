"use client";

import React from "react";
import {
  EmptyPostsIcon,
  EmptyExperienceIcon,
  EmptyEducationIcon,
  EmptyProjectIcon,
  WarningTriangleIcon,
} from "@/components/icons";

export interface ProfileEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  className?: string;
}

export const ProfileEmptyState: React.FC<ProfileEmptyStateProps> = ({
  icon,
  title,
  description,
  className = "",
}) => {
  return (
    <div
      className={`w-full max-w-[780px] py-10 px-5 flex flex-col items-center justify-center gap-4 self-stretch ${className}`}
    >
      {/* IconFrame: 56x56px, rounded-full, 12px padding */}
      <div className="w-14 h-14 rounded-full bg-[var(--ds-surface-1)] p-3 flex items-center justify-center text-[var(--ds-text-muted)] shrink-0">
        {icon}
      </div>

      {/* TextBlock: 6px gap, centered */}
      <div className="w-full max-w-[740px] flex flex-col items-center gap-1.5 text-center">
        <h3 className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6">
          {title}
        </h3>
        <p className="text-[var(--ds-text-secondary)] text-sm font-normal font-['DM_Sans'] leading-5">
          {description}
        </p>
      </div>
    </div>
  );
};

export interface ProfilePostsEmptyStateProps {
  isOwnProfile?: boolean;
  userName?: string;
}

export const ProfilePostsEmptyState: React.FC<ProfilePostsEmptyStateProps> = ({
  isOwnProfile = true,
  userName,
}) => {
  const description = isOwnProfile ? (
    <>
      Share your thoughts, articles, or updates with
      <br />
      your network.
    </>
  ) : userName ? (
    `${userName} hasn't shared any posts yet`
  ) : (
    "This user hasn't shared any posts yet"
  );

  return (
    <ProfileEmptyState
      icon={<EmptyPostsIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" />}
      title="No posts yet"
      description={description}
    />
  );
};

export const ProfileExperienceEmptyState: React.FC = () => {
  return (
    <ProfileEmptyState
      icon={<EmptyExperienceIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" />}
      title="No experience added"
      description={
        <>
          Adding your work history helps others learn
          <br />
          about your background.
        </>
      }
    />
  );
};

export const ProfileEducationEmptyState: React.FC = () => {
  return (
    <ProfileEmptyState
      icon={<EmptyEducationIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" />}
      title="No education added"
      description={
        <>
          Share your academic background and
          <br />
          certifications.
        </>
      }
    />
  );
};

export const ProfileProjectsEmptyState: React.FC = () => {
  return (
    <ProfileEmptyState
      icon={<EmptyProjectIcon className="w-8 h-8 text-[var(--ds-text-muted)] shrink-0" />}
      title="No projects yet"
      description={
        <>
          Showcase your work by adding projects you have
          <br />
          contributed to.
        </>
      }
    />
  );
};

// ─── Failed to Load / Error State Component (Shared) ──────────────────────────

import {
  FailedToLoad,
  type FailedToLoadProps,
  type FailedToLoadSectionType,
} from "@/shared/commonComponents/FailedToLoad";

import {
  FullPageError,
  type FullPageErrorProps,
} from "@/shared/commonComponents/FullPageError";
import {
  SomethingWentWrong,
  type SomethingWentWrongProps,
} from "@/shared/commonComponents/SomethingWentWrong";

export { FailedToLoad, FullPageError, SomethingWentWrong };
export type {
  FailedToLoadProps,
  FailedToLoadSectionType,
  FullPageErrorProps,
  SomethingWentWrongProps,
};

export const ProfileErrorState = FailedToLoad;
export type ProfileErrorStateProps = FailedToLoadProps;
export const ProfileFullPageError = FullPageError;
export const ProfileConnectionErrorState = SomethingWentWrong;

export const ProfilePostsErrorState: React.FC<{ onRetry?: () => void; className?: string }> = ({
  onRetry,
  className,
}) => <FailedToLoad type="posts" onRetry={onRetry} className={className} />;

export const ProfileExperienceErrorState: React.FC<{ onRetry?: () => void; className?: string }> = ({
  onRetry,
  className,
}) => <FailedToLoad type="experience" onRetry={onRetry} className={className} />;

export const ProfileEducationErrorState: React.FC<{ onRetry?: () => void; className?: string }> = ({
  onRetry,
  className,
}) => <FailedToLoad type="education" onRetry={onRetry} className={className} />;

export const ProfileProjectsErrorState: React.FC<{ onRetry?: () => void; className?: string }> = ({
  onRetry,
  className,
}) => <FailedToLoad type="projects" onRetry={onRetry} className={className} />;

export const ProfileSkillsErrorState: React.FC<{ onRetry?: () => void; className?: string }> = ({
  onRetry,
  className,
}) => <FailedToLoad type="skills" onRetry={onRetry} className={className} />;

export const ProfileFooterSection: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  return (
    <div
      className={`w-full max-w-[800px] py-10 flex flex-row items-center justify-center gap-2.5 ${className}`}
    >
      <span className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6 text-center">
        That&apos;s all for now
      </span>
    </div>
  );
};
