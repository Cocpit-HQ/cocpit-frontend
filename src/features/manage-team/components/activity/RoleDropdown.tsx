// 'use client';
// 
// import React, { useState, useRef, useEffect } from 'react';
// import { Icon } from '@iconify/react';
// 
// interface RoleDropdownProps {
//   options: { value: string; label: string }[];
//   value: string;
//   onChange: (value: string) => void;
//   placeholder?: string;
// }
// 
// export default function RoleDropdown({
//   options,
//   value,
//   onChange,
//   placeholder = 'All roles',
// }: RoleDropdownProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);
// 
//   useEffect(() => {
//     const handleClickOutside = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);
// 
//   const selectedLabel =
//     options.find((o) => o.value === value)?.label || placeholder;
// 
//   return (
//     <div ref={ref} className="relative w-full">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex items-center justify-between px-6 h-[50px] rounded-[24px] border border-[#E0E0E7] dark:border-gray-700 bg-transparent text-[16px] text-[#000000] dark:text-gray-200 font-['Poppins'] hover:border-gray-300 dark:hover:border-gray-600 transition-colors w-full box-border"
//       >
//         <span className="text-left truncate font-normal">{selectedLabel}</span>
//         <Icon
//           icon="lucide:chevron-down"
//           className={`w-5 h-5 text-black dark:text-gray-400 transition-transform ${
//             isOpen ? 'rotate-180' : ''
//           }`}
//         />
//       </button>
// 
//       {isOpen && (
//         <div className="absolute top-[calc(100%+8px)] left-0 w-full min-w-[140px] bg-white dark:bg-[#1A1D24] border border-[#E0E0E7] dark:border-gray-700 rounded-[12px] shadow-lg z-20 py-2 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
//           {options.map((option) => (
//             <button
//               key={option.value}
//               onClick={() => {
//                 onChange(option.value);
//                 setIsOpen(false);
//               }}
//               className={`w-full text-left px-6 py-2.5 text-[14px] font-normal font-['Poppins'] transition-colors ${
//                 value === option.value
//                   ? 'text-[#1A73E8] dark:text-[#4D9CFF] bg-[#F2F7FF] dark:bg-[#1A2435]'
//                   : 'text-[#000000] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0F1115]'
//               }`}
//             >
//               {option.label}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
