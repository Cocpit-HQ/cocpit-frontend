"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Folder, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { CreateFolderModal } from '@/features/settings/components/CreateFolderModal';
import { SavedFolder } from '@/types/entities';
import { useSavedFolders } from '../../hooks/useSavedFolders';
import { useSettingsStore } from '@/store/settings.store';

export function SavedSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // UI-only state (is the "create collection" modal open) now lives in the
  // shared settings store instead of local useState.
  const isCreateModalOpen = useSettingsStore((state) => state.saved.isCreateFolderModalOpen);
  const setIsCreateModalOpen = useSettingsStore((state) => state.setSavedCreateFolderModalOpen);
  const { folders, isLoading } = useSavedFolders();

  const handleFolderCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["saved-folders"] });
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full h-full min-h-full font-poppins">
      <div className="w-full relative flex-1 flex flex-col py-2 px-4 gap-4 max-w-[698px]">
        
        {/* Header section */}
        <div className="flex flex-row justify-between items-center w-full min-h-[56px] mb-2">
          <div className="flex flex-col items-start justify-center">
            <h1 className="text-[24px] font-semibold text-black leading-[32px]">Saved</h1>
            <p className="text-[16px] font-normal text-[#6B7280] leading-[24px]">Everything you've saved, organized your way</p>
          </div>
          
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex flex-row justify-center items-center px-3 py-2 gap-2 h-[40px] border border-[#6366F1] rounded-[24px] transition-colors"
          >
            <span className="text-[16px] font-medium text-[#6366F1] leading-[24px]">New collections</span>
            <Plus className="w-5 h-5 text-[#6366F1]" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col w-full px-4 gap-3">
          
          {/* General Folder */}
          <div 
            onClick={() => router.push('/saved')}
            className="flex flex-row items-center py-2 gap-4 w-full h-[56px] cursor-pointer hover:bg-gray-50 rounded-lg px-2 -ml-2 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10">
              <Folder className="w-6 h-6 text-black" strokeWidth={1.5} />
            </div>
            <span className="text-[16px] font-normal text-black leading-[24px]">General</span>
          </div>

          {/* Collections List Header */}
          <div className="flex flex-row items-center py-0 gap-[10px] w-full h-[16px] mt-1">
            <span className="text-[12px] font-normal text-[#6B7280] leading-[16px]">Collections</span>
          </div>

          {/* Collections Grid */}
          <div className="flex flex-row flex-wrap items-start gap-x-20 gap-y-4 w-full mt-2">
            {isLoading ? (
              <div className="flex items-center justify-center w-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : folders.length > 0 ? (
              folders.map((collection) => (
                <div 
                  key={collection.folder_id} 
                  onClick={() => router.push(`/saved/${collection.folder_id}`)}
                  className="flex flex-row items-center py-2 gap-4 w-[240px] cursor-pointer hover:bg-gray-50 rounded-lg px-2 -ml-2 transition-colors"
                >
                  {/* Image or Folder Placeholder */}
                  {collection.cover_image ? (
                    <img src={collection.cover_image} alt={collection.name} className="w-[40px] h-[40px] rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="flex items-center justify-center w-[40px] h-[40px] rounded-full bg-gray-100 flex-shrink-0">
                      <Folder className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                    </div>
                  )}
                  
                  {/* Details */}
                  <div className="flex flex-col justify-center gap-1">
                    <span className="text-[16px] font-normal text-black leading-[24px]">{collection.name}</span>
                    <span className="text-[12px] font-normal text-[#6B7280] leading-[16px]">Posts - {collection.post_count || 0}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[14px] text-gray-500 py-4 italic">No custom collections yet</div>
            )}
          </div>
          
        </div>

        {/* Modals */}
        <CreateFolderModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleFolderCreated}
        />

      </div>
    </div>
  );
}
