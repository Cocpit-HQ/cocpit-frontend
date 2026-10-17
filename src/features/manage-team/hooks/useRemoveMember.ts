// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import { toast } from 'sonner';
// import * as teamService from '../services/team.service';
// import { useActiveProfile } from '@/context/ActiveProfileContext';
// 
// export const useRemoveMember = () => {
//   const queryClient = useQueryClient();
//   const { activeProfile } = useActiveProfile();
// 
//   return useMutation({
//     mutationFn: (userId: string) => {
//       const orgId = activeProfile?.id;
//       if (!orgId) throw new Error('No active organization');
//       return teamService.removeMember(orgId, userId);
//     },
//     onSuccess: () => {
//       toast.success('Member removed.');
//       queryClient.invalidateQueries({ queryKey: ['team'] });
//     },
//     onError: () => {
//       toast.error('Failed to remove member.');
//     },
//   });
// };
