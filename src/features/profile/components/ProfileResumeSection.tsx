// [CLEANUP:DEAD_FILE] Entire component is orphaned and unused.
// "use client";
// 
// import React, { useRef } from "react";
// import { toast } from "sonner";
// import { useResumeMutations } from "@/hooks/use-my-profile";
// 
// interface ProfileResumeSectionProps {
//   resumeName?: string | null;
//   resumeUrl?: string | null;
//   isOwnProfile?: boolean;
// }
// 
// export const ProfileResumeSection: React.FC<ProfileResumeSectionProps> = ({
//   resumeName,
//   resumeUrl,
//   isOwnProfile = true,
// }) => {
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const { upload, remove } = useResumeMutations();
// 
//   const handleUploadClick = () => {
//     fileInputRef.current?.click();
//   };
// 
//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
// 
//     if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
//       toast.error("Only PDF files are allowed for resume upload.");
//       return;
//     }
// 
//     try {
//       const formData = new FormData();
//       formData.append("resume", file);
//       await upload.mutateAsync(formData);
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || "Failed to upload resume.");
//     } finally {
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     }
//   };
// 
//   const handleRemove = async () => {
//     try {
//       await remove.mutateAsync();
//     } catch (err: any) {
//       toast.error(err?.response?.data?.message || "Failed to remove resume.");
//     }
//   };
// 
//   const handleView = () => {
//     if (resumeUrl) {
//       window.open(resumeUrl, "_blank");
//     }
//   };
// 
//   const hasResume = Boolean(resumeName || resumeUrl);
// 
//   if (!hasResume && !isOwnProfile) return null;
// 
//   return (
//     /* Frame 2609756: Main Resume Section Container (w: 800px, pl: 20px, gap: 20px) */
//     <div className="w-full max-w-[800px] px-4 md:px-0 md:pl-5 flex flex-col items-start gap-5">
//       {/* Title */}
//       <div className="text-[var(--ds-text-primary)] text-base font-semibold font-['DM_Sans'] leading-6">
//         Resume
//       </div>
// 
//       {/* State Container */}
//       <div className="flex flex-row items-center gap-2">
//         {hasResume ? (
//           <>
//             <button
//               type="button"
//               onClick={handleView}
//               className="text-[var(--ds-text-primary)] text-base font-normal font-['DM_Sans'] leading-6 hover:opacity-80 transition-opacity cursor-pointer truncate max-w-[240px]"
//               title={resumeName || "Resume.pdf"}
//             >
//               {resumeName || "Resume.pdf"}
//             </button>
//             <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)]" />
//             {isOwnProfile && (
//               <button
//                 type="button"
//                 onClick={handleRemove}
//                 disabled={remove.isPending}
//                 className="text-[var(--ds-error)] text-base font-normal font-['DM_Sans'] leading-6 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
//               >
//                 {remove.isPending ? "Removing..." : "Remove"}
//               </button>
//             )}
//           </>
//         ) : (
//           <>
//             <span className="text-[var(--ds-text-muted)] text-sm font-normal font-['DM_Sans'] leading-5">
//               No resume uploaded
//             </span>
//             <span className="w-1 h-1 rounded-full bg-[var(--ds-text-muted)]" />
//             <button
//               type="button"
//               onClick={handleUploadClick}
//               disabled={upload.isPending}
//               className="text-[var(--ds-accent)] text-sm font-medium font-['DM_Sans'] leading-5 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-50"
//             >
//               {upload.isPending ? "Uploading..." : "Upload resume"}
//             </button>
//           </>
//         )}
// 
//         {/* Hidden PDF-only file input */}
//         <input
//           ref={fileInputRef}
//           type="file"
//           accept="application/pdf"
//           className="hidden"
//           onChange={handleFileChange}
//         />
//       </div>
//     </div>
//   );
// };
// 
// export default ProfileResumeSection;
// 