// import React from 'react';
// import Link from 'next/link';
// import { FileText } from 'lucide-react';
// import { RichTextRenderer } from '@/components/ui/RichTextRenderer';
// import { PostSharedContent } from './PostSharedContent';
// import { sanitizeArticleHtmlForDisplay } from '@/lib/sanitizeArticleHtml';
// import type { Poll, Post } from '@/types/entities';
// 
// interface PostContentProps {
//   content?: string;
//   author: string;
//   authorSlug?: string;
//   isExpanded: boolean;
//   isFullContent?: boolean;
//   shared_post?: Post | null;
//   sharedPollData?: Poll | null;
//   isSharedVoting?: boolean;
//   handleSharedVote?: (optionId: string) => void;
//   isProfileView?: boolean;
//   postId?: string | number;
//   location?: string;
//   timeAgo?: string;
//   onToggleExpand?: () => void;
//   isCarouselView?: boolean;
//   // Article support props:
//   category?: string;
//   title?: string | null;
//   articleBody?: string;
//   imageSrc?: string;
//   authorAvatar?: string;
//   postType?: string;
//   variant?: 'default' | 'overlay';
// }
// 
// export const PostContent = ({
//   content, author, authorSlug, isExpanded, isFullContent,
//   shared_post, sharedPollData, isSharedVoting, handleSharedVote, isProfileView,
//   postId, location, timeAgo, onToggleExpand, isCarouselView,
//   category, title, articleBody, imageSrc, postType, variant = 'default'
// }: PostContentProps) => {
//   const isArticle = category === 'Article' || Boolean(articleBody) || postType === 'article';
//   const articleHref = postId ? `/post/${postId}` : undefined;
//   const normalizedArticleBody = (articleBody || '').trim();
//   const articleDescription = (content || '').trim();
//   const shouldShowArticleDescription = Boolean(articleDescription) && articleDescription !== normalizedArticleBody;
//   const isLongArticleDescription = articleDescription.length > 180 || articleDescription.split('\n').length > 3;
//   const hasArticleBody = Boolean(articleBody?.trim());
//   const showFullArticle = isArticle && (isFullContent || isExpanded);
// 
//   if (!content && !shared_post && !isArticle) {
//     if (isCarouselView) {
//       return <div className="h-[40px] w-full flex-shrink-0" />;
//     }
//     return null;
//   }
// 
//   return (
//     <div className="flex-1 flex flex-col justify-center w-full gap-2">
//       {/* Main post description/caption */}
//       {content && !isArticle && (() => {
//         if (isCarouselView) {
//           return (
//             <div className="w-full h-[40px] flex-shrink-0 overflow-hidden">
//               <div className="font-normal font-[family-name:var(--font-poppins)] text-[12px] leading-[16px] text-black dark:text-white line-clamp-2 whitespace-pre-wrap break-words">
//                 <RichTextRenderer content={content.trimEnd()} authorName={author} authorSlug={authorSlug} />
//               </div>
//             </div>
//           );
//         }
// 
//         const isOverlay = variant === 'overlay';
//         const truncateLength = isOverlay ? 90 : 160;
//         const maxLines = isOverlay ? 2 : 3;
//         const trimmedContent = content.trimEnd();
//         const lines = trimmedContent.split('\n');
//         const nonEmptyLines = lines.filter((line) => line.trim() !== '');
//         const isLong = !isFullContent && (trimmedContent.length > truncateLength || nonEmptyLines.length > maxLines);
//         let displayContent = trimmedContent;
// 
//         if (isLong && (!isExpanded || isOverlay)) {
//           if (nonEmptyLines.length > maxLines) {
//             let nonEmptyCount = 0;
//             let sliceIndex = lines.length;
//             for (let i = 0; i < lines.length; i++) {
//               if (lines[i].trim() !== '') {
//                 nonEmptyCount++;
//                 if (nonEmptyCount === maxLines) {
//                   sliceIndex = i + 1;
//                   break;
//                 }
//               }
//             }
//             displayContent = lines.slice(0, sliceIndex).join('\n');
//           }
//           displayContent = displayContent.trimEnd();
// 
//           if (displayContent.length > truncateLength) {
//             let truncated = displayContent.slice(0, truncateLength);
//             const lastSpaceIndex = truncated.lastIndexOf(' ');
//             if (lastSpaceIndex > 0) {
//               truncated = truncated.slice(0, lastSpaceIndex);
//             }
//             displayContent = truncated.trimEnd();
//           }
//         }
// 
//         return (
//           <div className="w-full">
//             <div
//               className={`font-normal font-[family-name:var(--font-poppins)] text-[12px] leading-[16px] whitespace-pre-wrap ${isOverlay ? 'text-white' : 'text-foreground'}`}
//             >
//               <span className="inline">
//                 <RichTextRenderer content={(isExpanded && !isOverlay) ? trimmedContent : displayContent} authorName={author} authorSlug={authorSlug} />
//               </span>
//               {isLong && (!isExpanded || isOverlay) && (
//                 <span className="inline">
//                   {isOverlay ? '... ' : '... '}
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       if (isOverlay && postId) {
//                         window.location.href = `/post/${postId}`;
//                       } else {
//                         onToggleExpand?.();
//                       }
//                     }}
//                     className={`inline hover:opacity-80 font-medium font-[family-name:var(--font-poppins)] focus:outline-none transition-colors ${isOverlay ? 'text-white font-semibold shadow-sm' : 'text-[#6366F1]'}`}
//                   >
//                     {isOverlay ? 'Show more' : 'Read more'}
//                   </button>
//                 </span>
//               )}
//             </div>
//             {isLong && isExpanded && !isOverlay && (
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   onToggleExpand?.();
//                 }}
//                 className={`text-[12px] hover:opacity-80 mt-1 font-medium font-[family-name:var(--font-poppins)] focus:outline-none transition-colors inline-block text-[#6366F1]`}
//               >
//                 Show less
//               </button>
//             )}
//           </div>
//         );
//       })()}
// 
//       {/* Inline Article Card */}
//       {isArticle && (
//         <div className="w-full mt-2 mb-2 border border-border bg-card/60 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col">
//           {articleHref ? (
//             <Link href={articleHref} className="block" onClick={(e) => e.stopPropagation()}>
//               <div className="w-full aspect-[21/9] overflow-hidden relative border-b border-border/40">
//                 {imageSrc ? (
//                   <img
//                     src={imageSrc}
//                     alt={title || "Article cover"}
//                     className="w-full h-full object-cover"
//                   />
//                 ) : (
//                   <div className="w-full h-full bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-center">
//                     <FileText className="w-8 h-8 text-indigo-400" />
//                   </div>
//                 )}
//               </div>
//             </Link>
//           ) : (
//             <div className="w-full aspect-[21/9] overflow-hidden relative border-b border-border/40">
//               {imageSrc ? (
//                 <img
//                   src={imageSrc}
//                   alt={title || "Article cover"}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="w-full h-full bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-center">
//                   <FileText className="w-8 h-8 text-indigo-400" />
//                 </div>
//               )}
//             </div>
//           )}
// 
//           <div className="p-5 flex flex-col gap-3">
//             {articleHref && !isFullContent ? (
//               <Link href={articleHref} className="block">
//                 <h4 className="line-clamp-2 font-bold text-[16px] text-foreground font-[family-name:var(--font-poppins)] leading-snug">
//                   {title || "Untitled Article"}
//                 </h4>
//               </Link>
//             ) : (
//               <h4 className="line-clamp-2 font-bold text-[16px] text-foreground font-[family-name:var(--font-poppins)] leading-snug">
//                 {title || "Untitled Article"}
//               </h4>
//             )}
// 
//             {shouldShowArticleDescription && (
//               <div className="relative">
//                 <div
//                   className={`font-normal font-[family-name:var(--font-poppins)] text-[13px] leading-[20px] text-foreground/85 whitespace-pre-wrap ${!showFullArticle ? 'line-clamp-3' : ''}`}
//                 >
//                   <RichTextRenderer content={articleDescription} authorName={author} authorSlug={authorSlug} />
//                 </div>
//                 {!showFullArticle && isLongArticleDescription && (
//                   <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-card via-card/95 to-transparent" />
//                 )}
//               </div>
//             )}
// 
//             {hasArticleBody && showFullArticle && (
//               <div
//                 className={`grid min-w-0 transition-all duration-300 ease-out ${showFullArticle ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'}`}
//               >
//                 <div className={`min-w-0 ${showFullArticle ? 'overflow-visible' : 'overflow-hidden'}`}>
//                   <div
//                     dangerouslySetInnerHTML={{ __html: sanitizeArticleHtmlForDisplay(articleBody || '') }}
//                     className="article-content border-t border-border/40 pt-4 break-words"
//                     style={{ overflowWrap: 'break-word', wordWrap: 'break-word', wordBreak: 'break-word' }}
//                   />
//                 </div>
//               </div>
//             )}
// 
//           </div>
//         </div>
//       )}
// 
//       {/* Shared Post content if present */}
//       {shared_post && (
//         <PostSharedContent
//           shared_post={shared_post}
//           sharedPollData={sharedPollData}
//           handleSharedVote={handleSharedVote}
//           isSharedVoting={isSharedVoting}
//           isProfileView={isProfileView}
//         />
//       )}
//     </div>
//   );
// };
// 