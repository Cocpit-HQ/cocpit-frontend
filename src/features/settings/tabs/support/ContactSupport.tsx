import React, { useState, useRef } from 'react';
import { ChevronLeft, CloudUpload, Loader2, X } from 'lucide-react';
import { createTicket } from '@/features/settings/api/support';
import { toast } from 'sonner';

interface ContactSupportProps {
  onBack: () => void;
}

export function ContactSupport({ onBack }: ContactSupportProps) {
  const [email, setEmail] = useState('');
  const [issue, setIssue] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!email || !issue) return;
    
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
      setEmail('');
      setIssue('');
      setFile(null);
    } catch (error) {
      toast.error("Failed to submit support ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins pb-20">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-6 max-w-[698px]">
        {/* Header */}
        <div className="flex flex-row items-center gap-4 mb-2">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-12 h-12 rounded-full border border-[#DADADA] hover:bg-gray-50 transition-colors flex-shrink-0"
          >
            <ChevronLeft className="w-6 h-6 text-[#6B7280]" strokeWidth={1.5} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-medium text-black leading-[26px]">Contact support</h1>
            <p className="text-[14px] font-normal text-[#6B7280] leading-[20px]">We're here to help — our team typically responds within 24 hours</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-6 w-full">
          
          {/* Email field */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black leading-[20px]">Your email*</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-[48px] border border-[#DADADA] rounded-[12px] px-4 text-[16px] text-black font-poppins focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>

          {/* Issue field */}
          <div className="flex flex-col gap-2 w-full">
            <label className="text-[14px] font-medium text-black leading-[20px]">Describe your issue*</label>
            <textarea 
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Tell us what is issue..."
              className="w-full h-[120px] border border-[#DADADA] rounded-[12px] p-4 text-[16px] text-black font-poppins focus:outline-none focus:border-[#6366F1] resize-none placeholder-[#6B7280] transition-colors"
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
              <div className="flex flex-row items-center justify-between w-full h-[60px] border border-[#6366F1] rounded-[12px] bg-[#EEF2FF] px-4">
                <span className="text-[14px] font-medium text-[#6366F1] truncate max-w-[80%]">{file.name}</span>
                <button onClick={() => setFile(null)} className="p-1 hover:bg-[#C7D2FE] rounded-full transition-colors">
                  <X className="w-5 h-5 text-[#6366F1]" strokeWidth={1.5} />
                </button>
              </div>
            ) : (
              <div 
                className="flex flex-col items-center justify-center w-full h-[100px] border border-[#DADADA] rounded-[12px] bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <CloudUpload className="w-8 h-8 text-[#6B7280] mb-2" strokeWidth={1.5} />
                <span className="text-[10px] font-normal text-[#6B7280]">JPG, PNG, WEBP - Max 5MB</span>
              </div>
            )}
          </div>

        </div>

        {/* Submit button */}
        <div className="flex flex-row justify-end items-center w-full mt-2">
          <button 
            disabled={!issue || !email || isSubmitting}
            onClick={handleSubmit}
            className={`flex flex-row justify-center items-center py-2 px-6 min-w-[120px] h-[40px] rounded-[24px] transition-colors ${
              (issue && email && !isSubmitting) ? 'bg-[#6366F1] hover:bg-[#4F46E5] text-white' : 'bg-[#C7D2FE] text-white cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="text-[16px] font-medium leading-[24px]">Submit</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
