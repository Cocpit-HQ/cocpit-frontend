// import { useQuery } from '@tanstack/react-query';
// import * as teamService from '../services/team.service';
// import { useActiveProfile } from '@/context/ActiveProfileContext';
// 
// export const useTeamMembers = () => {
//   const { activeProfile } = useActiveProfile();
//   const orgId = activeProfile?.id;
// 
//   const { data, isLoading, refetch } = useQuery({
//     queryKey: ['team', 'members', orgId],
//     queryFn: () => teamService.getTeamMembers(orgId!),
//     staleTime: 5 * 60 * 1000,
//     refetchOnMount: true,
//     refetchOnWindowFocus: false,
//     enabled: !!orgId,
//   });
// 
//   return {
//     members: data ?? [],
//     isLoading,
//     refetch,
//   };
// };
