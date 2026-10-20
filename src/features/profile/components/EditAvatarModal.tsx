import React from "react";
import { CocpitUserProfileImageEditor } from "@/shared/commonComponents/CocpitUserProfileImageEditor";

export interface EditAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string | null;
  onUpload: (file: File) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  initialFile?: File | null;
  portalContainerId?: string;
  theme?: "dark" | "light";
}

export function EditAvatarModal({
  isOpen,
  onClose,
  currentAvatarUrl,
  onUpload,
  onDelete,
  initialFile,
  theme,
}: EditAvatarModalProps) {
  return (
    <CocpitUserProfileImageEditor
      isOpen={isOpen}
      onClose={onClose}
      initialImage={currentAvatarUrl}
      initialFile={initialFile}
      hideRemoveButton={false}
      onRemove={onDelete}
      onSave={async (_dataUrl, file) => {
        if (file) {
          await onUpload(file);
        } else if (currentAvatarUrl) {
          await onDelete();
        } else {
          onClose();
        }
      }}
      theme={theme as "dark" | "light" | undefined}
    />
  );
}

export default EditAvatarModal;
