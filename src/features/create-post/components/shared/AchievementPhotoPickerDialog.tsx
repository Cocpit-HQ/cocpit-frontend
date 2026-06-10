'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Icon } from '@iconify/react';
import { getAchievementImages } from '@/services/api/feed';

type AchievementOption = 'new_project' | 'new_role' | 'academic_milestone' | 'certificate';

interface AchievementPhotoPickerDialogProps {
  isOpen: boolean;
  selectedOption: AchievementOption | null;
  onClose: () => void;
  onBack: () => void;
  onPhotoSelect: (image: { id: number; url: string }) => void;
  onUploadPhoto: () => void;
}


export const AchievementPhotoPickerDialog = ({
  isOpen,
  selectedOption,
  onClose,
  onBack,
  onPhotoSelect,
  onUploadPhoto,
}: AchievementPhotoPickerDialogProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<{ id: number; url: string } | null>(null);
  const [achievementImages, setAchievementImages] = useState<{ id: number; key: string; title: string; url: string; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      getAchievementImages()
        .then(setAchievementImages)
        .catch(err => console.error("Failed to load achievement images", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  const imageRows = [];
  for (let i = 0; i < achievementImages.length; i += 2) {
    imageRows.push(achievementImages.slice(i, i + 2));
  }

  const categoryLabel = {
    new_project: 'Launched a project',
    new_role: 'New role',
    academic_milestone: 'Academic milestone',
    certificate: 'Certificate',
  }[selectedOption || 'new_project'];

  return (
    <div className="w-[640px] h-[670px] p-4 bg-white rounded-3xl flex flex-col justify-start items-end overflow-hidden">
      
      {/* X close button */}
      <button 
        onClick={onClose} 
        className="self-stretch inline-flex justify-end items-center mb-1 shrink-0 group"
      >
        <div className="size-6 relative overflow-hidden flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
          <X className="w-5 h-5 text-red-400 group-hover:text-red-500" />
        </div>
      </button>

      {/* Upload area or Selected Image Preview */}
      {selectedPhoto ? (
        <div className="self-stretch h-48 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-center items-center overflow-hidden relative w-full shrink-0 bg-indigo-50/10 border border-indigo-50">
          <img src={selectedPhoto.url} alt="Selected preview" className="w-full h-full object-contain p-2" />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-md text-red-500 transition-all border border-red-100"
            title="Remove photo"
          >
            <Icon icon="fluent:delete-16-regular" className="w-5 h-5 text-red-500" />
          </button>
        </div>
      ) : (
        <button 
          onClick={onUploadPhoto}
          className="self-stretch h-48 rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col justify-center items-center gap-10 cursor-pointer hover:bg-indigo-50/30 transition-colors w-full shrink-0"
        >
          <Icon icon="lets-icons:upload-light" className="w-10 h-10 text-gray-500" />
          <div className="flex flex-col justify-start items-center gap-2">
            <div className="text-center text-black text-lg font-medium font-['Poppins'] leading-6">Add a photo</div>
            <div className="text-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4">Or select from below</div>
          </div>
        </button>
      )}

      {/* Category label */}
      <div className="text-center text-gray-500 text-xs font-normal font-['Poppins'] leading-4 self-stretch py-2 shrink-0">
        {categoryLabel}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 w-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin" />
        </div>
      ) : (
        <div className="self-stretch grow shrink basis-0 overflow-y-auto overflow-x-hidden flex flex-col justify-start items-center gap-4 px-2">
          {imageRows.map((row, rowIndex) => (
            <div key={rowIndex} className="w-full flex justify-between items-start gap-4 shrink-0">
              {row.map((img) => {
                const isSelected = selectedPhoto?.id === img.id;
                return (
                  <div 
                    key={img.id}
                    className="w-[276px] h-[200px] bg-white flex justify-center items-center p-[10px] rounded-[16px] relative overflow-hidden group cursor-pointer border shrink-0 transition-all duration-200"
                    style={{ borderColor: isSelected ? '#6366F1' : 'transparent' }}
                    onClick={() => setSelectedPhoto(img)}
                  >
                    <img 
                      src={img.url} 
                      alt={`Achievement ${img.id}`}
                      className="w-[213.36px] h-[190px] object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    
                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-6 h-6 bg-[#6366F1] rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-200 scale-100">
                        <Icon icon="mdi:check" className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Add an empty placeholder if the row is not full */}
              {row.length === 1 && (
                <div className="w-[276px] h-[200px] shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back and Next buttons */}
      <div className="self-stretch pt-4 flex justify-end items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="w-24 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 inline-flex justify-center items-center gap-2.5 hover:bg-indigo-50/30 transition-colors"
        >
          <span className="text-center text-indigo-400 text-sm font-normal font-['Poppins'] leading-5">Back</span>
        </button>
        <button
          onClick={() => selectedPhoto && onPhotoSelect(selectedPhoto)}
          disabled={!selectedPhoto}
          className={`w-24 h-10 px-4 py-2 rounded-3xl inline-flex justify-center items-center gap-2.5 text-white font-medium font-['Poppins'] text-sm leading-5 transition-colors shadow-sm ${
            selectedPhoto 
              ? 'bg-[#6366F1] hover:bg-indigo-600 cursor-pointer' 
              : 'bg-indigo-200 cursor-not-allowed opacity-70'
          }`}
        >
          Next
        </button>
      </div>

    </div>
  );
};
