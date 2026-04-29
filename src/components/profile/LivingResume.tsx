"use client";

import React, { useState } from "react";
import { Download, FileText, Upload, File, X, RefreshCw, Briefcase, Layers, Wrench, Plus, LayoutGrid } from "lucide-react";
import { Icon } from "@iconify/react";
import { Experience } from "@/types/entities";
import { getResumeOverview } from "./ResumeOverview";
import { useResumeMutations } from "./hooks/use-my-profile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface LivingResumeProps {
  experiences: Experience[];
  skills: string[];
  resumeName?: string | null;
  resumeUrl?: string | null;
}

export function LivingResume({ experiences, skills, resumeName, resumeUrl }: LivingResumeProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tempFile, setTempFile] = useState<File | null>(null);
  const { upload, remove } = useResumeMutations();

  const overview = getResumeOverview(experiences);

  // Metrics calculations
  const domains = new Set(experiences.map(e => e.company_name)).size + 2;
  const toolsCount = skills.length;
  let totalYears = 0;
  experiences.forEach((exp) => {
    const start = new Date(exp.start_date).getFullYear();
    const end = exp.end_date ? new Date(exp.end_date).getFullYear() : new Date().getFullYear();
    totalYears += end - start;
  });
  if (totalYears === 0) totalYears = 1;

  const handleDownload = () => {
    if (resumeUrl) {
      window.open(resumeUrl, '_blank');
    } else {
      alert("No resume uploaded yet.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTempFile(e.target.files[0]);
    }
  };

  const saveCustomResume = async () => {
    if (tempFile) {
      const formData = new FormData();
      formData.append("resume", tempFile);
      upload.mutate(formData, {
        onSuccess: () => {
          setTempFile(null);
          setIsUploadModalOpen(false);
        }
      });
    }
  };

  const removeCustomResume = () => {
    remove.mutate();
  };

  const metricsData = [
    {
      icon: <Icon icon="hugeicons:job-search" className="w-5 h-5 text-[#000000]" />,
      label: "Years experience",
      value: `${totalYears}+`,
    },
    {
      icon: <Icon icon="cib:when-i-work" className="w-5 h-5 text-[#000000]" />,
      label: "Domains worked",
      value: `${domains}`,
    },
    {
      icon: <Icon icon="carbon:tools-alt" className="w-5 h-5 text-[#000000]" />,
      label: "Tools mastered",
      value: `${toolsCount}`,
    },
  ];

  return (
    <div className="w-full box-border px-4 md:pr-[16px] pb-[20px] md:pl-[40px] mt-[16px]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="font-[family-name:var(--font-poppins)] font-medium text-[18px] leading-[26px] text-[#000000] flex items-center">
          Living resume
        </h2>

        <div className="flex items-center gap-3">
          {/* PDF File Chip */}
          {resumeName && (
            <div className="inline-flex items-center gap-[10px] w-[148px] h-[40px] px-[16px] py-[8px] rounded-[24px] border border-[#6B7280] bg-white hover:bg-[#F9FAFB] transition-colors box-border">
              <Icon icon="material-icon-theme:pdf" width={24} height={24} className="flex-shrink-0 text-[#6B7280] grayscale opacity-80" />
              <span className="font-[family-name:var(--font-poppins)] font-normal text-[14px] leading-[20px] text-[#6B7280] truncate flex-1 min-w-0">{resumeName}</span>
              <button
                onClick={removeCustomResume}
                disabled={remove.isPending}
                className="w-6 h-6 flex items-center justify-center transition-colors flex-shrink-0 text-[#EF4444] hover:opacity-80 cursor-pointer disabled:opacity-50"
                title="Remove"
              >
                <Icon icon="solar:close-circle-linear" width={24} height={24} />
              </button>
            </div>
          )}

          {/* Add Resume Button - Only show if no resume exists */}
          {!resumeName && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center gap-[10px] px-[16px] py-[8px] w-[152px] h-[40px] bg-white text-[#818CF8] rounded-[24px] border border-[#818CF8] hover:bg-slate-50 transition-all text-[14px] leading-[20px] font-normal font-[family-name:var(--font-poppins)] whitespace-nowrap"
            >
              <Plus className="w-6 h-6 stroke-[2px]" />
              <span>Add resume</span>
            </button>
          )}

          {/* Download Icon Button */}
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-[10px] px-[16px] py-[8px] w-[56px] h-[40px] rounded-[24px] border border-[#818CF8] bg-white hover:bg-slate-50 transition-all"
            title="Download PDF"
          >
            <Download className="w-6 h-6 text-[#818CF8] stroke-[2px]" />
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="flex flex-col gap-4 w-full">
        <h3 className="font-[family-name:var(--font-poppins)] font-medium text-[18px] leading-[26px] text-[#000000]">
          Metrics
        </h3>

        <div className="flex flex-col md:flex-row gap-4 w-full">
          {metricsData.map((metric, idx) => (
            <div
              key={idx}
              className="flex-1 min-h-[90px] bg-white border border-[#E2E8F0] rounded-[16px] sm:rounded-[24px] px-5 py-4 flex items-center justify-between"
            >
              <div className="flex flex-col items-start justify-center gap-1">
                <div className="flex items-center justify-center text-slate-600 mb-1">
                  {metric.icon}
                </div>
                <span className="font-[family-name:var(--font-poppins)] font-medium text-[10px] text-[#94A3B8] uppercase tracking-tight">
                  {metric.label}
                </span>
              </div>
              <span className="font-[family-name:var(--font-poppins)] font-bold text-[24px] text-[#6366F1]">
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Upload Custom Resume</DialogTitle>
            <DialogDescription>
              Upload a PDF or DOCX file to attach to your profile.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors bg-muted/20">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                <div className="bg-primary/10 p-3 rounded-full mb-3 text-primary">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-foreground mb-1">
                  {tempFile ? tempFile.name : "Click to upload"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {tempFile ? "File selected" : "PDF or DOCX (Max 5MB)"}
                </span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => {
                setTempFile(null);
                setIsUploadModalOpen(false);
              }}
              className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveCustomResume}
              disabled={!tempFile || upload.isPending}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFile && !upload.isPending
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
            >
              {upload.isPending ? "Uploading..." : "Save"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
