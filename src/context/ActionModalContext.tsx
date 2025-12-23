"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CreatePostModal } from '@/components/home/CreatePostModal';
import MobileCreateMenu from '@/components/home/MobileCreateMenu';

type PostType = 'text' | 'photo' | 'video' | 'poll';

interface ActionModalContextType {
  toggleOptions: () => void;
  openModal: (type?: PostType) => void;
}

const ActionModalContext = createContext<ActionModalContextType | undefined>(undefined);

export const useActionModal = () => {
  const context = useContext(ActionModalContext);
  if (!context) {
    throw new Error('useActionModal must be used within an ActionModalProvider');
  }
  return context;
};

interface ActionModalProviderProps {
  children: ReactNode;
}

export const ActionModalProvider = ({ children }: ActionModalProviderProps) => {
  // isOptionsOpen now controls the MobileCreateMenu (Drawer)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialPostType, setInitialPostType] = useState<PostType>('text');

  const toggleOptions = () => setIsOptionsOpen(prev => !prev);
  const closeOptions = () => setIsOptionsOpen(false);

  const openModal = (type: PostType = 'text') => {
    setInitialPostType(type);
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <ActionModalContext.Provider value={{ toggleOptions, openModal }}>
      {children}
      
      {/* Replaced PostWithOptions with MobileCreateMenu */}
      <MobileCreateMenu
        open={isOptionsOpen}
        onOpenChange={setIsOptionsOpen}
        onOptionClick={(type) => {
          closeOptions();
          openModal(type);
        }}
      />
      
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={closeModal}
        initialPostType={initialPostType}
      />
    </ActionModalContext.Provider>
  );
};
