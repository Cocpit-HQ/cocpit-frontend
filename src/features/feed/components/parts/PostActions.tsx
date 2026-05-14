'use client';

import React from 'react';
import { SaveButton } from '@/components/home/SaveButton';

interface PostActionsProps {
  id: string | number;
  isLiked: boolean;
  likeCount: number;
  handleLike: () => void;
  isCommentSectionOpen: boolean;
  isMobileDrawerOpen: boolean;
  isCommented: boolean;
  commentsCount: number;
  handleToggleCommentSection: () => void;
  shares: string | number;
  handleShare: () => void;
  handleRepost: () => void;
  isSaved: boolean;
  setIsSaved: (val: boolean) => void;
  handleSaveToggle: () => void;
}

export const PostActions = ({
  id, isLiked, likeCount, handleLike,
  isCommentSectionOpen, isMobileDrawerOpen, isCommented, commentsCount, handleToggleCommentSection,
  shares, handleShare, handleRepost, isSaved, setIsSaved, handleSaveToggle
}: PostActionsProps) => {
  return (
    <div className="flex flex-row justify-between items-center px-[16px] py-[8px] gap-[8px] w-full h-[40px]">
      {/* Frame 2608620 (Action Icons Group) - Left Aligned */}
      <div className="flex flex-row items-center gap-[16px]">
        {/* Like (Frame 2608593) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleLike(); }}
          className="flex flex-row items-center gap-[8px] h-[24px]"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            className={isLiked ? "text-primary" : "text-foreground"}
          >
            {isLiked ? (
              <>
                <path 
                  fill="currentColor" 
                  d="m20.27 16.265l.705-4.08a1.666 1.666 0 0 0-1.64-1.95h-5.181a.833.833 0 0 1-.822-.969l.663-4.045a4.8 4.8 0 0 0-.09-1.973a1.64 1.64 0 0 0-1.092-1.137l-.145-.047a1.35 1.35 0 0 0-.994.068c-.34.164-.588.463-.68.818l-.476 1.834a7.6 7.6 0 0 1-.656 1.679c-.415.777-1.057 1.4-1.725 1.975l-1.439 1.24a1.67 1.67 0 0 0-.572 1.406l.812 9.393A1.666 1.666 0 0 0 8.597 22h4.648c3.482 0 6.453-2.426 7.025-5.735"
                />
                <path 
                  fill="currentColor" 
                  fillRule="evenodd" 
                  d="M2.968 9.485a.75.75 0 0 1 .78.685l.97 11.236a1.237 1.237 0 1 1-2.468.107V10.234a.75.75 0 0 1 .718-.749" 
                  clipRule="evenodd"
                />
              </>
            ) : (
              <path 
                fill="currentColor" 
                d="m20.975 12.185l-.739-.128zm-.705 4.08l-.74-.128zM6.938 20.477l-.747.065zm-.812-9.393l.747-.064zm7.869-5.863l.74.122zm-.663 4.045l.74.121zm-6.634.411l-.49-.568zm1.439-1.24l.49.569zm2.381-3.653l-.726-.189zm.476-1.834l.726.188zm1.674-.886l-.23.714zm.145.047l.229-.714zM9.862 6.463l.662.353zm4.043-3.215l-.726.188zm-2.23-1.116l-.326-.675zM3.971 21.471l-.748.064zM3 10.234l.747-.064a.75.75 0 0 0-1.497.064zm17.236 1.823l-.705 4.08l1.478.256l.705-4.08zm-6.991 9.193H8.596v1.5h4.649zm-5.56-.837l-.812-9.393l-1.495.129l.813 9.393zm11.846-4.276c-.507 2.93-3.15 5.113-6.286 5.113v1.5c3.826 0 7.126-2.669 7.764-6.357zM13.255 5.1l-.663 4.045l1.48.242l.663-4.044zm-6.067 5.146l1.438-1.24l-.979-1.136L6.21 9.11zm4.056-5.274l.476-1.834l-1.452-.376l-.476 1.833zm1.194-2.194l.145.047l.459-1.428l-.145-.047zm-1.915 4.038a8.4 8.4 0 0 0 .721-1.844l-1.452-.377A7 7 0 0 1 9.2 6.11zm2.06-3.991a.89.89 0 0 1 .596.61l1.452-.376a2.38 2.38 0 0 0-1.589-1.662zm-.863.313a.52.52 0 0 1 .28-.33l-.651-1.351c-.532.256-.932.73-1.081 1.305zm.28-.33a.6.6 0 0 1 .438-.03l.459-1.428a2.1 2.1 0 0 0-1.548.107zm2.154 8.176h5.18v-1.5h-5.18zM4.719 21.406L3.747 10.17l-1.494.129l.971 11.236zm-.969.107V10.234h-1.5v11.279zm-.526.022a.263.263 0 0 1 .263-.285v1.5c.726 0 1.294-.622 1.232-1.344zM14.735 5.343a5.5 5.5 0 0 0-.104-2.284l-1.452.377a4 4 0 0 1 .076 1.664zM8.596 21.25a.916.916 0 0 1-.911-.837l-1.494.129a2.416 2.416 0 0 0 2.405 2.208zm.03-12.244c.68-.586 1.413-1.283 1.898-2.19L9.2 6.109c-.346.649-.897 1.196-1.553 1.76zm13.088 3.307a2.416 2.416 0 0 0-2.38-2.829v1.5c.567 0 1 .512.902 1.073zM3.487 21.25c.146 0 .263.118.263.263h-1.5c0 .682.553 1.237 1.237 1.237zm9.105-12.105a1.583 1.583 0 0 0 1.562 1.84v-1.5a.083.083 0 0 1-.082-.098zm-5.72 1.875a.92.92 0 0 1 .316-.774l-.98-1.137a2.42 2.42 0 0 0-.83 2.04z" 
              />
            )}          </svg>
          <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground">
            {likeCount}
          </span>
        </button>

        {/* Comment (Frame 2608594) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleToggleCommentSection(); }}
          className="flex flex-row items-center gap-[8px] h-[24px]"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            className="text-foreground"
          >
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
              <path strokeLinejoin="round" d="M8 13.5h8m-8-5h4"/>
              <path d="M6.099 19q-1.949-.192-2.927-1.172C2 16.657 2 14.771 2 11v-.5c0-3.771 0-5.657 1.172-6.828S6.229 2.5 10 2.5h4c3.771 0 5.657 0 6.828 1.172S22 6.729 22 10.5v.5c0 3.771 0 5.657-1.172 6.828S17.771 19 14 19c-.56.012-1.007.055-1.445.155c-1.199.276-2.309.89-3.405 1.424c-1.563.762-2.344 1.143-2.834.786c-.938-.698-.021-2.863.184-3.865"/>
            </g>
          </svg>
          <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground">
            {commentsCount}
          </span>
        </button>

        {/* Repost is presentational until backend support is wired. */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleRepost(); }}
          aria-label="Repost"
          title="Repost"
          className="flex h-[24px] flex-row items-center gap-[8px]"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            className="text-foreground"
          >
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
              <path d="M8.5 15S5 17.578 5 18.5S8.5 22 8.5 22"/>
              <path d="M5.5 18.5h8c3.288 0 4.931 0 6.038-.908q.304-.25.554-.554C21 15.93 21 14.288 21 11m-5.5-2S19 6.422 19 5.5S15.5 2 15.5 2"/>
              <path d="M18.5 5.5h-8c-3.287 0-4.931 0-6.038.908a4 4 0 0 0-.554.554C3 8.07 3 9.712 3 13"/>
            </g>
          </svg>
          <span className="text-[12px] leading-[16px] font-normal font-[family-name:var(--font-poppins)] text-foreground">
            {shares}
          </span>
        </button>

        {/* Share (Frame 2608597) */}
        <button 
          onClick={(e) => { e.stopPropagation(); handleShare(); }}
          className="flex flex-row items-center gap-[8px] h-[24px]"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 28 28" 
            className="text-foreground"
          >
            <path fill="currentColor" d="M12.25 3a.75.75 0 1 1 0 1.5h-5A2.75 2.75 0 0 0 4.5 7.25v13.5a2.75 2.75 0 0 0 2.75 2.75h13.5a2.75 2.75 0 0 0 2.75-2.75v-5a.75.75 0 0 1 1.5 0v5A4.25 4.25 0 0 1 20.75 25H7.25A4.25 4.25 0 0 1 3 20.75V7.25A4.25 4.25 0 0 1 7.25 3zm5.179-.928a.75.75 0 0 1 .796.098l8.25 6.75a.75.75 0 0 1 .039 1.127l-8.25 7.75A.75.75 0 0 1 17 17.25v-3.74c-1.166.036-2.463.189-3.854.802c-1.584.698-3.35 2.021-5.16 4.577l-.362.527A.75.75 0 0 1 6.25 19c0-4.406 1.34-7.56 3.51-9.608C11.738 7.527 14.325 6.656 17 6.52V2.75a.75.75 0 0 1 .429-.679m1.07 5.178a.75.75 0 0 1-.75.75c-2.66 0-5.145.772-6.959 2.483c-1.413 1.334-2.474 3.292-2.87 6.046c1.56-1.823 3.12-2.93 4.621-3.59C14.532 12.06 16.349 12 17.75 12a.75.75 0 0 1 .75.75v2.766l6.363-5.978L18.5 4.332z"/>
          </svg>
        </button>
      </div>

      {/* Save (Frame 2608596) - Right Aligned */}
      <div className="flex-shrink-0">
        <SaveButton
          postId={id.toString()}
          initialIsSaved={isSaved}
          onSaveChange={setIsSaved}
          onToggle={handleSaveToggle}
        />
      </div>
    </div>
  );
};
