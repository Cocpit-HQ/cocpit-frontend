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
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (accountData?.primaryEmail) {
      setEmail(accountData.primaryEmail);
    }
  }, [accountData]);



  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Please upload a valid image file (JPG, PNG, WEBP)");
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
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

    setIsSubmitting(true);
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
    } catch (error) {
      toast.error("Failed to submit support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = issue.trim().length > 0 && !isSubmitting;

  return (
    <div className="w-full max-w-[712px] px-2 sm:px-4 py-2 rounded-tr-3xl rounded-br-3xl flex flex-col justify-start items-start gap-3">
      {/* Header */}
      <div className="self-stretch inline-flex justify-start items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="-ml-1.5 w-8 h-8 flex items-center justify-center cursor-pointer bg-transparent border border-ds-border hover:bg-ds-surface-1 p-0 ds-focus-ring rounded-full shrink-0"
          aria-label="Back to Support"
        >
          <ChevronLeft className="w-5 h-5 text-ds-text-primary" strokeWidth={1.5} />
        </button>
        <div className="flex-1 inline-flex flex-col justify-start items-start">
          <div className="ds-text-body-2 text-ds-text-primary">Contact support</div>
        </div>
      </div>

      {/* Primary email row */}
      <div className="self-stretch flex flex-col justify-start items-start gap-2">
        <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-1">
          <div className="ds-text-small-1 text-ds-text-secondary">Primary email</div>
          <div className="ds-text-secondary text-ds-text-primary">
            {email || accountData?.primaryEmail || 'Loading email...'}
          </div>
        </div>
      </div>

      {/* Describe your issue row */}
      <div className="self-stretch py-2 border-b border-ds-border flex flex-col justify-center items-start gap-1">
        <div className="ds-text-small-1 text-ds-text-secondary">Describe your issue*</div>
        <input
          type="text"
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          placeholder="Tell us what we can improve..."
          className="w-full bg-transparent border-none outline-none ds-text-secondary text-ds-text-primary placeholder:text-ds-text-muted p-0"
        />
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
        className="self-stretch h-28 bg-ds-surface-1 rounded-2xl border border-ds-border flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer hover:bg-ds-surface-2/60 transition-colors"
      >
        <div className="w-10 h-10 flex items-center justify-center">
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
              className="p-0.5 hover:bg-ds-surface-1 rounded-full text-ds-text-secondary hover:text-ds-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="ds-text-small text-ds-text-primary">
            JPG, PNG, WEBP · Max 5MB
          </div>
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
