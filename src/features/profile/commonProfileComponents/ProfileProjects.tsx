"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { EditableProjectItem } from "../components/EditableProjectItem";
import { ProfileEmptyState } from "./ProfileEmptyState";
import { Project } from "@/types/entities";

interface ProfileProjectsProps {
  projects: Project[];
  isOwnProfile: boolean;
  onAddProjectClick?: () => void;
  onEditProjectClick?: (project: Project) => void;
  onMediaClick?: (media: any) => void;
}

export function ProfileProjects({
  projects,
  isOwnProfile,
  onAddProjectClick,
  onEditProjectClick,
  onMediaClick,
}: ProfileProjectsProps) {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);

  if (!projects?.length && !isOwnProfile) {
    return null;
  }

  return (
    <div
      id="projects-section"
      className="w-full bg-card mt-[16px] md:rounded-[24px] transition-all duration-500 ease-in-out overflow-hidden"
    >
      <div className="pb-[40px] flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:pl-10 md:pr-4">
          <h2 className="text-[18px] leading-[26px] text-foreground font-medium font-['DM_Sans']">
            Projects
          </h2>
          {isOwnProfile && onAddProjectClick && (
            <button
              onClick={onAddProjectClick}
              className="add-button-chip cursor-pointer"
              title="Add project"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Projects Nested Card Wrapper */}
        <div className="px-4 md:pl-10 md:pr-4">
          <div
            className={`bg-card rounded-[24px] ${
              projects.length > 0 ? "min-h-[72px] py-4 md:py-8" : ""
            } px-4 md:pl-[40px] md:pr-4 `}
          >
            {projects.length === 0 ? (
              <ProfileEmptyState
                type="projects"
                isOwnProfile={isOwnProfile}
              />
            ) : (
              <div className="flex flex-col gap-[24px]">
                {(isProjectsExpanded ? projects : projects.slice(0, 2)).map(
                  (project, index) => (
                    <EditableProjectItem
                      key={`${project.project_id}-${index}`}
                      project={project}
                      onEdit={() => onEditProjectClick?.(project)}
                      isOwnProfile={isOwnProfile}
                      onMediaClick={onMediaClick}
                    />
                  )
                )}
              </div>
            )}

            {projects.length > 2 && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                  className="w-[86px] h-[24px] flex items-center justify-center text-[14px] leading-[20px] font-normal font-['DM_Sans'] text-primary transition-all flex-none cursor-pointer"
                >
                  {isProjectsExpanded ? "View less" : "View more"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
