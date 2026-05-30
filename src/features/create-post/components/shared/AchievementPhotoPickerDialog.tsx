'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Icon } from '@iconify/react';

type AchievementOption = 'new_project' | 'new_role' | 'academic_milestone' | 'certificate';

interface AchievementPhotoPickerDialogProps {
  isOpen: boolean;
  selectedOption: AchievementOption | null;
  onClose: () => void;
  onBack: () => void;
  onPhotoSelect: (imagePath: string) => void;
  onUploadPhoto: () => void;
}

const ACHIEVEMENT_IMAGES = [
  '/images/achievement/bachelor party.svg',
  '/images/achievement/celebration.svg',
  '/images/achievement/certification.svg',
  '/images/achievement/graduation cap.svg',
  '/images/achievement/helpingpartner.svg',
  '/images/achievement/newmember.svg',
  '/images/achievement/newteammember.svg',
  '/images/achievement/work anniversary.svg',
];

export const AchievementPhotoPickerDialog = ({
  isOpen,
  selectedOption,
  onClose,
  onBack,
  onPhotoSelect,
  onUploadPhoto,
}: AchievementPhotoPickerDialogProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const imageRows = [];
  for (let i = 0; i < ACHIEVEMENT_IMAGES.length; i += 2) {
    imageRows.push(ACHIEVEMENT_IMAGES.slice(i, i + 2));
  }

  const categoryLabel = {
    new_project: 'Launched a project',
    new_role: 'New role',
    academic_milestone: 'Academic milestone',
    certificate: 'Certificate',
  }[selectedOption || 'new_project'];

  return (
    <div className="w-[600px] h-[670px] p-4 bg-white rounded-3xl flex flex-col justify-start items-end overflow-hidden">
      
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
          <img src={selectedPhoto} alt="Selected preview" className="w-full h-full object-contain p-2" />
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-md text-red-500 hover:bg-red-50 hover:scale-105 active:scale-95 transition-all border border-red-100"
            title="Remove photo"
          >
            <Icon icon="hugeicons:delete-02" className="w-5 h-5 text-red-500" />
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

      {/* Image grid — 2 columns, scrollable */}
      <div className="flex-1 w-full overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-4">
        {imageRows.map((row, rowIdx) => (
          <div key={rowIdx} className="self-stretch inline-flex justify-start items-start gap-4">
            {row.map((src, colIdx) => {
              const isSelected = src === selectedPhoto;
              return (
                <button
                  key={colIdx}
                  onClick={() => setSelectedPhoto(src)}
                  className={`flex-1 h-48 p-2.5 bg-white flex justify-center items-center gap-2.5 overflow-hidden rounded-xl transition-all border ${
                    isSelected 
                      ? 'ring-2 ring-indigo-500 border-indigo-200 bg-indigo-50/20' 
                      : 'hover:ring-2 hover:ring-indigo-400 border-gray-100'
                  }`}
                >
                  <img src={src} alt="" className="w-full h-full object-contain rounded-lg" />
                </button>
              );
            })}
            {/* Fill empty cell if odd number of images */}
            {row.length === 1 && <div className="flex-1 h-48" />}
          </div>
        ))}
      </div>

      {/* Back or Next button */}
      <div className="self-stretch pt-4 flex flex-col justify-center items-end shrink-0">
        {selectedPhoto ? (
          <button
            onClick={() => onPhotoSelect(selectedPhoto)}
            className="w-24 h-10 px-4 py-2 bg-[#6366F1] hover:bg-indigo-600 rounded-3xl inline-flex justify-center items-center gap-2.5 text-white font-medium font-['Poppins'] text-sm leading-5 transition-colors shadow-sm"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onBack}
            className="w-24 h-10 px-4 py-2 bg-white rounded-3xl outline outline-1 outline-offset-[-1px] outline-indigo-400 inline-flex justify-center items-center gap-2.5 hover:bg-indigo-50/30 transition-colors"
          >
            <span className="text-center text-indigo-400 text-sm font-normal font-['Poppins'] leading-5">Back</span>
          </button>
        )}
      </div>

    </div>
  );
};
