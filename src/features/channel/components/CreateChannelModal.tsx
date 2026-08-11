import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Icon } from '@iconify/react';
import { Loader2, X } from 'lucide-react';
import ChannelBannerEditorModal from './ChannelBannerEditorModal';

export interface ChannelFormValues {
  name: string;
  description: string;
  bannerUrl: string;
}

interface CreateChannelModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialValues?: ChannelFormValues;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (values: ChannelFormValues) => void;
}

const emptyValues: ChannelFormValues = { name: '', description: '', bannerUrl: '' };

export default function CreateChannelModal({
  isOpen,
  mode,
  initialValues,
  isSubmitting,
  onClose,
  onSubmit,
}: CreateChannelModalProps) {
  const [name, setName] = useState(initialValues?.name ?? emptyValues.name);
  const [description, setDescription] = useState(initialValues?.description ?? emptyValues.description);
  const [bannerUrl, setBannerUrl] = useState(initialValues?.bannerUrl ?? emptyValues.bannerUrl);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialValues?.name ?? emptyValues.name);
      setDescription(initialValues?.description ?? emptyValues.description);
      setBannerUrl(initialValues?.bannerUrl ?? emptyValues.bannerUrl);
      setIsBannerModalOpen(false);
    }
  }, [isOpen, initialValues]);

  const isDescriptionValid = description.trim().length >= 20 && description.trim().length <= 100;
  const isValid = name.trim().length > 0 && bannerUrl.trim().length > 0 && isDescriptionValid;
  const title = mode === 'create' ? 'Create channel' : 'Edit channel';
  const submitLabel = mode === 'create' ? 'Create channel' : 'Save';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-full max-w-[648px] sm:max-w-[648px] !p-0 rounded-[24px] sm:rounded-[24px] bg-[#FFFFFF] dark:bg-[#121B2B] !border-0 !shadow-2xl overflow-hidden flex flex-col [&>button]:hidden">
          {/* Modal Header */}
          <div className="w-full max-w-[648px] h-[87px] px-[32px] py-[24px] flex flex-row items-center justify-between flex-shrink-0">
            <DialogTitle className="font-['Poppins'] font-medium text-[32px] leading-[38px] tracking-[-0.64px] text-[#000000] dark:text-[#FFFFFF] m-0">
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="w-[24px] h-[24px] flex items-center justify-center text-[#EF4444] hover:opacity-80 transition-opacity"
              title="Close"
            >
              <X className="w-6 h-6" strokeWidth={1.5} />
            </button>
          </div>

          {/* Modal Content (Scrollable) */}
          <div className="w-full max-w-[648px] h-[533.5px] px-[24px] flex flex-col items-start gap-[16px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* Container: Channel name* */}
            <div className="w-full max-w-[600px] flex flex-col items-start gap-[11.5px] flex-shrink-0">
              <label className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-[#000000] dark:text-[#FFFFFF]">
                Channel name*
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nexsus Global Systems"
                className="w-full max-w-[600px] h-[56px] px-[16px] rounded-[12px] border border-[#E0E0E7] dark:border-[#2A2D35] bg-[#FFFFFF] dark:bg-[#0F1115] text-[16px] leading-[24px] font-normal font-['Poppins'] text-[#000000] dark:text-[#FFFFFF] outline-none focus:border-[#1A73E8] placeholder:text-[#6B7280] dark:placeholder:text-[#A1A8B3]"
              />
            </div>

            {/* Container: Channel banner* (6:1 Ratio) */}
            <div className="w-full max-w-[600px] flex flex-col items-center gap-[8px] flex-shrink-0 rounded-[12px]">
              <label className="w-full font-['Poppins'] font-medium text-[16px] leading-[24px] text-[#000000] dark:text-[#FFFFFF] text-left">
                Channel banner*
              </label>
              
              {bannerUrl ? (
                <div className="w-full max-w-[600px] h-[100px] sm:h-[113px] rounded-[12px] overflow-hidden relative select-none bg-gray-100 dark:bg-[#1A2435] flex items-center justify-center flex-shrink-0">
                  <img src={bannerUrl} alt="Channel banner" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  onClick={() => setIsBannerModalOpen(true)}
                  className="w-full max-w-[600px] min-h-[113px] py-4 rounded-[12px] border border-[#E0E0E7] dark:border-[#2A2D35] flex flex-col items-center justify-center cursor-pointer hover:border-[#1A73E8] transition-colors bg-[#FFFFFF] dark:bg-[#0F1115] flex-shrink-0 gap-1 text-center px-4"
                >
                  <Icon icon="iconoir:cloud-upload" className="w-6 h-6 text-[#6B7280] dark:text-[#A1A8B3]" />
                  <span className="text-[16px] font-['Poppins'] font-medium text-[#000000] dark:text-[#FFFFFF]">Click to upload or drag and drop</span>
                  <span className="text-[10px] font-['Poppins'] text-[#6B7280] dark:text-[#A1A8B3]">Use a 16:3 banner. Minimum size: 960 &times; 180 px. Recommended size: 1920 &times; 360 px for optimal quality.</span>
                </div>
              )}

              {bannerUrl ? (
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(true)}
                  className="font-['Poppins'] font-normal text-[14px] leading-[21px] text-[#1A73E8] dark:text-[#4D9CFF] hover:underline cursor-pointer bg-transparent border-0 p-0 m-0 mt-0.5"
                >
                  Change
                </button>
              ) : null}
            </div>

            {/* Container: Channel description */}
            <div className="w-full max-w-[600px] flex flex-col items-start gap-[12px] flex-shrink-0">
              <label className="font-['Poppins'] font-medium text-[16px] leading-[24px] text-[#000000] dark:text-[#FFFFFF]">
                Channel description
              </label>
              <div className="relative w-full max-w-[600px] h-[120px] rounded-[12px] border border-[#E0E0E7] dark:border-[#2A2D35] bg-[#FFFFFF] dark:bg-[#0F1115] focus-within:border-[#1A73E8] transition-colors overflow-hidden">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                  rows={4}
                  placeholder="Describe what this channel is about"
                  className="w-full h-full p-[16px] pb-[32px] bg-transparent text-[16px] leading-[26px] font-normal font-['Poppins'] text-[#000000] dark:text-[#FFFFFF] outline-none placeholder:text-[#6B7280] dark:placeholder:text-[#A1A8B3] resize-none overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                />
                <span className={`absolute bottom-3 right-4 text-[12px] font-['Poppins'] ${description.length < 20 ? 'text-red-500' : 'text-[#6B7280] dark:text-[#A1A8B3]'}`}>
                  {description.length} / 100
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="w-full max-w-[600px] h-[64px] flex flex-row items-center justify-end gap-[16px] pb-[24px] mt-auto flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-[140px] h-[40px] flex items-center justify-center rounded-[24px] border border-[#1A73E8] dark:border-[#4D9CFF] bg-[#FFFFFF] dark:bg-transparent text-[#1A73E8] dark:text-[#4D9CFF] text-[14px] leading-[20px] font-normal font-['Poppins'] hover:bg-[#EFF4FF] dark:hover:bg-[#1A2435] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => isValid && onSubmit({ name: name.trim(), description: description.trim(), bannerUrl })}
                disabled={!isValid || isSubmitting}
                className="w-[140px] sm:w-auto min-w-[140px] px-6 h-[40px] flex items-center justify-center gap-2 rounded-[24px] bg-[#1A73E8] dark:bg-[#4D9CFF] border border-[#FFFFFF] dark:border-transparent text-[#FFFFFF] dark:text-[#0F1115] text-[14px] leading-[20px] font-normal font-['Poppins'] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{submitLabel}</span>
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* 6:1 Banner Editor & Crop Preview Modal */}
      <ChannelBannerEditorModal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        currentBanner={bannerUrl || null}
        onSaveBanner={(newUrl) => {
          if (newUrl) setBannerUrl(newUrl);
          setIsBannerModalOpen(false);
        }}
      />
    </>
  );
}
