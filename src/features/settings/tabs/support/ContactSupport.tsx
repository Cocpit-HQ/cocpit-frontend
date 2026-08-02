import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, CloudUpload, Loader2, X, FileText } from 'lucide-react';
import { createTicket } from '@/features/settings/api/support';
import { useAccountSettings } from '../../hooks/useAccountSettings';
import { toast } from 'sonner';

interface ContactSupportProps {
  onBack: () => void;
}

export function ContactSupport({ onBack }: ContactSupportProps) {
  const { data: accountData, isLoading: isLoadingAccount } = useAccountSettings();
  const [email, setEmail] = useState('');
  const [hasInitializedEmail, setHasInitializedEmail] = useState(false);
  const [issue, setIssue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize email once from account settings without overwriting user edits on refetches
  useEffect(() => {
    if (!hasInitializedEmail && accountData) {
      const userEmail = accountData.primaryEmail || (accountData as any)?.email;
      if (userEmail) {
        setEmail(userEmail);
        setHasInitializedEmail(true);
      }
    }
  }, [accountData, hasInitializedEmail]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

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
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !issue || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('description', issue);
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

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-6 max-w-[698px]">
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-2">
          <button 
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="flex items-center justify-center w-12 h-12 rounded-full border border-[#DADADA] hover:bg-gray-50 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <ChevronLeft className="w-6 h-6 text-[#6B7280]" strokeWidth={1.5} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-medium text-black leading-[26px]">Contact support</h1>
            <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">We're here to help — our team typically responds within 24 hours</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          
          {/* Email field */}
          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="support-email" className="text-[14px] font-medium text-black leading-[20px]">Your email*</label>
            <input 
              id="support-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isLoadingAccount ? "Loading email..." : "Enter your email"}
              className="w-full h-[48px] border border-[#DADADA] rounded-[12px] px-4 text-[16px] text-black font-poppins focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] transition-colors"
            />
          </div>

          {/* Issue field */}
          <div className="flex flex-col gap-2 w-full">
            <label htmlFor="support-issue" className="text-[14px] font-medium text-black leading-[20px]">Describe your issue*</label>
            <textarea 
              id="support-issue"
              required
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Tell us what is issue..."
              className="w-full h-[120px] border border-[#DADADA] rounded-[12px] p-4 text-[16px] text-black font-poppins focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] resize-none placeholder-[#6B7280] transition-colors"
            />
          </div>

          {/* Attachment field */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black leading-[20px]">Attachment</label>
            <input 
              type="file" 
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex flex-row items-center justify-between w-full h-[60px] border border-[#6366F1] rounded-[12px] bg-[#EEF2FF] px-4 transition-all">
                <div className="flex items-center gap-3 truncate max-w-[85%]">
                  <FileText className="w-5 h-5 text-[#6366F1] flex-shrink-0" />
                  <div className="flex flex-col truncate">
                    <span className="text-[14px] font-medium text-[#6366F1] truncate">{file.name}</span>
                    <span className="text-[11px] text-[#818CF8]">{formatFileSize(file.size)}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setFile(null)} 
                  className="p-1 hover:bg-[#C7D2FE] rounded-full transition-colors focus:outline-none"
                  aria-label="Remove attachment"
                >
                  <X className="w-5 h-5 text-[#6366F1]" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center w-full h-[100px] border ${
                  isDragging ? 'border-[#6366F1] bg-[#EEF2FF]' : 'border-[#DADADA] bg-white hover:bg-gray-50'
                } rounded-[12px] cursor-pointer transition-all duration-150 border-dashed`}
              >
                <CloudUpload className={`w-8 h-8 ${isDragging ? 'text-[#6366F1]' : 'text-[#6B7280]'} mb-2 transition-colors`} strokeWidth={1.5} />
                <span className="text-[12px] font-medium text-gray-700 mb-0.5">
                  {isDragging ? 'Drop file here' : 'Click or drag & drop to upload'}
                </span>
                <span className="text-[10px] font-normal text-[#6B7280]">JPG, PNG, WEBP — Max 5MB</span>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex flex-row justify-end items-center w-full mt-2">
            <button 
              type="submit"
              disabled={!issue || !email || isSubmitting}
              className={`flex flex-row justify-center items-center py-2 px-6 min-w-[120px] h-[40px] rounded-[24px] transition-all ${
                (issue && email && !isSubmitting) 
                  ? 'bg-[#6366F1] hover:bg-[#4F46E5] active:scale-[0.98] text-white shadow-sm' 
                  : 'bg-[#C7D2FE] text-white cursor-not-allowed opacity-80'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-[16px] font-medium leading-[24px]">Submit</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
