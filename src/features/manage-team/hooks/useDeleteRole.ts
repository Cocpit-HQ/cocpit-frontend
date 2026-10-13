// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import * as teamService from '../services/team.service';
// import { useActiveProfile } from '@/context/ActiveProfileContext';
// 
// export const useDeleteRole = () => {
//   const queryClient = useQueryClient();
//   const { activeProfile } = useActiveProfile();
// 
//   return useMutation({
//     mutationFn: (roleId: string) => {
//       const orgId = activeProfile?.id;
//       if (!orgId) throw new Error('No active organization');
//       return teamService.deleteRole(orgId, roleId);
//     },
//     onSuccess: () => {
//       toast.success('Role deleted successfully!');
//       queryClient.invalidateQueries({ queryKey: ['team', 'roles'] });
//     },
//     onError: () => {
//       toast.error('Failed to delete role.');
//     },
//   });
// };
