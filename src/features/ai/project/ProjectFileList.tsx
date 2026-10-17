"use client";

import React from "react";
import ProjectFileItem from "./ProjectFileItem";
import type { ProjectFile } from "./project.types";

interface ProjectFileListProps {
  files: ProjectFile[];
  onDeleteFile: (id: string) => void;
}

export default function ProjectFileList({ files, onDeleteFile }: ProjectFileListProps) {
  return (
    <div
      className="scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flex: 1,
        overflowY: "auto",
        minHeight: 0,
        width: "100%",
      }}
    >
      {files.map((file) => (
        <ProjectFileItem key={file.id} file={file} onDelete={onDeleteFile} />
      ))}
    </div>
  );
}
