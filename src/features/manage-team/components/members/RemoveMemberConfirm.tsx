// 'use client';
// 
// import React from 'react';
// import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';
// 
// interface RemoveMemberConfirmProps {
//   isOpen: boolean;
//   memberName?: string;
//   onConfirm: () => void;
//   onCancel: () => void;
// }
// 
// export default function RemoveMemberConfirm({
//   isOpen,
//   memberName,
//   onConfirm,
//   onCancel,
// }: RemoveMemberConfirmProps) {
//   return (
//     <CocpitConfirmBox
//       isOpen={isOpen}
//       title="Remove this member?"
//       message={`Are you sure you want to remove${memberName ? ` ${memberName}` : ' this member'}? They will lose all role permissions and access.`}
//       confirmText="Remove"
//       cancelText="Cancel"
//       onConfirm={onConfirm}
//       onCancel={onCancel}
//     />
//   );
// }
