"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface RenameProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onRename: (newName: string) => void;
}

export default function RenameProjectDialog({
  isOpen,
  onClose,
  currentName,
  onRename,
}: RenameProjectDialogProps) {
  const [projectName, setProjectName] = useState(currentName);

  useEffect(() => {
    if (isOpen) {
      setProjectName(currentName);
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim() && projectName.trim() !== currentName) {
      onRename(projectName.trim());
    }
    onClose();
  };

  const handleCancel = () => {
    setProjectName(currentName);
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

  const isRenameDisabled = !projectName.trim() || projectName.trim() === currentName;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent
        className="max-w-[384px] w-[90%] p-4 pt-4 pb-10 bg-white outline outline-1 outline-offset-[-1px] outline-indigo-200 shadow-lg flex flex-col font-sans border-none"
        style={{
          borderRadius: "24px",
        }}
      >
        <div className="self-stretch flex flex-col justify-start items-center gap-4">
          <div className="flex flex-col justify-start items-center gap-2">
            <DialogTitle className="text-center justify-start text-black text-lg font-medium font-['Poppins'] leading-6">
              Rename
            </DialogTitle>
          </div>

          <form onSubmit={handleSubmit} className="self-stretch flex flex-col justify-start items-center gap-4 w-full">
            <div className="self-stretch flex flex-col justify-start items-start gap-2 w-full">
              <div className="justify-start text-black text-sm font-normal font-['Poppins'] leading-5">
                Project name
              </div>
              <input
                type="text"
                placeholder="Greetings"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onFocus={handleFocus}
                className="self-stretch h-12 px-4 py-2 bg-white rounded-2xl border border-zinc-200 text-black text-base font-normal font-['Poppins'] leading-6 outline-none w-full focus:border-indigo-400 transition-all"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="w-72 inline-flex justify-center items-start gap-2 mt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-10 px-4 py-2 bg-white rounded-3xl border border-[#818CF8] text-[#818CF8] hover:bg-[#EEF2FF] flex justify-center items-center gap-2.5 cursor-pointer transition-all outline-none"
              >
                <span className="text-center justify-start text-[#818CF8] text-sm font-normal font-['Poppins'] leading-5">
                  Cancel
                </span>
              </button>
              <button
                type="submit"
                disabled={isRenameDisabled}
                className={`flex-1 h-10 px-4 py-2 rounded-3xl flex justify-center items-center gap-2.5 transition-all outline-none border-none text-white text-sm font-normal font-['Poppins'] leading-5 ${
                  isRenameDisabled
                    ? "bg-indigo-200 cursor-not-allowed"
                    : "bg-[#6366F1] hover:bg-[#4F46E5] cursor-pointer"
                }`}
              >
                Rename
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
