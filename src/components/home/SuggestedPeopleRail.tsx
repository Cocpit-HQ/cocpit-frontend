// [CLEANUP:DEAD_FILE] Legacy component is orphaned and unused.
// "use client";
// 
// import React, { useState, useEffect } from 'react';
// import { Plus, Check, Loader2 } from 'lucide-react';
// import { UserMention, getSuggestedUsers } from '@/services/api/users';
// import { followUser } from '@/services/api/social';
// import { toast } from 'sonner';
// 
// interface SuggestedPeopleRailProps {
//     onFollowSuccess?: () => void;
// }
// 
// export function SuggestedPeopleRail({ onFollowSuccess }: SuggestedPeopleRailProps) {
//     const [suggestions, setSuggestions] = useState<UserMention[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
// 
//     useEffect(() => {
//         const fetchSuggestions = async () => {
//             try {
//                 const data = await getSuggestedUsers();
//                 setSuggestions(data);
//             } catch (error) {
//                 console.error("Failed to fetch suggestions", error);
//             } finally {
//                 setLoading(false);
//             }
//         };
//         fetchSuggestions();
//     }, []);
// 
//     const handleFollow = async (userId: string) => {
//         if (followingIds.has(userId)) return;
// 
//         setFollowingIds(prev => new Set(prev).add(userId));
//         try {
//             await followUser(userId);
//             toast.success("Following user");
//             if (onFollowSuccess) onFollowSuccess();
//         } catch (error) {
//             console.error("Follow failed", error);
//             setFollowingIds(prev => {
//                 const next = new Set(prev);
//                 next.delete(userId);
//                 return next;
//             });
//             toast.error("Failed to follow user");
//         }
//     };
// 
//     if (loading) {
//         return (
//             <div className="mb-4">
//                 <div className="flex items-center justify-between mb-1 px-4">
//                     <h2 className="font-semibold text-lg text-foreground">Suggested for You</h2>
//                 </div>
//                 <div className="flex gap-3 overflow-x-auto pt-2 pb-2 px-4 scrollbar-hide">
//                     {Array.from({ length: 5 }).map((_, i) => (
//                         <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
//                             <div className="w-14 h-14 rounded-full bg-muted animate-pulse border border-border" />
//                             <div className="w-12 h-2 bg-muted-foreground/20 rounded-full" />
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         );
//     }
// 
//     if (suggestions.length === 0) return null;
// 
//     return (
//         <div className="mb-4">
//             <div className="flex items-center justify-between mb-1 px-4">
//                 <h2 className="font-semibold text-lg text-foreground">Suggested for You</h2>
//             </div>
// 
//             <div className="flex gap-3 overflow-x-auto pt-2 pb-2 px-4 scrollbar-hide">
//                 {suggestions.map((user) => (
//                     <div key={user.id} className="flex-shrink-0 flex flex-col items-center gap-2 group relative">
//                         <div className="relative">
//                             <div
//                                 className="w-14 h-14 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center cursor-pointer transition-transform active:scale-95"
//                                 onClick={() => window.location.href = `/profile/${user.account_name || user.id}`}
//                             >
//                                 {user.avatar_url ? (
//                                     <img
//                                         src={user.avatar_url}
//                                         alt={user.full_name}
//                                         className="w-full h-full object-cover"
//                                     />
//                                 ) : (
//                                     <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-lg">
//                                         {user.full_name[0]}
//                                     </div>
//                                 )}
//                             </div>
// 
//                             {/* Follow Button (+) */}
//                             <button
//                                 onClick={() => handleFollow(user.id)}
//                                 disabled={followingIds.has(user.id)}
//                                 className={`absolute top-10 left-11 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background z-10 transition-colors ${followingIds.has(user.id)
//                                     ? 'bg-green-500 text-white'
//                                     : 'bg-primary text-primary-foreground hover:bg-primary/90'
//                                     }`}
//                             >
//                                 {followingIds.has(user.id) ? (
//                                     <Check className="w-3 h-3" />
//                                 ) : (
//                                     <Plus className="w-3.5 h-3.5" />
//                                 )}
//                             </button>
//                         </div>
// 
//                         <span className="text-foreground text-[10px] font-medium truncate w-16 text-center">
//                             {user.account_name || user.full_name.split(' ')[0]}
//                         </span>
//                     </div>
//                 ))}
//             </div>
//         </div>
//     );
// }
// 