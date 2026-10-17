// 'use client';
// 
// import React, { useState, useCallback } from 'react';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { Icon } from '@iconify/react';
// import { Loader2 } from 'lucide-react';
// import { useRoleDetails } from '../hooks/useRoleDetails';
// import { useActivityLogs } from '../hooks/useActivityLogs';
// import { useRemoveMember } from '../hooks/useRemoveMember';
// import { useInviteMember } from '../hooks/useInviteMember';
// import { useUpdateRole } from '../hooks/useUpdateRole';
// import { useDeleteRole } from '../hooks/useDeleteRole';
// import { useWithdrawInvite } from '../hooks/useWithdrawInvite';
// import { TeamMember, ActivityLogFilters, UpdateRoleInput, PendingInvitation, PERMISSION_LABELS, getPermissionLabel } from '../types/team.types';
// import { useDebounce } from '@/hooks/use-debounce';
// import MemberList from '../components/members/MemberList';
// import InviteMemberModal from '../components/members/InviteMemberModal';
// import RemoveMemberConfirm from '../components/members/RemoveMemberConfirm';
// import WithdrawInviteConfirm from '../components/members/WithdrawInviteConfirm';
// import ActivityLogTable from '../components/activity/ActivityLogTable';
// import ActivityLogFiltersBar from '../components/activity/ActivityLogFilters';
// import EditRoleModal from '../components/roles/EditRoleModal';
// import DeleteRoleConfirm from '../components/roles/DeleteRoleConfirm';
// import { useActiveProfile } from '@/context/ActiveProfileContext';
// import { useCompanyPermissions } from '@/features/companyprofile/hooks/useCompanyPermissions';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// 
// interface RoleDetailsPageProps {
//   roleId: string;
// }
// 
// export default function RoleDetailsPage({ roleId }: RoleDetailsPageProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const { activeProfile } = useActiveProfile();
//   const perms = useCompanyPermissions(activeProfile);
//   const hasActivityPermission = perms.checkPermission('ACTIVITY_LOGS');
// 
//   const { role, isLoading } = useRoleDetails(roleId);
//   const removeMember = useRemoveMember();
//   const inviteMember = useInviteMember();
//   const updateRole = useUpdateRole();
//   const deleteRole = useDeleteRole();
//   const withdrawInvite = useWithdrawInvite();
// 
//   // Read initial sub-tab from the URL so a refresh (or a shared link) lands
//   // back on Activity logs instead of resetting to Members.
//   const urlTab = searchParams?.get('tab');
//   const [activeTab, setActiveTabLocal] = useState<'members' | 'activity'>(
//     urlTab === 'activity' ? 'activity' : 'members'
//   );
// 
//   // Wrap setActiveTab to also persist the selected sub-tab in the URL, same
//   // pattern as jobs/MyListingsDashboard's subtab/filter query params.
//   const setActiveTab = useCallback((tab: 'members' | 'activity') => {
//     setActiveTabLocal(tab);
//     const params = new URLSearchParams(window.location.search);
//     if (tab === 'members') {
//       params.delete('tab');
//     } else {
//       params.set('tab', tab);
//     }
//     const query = params.toString();
//     router.replace(`${window.location.pathname}${query ? `?${query}` : ''}`);
//   }, [router]);
//   const [isInviteOpen, setIsInviteOpen] = useState(false);
//   const [withdrawTargetId, setWithdrawTargetId] = useState<string | null>(null);
//   const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
//   const [isEditOpen, setIsEditOpen] = useState(false);
//   const [isDeleteOpen, setIsDeleteOpen] = useState(false);
// 
//   // Activity log filters for this role
//   const [logFilters, setLogFilters] = useState<ActivityLogFilters>({
//     search: '',
//     roleId: roleId,
//     memberId: 'all',
//     dateRange: 'last_7_days',
//   });
//   // Debounce free-text search before it hits the query key, same as TeamActivityLogPage
//   const debouncedSearch = useDebounce(logFilters.search, 300);
//   const effectiveSearch = debouncedSearch.trim().length >= 3 ? debouncedSearch.trim() : '';
//   const queryLogFilters: ActivityLogFilters = { ...logFilters, search: effectiveSearch };
// 
//   const { logs, isLoading: logsLoading, isFetchingMore: logsFetchingMore, hasMore: logsHasMore, loadMore: loadMoreLogs } = useActivityLogs(queryLogFilters);
// 
//   if (isLoading) {
//     return (
//       <div className="w-full flex items-center justify-center py-24">
//         <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-accent)]" />
//       </div>
//     );
//   }
// 
//   if (!role) {
//     return (
//       <div className="w-full flex flex-col items-center justify-center py-16 gap-4">
//         <p className="ds-text-body text-ds-text-muted">Role not found.</p>
//         <button
//           onClick={() => router.push('/team')}
//           className="text-[var(--ds-accent)] ds-text-secondary-1 hover:underline"
//         >
//           ← Back to team
//         </button>
//       </div>
//     );
//   }
// 
//   const handleRemove = () => {
//     if (!removeTarget) return;
//     removeMember.mutate(removeTarget.id, {
//       onSuccess: () => setRemoveTarget(null),
//     });
//   };
// 
//   const handleWithdraw = () => {
//     if (!withdrawTargetId) return;
//     withdrawInvite.mutate(withdrawTargetId, {
//       onSuccess: () => setWithdrawTargetId(null),
//     });
//   };
// 
//   const handleUpdate = (input: UpdateRoleInput) => {
//     if (!role) return;
//     updateRole.mutate(
//       { roleId: role.id, input },
//       { onSuccess: () => setIsEditOpen(false) }
//     );
//   };
// 
//   const handleDelete = () => {
//     if (!role) return;
//     deleteRole.mutate(role.id, {
//       onSuccess: () => {
//         setIsDeleteOpen(false);
//         router.push('/team');
//       },
//     });
//   };
// 
//   const isAdminRole = role.name.toLowerCase() === 'admin' || role.name.toLowerCase() === 'administrator';
// 
//   return (
//     <div className="w-full max-w-[1200px] mx-auto min-h-screen bg-ds-bg pt-4 md:pt-6 pb-8 px-4 lg:px-10">
//       <div className="w-full mx-auto flex flex-col gap-5">
//         {/* Back */}
//         <div className="flex items-center mb-1">
//           <button
//             onClick={() => router.push('/team')}
//             className="flex items-center ds-text-secondary text-ds-text-muted hover:text-ds-text-primary transition-colors"
//           >
//             <Icon icon="lucide:chevron-left" className="ds-icon-16 mr-2" />
//             Back
//           </button>
//         </div>
// 
//         <h2 className="ds-text-body-2 text-ds-text-primary mb-4">
//           Role details
//         </h2>
// 
//         {/* Role header */}
//         <div className="flex flex-col gap-4">
//           <div className="flex items-center justify-between w-full">
//             <div className="flex items-center gap-2">
//               <div
//                 className="w-3 h-3 rounded-full"
//                 style={{ backgroundColor: role.color }}
//               />
//               <h1 className="ds-text-body-2 text-ds-text-primary flex items-center">
//                 {role.name}
//               </h1>
//             </div>
//             {!role.isSystemRole && (
//               <div className="flex items-center gap-4">
//                 <button
//                   onClick={() => setIsEditOpen(true)}
//                   className="relative hover:opacity-80 flex items-center justify-center text-ds-text-muted hover:text-ds-text-primary transition-colors"
//                   title="Edit role"
//                 >
//                   <Icon icon="lucide:edit-2" className="ds-icon-16" />
//                 </button>
//                 <button
//                   onClick={() => setIsDeleteOpen(true)}
//                   className="relative hover:opacity-80 flex items-center justify-center text-ds-text-muted hover:text-[var(--ds-error)] transition-colors"
//                   title="Delete role"
//                 >
//                   <Icon icon="lucide:trash-2" className="ds-icon-16" />
//                 </button>
//               </div>
//             )}
//           </div>
//           
//           <div className="flex w-full">
//             <div className="w-[2px] min-h-[32px] rounded-full mr-3 shrink-0" style={{ backgroundColor: role.color }} />
//             <p className="ds-text-secondary text-ds-text-secondary">
//               {role.description || (isAdminRole ? 'Administrator Has full access to all modules and features of the application. Administrators can view, manage, create, edit, and delete any data, as well as configure settings and oversee all system activities' : 'No description provided.')}
//             </p>
//           </div>
//         </div>
// 
//         {/* Sub-tabs: Members | Activity Log */}
//         <div className="flex gap-6 mt-8 border-b border-ds-border">
//           <button
//             onClick={() => setActiveTab('members')}
//             className={`pb-3 ds-text-secondary-1 transition-colors border-b-2 ${
//               activeTab === 'members'
//                 ? 'border-[var(--ds-accent)] text-ds-text-primary'
//                 : 'border-transparent text-ds-text-muted hover:text-ds-text-secondary'
//             }`}
//           >
//             Members
//           </button>
//           {hasActivityPermission ? (
//             <button
//               onClick={() => setActiveTab('activity')}
//               className={`pb-3 ds-text-secondary-1 transition-colors border-b-2 ${
//                 activeTab === 'activity'
//                   ? 'border-[var(--ds-accent)] text-ds-text-primary'
//                   : 'border-transparent text-ds-text-muted hover:text-ds-text-secondary'
//               }`}
//             >
//               Team Activity
//             </button>
//           ) : (
//             <TooltipProvider delayDuration={0}>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <div className="!cursor-not-allowed">
//                     <button
//                       disabled
//                       className="pb-3 ds-text-secondary-1 border-b-2 border-transparent text-ds-text-muted opacity-50 !cursor-not-allowed bg-transparent"
//                     >
//                       Team Activity
//                     </button>
//                   </div>
//                 </TooltipTrigger>
//                 <TooltipContent side="top" className="bg-ds-surface-2 text-ds-text-primary border-ds-border">
//                   <p>You don't have permission to access this</p>
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>
//           )}
//         </div>
// 
//         {/* Tab content */}
//         {activeTab === 'members' ? (
//           <div className="flex flex-col gap-4 mt-2">
//             <MemberList
//               members={role.members.filter(m => m.status === 'ACTIVE')}
//               pendingInvites={role.members.filter(m => m.status === 'PENDING_INVITE').map(m => ({
//                 id: m.inviteId || '',
//                 userId: m.id,
//                 name: m.name,
//                 avatarUrl: m.avatarUrl,
//                 email: m.email,
//                 headline: m.headline,
//                 roleId: role.id,
//                 roleName: role.name,
//                 roleColor: role.color,
//                 invitedAt: m.joinedAt
//               } as PendingInvitation))}
//               onRemoveMember={(member) => setRemoveTarget(member)}
//               onInviteClick={() => setIsInviteOpen(true)}
//               onWithdrawInvitation={(inviteId) => setWithdrawTargetId(inviteId)}
//             />
//           </div>
//         ) : (
//           <div className="flex flex-col gap-4">
//             <ActivityLogFiltersBar
//               filters={logFilters}
//               onFiltersChange={setLogFilters}
//               memberOptions={role.members.filter(m => m.status === 'ACTIVE').map((m) => ({
//                 value: m.id,
//                 label: m.name,
//               }))}
//               hideRoleDropdown={true}
//             />
//             <ActivityLogTable
//               logs={logs}
//               isLoading={logsLoading}
//               hasMore={logsHasMore}
//               isFetchingMore={logsFetchingMore}
//               loadMore={loadMoreLogs}
//             />
//           </div>
//         )}
// 
//         {/* Modals */}
//         <InviteMemberModal
//           isOpen={isInviteOpen}
//           onClose={() => setIsInviteOpen(false)}
//           onInvite={(userId) => {
//             inviteMember.mutate({ userId, roleId: role.id });
//           }}
//         />
// 
//         <RemoveMemberConfirm
//           isOpen={!!removeTarget}
//           memberName={removeTarget?.name}
//           onConfirm={handleRemove}
//           onCancel={() => setRemoveTarget(null)}
//         />
// 
//         <WithdrawInviteConfirm
//           isOpen={!!withdrawTargetId}
//           onConfirm={handleWithdraw}
//           onCancel={() => setWithdrawTargetId(null)}
//         />
// 
//         <EditRoleModal
//           isOpen={isEditOpen}
//           role={role}
//           isSubmitting={updateRole.isPending}
//           onClose={() => setIsEditOpen(false)}
//           onSubmit={handleUpdate}
//         />
// 
//         <DeleteRoleConfirm
//           isOpen={isDeleteOpen}
//           roleName={role?.name}
//           onConfirm={handleDelete}
//           onCancel={() => setIsDeleteOpen(false)}
//         />
//       </div>
//     </div>
//   );
// }
