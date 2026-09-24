"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function CreateProjectDialog({
  isOpen,
  onClose,
  onCreate,
}: CreateProjectDialogProps) {
  const [projectName, setProjectName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      onCreate(projectName.trim());
      setProjectName("");
    }
  };

  const handleCancel = () => {
    setProjectName("");
    onClose();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const length = input.value.length;
    input.setSelectionRange(length, length);
    setTimeout(() => {
      if (input) {
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 0);
  };

  const isCreateDisabled = !projectName.trim();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className="max-w-[384px] w-[90%] p-4 pt-4 pb-10 bg-[var(--background)] border border-[var(--border)] shadow-lg flex flex-col font-sans"
        style={{
          borderRadius: "24px",
        }}
      >
        <div className="self-stretch flex flex-col justify-start items-center gap-4">
          <div className="flex flex-col justify-start items-center gap-2">
            <DialogTitle className="text-center justify-start text-[var(--foreground)] text-lg font-medium font-['Poppins'] leading-6">
              Create project
            </DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="self-stretch flex flex-col justify-start items-center gap-4 w-full">
            <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
              <label
                htmlFor="project-name-input"
                className="justify-start text-[var(--foreground)] text-sm font-normal font-['Poppins'] leading-5"
              >
                Project name
              </label>
              <input
                id="project-name-input"
                type="text"
                placeholder="e.g. Tech"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onFocus={handleFocus}
                className="self-stretch h-12 px-4 py-2 bg-[var(--background)] rounded-2xl border border-[var(--border)] text-[var(--foreground)] text-base font-normal font-['Poppins'] leading-6 outline-none w-full focus:border-[var(--primary)] transition-all"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="w-72 inline-flex justify-center items-start gap-2 mt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-10 px-4 py-2 bg-[var(--background)] rounded-3xl border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-tint)] flex justify-center items-center gap-2.5 cursor-pointer transition-all outline-none"
              >
                <span className="text-center justify-start text-[var(--primary)] text-sm font-normal font-['Poppins'] leading-5">
                  Cancel
                </span>
              </button>
              <button
                type="submit"
                disabled={isCreateDisabled}
                className={`flex-1 h-10 px-4 py-2 rounded-3xl flex justify-center items-center gap-2.5 transition-all outline-none border-none text-white text-sm font-normal font-['Poppins'] leading-5 ${isCreateDisabled
                    ? "bg-[var(--primary-tint)] text-[var(--muted-foreground)] cursor-default"
                    : "bg-[var(--primary)] hover:bg-[var(--primary)]/90 cursor-pointer"
                  }`}
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
