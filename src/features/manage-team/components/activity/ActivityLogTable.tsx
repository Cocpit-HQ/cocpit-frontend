// 'use client';
// 
// import React, { useEffect } from 'react';
// import { Icon } from '@iconify/react';
// import { ActivityLogEntry } from '../../types/team.types';
// import ActivityLogRow from './ActivityLogRow';
// import ActivityLogEmptyState from './ActivityLogEmptyState';
// import { useInView } from '@/hooks/use-in-view';
// 
// interface ActivityLogTableProps {
//   logs: ActivityLogEntry[];
//   isLoading?: boolean;
//   hasMore?: boolean;
//   isFetchingMore?: boolean;
//   loadMore?: () => void;
// }
// 
// export default function ActivityLogTable({
//   logs,
//   isLoading,
//   hasMore = false,
//   isFetchingMore = false,
//   loadMore,
// }: ActivityLogTableProps) {
//   const { ref: loadMoreRef, inView } = useInView({
//     threshold: 0,
//     rootMargin: '100px',
//   });
// 
//   useEffect(() => {
//     if (inView && hasMore && !isFetchingMore && loadMore) {
//       loadMore();
//     }
//   }, [inView, hasMore, isFetchingMore, loadMore]);
// 
//   if (isLoading) {
//     return (
//       <div className="w-full flex items-center justify-center py-12">
//         <div className="w-5 h-5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }
// 
//   if (logs.length === 0) {
//     return <ActivityLogEmptyState />;
//   }
// 
//   return (
//     <div className="w-full flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
//       {logs.map((entry) => (
//         <ActivityLogRow key={entry.id} entry={entry} />
//       ))}
// 
//       {hasMore && (
//         <div ref={loadMoreRef} className="w-full py-4 flex justify-center items-center flex-shrink-0">
//           {isFetchingMore && (
//             <div className="flex items-center gap-2 text-[#1A73E8] font-medium text-xs font-['Poppins']">
//               <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin text-[#1A73E8]" />
//               <span>Loading more...</span>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }
