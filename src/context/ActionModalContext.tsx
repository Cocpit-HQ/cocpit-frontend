"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import PostWithOptions from '@/components/home/PostWithOptions';
import CreatePostModal from '@/components/home/CreatePostModal';

interface ActionModalContextType {
  toggleOptions: () => void;
  openModal: () => void;
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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleOptions = () => setIsOptionsOpen(prev => !prev);
  const closeOptions = () => setIsOptionsOpen(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleOptionClick = (option: string) => {
    closeOptions();
    if (option === 'photo') {
      openModal();
    }
    // Handle other options like 'video' or 'poll' here
  };

  return (
    <ActionModalContext.Provider value={{ toggleOptions, openModal }}>
      {children}
      
      {isOptionsOpen && (
        <PostWithOptions
          onClose={closeOptions}
          onOptionClick={handleOptionClick}
        />
      )}
      
      <CreatePostModal isOpen={isModalOpen} onClose={closeModal} />
    </ActionModalContext.Provider>
  );
};
