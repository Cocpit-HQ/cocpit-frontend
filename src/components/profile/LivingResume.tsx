"use client";

import React, { useState } from "react";
import { Download, FileText, BarChart2, Upload, File, X, RefreshCw } from "lucide-react";
import { Experience } from "@/types/entities";
import { getResumeOverview } from "./ResumeOverview";
import { ResumeMetrics } from "./ResumeMetrics";
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
}

export function LivingResume({ experiences, skills }: LivingResumeProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "metrics">("overview");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [customResumeName, setCustomResumeName] = useState<string | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);

  const overview = getResumeOverview(experiences);

  const handleDownload = () => {
    const message = "Resume download will be available soon.";
    if (typeof window !== 'undefined') {
        alert(message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setTempFile(e.target.files[0]);
    }
  };

  const saveCustomResume = () => {
    if (tempFile) {
      setCustomResumeName(tempFile.name);
      setTempFile(null);
      setIsUploadModalOpen(false);
    }
  };

  const removeCustomResume = () => {
    setCustomResumeName(null);
  };

  return (
    <div className="rounded-xl border p-6 mb-4 bg-card border-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl text-foreground font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Living Resume
        </h2>

        <div className="flex items-center gap-3">
          {customResumeName ? (
             <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg border border-border">
                <File className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate max-w-[100px] sm:max-w-[150px]">{customResumeName}</span>
                <div className="flex items-center gap-1 ml-1 border-l pl-2 border-border/50">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Replace"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={removeCustomResume}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        title="Remove"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
             </div>
          ) : (
            <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-all text-sm font-medium border border-transparent hover:border-border"
            >
                <Upload className="w-4 h-4" />
                Add Custom Resume
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "metrics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Metrics
        </button>
      </div>

      <div className="min-h-[120px]">
        {activeTab === "overview" && (
            <div className="animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-foreground mb-1">{overview.yearsOfExperience}</p>
                        <p className="text-sm text-muted-foreground">across product management & strategy</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                        <p className="text-2xl font-bold text-foreground mb-1">{overview.featuresShipped}</p>
                        <p className="text-sm text-muted-foreground">driving user growth & revenue</p>
                    </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {overview.summary}
                </p>
            </div>
        )}

        {activeTab === "metrics" && (
            <div className="animate-in fade-in duration-300">
                <ResumeMetrics experiences={experiences} skills={skills} />
            </div>
        )}
      </div>

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
                    disabled={!tempFile}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        tempFile
                            ? "bg-primary text-primary-foreground hover:opacity-90"
                            : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                >
                    Save
                </button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
