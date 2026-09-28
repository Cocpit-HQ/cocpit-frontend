// [CLEANUP:DEAD_FILE] Legacy connection/business component is orphaned and unused.
// "use client"
// 
// import React from 'react'
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// 
// interface LeadItem {
//   id: string
//   name: string
//   subtitle: string
//   reasoning: string
//   score: number
//   imageUrl?: string
// }
// 
// const leads: LeadItem[] = [
//   {
//     id: '1',
//     name: 'Nexus Systems',
//     subtitle: 'Cloud Infrastructure',
//     reasoning: 'Recently expanded to your region...',
//     score: 85
//   },
//   {
//     id: '2',
//     name: 'Marcus Chen',
//     subtitle: 'Product Design lead',
//     reasoning: 'Frequent interaction with your design...',
//     score: 78
//   }
// ]
// 
// export function LeadsTable() {
//   return (
//     <div className="p-10 rounded-[32px] bg-[#0a0f1d]/40 border border-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
//       <div className="grid grid-cols-[0.8fr_1.5fr_1fr] gap-10 items-center mb-8 px-4 font-black text-[11px] text-slate-500 uppercase tracking-[0.2em] opacity-60">
//         <span>Entity</span>
//         <span>Match Reasoning</span>
//         <span className="text-right">Match Score</span>
//       </div>
// 
//       <div className="space-y-4">
//         {leads.map((lead) => (
//           <div key={lead.id} className="grid grid-cols-[0.8fr_1.5fr_1fr] gap-10 items-center p-6 rounded-3xl bg-white/5 border border-white/5 transition-all hover:bg-white/10 hover:border-white/10 group cursor-pointer duration-500">
//             <div className="flex items-center gap-4">
//               <Avatar className="h-14 w-14 rounded-2xl ring-1 ring-white/10 transition-all duration-500 group-hover:ring-[#818cf8]/50 group-hover:scale-105">
//                 <AvatarImage src={lead.imageUrl} className="object-cover" />
//                 <AvatarFallback className="bg-slate-800 text-slate-400 font-bold uppercase">{lead.name.slice(0, 2)}</AvatarFallback>
//               </Avatar>
//               <div className="min-w-0">
//                 <h4 className="text-base font-black text-white tracking-tight truncate">{lead.name}</h4>
//                 <p className="text-[11px] font-bold text-slate-600 tracking-tight leading-tight uppercase font-black">{lead.subtitle}</p>
//               </div>
//             </div>
// 
//             <p className="text-xs font-bold text-slate-400 opacity-60 px-2 line-clamp-2 leading-relaxed">
//               {lead.reasoning}
//             </p>
// 
//             <div className="flex items-center gap-4 justify-end shrink-0">
//               <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
//                  <div className="h-full bg-[#818cf8] shadow-[0_0_8px_rgba(129,140,248,0.5)] rounded-full" style={{ width: `${lead.score}%` }} />
//               </div>
//               <span className="text-sm font-black text-slate-300 w-12 text-right">{lead.score}%</span>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }
// 