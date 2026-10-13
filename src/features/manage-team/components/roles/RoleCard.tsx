// 'use client';
// 
// import React from 'react';
// import { Icon } from '@iconify/react';
// import { TeamRole, TeamPermission, PERMISSION_LABELS, getPermissionLabel } from '../../types/team.types';
// 
// interface RoleCardProps {
//   role: TeamRole;
//   onClick: () => void;
//   onEdit: () => void;
//   onDelete: () => void;
//   onInvite: () => void;
// }
// 
// export default function RoleCard({ role, onClick, onEdit, onDelete, onInvite }: RoleCardProps) {
//   const formatPermissions = (perms: TeamPermission[]) => {
//     if (!perms || perms.length === 0) return 'No permissions';
//     const mapped = perms.map(p => getPermissionLabel(p));
//     const shouldTruncate = mapped.length > 3;
//     const displayPerms = shouldTruncate ? mapped.slice(0, 3) : mapped;
//     const str = displayPerms.join(', ') + (shouldTruncate ? '...' : '');
//     return str.charAt(0).toUpperCase() + str.slice(1);
//   };
// 
//   return (
//     <div
//       onClick={onClick}
//       className="self-stretch h-[60px] px-4 inline-flex justify-between items-center transition-colors cursor-pointer rounded-xl hover:bg-company-ultra-light"
//     >
//       <div className="flex-1 min-w-0 self-stretch flex justify-start items-center gap-2">
//         <div
//           className="w-6 h-6 rounded-full flex-shrink-0"
//           style={{ backgroundColor: role.color }}
//         />
//         <div className="justify-center text-company-text text-base font-medium font-['Poppins'] leading-6 truncate">
//           {role.name}
//         </div>
//       </div>
// 
//       <div className="flex-1 self-stretch inline-flex flex-col justify-center items-start gap-2">
//         <div className="self-stretch h-8 inline-flex justify-start items-center gap-2">
//           <div className="w-[100px] justify-start text-company-secondary text-base font-normal font-['Poppins'] leading-[16px]">
//             {role.memberCount} Member{role.memberCount !== 1 ? 's' : ''}
//           </div>
//           <div className="flex justify-start items-center -space-x-2">
//             {role.members.slice(0, 3).map((member) => (
//               <img
//                 key={member.id}
//                 src={member.avatarUrl || '/images/Team/profile_team.png'}
//                 alt={member.name}
//                 className="w-6 h-6 rounded-full border border-company-card object-cover"
//                 onError={(e) => {
//                   (e.target as HTMLImageElement).src = '/images/Team/profile_team.png';
//                 }}
//               />
//             ))}
//             {role.memberCount > 3 && (
//               <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 border border-company-card flex items-center justify-center z-10">
//                 <span className="text-[9px] text-gray-600 dark:text-gray-300 font-medium">
//                   +{role.memberCount - 3}
//                 </span>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
// 
//       <div className="flex-1 self-stretch inline-flex flex-col justify-center items-start gap-2">
//         <div className="w-[120px] justify-center text-company-secondary text-[14px] font-normal font-['Poppins'] leading-[26px] truncate">
//           {role.name === 'Admin' ? 'All permissions' : formatPermissions(role.permissions)}
//         </div>
//       </div>
// 
//       <div className="w-[120px] h-full relative inline-flex justify-end items-center pr-2">
//         {role.name === 'Admin' ? (
//           <div className="flex items-center justify-end w-full">
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onInvite();
//               }}
//               className="flex items-center justify-center p-1.5 text-company-text hover:text-company-primary"
//             >
//               <Icon icon="lucide:plus" className="w-5 h-5" />
//             </button>
//           </div>
//         ) : (
//           <div className="flex items-center justify-end gap-3 w-full">
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onInvite();
//               }}
//               className="p-1.5 text-company-text hover:text-company-primary"
//             >
//               <Icon icon="lucide:plus" className="w-5 h-5" />
//             </button>
//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 onEdit();
//               }}
//               className="p-1.5 text-company-secondary hover:text-company-primary"
//               title="Edit role"
//             >
//               <Icon icon="proicons:pencil" className="w-5 h-5" />
//             </button>
//             {!role.isSystemRole && (
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onDelete();
//                 }}
//                 className="p-1.5 text-[#EF4444] dark:text-[#F87171] hover:text-red-600 dark:hover:text-red-400"
//                 title="Delete role"
//               >
//                 <Icon icon="lucide:trash-2" className="w-5 h-5" />
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
