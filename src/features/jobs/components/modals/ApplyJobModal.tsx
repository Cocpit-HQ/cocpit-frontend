import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FeatureDisabledTooltip } from '@/components/feature-flags';
import {
  UploadIcon,
  PdfFileIcon,
  DeleteIcon,
  CloseCrossIcon,
  AlertCircleIcon,
} from '@/components/icons';

export interface Resume {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: string;
}

interface ApplyJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (resumeUrl: string, uploadedFile: File | null, resumeId: string | null, coverLetter: string) => Promise<void> | void;
  jobTitle?: string;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [fetchedResumes, setFetchedResumes] = useState<Resume[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsError(false);
      setIsSubmitting(false);
      setSelectedResumeId(null);
      setUploadedFile(null);
      setCoverLetter('');

      import('../../services/jobs.service')
        .then((service) => {
          service
            .getRecentResumes()
            .then((resumes) => {
              const formatted = resumes.map((r: any) => ({
                id: r.id,
                name: r.name,
                url: r.url,
                type: r.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document',
              }));
              setFetchedResumes(formatted);
            })
            .catch((err) => console.error('Failed to fetch resumes', err));
        });
    }
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit.');
        return;
      }
      setUploadedFile(file);
      setSelectedResumeId(null);
      toast.success(`Selected file: ${file.name}`);
    }
  };

  const handleResumeSelect = (id: string) => {
    setSelectedResumeId(id);
    setUploadedFile(null);
  };

  const handleDeleteResume = (id: string) => {
    setFetchedResumes((prev) => prev.filter((r) => r.id !== id));
    if (selectedResumeId === id) setSelectedResumeId(null);
    toast.success('Resume removed');
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const selectedResume = fetchedResumes.find((r) => r.id === selectedResumeId);
      const resumeUrlOrName = uploadedFile ? uploadedFile.name : selectedResume?.name || 'resume.pdf';
      const resumeUrlToSend = uploadedFile ? null : selectedResume?.url || null;
      await onApply(resumeUrlOrName, uploadedFile, resumeUrlToSend, coverLetter);
      onClose();
    } catch (err) {
      console.error('Failed to submit application', err);
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedResumeName = uploadedFile
    ? uploadedFile.name
    : fetchedResumes.find((r) => r.id === selectedResumeId)?.name || 'resume.pdf';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[320px] w-full [&>button]:hidden outline-none z-[101]">
        <div className="w-full p-3 bg-ds-bg rounded-2xl border border-ds-border flex flex-col justify-start items-center gap-3 overflow-hidden box-border shadow-2xl">
          {/* Top Close Row */}
          <div className="self-stretch flex justify-end items-center">
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="size-5 flex items-center justify-center text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              <CloseCrossIcon size={14} className="size-3.5 text-ds-text-primary" fill="currentColor" />
            </button>
          </div>

          {/* Hidden description for accessibility */}
          <DialogDescription className="sr-only">
            Apply for this job by uploading your resume or selecting a recent one.
          </DialogDescription>

          {isError ? (
            /* STATE 3: SUBMISSION ERROR STATE */
            <div className="self-stretch flex flex-col items-center justify-center gap-4 py-3">
              <AlertCircleIcon size={40} className="size-10 text-ds-text-primary" fill="currentColor" />
              <p className="text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center max-w-[240px] m-0">
                Unable to submit your application. Please try again.
              </p>
              <button
                onClick={() => {
                  setIsError(false);
                  setStep(1);
                }}
                type="button"
                className="px-4 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex justify-center items-center cursor-pointer transition-colors outline-none bg-transparent"
              >
                Try again
              </button>
            </div>
          ) : step === 1 ? (
            /* STATE 1: SELECT OR UPLOAD RESUME */
            <>
              {/* Title */}
              <DialogTitle className="justify-start text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center m-0">
                Apply job
              </DialogTitle>

              {/* Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="self-stretch px-3 py-2 bg-ds-surface-1 rounded-2xl border border-ds-border flex flex-col justify-start items-center gap-2 cursor-pointer hover:border-ds-accent/60 transition-colors box-border"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="size-5 flex items-center justify-center">
                  <UploadIcon size={18} className="size-4 text-ds-text-primary" fill="currentColor" />
                </div>
                <div className="self-stretch flex flex-col justify-start items-center gap-1">
                  <span className="justify-start text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center">
                    Upload your resume
                  </span>
                  <span className="text-center justify-start text-ds-text-secondary text-[10px] font-normal font-dm-sans leading-3">
                    Let AI fill in your profile from your resume
                  </span>
                  <span className="text-center justify-start text-ds-text-secondary text-[10px] font-medium font-dm-sans leading-3">
                    PDF only (maximum 5 MB)
                  </span>
                </div>
              </div>

              {/* Recent Resume Section */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                <span className="text-center justify-start text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                  Recent resume
                </span>

                {/* Uploaded File */}
                {uploadedFile && (
                  <div className="self-stretch flex justify-between items-center py-0.5">
                    <div
                      onClick={() => setSelectedResumeId(null)}
                      className={`flex justify-start items-center gap-2 min-w-0 flex-1 cursor-pointer ${
                        !selectedResumeId ? 'text-ds-accent font-medium' : 'text-ds-text-primary'
                      }`}
                    >
                      <PdfFileIcon
                        size={16}
                        className={`size-4 shrink-0 ${!selectedResumeId ? 'text-ds-accent' : 'text-ds-text-primary'}`}
                        fill="currentColor"
                      />
                      <span className="text-center justify-start text-base font-normal font-dm-sans leading-6 truncate">
                        {uploadedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setUploadedFile(null)}
                      type="button"
                      aria-label="Remove uploaded file"
                      className="size-5 flex items-center justify-center text-ds-error hover:text-ds-error/80 transition-colors cursor-pointer p-0 bg-transparent border-none outline-none"
                    >
                      <DeleteIcon size={16} className="size-4 text-ds-error shrink-0" fill="currentColor" />
                    </button>
                  </div>
                )}

                {/* Fetched Resumes */}
                {fetchedResumes.length === 0 && !uploadedFile && (
                  <span className="text-ds-text-muted text-xs font-dm-sans py-1">
                    No recent resumes found
                  </span>
                )}

                {fetchedResumes.map((resume) => {
                  const isSelected = selectedResumeId === resume.id;
                  return (
                    <div
                      key={resume.id}
                      className="self-stretch flex justify-between items-center py-0.5"
                    >
                      <div
                        onClick={() => handleResumeSelect(resume.id)}
                        className={`flex justify-start items-center gap-2 min-w-0 flex-1 cursor-pointer ${
                          isSelected ? 'text-ds-accent font-medium' : 'text-ds-text-primary'
                        }`}
                      >
                        <PdfFileIcon
                          size={16}
                          className={`size-4 shrink-0 ${isSelected ? 'text-ds-accent' : 'text-ds-text-primary'}`}
                          fill="currentColor"
                        />
                        <span className="text-center justify-start text-base font-normal font-dm-sans leading-6 truncate">
                          {resume.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResume(resume.id);
                        }}
                        type="button"
                        aria-label={`Delete ${resume.name}`}
                        className="size-5 flex items-center justify-center text-ds-error hover:text-ds-error/80 transition-colors cursor-pointer p-0 bg-transparent border-none outline-none"
                      >
                        <DeleteIcon size={16} className="size-4 text-ds-error shrink-0" fill="currentColor" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="self-stretch flex justify-center items-start gap-2 pt-1">
                <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
                  <button
                    onClick={() => {
                      if (selectedResumeId || uploadedFile) setStep(2);
                    }}
                    disabled={!selectedResumeId && !uploadedFile}
                    type="button"
                    className={`flex-1 px-3 py-1.5 rounded-[100px] text-base font-medium font-dm-sans leading-6 transition-all border-none outline-none ${
                      selectedResumeId || uploadedFile
                        ? 'bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary cursor-pointer shadow-sm'
                        : 'bg-zinc-900 text-stone-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    Continue
                  </button>
                </FeatureDisabledTooltip>
                <button
                  onClick={onClose}
                  type="button"
                  className="w-24 px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex justify-center items-center cursor-pointer transition-colors outline-none bg-transparent"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* STATE 2: SELECTED RESUME & UNIQUE NOTE */
            <>
              {/* Title */}
              <DialogTitle className="justify-start text-ds-text-primary text-base font-medium font-dm-sans leading-6 text-center m-0">
                Apply job
              </DialogTitle>

              {/* Recent resume header & selected row */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2">
                <span className="text-center justify-start text-ds-text-secondary text-xs font-normal font-dm-sans leading-4">
                  Recent resume
                </span>
                <div className="self-stretch flex justify-between items-center py-0.5">
                  <div className="flex justify-start items-center gap-2 min-w-0 flex-1">
                    <PdfFileIcon size={16} className="size-4 text-ds-accent shrink-0" fill="currentColor" />
                    <span className="text-center justify-start text-ds-text-primary text-base font-normal font-dm-sans leading-6 truncate">
                      {selectedResumeName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedResumeId(null);
                      setUploadedFile(null);
                      setStep(1);
                    }}
                    type="button"
                    aria-label="Remove selected resume"
                    className="size-5 flex items-center justify-center text-ds-error hover:text-ds-error/80 transition-colors cursor-pointer p-0 bg-transparent border-none outline-none"
                  >
                    <DeleteIcon size={16} className="size-4 text-ds-error shrink-0" fill="currentColor" />
                  </button>
                </div>
              </div>

              {/* Note Textarea */}
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Tell us what makes you unique..."
                className="w-full h-24 p-3 bg-ds-bg border border-ds-border rounded-xl font-dm-sans text-sm text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:border-ds-accent resize-none box-border"
              />

              {/* Action Buttons */}
              <div className="self-stretch flex justify-center items-start gap-2 pt-1">
                <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    type="button"
                    className={`flex-1 px-3 py-1.5 rounded-[100px] text-ds-text-primary text-base font-medium font-dm-sans leading-6 shadow-sm transition-all border-none outline-none flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? 'bg-ds-accent/80 cursor-wait'
                        : 'bg-ds-accent hover:opacity-90 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      'Continue'
                    )}
                  </button>
                </FeatureDisabledTooltip>
                <button
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  type="button"
                  className="w-24 px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex justify-center items-center cursor-pointer transition-colors outline-none bg-transparent disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyJobModal;
