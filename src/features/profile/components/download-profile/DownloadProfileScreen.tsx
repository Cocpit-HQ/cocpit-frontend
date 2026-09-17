"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/icons";
import { useMyProfile } from "@/hooks/use-my-profile";
import { ResumeTemplate } from "./ResumeTemplate";
import type { UserProfile, UserData, User } from "@/types/user";
import type { Experience, Education, Project, ExperienceGroup } from "@/types/entities";

export interface DownloadProfileScreenProps {
  isOpen?: boolean;
  onClose: () => void;
  profileData?: UserProfile | null;
  user?: UserData | User | null;
  experiences?: Experience[] | ExperienceGroup[];
  educations?: Education[];
  projects?: Project[];
  skills?: any[];
}

export const DownloadProfileScreen: React.FC<DownloadProfileScreenProps> = ({
  isOpen = true,
  onClose,
  profileData: initialProfileData,
  user: initialUser,
  experiences: initialExperiences,
  educations: initialEducations,
  projects: initialProjects,
  skills: initialSkills,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling while open
  useEffect(() => {
    if (isOpen && mounted) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, mounted]);

  // Support Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch profile data if not supplied
  const { data: queriedProfile } = useMyProfile();
  const profile = initialProfileData || queriedProfile;

  const resolvedUser = initialUser || (profile?.user as UserData | undefined);
  const resolvedExperiences = initialExperiences || profile?.experiences || [];
  const resolvedEducations = initialEducations || profile?.educations || [];
  const resolvedProjects = initialProjects || profile?.projects || [];
  const resolvedSkills = initialSkills || profile?.skills || [];


  if (!isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-[100] min-h-screen w-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] font-['DM_Sans'] flex flex-col items-center overflow-y-auto overflow-x-hidden scrollbar-hide select-text animate-in fade-in-90 duration-200">
      {/* Print & Resume Preview Styles */}
      <style jsx global>{`
        /* Force resume paper preview to always be pure white with black text regardless of dark mode */
        #resume-print-area {
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        #resume-print-area h1 {
          color: #000000 !important;
        }
        #resume-print-area h2 {
          color: #000000 !important;
          border-color: #000000 !important;
        }
        #resume-print-area p,
        #resume-print-area span,
        #resume-print-area li,
        #resume-print-area div {
          color: inherit;
        }
        #resume-print-area .text-black,
        #resume-print-area .text-neutral-950,
        #resume-print-area .text-neutral-900,
        #resume-print-area .text-neutral-850,
        #resume-print-area .text-neutral-800 {
          color: #000000 !important;
        }
        #resume-print-area .text-neutral-700,
        #resume-print-area .text-neutral-600 {
          color: #374151 !important;
        }
        #resume-print-area .text-neutral-400 {
          color: #9ca3af !important;
        }
        #resume-print-area .border-black,
        #resume-print-area .border-neutral-950 {
          border-color: #000000 !important;
        }
        #resume-print-area svg {
          stroke: #000000 !important;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          /* Hide all surrounding app containers during print */
          body * {
            visibility: hidden !important;
          }
          #resume-print-area,
          #resume-print-area * {
            visibility: visible !important;
          }
          #resume-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top-Right Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close download profile"
        className="fixed top-[40px] right-[40px] z-[10000] w-[20px] h-[20px] flex items-center justify-center text-[var(--ds-text-primary)] hover:opacity-75 active:scale-95 transition-all cursor-pointer focus:outline-none no-print"
      >
        <CloseIcon size={20} className="w-[20px] h-[20px] text-[var(--ds-text-primary)]" />
      </button>

      {/* Centered Container (800px width) */}
      <div className="w-[800px] max-w-full px-4 sm:px-0 pt-[40px] pb-[60px] flex flex-col items-center relative">
        {/* Resume Preview Paper Sheet */}
        <div className="w-full flex justify-center shadow-2xl rounded-sm overflow-hidden bg-white">
          <ResumeTemplate
            id="resume-print-area"
            user={resolvedUser}
            experiences={resolvedExperiences}
            educations={resolvedEducations}
            projects={resolvedProjects}
            skills={resolvedSkills}
          />
        </div>
      </div>
    </div>
  );

  if (mounted && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
};

export default DownloadProfileScreen;
