'use client';

import React from 'react';
import { ActionConfirmModal, ConfirmPresetType } from './ActionConfirmModal';

export interface CocpitConfirmBoxProps {
  isOpen: any;
  type?: ConfirmPresetType;
  targetName?: string;
  title?: React.ReactNode;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  buttonWidthClass?: string;
  modalClassName?: string;
  buttonsClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export const CocpitConfirmBox: React.FC<CocpitConfirmBoxProps> = ({
  isOpen,
  type = "custom",
  targetName,
  title,
  message,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  buttonWidthClass,
  modalClassName,
  buttonsClassName,
  titleClassName,
  descriptionClassName,
}) => {
  return (
    <ActionConfirmModal
      isOpen={Boolean(isOpen)}
      type={type}
      targetName={targetName}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={title}
      description={message}
      confirmText={confirmText}
      cancelText={cancelText}
      isLoading={isLoading}
      buttonWidthClass={buttonWidthClass}
      modalClassName={modalClassName}
      buttonsClassName={buttonsClassName}
      titleClassName={titleClassName}
      descriptionClassName={descriptionClassName}
    />
  );
};

export default CocpitConfirmBox;
