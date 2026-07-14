import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Icon } from '@iconify/react';
import { Loader2 } from 'lucide-react';

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
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialValues?.name ?? emptyValues.name);
      setDescription(initialValues?.description ?? emptyValues.description);
      setBannerUrl(initialValues?.bannerUrl ?? emptyValues.bannerUrl);
    }
  }, [isOpen, initialValues]);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setBannerUrl(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isValid = name.trim().length > 0 && bannerUrl.trim().length > 0;
  const title = mode === 'create' ? 'Create channel' : 'Edit channel';
  const submitLabel = mode === 'create' ? 'Create channel' : 'Save';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] rounded-[24px] p-6">
        <DialogHeader>
          <DialogTitle className="font-['Poppins'] text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-black dark:text-[#FFFFFF] font-['Poppins']">
              Channel name*
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nexsus Global Systems"
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-[#2A2D35] bg-white dark:bg-[#0F1115] text-sm font-['Poppins'] text-black dark:text-[#FFFFFF] outline-none focus:border-[#1A73E8] placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-black dark:text-[#FFFFFF] font-['Poppins']">
              Channel banner*
            </label>
            <div
              onClick={() => bannerInputRef.current?.click()}
              className="relative w-full h-[110px] rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#2A2D35] flex items-center justify-center cursor-pointer overflow-hidden hover:border-[#1A73E8]/50 transition-colors bg-gray-50 dark:bg-[#0F1115]"
            >
              {bannerUrl ? (
                <img src={bannerUrl} alt="Channel banner" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <Icon icon="iconoir:cloud-upload" className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-400 font-['Poppins']">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-[10px] text-gray-400 font-['Poppins']">
                    Max 5 MB, recommended 920 x 100 px
                  </span>
                </div>
              )}
            </div>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-black dark:text-[#FFFFFF] font-['Poppins']">
              Channel description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what this channel is about"
              className="w-full px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-[#2A2D35] bg-white dark:bg-[#0F1115] text-sm font-['Poppins'] text-black dark:text-[#FFFFFF] outline-none focus:border-[#1A73E8] resize-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-full border border-[#1A73E8] text-[#1A73E8] text-sm font-semibold font-['Poppins'] transition-colors hover:bg-[#EFF4FF] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onSubmit({ name: name.trim(), description: description.trim(), bannerUrl })}
            disabled={!isValid || isSubmitting}
            className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-[#1A73E8] text-white text-sm font-semibold font-['Poppins'] transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
