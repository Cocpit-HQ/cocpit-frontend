// [CLEANUP:DEAD_FILE] Legacy profile/onboarding component is orphaned and unused.
// 'use client'
// 
// import React, { useState, useMemo } from 'react'
// import {
//   Radar,
//   RadarChart,
//   PolarGrid,
//   PolarAngleAxis,
//   PolarRadiusAxis,
//   ResponsiveContainer,
//   Tooltip
// } from 'recharts'
// import { Target, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react'
// import { TARGET_ROLES, getSkillGapData, SkillData } from '@/app/(authenticated)/(dashboard)/analytics/data';
// 
// export function SkillGapVisualizer() {
//   const [selectedRole, setSelectedRole] = useState(TARGET_ROLES[0].id)
// 
//   const data = useMemo(() => getSkillGapData(selectedRole), [selectedRole])
// 
//   // Calculate readiness score (avg current level / avg required level)
//   const readinessScore = useMemo(() => {
//     const totalCurrent = data.reduce((acc, curr) => acc + curr.currentLevel, 0)
//     const totalRequired = data.reduce((acc, curr) => acc + curr.requiredLevel, 0)
//     return Math.round((totalCurrent / totalRequired) * 100)
//   }, [data])
// 
//   const missingSkills = data.filter(d => d.gap > 0).sort((a, b) => b.gap - a.gap)
// 
//   return (
//     <div className="p-6 rounded-xl border bg-card border-border shadow-sm">
//       <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
//         <div>
//           <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
//             <Target className="w-5 h-5 text-blue-500" />
//             Career Trajectory & Skill Gap
//           </h2>
//           <p className="text-sm text-muted-foreground mt-1">
//             Compare your current skills against your dream role.
//           </p>
//         </div>
// 
//         <div className="relative">
//           <select
//             value={selectedRole}
//             onChange={(e) => setSelectedRole(e.target.value)}
//             className="w-full md:w-64 appearance-none bg-muted/50 border border-border text-foreground rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-[#5B7CFF]/20"
//           >
//             {TARGET_ROLES.map((role) => (
//               <option key={role.id} value={role.id}>
//                 {role.label}
//               </option>
//             ))}
//           </select>
//           <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
//             <ChevronRight className="w-4 h-4 rotate-90" />
//           </div>
//         </div>
//       </div>
// 
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
//         {/* Radar Chart */}
//         <div className="h-[300px] w-full relative">
//           <ResponsiveContainer width="100%" height="100%">
//             <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
//               <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
//               <PolarAngleAxis
//                 dataKey="skill"
//                 tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
//               />
//               <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
//               <Radar
//                 name="Current Skills"
//                 dataKey="currentLevel"
//                 stroke="#5B7CFF"
//                 fill="#5B7CFF"
//                 fillOpacity={0.3}
//               />
//               <Radar
//                 name="Required Level"
//                 dataKey="requiredLevel"
//                 stroke="#10b981"
//                 fill="#10b981"
//                 fillOpacity={0.1}
//                 strokeDasharray="4 4"
//               />
//               <Tooltip
//                 contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '8px', borderColor: 'var(--border)', color: 'var(--foreground)' }}
//                 itemStyle={{ color: 'var(--foreground)' }}
//               />
//             </RadarChart>
//           </ResponsiveContainer>
// 
//           <div className="absolute top-0 right-0 flex flex-col gap-2 text-xs">
//             <div className="flex items-center gap-2">
//               <span className="w-3 h-3 rounded-full bg-[#5B7CFF]/30 border border-[#5B7CFF]"></span>
//               <span className="text-muted-foreground">You</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <span className="w-3 h-3 rounded-full bg-[#10b981]/10 border border-[#10b981] border-dashed"></span>
//               <span className="text-muted-foreground">Target</span>
//             </div>
//           </div>
//         </div>
// 
//         {/* Gap Analysis & Insights */}
//         <div className="space-y-6">
// 
//           {/* Readiness Score */}
//           <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
//             <div className="flex items-center justify-between mb-2">
//               <span className="text-sm font-medium text-muted-foreground">Role Readiness</span>
//               <span className="text-2xl font-bold text-[#5B7CFF]">{readinessScore}%</span>
//             </div>
//             <div className="w-full bg-muted rounded-full h-2">
//               <div
//                 className="bg-[#5B7CFF] h-2 rounded-full transition-all duration-1000 ease-out"
//                 style={{ width: `${readinessScore}%` }}
//               />
//             </div>
//             <p className="text-xs text-muted-foreground mt-2">
//               You are <span className="font-semibold text-foreground">{readinessScore >= 85 ? 'highly qualified' : readinessScore >= 60 ? 'on track' : 'developing skills'}</span> for this role.
//             </p>
//           </div>
// 
//           {/* Top Gaps List */}
//           <div>
//             <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
//               <AlertCircle className="w-4 h-4 text-orange-500" />
//               Priority Focus Areas
//             </h3>
//             <div className="space-y-3">
//               {missingSkills.slice(0, 3).map((item) => (
//                 <div key={item.skill}>
//                   <div className="flex justify-between text-xs mb-1">
//                     <span className="text-foreground font-medium">{item.skill}</span>
//                     <span className="text-orange-500 font-medium">+{item.gap}% needed</span>
//                   </div>
//                   <div className="w-full bg-muted rounded-full h-1.5">
//                     <div
//                       className="bg-orange-400 h-1.5 rounded-full"
//                       style={{ width: `${(item.currentLevel / item.requiredLevel) * 100}%` }}
//                     />
//                   </div>
//                 </div>
//               ))}
//               {missingSkills.length === 0 && (
//                 <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm py-2">
//                   <CheckCircle2 className="w-5 h-5" />
//                   <span>You meet all requirements for this role!</span>
//                 </div>
//               )}
//             </div>
//           </div>
// 
//           <button className="w-full mt-2 py-2.5 text-sm font-medium text-[#5B7CFF] bg-[#5B7CFF]/10 hover:bg-[#5B7CFF]/20 rounded-lg transition-colors">
//             View Recommended Courses
//           </button>
//         </div>
//       </div>
//     </div>
//   )
// }
// 