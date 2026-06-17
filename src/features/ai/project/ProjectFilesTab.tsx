"use client";

import React from "react";
import ProjectFileUploadEmptyState from "./ProjectFileUploadEmptyState";
import ProjectFileList from "./ProjectFileList";
import type { ProjectFile } from "./project.types";

interface ProjectFilesTabProps {
  files: ProjectFile[];
  onUploadFiles: (files: FileList) => void;
  onDeleteFile: (id: string) => void;
}

export default function ProjectFilesTab({
  files,
  onUploadFiles,
  onDeleteFile,
}: ProjectFilesTabProps) {
  const hasFiles = files.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Upload Area */}
      <ProjectFileUploadEmptyState onFilesSelected={onUploadFiles} />

      {/* Divider and File List only when files exist */}
      {hasFiles && (
        <>
          {/* Divider */}
          <div
            style={{
              width: "100%",
              maxWidth: "348px",
              height: "0px",
              borderBottom: "1px solid #E0E7FF",
              marginTop: "16px",
              marginBottom: "16px",
              alignSelf: "center",
              flexShrink: 0,
            }}
          />

          {/* File List */}
          <ProjectFileList files={files} onDeleteFile={onDeleteFile} />
        </>
      )}
    </div>
  );
}
