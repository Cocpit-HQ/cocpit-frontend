// 'use client';
// 
// import React from 'react';
// import { TeamRole } from '../../types/team.types';
// import RoleCard from './RoleCard';
// 
// interface RoleListProps {
//   roles: TeamRole[];
//   onRoleClick: (role: TeamRole) => void;
//   onEditRole: (role: TeamRole) => void;
//   onDeleteRole: (role: TeamRole) => void;
//   onInviteRole: (role: TeamRole) => void;
// }
// 
// export default function RoleList({
//   roles,
//   onRoleClick,
//   onEditRole,
//   onDeleteRole,
//   onInviteRole,
// }: RoleListProps) {
//   return (
//     <div className="w-full flex flex-col">
//       <div className="flex flex-col gap-2">
//         {roles.map((role) => (
//           <RoleCard
//             key={role.id}
//             role={role}
//             onClick={() => onRoleClick(role)}
//             onEdit={() => onEditRole(role)}
//             onDelete={() => onDeleteRole(role)}
//             onInvite={() => onInviteRole(role)}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }
