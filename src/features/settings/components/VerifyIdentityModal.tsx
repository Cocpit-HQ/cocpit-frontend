"use client";

import React, { useState } from 'react';
import { Dialog, BareDialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Upload, X, Info, CheckCircle2 } from 'lucide-react';
import { DrivingLicenceIcon, PassportIcon, NationalIdIcon, PanCardIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useIdentityVerification } from '@/features/settings/hooks/useIdentityVerification';
import { useActiveProfile } from '@/context/ActiveProfileContext';

interface VerifyIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const documentOptions = [
  { id: 'DRIVING_LICENSE', label: 'Driving License', icon: DrivingLicenceIcon },
  { id: 'PASSPORT', label: 'Passport', icon: PassportIcon },
  { id: 'NATIONAL_ID', label: 'National ID', icon: NationalIdIcon },
  { id: 'PAN_CARD', label: 'PAN Card', icon: PanCardIcon },
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
          handleClose();
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
    <div className="w-full sm:w-[334px] flex flex-col justify-start items-start gap-2">
      <div className="text-ds-text-secondary text-xs font-normal font-['DM_Sans'] leading-4">
        {side === 'front' ? 'Front image' : 'Back image'}
      </div>
      {file ? (
        <div className="self-stretch h-44 bg-black rounded-2xl border border-ds-border flex flex-col justify-center items-center relative overflow-hidden p-2">
          <img
            src={URL.createObjectURL(file)}
            alt={`${side} preview`}
            className="w-full h-full object-contain rounded-xl"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFile(null);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-ds-text-primary transition-colors cursor-pointer"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={`file-upload-${side}`}
          className="self-stretch h-44 bg-black rounded-2xl border border-ds-border hover:border-ds-text-muted flex flex-col justify-center items-center gap-2 overflow-hidden cursor-pointer transition-colors"
        >
          <Upload className="w-10 h-10 text-ds-text-primary" strokeWidth={1.5} />
          <div className="text-center text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4">
            JPG, PNG, WEBP · Max 5MB
          </div>
          <input
            id={`file-upload-${side}`}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const selectedFile = e.target.files[0];
                if (selectedFile.size > 5 * 1024 * 1024) {
                  toast({
                    title: 'File too large',
                    description: 'Document image must be less than 5MB',
                    variant: 'destructive',
                  });
                  return;
                }
                setFile(selectedFile);
                setError(null);
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
        className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full h-full max-w-none border-0 p-0 bg-black shadow-none outline-none flex flex-col items-center justify-center z-[300]"
        overlayClassName="bg-black"
      >
        <DialogTitle className="sr-only">
          {step === 1 ? 'Verify your identity' : step === 2 ? 'Upload document' : 'Verification under review'}
        </DialogTitle>

        {/* Screen Top-Right Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close dialog"
          className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-[301] p-2 text-ds-text-secondary hover:text-ds-text-primary rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" strokeWidth={1.5} />
        </button>

        <div
          className={cn(
            "flex flex-col items-center justify-center relative pointer-events-auto max-h-[90vh] overflow-y-auto",
            step === 1
              ? "w-full max-w-[340px] px-4 py-2 border-0 bg-transparent shadow-none"
              : step === 2
              ? "w-full max-w-[712px] px-4 py-2 border-0 bg-transparent shadow-none"
              : "p-6 bg-ds-surface-2 border border-ds-border rounded-2xl shadow-2xl w-[380px] max-w-[95vw]"
          )}
        >

        {step === 1 ? (
          <div className="w-full flex flex-col justify-center items-center gap-4">
            <div className="w-full flex flex-col justify-start items-center gap-4">
              {/* Header */}
              <div className="self-stretch flex flex-col justify-start items-center gap-2">
                <h2 className="text-center justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                  Verify your identity
                </h2>
                <p className="text-center justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                  Choose a document to verify your account
                </p>
              </div>

              {/* Options List */}
              <div className="w-full max-w-[320px] flex flex-col justify-start items-start gap-4">
                {documentOptions.map((option) => {
                  const isSelected = documentType === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => setDocumentType(option.id)}
                      className="self-stretch px-4 py-3 bg-black hover:bg-white/[0.04] rounded-lg inline-flex justify-between items-center overflow-hidden cursor-pointer transition-colors select-none"
                    >
                      <div className="flex justify-start items-center gap-6">
                        {/* Circular Icon Disc */}
                        <div className="relative w-12 h-12 shrink-0 flex justify-center items-center rounded-full">
                          {/* Gradient border wrapper — always-on diagonal conic ring */}
                          <div
                            className="absolute inset-0 rounded-full p-[1px]"
                            style={{
                              background: "conic-gradient(from 345deg at 50% 50%, rgba(255,255,255,0.04) 0deg, rgba(255,255,255,0.7) 60deg, rgba(255,255,255,0.04) 120deg, rgba(255,255,255,0.01) 180deg, rgba(255,255,255,0.6) 240deg, rgba(255,255,255,0.04) 300deg, rgba(255,255,255,0.04) 360deg)"
                            }}
                          >
                            {/* Inner black container */}
                            <div className="w-full h-full rounded-full bg-black flex justify-center items-center">
                              <option.icon 
                                className="w-5 h-5 text-white" 
                                strokeWidth={1.5} 
                              />
                            </div>
                          </div>
                        </div>
                        <span className="justify-center text-ds-text-primary text-sm font-normal font-['DM_Sans'] leading-5">
                          {option.label}
                        </span>
                      </div>

                      {/* Radio indicator */}
                      {isSelected ? (
                        <div className="w-6 h-6 p-1.5 rounded-full border-[1.5px] border-ds-accent flex justify-center items-center shrink-0">
                          <div className="w-2 h-2 bg-ds-accent rounded-full" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-[1.5px] border-ds-border shrink-0 transition-colors" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="inline-flex justify-center items-center gap-4 pt-2">
              <div className="flex justify-center items-start gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-[94px] h-[36px] px-4 py-1.5 bg-ds-accent hover:opacity-90 rounded-[100px] flex justify-center items-center gap-2.5 transition-opacity cursor-pointer"
                >
                  <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                    Continue
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-[94px] h-[36px] px-3 py-1.5 rounded-[100px] border border-ds-border hover:bg-ds-surface-1 flex justify-center items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                    Cancel
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : step === 2 ? (
          <form onSubmit={handleSubmit} className="w-full flex flex-col justify-center items-center gap-4">
            {/* Header */}
            <div className="self-stretch flex flex-col justify-start items-center gap-2">
              <h2 className="text-center justify-center text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                Verify your identity
              </h2>
              <p className="text-center justify-center text-ds-text-secondary text-sm font-normal font-['DM_Sans'] leading-5">
                Choose a document to verify your account
              </p>
            </div>

            {/* Upload Boxes */}
            <div className="self-stretch flex flex-col sm:flex-row justify-center items-center gap-3">
              <FileUploader side="front" file={frontImage} setFile={setFrontImage} />
              <FileUploader side="back" file={backImage} setFile={setBackImage} />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-ds-error ds-text-small font-medium w-full text-center">
                {error}
              </div>
            )}

            {/* Info Note Banner */}
            <div className="px-4 py-2 bg-ds-surface-1 rounded-3xl inline-flex justify-center items-center gap-2 max-w-[560px]">
              <Info className="w-6 h-6 text-ds-text-primary shrink-0" strokeWidth={1.5} />
              <div className="justify-center text-ds-text-primary text-xs font-normal font-['DM_Sans'] leading-4 text-center sm:text-left">
                Ensure all details are clearly visible and not blurred. Good lighting and a plain
                <br className="hidden sm:inline" /> background help speed up the verification process.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="self-stretch inline-flex justify-center items-center gap-4 pt-1">
              <div className="flex justify-center items-start gap-2">
                <button
                  type="submit"
                  disabled={isPending || !frontImage || !backImage}
                  className="w-[78px] h-[36px] bg-ds-accent hover:opacity-90 rounded-[100px] flex justify-center items-center transition-opacity cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                      Submit
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-[78px] h-[36px] rounded-[100px] border border-ds-border hover:bg-white/[0.06] flex justify-center items-center transition-colors cursor-pointer"
                >
                  <span className="text-ds-text-primary text-base font-medium font-['DM_Sans'] leading-6">
                    Cancel
                  </span>
                </button>
              </div>
            </div>
          </form>
        ) : null}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center w-full py-6 text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-ds-surface-1 border border-ds-success/30 flex items-center justify-center text-ds-success">
              <CheckCircle2 className="w-8 h-8 text-ds-success" />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <h3 className="ds-text-body font-semibold text-ds-text-primary text-lg">
                Verification under review
              </h3>
              <p className="ds-text-small text-ds-text-secondary max-w-[280px]">
                Our team will review your documents before we verify your identity.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="ds-btn h-[36px] px-8 bg-ds-accent text-white rounded-full ds-text-small font-medium hover:opacity-90 transition-opacity mt-2"
            >
              Done
            </button>
          </div>
        )}
        </div>
      </BareDialogContent>
    </Dialog>
  );
}
