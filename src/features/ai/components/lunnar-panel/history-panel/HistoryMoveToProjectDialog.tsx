"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@iconify/react";

interface HistoryMoveToProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatTitle: string;
  onMove?: (projectName: string) => void;
}

export default function HistoryMoveToProjectDialog({
  isOpen,
  onClose,
  chatTitle,
  onMove,
}: HistoryMoveToProjectDialogProps) {
  // Dummy project list matching the design mockup screenshot
  const projects = [
    "Infrastructure Optimization",
    "AI research architecture",
  ];

  const handleSelectProject = (projectName: string) => {
    if (onMove) {
      onMove(projectName);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[360px] w-[90%] p-6 bg-[var(--card)] outline outline-1 outline-offset-[-1px] outline-[var(--border)] shadow-lg flex flex-col font-sans border-none"
        style={{
          borderRadius: "24px",
        }}
      >
        <div className="self-stretch inline-flex flex-col justify-start items-center gap-4">
          <div className="flex flex-col justify-start items-center gap-2">
            <DialogTitle className="text-center justify-start text-[var(--foreground)] text-lg font-medium font-['Poppins'] leading-6">
              Move chat
            </DialogTitle>
          </div>

          {/* Project List */}
          <div className="self-stretch flex flex-col justify-start items-start gap-2">
            {projects.map((project) => (
              <button
                key={project}
                type="button"
                onClick={() => handleSelectProject(project)}
                className="self-stretch h-12 px-4 py-2 inline-flex justify-start items-center gap-2 rounded-3xl bg-transparent border-none cursor-pointer hover:bg-[var(--primary-tint)] transition-all duration-200 outline-none text-left"
              >
                <Icon
                  icon="solar:folder-linear"
                  width={24}
                  height={24}
                  className="text-[var(--foreground)] flex-shrink-0"
                />
                <span className="justify-center text-[var(--foreground)] text-base font-normal font-['Poppins'] leading-6">
                  {project}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              alert("Create new project action clicked");
              onClose();
            }}
            className="self-stretch h-10 px-4 bg-[var(--background)] rounded-3xl border border-[var(--primary)] inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-[var(--primary-tint)] transition-all duration-200 outline-none"
          >
            <Icon
              icon="lucide:plus"
              width={24}
              height={24}
              className="text-[var(--primary)] flex-shrink-0"
            />
            <span className="text-center text-[var(--primary)] text-sm font-normal font-['Poppins'] leading-5">
              New project
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
