// [CLEANUP:DEAD_FILE] Legacy component is orphaned and unused.
// "use client";
// 
// import React from "react";
// import { Megaphone } from "lucide-react";
// 
// interface BroadcastBannerProps {
//   orgName: string;
// }
// 
// /**
//  * BroadcastBanner
//  * Displayed above post content for posts with is_broadcast = true.
//  * Signals that this is an official announcement from a parent organization
//  * sent to all members of its sub-organizations.
//  */
// export function BroadcastBanner({ orgName }: BroadcastBannerProps) {
//   return (
//     <div className="flex items-center gap-2 px-4 pt-3 pb-1">
//       <span
//         className="
//           inline-flex items-center gap-1.5
//           text-xs font-semibold
//           bg-amber-50 dark:bg-amber-950/30
//           text-amber-700 dark:text-amber-400
//           border border-amber-200 dark:border-amber-800
//           px-2.5 py-1 rounded-full
//           select-none
//         "
//       >
//         <Megaphone className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
//         Official Announcement from{" "}
//         <span className="font-bold">{orgName}</span>
//       </span>
//     </div>
//   );
// }
// 