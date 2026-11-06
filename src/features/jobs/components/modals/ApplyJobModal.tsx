import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useBodyScrollLock } from '@/hooks';
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
  useBodyScrollLock(isOpen);
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
                id: r.id || r.url || r.name,
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

  const handleDeleteResume = async (id: string, name?: string, url?: string) => {
    setFetchedResumes((prev) => prev.filter((r) => r.id !== id && r.name !== name && r.url !== url));
    if (selectedResumeId === id) setSelectedResumeId(null);
    toast.success('Resume removed');

    try {
      const service = await import('../../services/jobs.service');
      await service.deleteRecentResume(url, name, id);
    } catch (err) {
      console.error('Failed to delete recent resume:', err);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const selectedResume = fetchedResumes.find((r) => r.id === selectedResumeId);
      const resumeUrlOrName = uploadedFile ? uploadedFile.name : selectedResume?.name || 'resume.pdf';
      const resumeUrlToSend = uploadedFile ? null : selectedResume?.url || null;
      await onApply(resumeUrlOrName, uploadedFile, resumeUrlToSend, coverLetter.slice(0, 1000));
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
      <DialogContent className="p-0 border-none bg-transparent shadow-none w-full outline-none z-[101] [&>button]:hidden max-md:fixed max-md:bottom-0 max-md:top-auto max-md:left-0 max-md:right-0 max-md:translate-x-0 max-md:translate-y-0 max-md:max-w-none max-md:flex max-md:justify-center md:max-w-[320px]">
        <div className={`w-full max-w-[393px] md:w-[300px] ${step === 2 ? 'md:h-[296px]' : 'md:h-[344px]'} p-[8px_12px_24px] md:p-3 bg-ds-bg rounded-t-[8px] md:rounded-2xl rounded-b-none md:rounded-b-2xl border-t md:border border-ds-border flex flex-col justify-between items-center overflow-hidden box-border shadow-2xl gap-4 md:gap-0`}>
          {/* Mobile Drag Handle */}
          <div className="w-full flex md:hidden flex-col items-center justify-center shrink-0 h-5">
            <div className="w-[50px] h-[3px] bg-ds-text-muted rounded-full" />
          </div>
          {/* Top Close Row */}
          <div className="hidden md:flex self-stretch justify-end items-center">
            <button
              onClick={onClose}
              type="button"
              aria-label="Close"
              className="size-5 flex items-center justify-center text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer bg-transparent border-none p-0 outline-none"
            >
              <CloseCrossIcon size={20} className="size-5 text-ds-text-primary" fill="currentColor" />
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
                className="w-full max-w-[369px] md:w-[276px] h-[112px] px-3 py-2 bg-ds-surface-1 rounded-2xl border border-ds-border flex flex-col justify-center items-center gap-2 cursor-pointer hover:border-ds-accent/60 transition-colors box-border"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="size-5 flex items-center justify-center">
                  <UploadIcon size={20} className="size-5 text-ds-text-primary" fill="currentColor" />
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
                        size={20}
                        className={`size-5 shrink-0 ${!selectedResumeId ? 'text-ds-accent' : 'text-ds-text-primary'}`}
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
                      <DeleteIcon size={20} className="size-5 text-ds-error shrink-0" fill="currentColor" />
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
                          size={20}
                          className={`size-5 shrink-0 ${isSelected ? 'text-ds-accent' : 'text-ds-text-primary'}`}
                          fill="currentColor"
                        />
                        <span className="text-center justify-start text-base font-normal font-dm-sans leading-6 truncate">
                          {resume.name}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResume(resume.id, resume.name, resume.url);
                        }}
                        type="button"
                        aria-label={`Delete ${resume.name}`}
                        className="size-5 flex items-center justify-center text-ds-error hover:text-ds-error/80 transition-colors cursor-pointer p-0 bg-transparent border-none outline-none"
                      >
                        <DeleteIcon size={20} className="size-5 text-ds-error shrink-0" fill="currentColor" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="self-stretch flex justify-center items-center gap-[10px]">
                <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
                  <button
                    onClick={() => {
                      if (selectedResumeId || uploadedFile) setStep(2);
                    }}
                    disabled={!selectedResumeId && !uploadedFile}
                    type="button"
                    className={`w-[94px] h-[36px] py-[6px] px-[12px] rounded-full text-base font-medium font-dm-sans leading-6 transition-all border-none outline-none flex items-center justify-center ${
                      selectedResumeId || uploadedFile
                        ? 'bg-ds-accent hover:opacity-90 active:scale-95 text-ds-text-primary cursor-pointer shadow-sm'
                        : 'bg-[#1A1A20] text-[#71717A] cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                </FeatureDisabledTooltip>
                <button
                  onClick={onClose}
                  type="button"
                  className="w-[94px] h-[36px] py-[6px] px-[12px] rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex justify-center items-center cursor-pointer transition-colors outline-none bg-transparent"
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
                    <PdfFileIcon size={20} className="size-5 text-ds-text-primary shrink-0" fill="currentColor" />
                    <span className="text-center justify-start text-ds-text-primary text-base font-normal font-dm-sans leading-6 truncate">
                      {selectedResumeName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (selectedResumeId) {
                        const target = fetchedResumes.find((r) => r.id === selectedResumeId);
                        handleDeleteResume(selectedResumeId, target?.name, target?.url);
                      }
                      setSelectedResumeId(null);
                      setUploadedFile(null);
                      setStep(1);
                    }}
                    type="button"
                    aria-label="Remove selected resume"
                    className="size-5 flex items-center justify-center text-ds-error hover:text-ds-error/80 transition-colors cursor-pointer p-0 bg-transparent border-none outline-none"
                  >
                    <DeleteIcon size={20} className="size-5 text-ds-error shrink-0" fill="currentColor" />
                  </button>
                </div>
              </div>

              {/* Note Textarea & Character Counter */}
              <div className="w-full max-w-[369px] md:w-[276px] flex flex-col gap-1">
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value.slice(0, 1000))}
                  maxLength={1000}
                  placeholder="Tell us what makes you unique..."
                  spellCheck={false}
                  data-ms-editor="false"
                  {...({ writingsuggestions: "false" } as any)}
                  className="w-full h-[80px] p-3 bg-ds-bg border border-ds-border rounded-2xl font-dm-sans text-sm text-ds-text-primary placeholder:text-ds-text-muted focus:outline-none focus:border-ds-accent resize-none box-border overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                />
                <div className="flex justify-end items-center px-1">
                  <span className="text-[10px] text-ds-text-muted font-normal font-dm-sans leading-3 select-none">
                    {coverLetter.length}/1000
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="self-stretch flex justify-center items-center gap-[10px]">
                <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    type="button"
                    className={`w-[94px] h-[36px] py-[6px] px-[12px] rounded-full text-ds-text-primary text-base font-medium font-dm-sans leading-6 shadow-sm transition-all border-none outline-none flex items-center justify-center gap-2 ${
                      isSubmitting
                        ? 'bg-ds-accent/80 cursor-wait'
                        : 'bg-ds-accent hover:opacity-90 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span className="text-xs">Applying...</span>
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
                  className="w-[94px] h-[36px] py-[6px] px-[12px] rounded-full border border-ds-border hover:bg-ds-surface-1 text-ds-text-primary text-base font-medium font-dm-sans leading-6 flex justify-center items-center cursor-pointer transition-colors outline-none bg-transparent disabled:opacity-50"
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
