// 'use client';
// import React, { useEffect, useState } from 'react';
// import debounce from 'lodash.debounce';
// import { useRouter } from 'next/navigation';

// export default function AccountOnboard() {
//   const [username, setUsername] = useState('');
//   const [status, setStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
//   const router = useRouter();

//   // debounced check (500ms)
//   const check = debounce(async (val: string) => {
//     if (!val) { setStatus('idle'); return; }
//     setStatus('checking');
//     try {
//       const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(val)}`);
//       const data = await res.json();
//       setStatus(data.available ? 'available' : 'taken');
//     } catch (err) {
//       setStatus('idle');
//     }
//   }, 500);

//   useEffect(() => {
//     check(username.trim().toLowerCase());
//     return () => check.cancel();
//   }, [username]);

//   return (
//     <div className="min-h-screen bg-onboard flex items-center justify-center">
//       <div className="w-[480px] bg-white/95 rounded-2xl p-8">
//         <h2 className="text-2xl font-semibold text-gray-900">Create your account</h2>
//         <p className="text-sm text-gray-600 mt-2">Choose a unique account name. This will be visible to others.</p>

//         <div className="mt-6">
//           <label className="block text-sm font-medium text-gray-700">Account Name</label>
//           <input
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             className="mt-2 w-full rounded-lg border px-3 py-2"
//             placeholder="Enter a unique username"
//           />
//           <div className="mt-2 h-5 text-sm">
//             {status === 'checking' && <span className="text-purple-600">Checking availability...</span>}
//             {status === 'available' && <span className="text-green-600">✓ This username is available</span>}
//             {status === 'taken' && <span className="text-red-600">✕ Username already exists</span>}
//           </div>
//         </div>

//         <div className="mt-6">
//           <h3 className="text-sm font-semibold text-gray-800">Optional Information</h3>

//           <label className="block text-sm text-gray-700 mt-3">Description</label>
//           <textarea placeholder="Write something about yourself…" className="mt-2 w-full rounded-lg border p-3 h-28"></textarea>

//           <label className="block text-sm text-gray-700 mt-3">Mobile number (optional)</label>
//           <input placeholder="+91 98765 43210" className="mt-2 w-full rounded-lg border px-3 py-2" />
//           <p className="text-xs text-gray-500 mt-1">Used only for verification (optional)</p>
//         </div>

//         <div className="mt-6 space-y-3">
//           <button
//             className="w-full bg-gradient-to-r from-purple-600 to-purple-400 text-white py-3 rounded-lg font-semibold"
//             onClick={() => alert('Save & continue (implement API)')}
//           >
//             Continue
//           </button>
//           <button onClick={() => router.push('/')} className="w-full text-purple-700 underline">
//             Skip for now
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
