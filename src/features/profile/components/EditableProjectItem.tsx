"use client";

import React, { useState, useMemo } from "react";
import { Project } from "@/types/entities";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

interface EditableProjectItemProps {
  project: Project;
  onEdit?: () => void;
  isOwnProfile?: boolean;
  onMediaClick?: (mediaItem: any) => void;
}

export function EditableProjectItem({
  project,
  onEdit,
  isOwnProfile = true,
  onMediaClick,
}: EditableProjectItemProps) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const isLongDescription = project.details && project.details.length > 160;

  const displayDescription = useMemo(() => {
    if (!project.details) return "";
    if (isDescExpanded || !isLongDescription) return project.details;

    const truncated = project.details.slice(0, 160);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 50) {
      return truncated.slice(0, lastSpace);
    }
    return truncated;
  }, [project.details, isDescExpanded, isLongDescription]);

  const formattedStart = useMemo(() => {
    return `${project.start_month || ""} ${project.start_year || ""}`.trim();
  }, [project.start_month, project.start_year]);

  const formattedEnd = useMemo(() => {
    return project.is_current || !project.end_year ? "Present" : `${project.end_month || ""} ${project.end_year || ""}`.trim();
  }, [project.is_current, project.end_month, project.end_year]);

  const formattedTeamSize = useMemo(() => {
    if (!project.team_size) return "";
    const trimmed = project.team_size.trim();
    if (/^\d+$/.test(trimmed)) {
      return `Team of ${trimmed}`;
    }
    return trimmed;
  }, [project.team_size]);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "image":
        return "mage:image";
      case "document":
        return "solar:document-linear";
      case "link":
      default:
        return "ant-design:link-outlined";
    }
  };

  return (
    <div className="flex flex-col md:flex-row group relative w-full items-start justify-between gap-3 md:gap-6">
      {/* Left/Center Content: Icon + Info */}
      <div className="flex gap-4 flex-1 min-w-0">
        {/* Project Thumbnail / Placeholder Icon */}
        <div className="entity-placeholder">
          <Icon icon="si:projects-line" className="entity-placeholder-icon" />
        </div>

        {/* Info block */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-[6px]">
            {/* Title & Mobile Edit Button */}
            <div className="flex justify-between items-start w-full">
              <h3 className="text-[16px] leading-[24px] font-medium font-[family-name:var(--font-poppins)] text-foreground mb-[2px]">
                {project.title}
              </h3>
              {isOwnProfile && onEdit && (
                <button
                  onClick={onEdit}
                  className="md:hidden flex-shrink-0 p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
                >
                  <Icon icon="eva:edit-outline" className="w-[20px] h-[20px] stroke-[1.5px] transition-colors" />
                </button>
              )}
            </div>

            {/* Details / Description */}
            {project.details && (
              <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground mb-[6px] break-words">
                {displayDescription}
                {!isDescExpanded && isLongDescription && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescExpanded(true);
                    }}
                    className="text-muted-foreground hover:text-primary font-semibold transition-colors cursor-pointer ml-1 inline-flex items-center"
                  >
                    ... More
                  </button>
                )}
                {isDescExpanded && isLongDescription && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDescExpanded(false);
                    }}
                    className="text-primary hover:underline ml-1 font-medium cursor-pointer inline-flex items-center"
                  >
                    See less
                  </button>
                )}
              </p>
            )}

            {/* Skills Used */}
            {project.skills && project.skills.length > 0 && (
              <div className="flex items-center gap-[6px] text-[12px] leading-[16px] font-[family-name:var(--font-poppins)] text-foreground py-[2px]">
                <Icon icon="iconoir:light-bulb-on" className="w-[15px] h-[15px] text-black dark:text-white flex-shrink-0" />
                <span className="break-words">{project.skills.join(", ")}</span>
              </div>
            )}

            {/* Media Attachments Row */}
            {project.media && project.media.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-[4px]">
                {project.media.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => onMediaClick?.(item)}
                    className="flex items-center gap-[6px] text-[12px] leading-[16px] font-medium font-[family-name:var(--font-poppins)] text-[#6366F1] dark:text-primary cursor-pointer hover:underline"
                  >
                    <Icon icon={getMediaIcon(item.type)} className="w-[15px] h-[15px] text-[#6366F1] dark:text-primary flex-shrink-0" />
                    <span>{item.title || "Attachment"}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Role in project */}
            {project.role && (
              <div className="text-[12px] leading-[16px] font-medium font-[family-name:var(--font-poppins)] text-foreground mt-[4px]">
                Role — {project.role}
              </div>
            )}

            {/* Role Description */}
            {project.role_description && (
              <p className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-muted-foreground mt-[2px] break-words">
                {project.role_description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Metadata + Edit Button (Desktop Only) */}
      <div className="hidden md:flex flex-row items-start justify-between md:justify-end flex-shrink-0 w-full md:w-[220px] gap-[12px] md:gap-[16px] md:ml-auto pl-[72px] md:pl-0">
        <div className="flex flex-col items-start p-0 gap-[8px] md:w-[130px]">
          {formattedStart || formattedEnd ? (
            <div className="flex flex-row flex-wrap md:flex-nowrap items-center gap-x-[8px] gap-y-[4px]">
              <span className="md:w-[60px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                {formattedStart || "—"}
              </span>
              <span className="md:w-[9px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-center text-muted-foreground">
                -
              </span>
              <span className="md:w-[75px] md:h-[16px] font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground whitespace-nowrap">
                {formattedEnd}
              </span>
            </div>
          ) : null}
          {project.organization && (
            <div className="w-full break-words font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground">
              {project.organization}
            </div>
          )}
          {formattedTeamSize && (
            <div className="w-full break-words font-[family-name:var(--font-poppins)] font-normal text-[12px] leading-[16px] text-muted-foreground">
              {formattedTeamSize}
            </div>
          )}
        </div>
        <div className="w-[32px] flex justify-end flex-shrink-0">
          {isOwnProfile && onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-[color:var(--edit-btn-hover)] text-muted-foreground hover:text-primary rounded-full transition-colors mt-[-4px]"
            >
              <Icon icon="eva:edit-outline" className="w-[24px] h-[24px] stroke-[1.5px] transition-colors" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
