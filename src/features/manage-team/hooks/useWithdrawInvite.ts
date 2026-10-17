// import { useMutation, useQueryClient } from '@tanstack/react-query';
// import * as teamService from '../services/team.service';
// import { useActiveProfile } from '@/context/ActiveProfileContext';
// import { toast } from 'sonner';
// 
// export const useWithdrawInvite = () => {
//   const { activeProfile } = useActiveProfile();
//   const orgId = activeProfile?.id;
//   const queryClient = useQueryClient();
// 
//   return useMutation({
//     mutationFn: (inviteId: string) => teamService.withdrawInvite(orgId!, inviteId),
//     onSuccess: () => {
//       toast.success('Invitation withdrawn');
//       queryClient.invalidateQueries({ queryKey: ['team'] });
//     },
//     onError: () => {
//       toast.error('Failed to withdraw invitation');
//     },
//   });
// };
