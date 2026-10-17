"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ProjectSkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  skills: string[];
}

export function ProjectSkillsModal({ isOpen, onClose, projectTitle, skills }: ProjectSkillsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="bg-white border-none shadow-[0px_4px_24px_rgba(0,0,0,0.1)] p-6 flex flex-col items-center sm:max-w-[600px] w-full !rounded-[24px] gap-0 [&>button.absolute]:hidden"
      >
        <div className="w-full flex justify-end">
          <button 
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-[#FF6B6B]" strokeWidth={1} />
          </button>
        </div>

        <DialogTitle className="font-['DM_Sans'] font-medium text-[18px] leading-[26px] text-center text-black mt-2 mb-4">
          Skills for {projectTitle.toLowerCase()}
        </DialogTitle>

        <div className="w-full max-h-[60vh] overflow-y-auto flex flex-col gap-4 px-1 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {skills.map((skill, index) => (
            <div 
              key={index}
              className="w-full flex items-center px-4 bg-white rounded-[24px]"
              style={{ height: '36px' }}
            >
              <span className="font-['DM_Sans'] font-normal text-[14px] leading-[20px] text-black">
                {skill}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
