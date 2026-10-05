"use client";

import React from 'react';
import { X } from 'lucide-react';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ModalWrapper({ isOpen, onClose, title, children }: ModalWrapperProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-ds-surface-2 border border-ds-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <div className="flex items-center justify-between p-6 pb-2">
          <h2 className="ds-text-body-2 text-lg font-semibold text-ds-text-primary text-center w-full">{title}</h2>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-ds-text-secondary hover:text-ds-text-primary hover:bg-ds-surface-1 rounded-full transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 pt-3">
          {children}
        </div>
      </div>
    </div>
  );
}
