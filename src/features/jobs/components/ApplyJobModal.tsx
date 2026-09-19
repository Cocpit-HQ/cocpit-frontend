import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, ArrowLeft, Trash2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { FeatureDisabledTooltip } from '@/components/feature-flags';

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
  onApply: (resumeUrl: string, uploadedFile: File | null, resumeId: string | null, coverLetter: string) => void;
  jobTitle?: string;
}

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isOpen,
  onClose,
  onApply,
  jobTitle,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>('');
  const [fetchedResumes, setFetchedResumes] = useState<Resume[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedResumeId(null);
      setUploadedFile(null);
      setCoverLetter('');
      
      // Fetch recent resumes
      import('../services/jobs.service').then(service => {
        service.getRecentResumes().then(resumes => {
          // Format them properly
          const formatted = resumes.map((r: any) => ({
            id: r.id,
            name: r.name,
            url: r.url,
            type: r.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Document'
          }));
          setFetchedResumes(formatted);
        }).catch(err => console.error("Failed to fetch resumes", err));
      });
    }
  }, [isOpen]);

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size exceeds 5MB limit.");
        return;
      }

      setUploadedFile(file);
      setSelectedResumeId(null); // deselect recent resume
      toast.success(`Selected file: ${file.name}`);
      setStep(2); // Automatically move to next step
    }
  };

  const handleResumeSelect = (id: string) => {
    setSelectedResumeId(id);
    setUploadedFile(null); // deselect uploaded file
    setStep(2); // Automatically move to next step
  };

  const handleRemoveSelection = () => {
    setSelectedResumeId(null);
    setUploadedFile(null);
    setStep(1); // go back to screen 1 if they delete the selection on screen 2
  };

  const handleContinue = () => {
    if (selectedResumeId || uploadedFile) {
      setStep(2);
    }
  };

  const handleSubmit = () => {
    const selectedResume = fetchedResumes.find(r => r.id === selectedResumeId);
    const resumeUrlOrName = uploadedFile ? uploadedFile.name : (selectedResume?.name || 'resume.pdf');
    // Pass the actual resume URL (not the ID) so the backend receives it as resume_url
    const resumeUrlToSend = uploadedFile ? null : (selectedResume?.url || null);
    onApply(resumeUrlOrName, uploadedFile, resumeUrlToSend, coverLetter);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Get active selection details for Screen 2
  const selectedResumeName = uploadedFile 
    ? uploadedFile.name 
    : fetchedResumes.find(r => r.id === selectedResumeId)?.name || '';

  const selectedResumeType = uploadedFile
    ? (uploadedFile.name.split('.').pop()?.toUpperCase() === 'PDF' ? 'PDF' : 'Document')
    : fetchedResumes.find(r => r.id === selectedResumeId)?.type || 'Document';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-[480px] [&>button]:hidden outline-none z-[101]">
        <div className="relative min-w-0 bg-white dark:bg-[#0B0F19] rounded-[28px] p-6 w-full shadow-[0px_8px_32px_rgba(0,0,0,0.08)] flex flex-col items-center outline-none border border-indigo-50/50 dark:border-[#2E3445]/50">
          
          {/* Top Close Row */}
          <div className="flex justify-end w-full mb-2">
            <button 
              onClick={onClose}
              type="button"
              className="text-[#FF6B6B] hover:bg-[#FF6B6B]/10 p-1.5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          {step === 1 ? (
            /* SCREEN 1: SELECT OR UPLOAD RESUME */
            <div className="w-full min-w-0 flex flex-col items-center">
              
              {/* Title Section */}
              <div className="text-center mb-6">
                <DialogTitle className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-[#000000] dark:text-[#F9FAFB] text-center">
                  Apply job
                </DialogTitle>
                <DialogDescription className="font-['Poppins'] font-normal text-[12px] leading-[18px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 text-center">
                  Select or upload your resume to complete your application
                </DialogDescription>
              </div>

              {/* Upload Section */}
              <div 
                onClick={handleUploadAreaClick}
                className="w-full border-2 border-dashed border-indigo-100 dark:border-[#2E3445] rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-indigo-50/20 dark:hover:bg-[#2E3445]/20 hover:border-indigo-300 dark:hover:border-[#818CF8] transition-all mb-6"
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                
                {/* Upload Icon Area */}
                <div className="w-10 h-10 flex items-center justify-center text-slate-400">
                  <Icon icon="solar:cloud-upload-linear" className="w-8 h-8 text-[#6B7280] dark:text-[#9CA3AF]" />
                </div>

                {/* Info Texts */}
                <div className="flex flex-col items-center">
                  <span className="font-['Poppins'] font-normal text-[10px] text-[#6B7280] dark:text-[#9CA3AF] leading-normal uppercase tracking-wider">
                    PDF, DOC, DOCX · Max 5MB
                  </span>
                  <span className="font-['Poppins'] font-normal text-[12px] text-[#6B7280] dark:text-[#9CA3AF] leading-normal mt-0.5">
                    Upload your latest resume
                  </span>
                </div>
              </div>

              {/* Recent Resume Section */}
              <div className="w-full min-w-0 flex flex-col gap-3 mb-8">
                <h4 className="font-['Poppins'] font-normal text-[12px] text-[#000000] dark:text-[#F9FAFB] text-left">
                  Recent resume
                </h4>
                
                {/* Custom uploaded item if present */}
                {uploadedFile && (
                  <div 
                    className="w-full min-w-0 p-3 bg-white dark:bg-[#1C2340] rounded-xl flex justify-start items-center gap-4 self-stretch border-2 border-[#6366F1] dark:border-[#818CF8] shadow-[0px_4px_12px_rgba(99,102,241,0.04)]"
                  >
                    <div className="w-10 h-10 bg-[#F87171] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <Icon icon="bi:file-earmark-pdf-fill" className="w-5 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                      <span className="font-['Poppins'] font-semibold text-sm leading-5 text-[#000000] dark:text-[#F9FAFB] truncate block w-full">
                        {uploadedFile.name}
                      </span>
                      <span className="font-['Poppins'] font-normal text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                        Uploaded just now
                      </span>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                      }}
                      className="p-1 hover:bg-rose-50 rounded-lg text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Recent Resumes List */}
                {fetchedResumes.length === 0 && !uploadedFile && (
                  <span className="font-['Poppins'] text-sm text-[#6B7280] dark:text-[#9CA3AF]">No recent resumes found</span>
                )}
                {fetchedResumes.map((resume) => {
                  const isSelected = selectedResumeId === resume.id;
                  return (
                    <div 
                      key={resume.id}
                      onClick={() => handleResumeSelect(resume.id)}
                      className={`w-full min-w-0 p-3 bg-white dark:bg-[#0B0F19] rounded-xl flex justify-start items-center gap-4 self-stretch border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-2 border-[#6366F1] dark:border-[#818CF8] shadow-[0px_4px_12px_rgba(99,102,241,0.04)]' 
                          : 'border-[#EEF2FF] dark:border-[#2E3445] hover:border-indigo-100 dark:hover:border-[#818CF8]'
                      }`}
                    >
                      <div className="w-10 h-10 bg-[#F87171] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                        <Icon icon="bi:file-earmark-pdf-fill" className="w-5 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                        <span className="font-['Poppins'] font-semibold text-sm leading-5 text-[#000000] dark:text-[#F9FAFB] truncate block w-full">
                          {resume.name}
                        </span>
                        <span className="font-['Poppins'] font-normal text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                          {resume.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-4 w-full self-stretch">
                <button
                  onClick={handleCancel}
                  className="flex-1 h-10 px-4 rounded-[24px] border border-[#818CF8] dark:border-[#818CF8] bg-white dark:bg-[#0B0F19] hover:bg-indigo-50/20 dark:hover:bg-[#2E3445]/20 font-['Poppins'] font-normal text-[14px] text-[#818CF8] dark:text-[#818CF8] transition-colors"
                >
                  Cancel
                </button>
                <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
                  <button
                    onClick={handleContinue}
                    disabled={!selectedResumeId && !uploadedFile}
                    className={`flex-1 h-10 px-4 rounded-[24px] border border-white dark:border-transparent font-['Poppins'] font-normal text-[14px] text-white dark:text-[#F9FAFB] transition-all ${
                      (selectedResumeId || uploadedFile)
                        ? 'bg-[#6366F1] dark:bg-[#818CF8] hover:bg-[#6366F1]/95 dark:hover:bg-[#818CF8]/95 cursor-pointer shadow-md'
                        : 'bg-[#C7D2FE] dark:bg-[#2E3445] cursor-not-allowed'
                    }`}
                  >
                    Continue
                  </button>
                </FeatureDisabledTooltip>
              </div>

            </div>
          ) : (
            /* SCREEN 2: SHARE WHAT MAKES YOUR APPLICATION STAND OUT */
            <div className="w-full min-w-0 flex flex-col items-center">
              
              {/* Title Section */}
              <div className="text-center mb-6">
                <DialogTitle className="font-['Poppins'] font-medium text-[18px] leading-[26px] text-[#000000] dark:text-[#F9FAFB] text-center">
                  Apply job
                </DialogTitle>
                <DialogDescription className="font-['Poppins'] font-normal text-[12px] leading-[18px] text-[#6B7280] dark:text-[#9CA3AF] mt-1 text-center">
                  Share what makes your application stand out
                </DialogDescription>
              </div>

              {/* Selected Resume Row */}
              <div className="w-full min-w-0 p-3 bg-white dark:bg-[#1C2340] rounded-xl flex justify-start items-center gap-4 self-stretch border border-[#6366F1] dark:border-[#818CF8] shadow-[0px_4px_12px_rgba(99,102,241,0.04)] mb-6">
                <div className="w-10 h-10 bg-[#F87171] rounded-xl flex items-center justify-center text-white flex-shrink-0">
                  <Icon icon="bi:file-earmark-pdf-fill" className="w-5 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
                  <span className="font-['Poppins'] font-semibold text-sm leading-5 text-[#000000] dark:text-[#F9FAFB] truncate block w-full">
                    {selectedResumeName}
                  </span>
                  <span className="font-['Poppins'] font-normal text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                    {selectedResumeType}
                  </span>
                </div>
                <button
                  onClick={handleRemoveSelection}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-rose-100 hover:bg-rose-50 text-rose-500 transition-colors"
                  title="Remove selected resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Cover Letter Textarea */}
              <div className="w-full flex flex-col gap-1 mb-8">
                <textarea
                  className="w-full min-h-[120px] bg-white dark:bg-[#0B0F19] border border-[#EEF2FF] dark:border-[#2E3445] rounded-[16px] px-4 py-3 font-['Poppins'] text-sm leading-5 text-black dark:text-[#F9FAFB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#9CA3AF] focus:border-[#6366F1] dark:focus:border-[#818CF8] focus:ring-0 resize-none outline-none transition-all shadow-[0px_2px_8px_rgba(0,0,0,0.01)]"
                  placeholder="Tell us what makes you unique..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-4 w-full self-stretch">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 h-10 px-4 rounded-[24px] border border-[#818CF8] dark:border-[#818CF8] bg-white dark:bg-[#0B0F19] hover:bg-indigo-50/20 dark:hover:bg-[#2E3445]/20 font-['Poppins'] font-normal text-[14px] text-[#818CF8] dark:text-[#818CF8] transition-colors"
                >
                  Back
                </button>
                <FeatureDisabledTooltip featureKey="enableJobApplications" disabledMessage="Job applications are temporarily paused by administration.">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 h-10 px-4 rounded-[24px] border border-white dark:border-transparent font-['Poppins'] font-normal text-[14px] text-white dark:text-[#F9FAFB] bg-[#6366F1] dark:bg-[#818CF8] hover:bg-[#6366F1]/95 dark:hover:bg-[#818CF8]/95 cursor-pointer shadow-md transition-colors"
                  >
                    Submit
                  </button>
                </FeatureDisabledTooltip>
              </div>

            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
};
