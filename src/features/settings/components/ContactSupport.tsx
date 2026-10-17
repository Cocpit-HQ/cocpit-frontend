"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Upload, Loader2, X } from 'lucide-react';
import { createTicket } from '@/features/settings/api/support';
import { useAccountSettings } from '../hooks/useAccountSettings';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ContactSupportProps {
  onBack: () => void;
}

export function ContactSupport({ onBack }: ContactSupportProps) {
  const { data: accountData } = useAccountSettings();
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');
  const [issueError, setIssueError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rejectedFile, setRejectedFile] = useState<{ name: string; size: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accountData?.primaryEmail) {
      setEmail(accountData.primaryEmail);
    }
  }, [accountData]);



  const validateAndSetFile = (selectedFile: File) => {
    setFileError(null);
    setRejectedFile(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!validTypes.includes(selectedFile.type)) {
      setFileError("invalid_type");
      setRejectedFile({ name: selectedFile.name, size: selectedFile.size });
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setFileError("too_large");
      setRejectedFile({ name: selectedFile.name, size: selectedFile.size });
      return;
    }
    setFile(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!issue.trim() || isSubmitting) return;

    if (issue.trim().length < 10) {
      setIssueError("Description must be at least 10 characters long");
      return;
    }

    setIsSubmitting(true);
    setIssueError('');
    try {
      const formData = new FormData();
      formData.append('email', email || accountData?.primaryEmail || 'user@cocpit.io');
      formData.append('description', issue.trim());
      if (file) {
        formData.append('attachment', file);
      }

      await createTicket(formData);
      toast.success("Support ticket submitted successfully!");
      setIssue('');
      setFile(null);
      setFileError(null);
      setRejectedFile(null);
    } catch (error) {
      toast.error("Failed to submit support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  const isFormValid = issue.trim().length > 0 && !isSubmitting && !fileError;

  return (
    <div className="w-full max-w-[712px] p-0 md:px-4 md:py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-0 md:gap-3">
      {/* Header */}
      <div className="self-stretch flex items-center gap-2 shrink-0 px-4 h-6 mb-4 md:px-0 md:h-auto md:mb-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center w-5 h-5 p-0 text-ds-text-primary hover:text-ds-text-secondary transition-colors cursor-pointer shrink-0"
          aria-label="Back to Support"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary stroke-[1.5]" />
        </button>
        <h1 className="text-ds-text-primary text-[16px] md:ds-text-body-2 font-medium leading-[24px] h-6 flex items-center m-0">
          Contact support
        </h1>
      </div>

      {/* Primary email row */}
      <div className="self-stretch px-4 md:px-0 flex flex-col justify-start items-start gap-2">
        <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-1">
          <div className="ds-text-small-1 text-ds-text-secondary">Primary email</div>
          <div className="ds-text-secondary text-ds-text-primary">
            {email || accountData?.primaryEmail || 'Loading email...'}
          </div>
        </div>
      </div>

      {/* Describe your issue row */}
      <div className="self-stretch flex flex-col justify-start items-start w-full">
        <div className={cn("self-stretch py-2 border-b flex flex-col justify-center items-start gap-1 transition-colors", issueError ? "border-ds-error" : "border-ds-border")}>
          <div className="ds-text-small-1 text-ds-text-secondary">Describe your issue*</div>
          <input
            type="text"
            value={issue}
            onChange={(e) => {
              setIssue(e.target.value);
              if (issueError) setIssueError('');
            }}
            placeholder="Tell us what we can improve..."
            className="w-full bg-transparent border-none outline-none ds-text-secondary text-ds-text-primary placeholder:text-ds-text-muted p-0"
          />
        </div>
        <div className="ds-supporting-area min-h-[16px] w-full pt-1">
          {issueError && (
            <span className="ds-text-small text-ds-error">
              {issueError}
            </span>
          )}
        </div>
      </div>

      {/* Attachment area */}
      <input
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "self-stretch py-4 min-h-[7rem] bg-ds-surface-1 rounded-2xl border flex flex-col justify-center items-center overflow-hidden cursor-pointer hover:bg-ds-surface-2/60 transition-colors",
          (fileError || rejectedFile) ? "border-ds-error gap-1" : "border-ds-border gap-2"
        )}
      >
        {(fileError || rejectedFile) ? (
          <div className="flex flex-col items-center justify-center gap-1 w-full px-4 text-center">
            <Upload className="w-6 h-6 text-ds-text-primary mb-1" strokeWidth={1.5} />
            <div className="ds-text-body-1 font-medium text-ds-text-primary truncate max-w-full">
              {rejectedFile?.name}
            </div>
            <div className="flex flex-col items-center justify-center text-ds-error ds-text-small text-center">
              {fileError === 'too_large' ? (
                <>
                  <div>File is too large ({(rejectedFile!.size / (1024 * 1024)).toFixed(1)}MB).</div>
                  <div>Maximum size is 5MB</div>
                </>
              ) : (
                <>
                  <div>Please upload a valid image file.</div>
                  <div>JPG, PNG, WEBP</div>
                </>
              )}
            </div>
            <div className="ds-text-body-1 font-medium text-ds-text-primary mt-1 hover:underline">Change</div>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <Upload className="w-7 h-7 text-ds-text-primary" strokeWidth={1.5} />
            </div>
            {file ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-ds-surface-2 rounded-full max-w-[90%] truncate">
                <span className="ds-text-small text-ds-text-primary truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                  className="p-0.5 hover:bg-ds-surface-1 rounded-full text-ds-text-secondary hover:text-ds-text-primary shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="ds-text-small text-ds-text-primary text-center px-4">
                JPG, PNG, WEBP · Max 5MB
              </div>
            )}
          </>
        )}
      </div>

      {/* Submit Button */}
      <div className="self-stretch flex flex-col justify-center items-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={cn(
            "h-[36px] px-3 py-1.5 rounded-[100px] inline-flex justify-center items-center gap-2 transition-colors ds-focus-ring",
            isFormValid
              ? "bg-ds-accent text-ds-text-primary hover:opacity-90 active:opacity-80 cursor-pointer"
              : "bg-ds-surface-1 text-ds-text-muted cursor-not-allowed"
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          <span className="ds-text-body-1 font-medium">
            {isSubmitting ? "Submitting..." : "Submit"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default ContactSupport;
