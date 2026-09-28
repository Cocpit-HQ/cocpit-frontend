// [CLEANUP:DEAD_FILE] Legacy component is orphaned and unused.
// "use client";
// 
// import Link from "next/link";
// import { Bookmark, BriefcaseBusiness, Flame, Plus } from "lucide-react";
// import { Icon } from "@iconify/react";
// 
// const jobMatches = [
//   {
//     id: "google-swe",
//     title: "Software Engineer Intern @ Google",
//     meta: "Remote • Fresher",
//   },
//   {
//     id: "startup-uiux",
//     title: "UI/UX Designer @ Startup",
//     meta: "Hybrid • Pune",
//   },
// ];
// 
// export function ApplicantInsightCard() {
//   return (
//     <div className="flex flex-col w-full max-w-[560px]">
//       <div className="w-full border-t border-[#EEF2FF]" />
//       <section className="feed-card-shell flex items-center justify-between gap-4 w-full py-4 px-4 md:px-0">
//         <div className="flex min-w-0 items-center gap-3">
//           <div className="flex shrink-0 items-center justify-center text-[24px]">
//             <Icon icon="emojione:fire" />
//           </div>
//           <div className="min-w-0">
//             <h2 className="truncate text-sm font-medium text-foreground">
//               You&apos;re in top 20% of applicants in UI/UX
//             </h2>
//             <p className="mt-0.5 truncate text-xs text-muted-foreground">
//               Add missing skills (Figma, Design Systems)
//             </p>
//           </div>
//         </div>
//         <Link
//           href="/profile/edit"
//           className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
//         >
//           <Plus className="h-3.5 w-3.5" aria-hidden="true" />
//           Add skills
//         </Link>
//       </section>
//       <div className="w-full border-t border-[#EEF2FF]" />
//     </div>
//   );
// }
// 
// export function JobMatchesCard() {
//   return (
//     <div className="flex flex-col w-full max-w-[560px]">
//       <div className="w-full border-t border-[#EEF2FF]" />
//       <section className="feed-card-shell flex flex-col gap-4 w-full py-4 px-4 md:px-0">
//         <div className="flex flex-col">
//           <h2 className="text-[16px] font-medium leading-[24px] text-foreground font-['Poppins']">Best Matches for You Today</h2>
//           <p className="mt-1 text-[12px] leading-[18px] text-muted-foreground font-normal font-['Poppins']">Based on your profile & activity</p>
//         </div>
// 
//         <div className="flex flex-col gap-3">
//           {jobMatches.map((job) => (
//             <Link
//               key={job.id}
//               href="/jobs"
//               className="flex items-center justify-between gap-[10px] p-[16px] border border-[#EEF2FF] rounded-[24px] shadow-[0px_2px_4px_0px_rgba(99,102,241,0.05)] bg-[#FFFFFF] transition-colors hover:bg-muted/30"
//             >
//               <div className="min-w-0 flex flex-col gap-[8px]">
//                 <h3 className="truncate text-[16px] font-normal leading-[24px] text-[#000000] font-['Poppins']">{job.title}</h3>
//                 <p className="truncate text-[12px] leading-[16px] text-[#6B7280] font-normal font-['Poppins']">{job.meta}</p>
//               </div>
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 width="24"
//                 height="24"
//                 viewBox="0 0 24 24"
//                 className="h-6 w-6 shrink-0 text-[#000000]"
//                 aria-hidden="true"
//               >
//                 <path fill="currentColor" d="M9 5.25a.75.75 0 0 0 0 1.5h6a.75.75 0 0 0 0-1.5z"/>
//                 <path 
//                     fill="currentColor" 
//                     fillRule="evenodd" 
//                     d="M11.943 1.25c-2.073 0-3.706 0-4.982.173c-1.31.178-2.355.552-3.176 1.382c-.82.829-1.188 1.882-1.364 3.202c-.171 1.289-.171 2.938-.171 5.034v5.098c0 1.508 0 2.701.096 3.6c.095.888.298 1.689.88 2.225c.466.43 1.056.7 1.686.773c.787.09 1.522-.286 2.247-.8c.733-.518 1.622-1.305 2.744-2.297l.036-.032c.52-.46.872-.77 1.166-.986c.284-.207.457-.282.603-.312a1.5 1.5 0 0 1 .584 0c.146.03.32.105.603.312c.294.215.646.526 1.166.986l.037.032c1.121.992 2.01 1.779 2.743 2.298c.725.513 1.46.889 2.247.799a3 3 0 0 0 1.686-.773c.581-.536.785-1.337.88-2.225c.096-.899.096-2.092.096-3.6v-5.098c0-2.096 0-3.746-.171-5.034c-.171-1.32-.544-2.373-1.364-3.202c-.821-.83-1.866-1.204-3.176-1.382c-1.276-.173-2.909-.173-4.982-.173zM4.85 3.86c.497-.502 1.172-.795 2.312-.95c1.163-.158 2.694-.16 4.837-.16s3.674.002 4.837.16c1.14.155 1.815.448 2.312.95c.498.503.789 1.188.943 2.345c.156 1.178.158 2.727.158 4.893v4.993c0 1.566-.001 2.68-.087 3.488c-.09.83-.253 1.141-.405 1.282c-.234.215-.528.35-.84.385c-.2.023-.534-.054-1.21-.532c-.658-.467-1.487-1.198-2.653-2.23l-.026-.023c-.488-.431-.892-.788-1.249-1.05c-.373-.272-.749-.482-1.192-.571a3 3 0 0 0-1.176 0c-.443.09-.82.299-1.192.572c-.357.26-.761.618-1.249 1.049l-.026.023c-1.166 1.032-1.995 1.763-2.653 2.23c-.676.478-1.01.555-1.21.532a1.5 1.5 0 0 1-.84-.385c-.152-.141-.316-.452-.404-1.282c-.087-.809-.088-1.922-.088-3.488v-4.994c0-2.165.002-3.714.158-4.892c.154-1.157.445-1.842.943-2.345" 
//                     clipRule="evenodd"
//                 />
//               </svg>
//             </Link>
//           ))}
//         </div>
// 
//         <Link
//           href="/jobs"
//           className="block mt-1 text-center text-[14px] font-medium text-[#6366F1] hover:underline font-['Poppins']"
//         >
//           View more
//         </Link>
//       </section>
//       <div className="w-full border-t border-[#EEF2FF]" />
//     </div>
//   );
// }
// 
// export function CompactJobRecommendation() {
//   return (
//     <div className="flex flex-col w-full max-w-[560px]">
//       <div className="w-full border-t border-[#EEF2FF]" />
//       <section className="feed-card-shell flex items-center justify-between gap-3 w-full py-4 px-4 md:px-0">
//       <div className="flex min-w-0 items-center gap-3">
//         <div className="flex h-12 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary">
//           <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
//         </div>
//         <div className="min-w-0">
//           <h2 className="truncate text-sm font-medium text-foreground">UI/UX Designer @ Startup</h2>
//           <p className="mt-1 truncate text-xs text-muted-foreground">Hybrid - Pune</p>
//         </div>
//       </div>
//       </section>
//       <div className="w-full h-px bg-[#EEF2FF]" />
//     </div>
//   );
// }
// 