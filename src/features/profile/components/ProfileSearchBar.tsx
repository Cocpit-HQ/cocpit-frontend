// [CLEANUP:DEAD_FILE] Entire component is orphaned and unused.
// "use client";
// 
// import React, { useState } from "react";
// import { Icon } from "@iconify/react";
// 
// interface ProfileSearchBarProps {
//   onSearch?: (query: string) => void;
// }
// 
// export const ProfileSearchBar: React.FC<ProfileSearchBarProps> = ({ onSearch }) => {
//   const [query, setQuery] = useState("");
// 
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setQuery(e.target.value);
//     onSearch?.(e.target.value);
//   };
// 
//   return (
//     <div className="w-full max-w-[384px] h-10 px-3 py-1.5 border-b border-[var(--ds-text-primary)]/40 hover:border-[var(--ds-text-primary)] focus-within:border-[var(--ds-accent)] inline-flex justify-between items-center transition-colors">
//       <input
//         type="text"
//         value={query}
//         onChange={handleChange}
//         placeholder="Search"
//         className="w-full bg-transparent text-[var(--ds-text-primary)] placeholder-[var(--ds-text-muted)] text-base font-normal font-['DM_Sans'] leading-6 outline-none border-none"
//       />
//       <Icon
//         icon="hugeicons:search-01"
//         className="w-5 h-5 text-[var(--ds-text-primary)] shrink-0 ml-2"
//       />
//     </div>
//   );
// };
// 
// export default ProfileSearchBar;
// 