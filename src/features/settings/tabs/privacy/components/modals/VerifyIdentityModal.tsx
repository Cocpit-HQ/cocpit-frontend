"use client";

import React, { useState } from 'react';
import { Dialog, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, UploadCloud, X, CarFront, BookOpenText, IdCard, CreditCard, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useIdentityVerification } from '@/features/settings/hooks/useIdentityVerification';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface VerifyIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const documentOptions = [
  { id: 'DRIVING_LICENSE', label: 'Driving License', icon: CarFront },
  { id: 'PASSPORT', label: 'Passport', icon: BookOpenText },
  { id: 'NATIONAL_ID', label: 'National ID', icon: IdCard },
  { id: 'PAN_CARD', label: 'PAN Card', icon: CreditCard },
];

export function VerifyIdentityModal({ isOpen, onClose }: VerifyIdentityModalProps) {
  const { isCompany } = useActiveProfile();
  const { mutate: verifyIdentity, isPending } = useIdentityVerification();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [documentType, setDocumentType] = useState<string>('DRIVING_LICENSE');

  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frontImage || !backImage) {
      setError("Please upload both front and back images of your document.");
      return;
    }
    setError(null);

    verifyIdentity(
      { documentType, frontImage, backImage: backImage || undefined },
      {
        onSuccess: () => {
          setStep(3);
          setTimeout(() => {
            handleClose();
          }, 3000);
        }
      }
    );
  };

  const handleClose = () => {
    if (isPending) return;
    setStep(1);
    setDocumentType('DRIVING_LICENSE');
    setFrontImage(null);
    setBackImage(null);
    onClose();
  };

  const FileUploader = ({ side, file, setFile }: { side: 'front' | 'back', file: File | null, setFile: (f: File | null) => void }) => (
    <div className="flex flex-col gap-[8px] w-full sm:w-[283px]">
      <span className={`text-[12px] font-normal text-center sm:text-left ${isCompany ? 'dark:text-company-secondary' : 'text-[#6B7280]'}`}>
        {side === 'front' ? 'Front image' : 'Back image'}
      </span>
      {file ? (
        <div className={`relative flex flex-col items-center justify-center p-2 h-[192px] border rounded-[12px] overflow-hidden ${isCompany ? 'dark:border-company-border dark:bg-[#121B2B]' : 'border-[#EEF2FF] bg-white dark:bg-gray-800'}`}>
          <img
            src={URL.createObjectURL(file)}
            alt={`${side} side preview`}
            className="w-full h-full object-contain rounded-[8px]"
          />
          <button
            type="button"
            onClick={() => setFile(null)}
            className={`absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors`}
            disabled={isPending}
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-full h-[192px] border border-[#EEF2FF] rounded-[12px] cursor-pointer transition-colors ${isCompany ? 'dark:border-company-border dark:bg-company-card dark:hover:bg-gray-800/50' : 'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700/50'}`}>
          <div className="flex flex-col items-center justify-center gap-[16px]">
            <UploadCloud className={`w-[40px] h-[40px] ${isCompany ? 'dark:text-company-secondary' : 'text-[#6B7280]'}`} strokeWidth={1.5} />
            <div className="flex flex-col items-center gap-0">
              <span className={`text-[10px] sm:text-[12px] font-normal ${isCompany ? 'dark:text-company-secondary' : 'text-[#6B7280]'}`}>
                Click to upload {side}
              </span>
              <span className={`text-[10px] font-normal ${isCompany ? 'dark:text-company-secondary' : 'text-[#6B7280]'}`}>
                JPG, PNG · Max 5MB
              </span>
            </div>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/jpg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const selectedFile = e.target.files[0];
                const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                if (!validTypes.includes(selectedFile.type)) {
                  toast({
                    title: "Invalid file type",
                    description: "Please upload a JPG or PNG image.",
                    variant: "destructive"
                  });
                  e.target.value = '';
                  return;
                }
                if (selectedFile.size > 5 * 1024 * 1024) {
                  toast({
                    title: "File too large",
                    description: "Maximum file size is 5MB.",
                    variant: "destructive"
                  });
                  e.target.value = '';
                  return;
                }
                setFile(selectedFile);
              }
            }}
            disabled={isPending}
          />
        </label>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <BareDialogContent
        className={step === 3
          ? `p-0 bg-white dark:bg-[#1F2937] w-[300px] h-[92px] rounded-[24px] max-w-none border-none flex flex-col items-center justify-center outline-none shadow-[0px_4px_20px_rgba(0,0,0,0.05)]`
          : `p-0 overflow-y-auto bg-white ${isCompany ? 'dark:bg-company-card' : 'dark:bg-[#1F2937]'} w-screen h-screen max-w-none border-none flex flex-col items-center justify-center`
        }
      >
        <DialogTitle className="sr-only">
          {step === 1 ? 'Verify your identity' : step === 2 ? 'Upload document' : 'Verification under review'}
        </DialogTitle>

        {step !== 3 && (
          <div className="flex flex-row justify-end items-center w-full pt-[24px] pr-[24px] absolute top-0 right-0">
            <button onClick={handleClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
              <X className="w-6 h-6 text-[#EF4444]" />
            </button>
          </div>
        )}

        {step === 1 ? (
          <div className="flex flex-col justify-center items-center w-full max-w-[412px] flex-1 pb-16 gap-[40px]">

            {/* Header */}
            <div className="flex flex-col items-center gap-[8px]">
              <h1 className={`text-[24px] font-semibold text-center leading-[32px] ${isCompany ? 'dark:text-company-text' : 'text-black dark:text-white'}`}>
                Verify your identity
              </h1>
              <p className={`text-[14px] font-normal text-center leading-[20px] ${isCompany ? 'dark:text-company-secondary' : 'text-[#6B7280] dark:text-gray-400'}`}>
                Choose a document to verify your account
              </p>
            </div>

            {/* Options List */}
            <div className="flex flex-col items-center gap-[16px] w-[330px]">
              {documentOptions.map((option) => (
                <div
                  key={option.id}
                  className={`flex flex-row items-center justify-between px-[24px] w-[330px] h-[96px] rounded-lg border border-transparent transition-all bg-white ${isCompany ? 'dark:bg-company-card' : 'dark:bg-[#1F2937]'}`}
                  style={{
                    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div className="flex flex-row items-center gap-[24px]">
                    <div className="flex items-center justify-center w-[48px] h-[48px] bg-[#EEF2FF] dark:bg-company-primary/10 rounded-full">
                      <option.icon className="w-6 h-6 text-[#6366F1]" strokeWidth={2} />
                    </div>
                    <span className={`text-[18px] font-medium ${isCompany ? 'dark:text-company-text' : 'text-black dark:text-white'}`}>
                      {option.label}
                    </span>
                  </div>

                  {/* Radio indicator */}
                  <button
                    type="button"
                    onClick={() => setDocumentType(option.id)}
                    className={`flex flex-col items-center justify-center w-[24px] h-[24px] rounded-full border-2 cursor-pointer transition-colors ${documentType === option.id
                        ? 'border-[#6366F1]'
                        : 'border-[#6B7280]'
                      }`}>
                    {documentType === option.id && (
                      <div className="w-[12px] h-[12px] rounded-full bg-[#6366F1]" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex flex-row justify-center items-center gap-[16px] h-[40px]">
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-[140px] h-[40px] bg-white border border-[#818CF8] text-[#818CF8] rounded-[24px] text-[14px] font-medium hover:bg-[#818CF8]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex items-center justify-center w-[140px] h-[40px] bg-[#6366F1] border border-[#FFFFFF] text-[#FFFFFF] rounded-[24px] text-[14px] font-medium hover:bg-[#6366F1]/90 transition-colors"
              >
                Continue
              </button>
            </div>

          </div>
        ) : step === 2 ? (
          <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center w-full max-w-[582px] flex-1 pb-16 gap-[40px] px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col items-center gap-[8px]">
              <h1 className={`text-[24px] font-semibold text-center leading-[32px] ${isCompany ? 'dark:text-company-text' : 'text-black dark:text-white'}`}>
                Upload document
              </h1>
              <p className={`text-[14px] font-normal text-center leading-[20px] ${isCompany ? 'dark:text-company-secondary' : 'text-[#6B7280] dark:text-gray-400'}`}>
                Please provide clear photos of both sides of your ID
              </p>
            </div>

            {/* Upload Boxes */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-[16px] w-full">
              <FileUploader side="front" file={frontImage} setFile={(f) => { setFrontImage(f); setError(null); }} />
              <FileUploader side="back" file={backImage} setFile={(f) => { setBackImage(f); setError(null); }} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-[12px] font-medium w-full text-center max-w-[526px]">
                {error}
              </div>
            )}

            {/* Info Note */}
            <div className="flex flex-row items-center w-full max-w-[526px] bg-[#EEF2FF] dark:bg-[#6366F1]/10 rounded-[24px] py-[8px] px-[16px] gap-[8px]">
              <Info className="w-[24px] h-[24px] text-[#6366F1] flex-shrink-0" strokeWidth={1.5} />
              <p className="text-[12px] font-normal text-[#6366F1] leading-[16px]">
                Ensure all details are clearly visible and not blurred. Good lighting and a plain background help speed up the verification process.
              </p>
            </div>

            {/* Footer */}
            <div className="flex flex-row justify-center items-center gap-[16px] h-[40px]">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isPending}
                className="flex items-center justify-center w-[140px] h-[40px] bg-white border border-[#818CF8] text-[#818CF8] rounded-[24px] text-[14px] font-medium hover:bg-[#818CF8]/5 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center justify-center w-[140px] h-[40px] border border-[#FFFFFF] text-[#FFFFFF] rounded-[24px] text-[14px] font-medium transition-colors disabled:opacity-50 disabled:cursor-default"
                style={{ background: isPending ? '#C7D2FE' : '#6366F1' }}
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
              </button>
            </div>
          </form>
        ) : null}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center w-full h-full p-[16px] text-center gap-[4px]">
            <h3 className="text-[14px] leading-[20px] font-medium text-black dark:text-white">
              Verification under review
            </h3>
            <p className="text-[12px] leading-[20px] font-normal text-[#6B7280] dark:text-[#9CA3AF]">
              Our team will review your documents before we verify your identity
            </p>
          </div>
        )}
      </BareDialogContent>
    </Dialog>
  );
}
