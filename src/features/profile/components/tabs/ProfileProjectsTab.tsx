import React, { useState } from "react";
import {
  ProfileEditIcon,
  SkillsBulbIcon,
  ExternalLinkIcon,
  EduGraduationIcon,
  ProjectDocIcon,
} from "@/components/icons";
import type { Project } from "@/types/entities";
import { ProfileProjectsEmptyState, ProfileProjectsErrorState } from "../ProfileEmptyStates";

interface ProfileProjectsTabProps {
  projects: Project[];
  isOwnProfile?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onEditProject?: (project: Project) => void;
  onAddProject?: () => void;
}

import { ExpandableText } from "@/hooks";

export const ProfileProjectsTab: React.FC<ProfileProjectsTabProps> = ({
  projects = [],
  isOwnProfile = true,
  isError,
  onRetry,
  onEditProject,
  onAddProject,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});

  const toggleSkills = (id: string) => {
    setExpandedSkills((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isError) {
    return <ProfileProjectsErrorState onRetry={onRetry} />;
  }

  if (!projects || projects.length === 0) {
    return <ProfileProjectsEmptyState />;
  }

  const displayedProjects = isExpanded ? projects : projects.slice(0, 2);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <div className="w-full flex flex-col items-start gap-5">
        {displayedProjects.map((proj, idx) => {
          const startDateFormatted = proj.start_month
            ? `${proj.start_month} ${proj.start_year || ""}`.trim()
            : proj.start_year || "";
          const endDateFormatted = proj.is_current
            ? "Present"
            : proj.end_month
            ? `${proj.end_month} ${proj.end_year || ""}`.trim()
            : proj.end_year || "Present";

          const skills = proj.skills || [];
          const isSkillsExpanded = expandedSkills[proj.project_id || `${idx}`];
          const visibleSkills = isSkillsExpanded ? skills : skills.slice(0, 2);
          const remainingCount = skills.length - 2;

          return (
            <div key={proj.project_id || idx} className="w-full flex flex-row items-start gap-3">
              {/* Project Icon / Placeholder (40x40px, rounded-[8px]) */}
              <div className="w-10 h-10 rounded-[8px] bg-[var(--ds-surface-1)] flex items-center justify-center flex-shrink-0 overflow-hidden">
                <EduGraduationIcon className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0" />
              </div>

              {/* Project Details Column */}
              <div className="flex-1 flex flex-col items-start gap-3 min-w-0">
                <div className="w-full flex flex-row items-start justify-between gap-2">
                  <div className="flex flex-col items-start gap-1 flex-1 min-w-0">
                    {/* Title */}
                    <div className="text-[var(--ds-text-primary)] text-base font-medium font-['DM_Sans'] leading-6">
                      {proj.title}
                    </div>

                    {/* Date Range */}
                    {(startDateFormatted || endDateFormatted) && (
                      <div className="flex flex-row items-center gap-2 flex-wrap text-xs font-normal font-['DM_Sans'] leading-4 text-[var(--ds-text-secondary)]">
                        {startDateFormatted && <span>{startDateFormatted}</span>}
                        {startDateFormatted && endDateFormatted && (
                          <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full shrink-0" />
                        )}
                        {endDateFormatted && <span>{endDateFormatted}</span>}
                      </div>
                    )}
                  </div>

                  {/* Edit Icon for Own Profile */}
                  {isOwnProfile && onEditProject && (
                    <button
                      type="button"
                      onClick={() => onEditProject(proj)}
                      className="w-5 h-5 flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0"
                      title="Edit project"
                    >
                      <ProfileEditIcon className="w-5 h-5 text-[var(--ds-text-primary)]" />
                    </button>
                  )}
                </div>

                {/* Description */}
                {proj.details && (
                  <ExpandableText text={proj.details} />
                )}

                {/* Skills Used */}
                {skills.length > 0 && (
                  <div className="flex flex-row items-center gap-2 flex-wrap">
                    <SkillsBulbIcon className="w-4 h-4 text-[var(--ds-text-primary)] shrink-0" />
                    {visibleSkills.map((sk: any, sIdx: number) => {
                      const skName = typeof sk === "string" ? sk : sk.name || sk.skill_name;
                      return (
                        <span
                          key={sIdx}
                          className="text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4"
                        >
                          {skName}
                        </span>
                      );
                    })}
                    {remainingCount > 0 && (
                      <button
                        type="button"
                        onClick={() => toggleSkills(proj.project_id || `${idx}`)}
                        className="flex flex-row items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <div className="w-7 h-0 border-t border-[var(--ds-accent)] flex-none" />
                        <span className="text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4">
                          {isSkillsExpanded ? "Show less" : `+${remainingCount} more`}
                        </span>
                      </button>
                    )}
                  </div>
                )}

                {/* Media & Action Boxes (Web Link, Doc, Image - each only shown if present) */}
                {(() => {
                  const mediaList = proj.media || [];
                  const linkMedia = mediaList.find(
                    (m: any) =>
                      m.type === "link" ||
                      (m.url && !/\.(jpg|jpeg|png|webp|gif|svg|pdf|doc|docx)$/i.test(m.url))
                  );
                  const docMedia = mediaList.find(
                    (m: any) =>
                      m.type === "document" ||
                      (m.url && /\.(pdf|doc|docx|txt)$/i.test(m.url))
                  );
                  const imgMedia = mediaList.find(
                    (m: any) =>
                      m.type === "image" ||
                      (m.url && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(m.url)) ||
                      (m.fileUrl && /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(m.fileUrl))
                  );

                  const linkUrl = linkMedia?.url || linkMedia?.fileUrl;
                  const docUrl = docMedia?.url || docMedia?.fileUrl;
                  const imgUrl = imgMedia?.url || imgMedia?.fileUrl;

                  const hasAnyMedia = !!(linkUrl || docUrl || imgUrl);
                  if (!hasAnyMedia) return null;

                  return (
                    <div className="flex flex-row items-center gap-3 overflow-x-auto py-1">
                      {/* Box 1: Web / Link (only if present) */}
                      {linkUrl && (
                        <a
                          href={
                            /^https?:\/\//i.test(linkUrl)
                              ? linkUrl
                              : `https://${linkUrl}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-20 h-10 bg-[var(--ds-surface-1)] rounded-lg flex flex-col items-center justify-center gap-2.5 overflow-hidden flex-none hover:opacity-80 transition-opacity cursor-pointer"
                          title={linkMedia?.title || "Project website"}
                        >
                          <ExternalLinkIcon className="w-5 h-5 flex-none order-0 text-[var(--ds-text-primary)]" />
                        </a>
                      )}

                      {/* Box 2: Document (only if present) */}
                      {docUrl && (
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-20 h-10 bg-[var(--ds-surface-1)] rounded-lg flex flex-col items-center justify-center gap-2.5 overflow-hidden flex-none hover:opacity-80 transition-opacity cursor-pointer"
                          title={docMedia?.title || "Project document"}
                        >
                          <ProjectDocIcon className="w-5 h-5 flex-none order-0 text-[var(--ds-text-primary)]" />
                        </a>
                      )}

                      {/* Box 3: Image (only if present) */}
                      {imgUrl && (
                        <div className="w-20 h-10 bg-[var(--ds-surface-1)] rounded-lg overflow-hidden flex-none flex items-center justify-center">
                          <img
                            src={imgUrl}
                            alt={imgMedia?.title || "Project preview"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.parentElement?.remove();
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Role Details */}
                {(proj.role || proj.team_size || proj.role_description) && (
                  <div className="flex flex-col items-start gap-1 pt-1">
                    <div className="text-[var(--ds-text-primary)] text-xs font-semibold font-['DM_Sans'] leading-4">
                      Role details
                    </div>
                    {(proj.role || proj.team_size) && (
                      <div className="flex flex-row items-center gap-2 flex-wrap text-[var(--ds-text-primary)] text-xs font-normal font-['DM_Sans'] leading-4">
                        {proj.role && <span>{proj.role}</span>}
                        {proj.role && proj.team_size && (
                          <div className="w-1 h-1 bg-[var(--ds-text-muted)] rounded-full shrink-0" />
                        )}
                        {proj.team_size && <span>Team of {proj.team_size}</span>}
                      </div>
                    )}
                    {proj.role_description && (
                      <ExpandableText text={proj.role_description} />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {projects.length > 2 && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[var(--ds-accent)] text-xs font-medium font-['DM_Sans'] leading-4 cursor-pointer hover:opacity-80 transition-opacity mt-2 self-center"
        >
          {isExpanded ? "View less" : "View more"}
        </button>
      )}
    </div>
  );
};

export default ProfileProjectsTab;

