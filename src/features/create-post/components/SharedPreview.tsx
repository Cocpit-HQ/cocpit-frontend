import React from 'react';
import { Video } from 'lucide-react';
import { Icon } from '@iconify/react';

interface SharedPreviewProps {
  sharedPost: any;
  sharedPostId?: string;
  sharedJobId?: string;
  isMobile: boolean;
}

const SharedPreview = ({ sharedPost, isMobile }: SharedPreviewProps) => {
  if (!sharedPost) return null;

  // Job Preview
  if (sharedPost.isJob) {
    return (
      <div className="mt-4 border border-border/50 rounded-xl overflow-hidden bg-muted/20 backdrop-blur-sm p-4 flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
        <div className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg bg-background overflow-hidden flex items-center justify-center border border-border/50 shadow-sm">
          {sharedPost.jobLogo ? (
            <img src={sharedPost.jobLogo} alt={sharedPost.jobCompany || "Company"} className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-2xl font-bold text-muted-foreground">{sharedPost.jobCompany?.charAt(0) || "J"}</span>
          )}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="text-base font-semibold text-foreground truncate">{sharedPost.jobTitle}</h4>
          <p className="text-sm text-foreground/90 truncate font-medium">{sharedPost.jobCompany}</p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {sharedPost.jobLocation}
            {sharedPost.jobWorkMode ? ` (${sharedPost.jobWorkMode})` : ''}
          </p>
        </div>
        {!isMobile && (
          <div className="shrink-0 ml-4 hidden sm:block">
            <div className="px-4 py-1.5 rounded-full border border-primary text-primary text-sm font-medium shadow-sm">
              View job
            </div>
          </div>
        )}
      </div>
    );
  }

  // Post Preview
  console.log('sharedPost:', sharedPost);

  const sharedUser = sharedPost?.user 
    || (typeof sharedPost?.author === 'object' ? sharedPost?.author : null)
    || sharedPost?.created_by
    || sharedPost?.posted_by;

  const sharedName = sharedUser?.name 
    || sharedUser?.full_name 
    || (sharedUser?.firstName && sharedUser?.lastName ? `${sharedUser.firstName} ${sharedUser.lastName}` : null)
    || (typeof sharedPost?.author === 'string' ? sharedPost?.author : null)
    || sharedPost?.userName
    || sharedPost?.authorName
    || sharedPost?.name;

  const sharedAvatar = sharedUser?.image 
    || sharedUser?.avatar 
    || sharedUser?.avatar_url 
    || sharedUser?.profile_picture
    || sharedUser?.photo
    || sharedPost?.authorAvatar
    || sharedPost?.authorImg
    || sharedPost?.image;

  const sharedRole = sharedUser?.title 
    || sharedUser?.role 
    || sharedUser?.designation
    || sharedUser?.headline
    || sharedPost?.authorHeadline;

  const sharedLocation = sharedUser?.location 
    || sharedPost?.location;

  const sharedTime = sharedPost?.timeAgo 
    || sharedPost?.created_at 
    || sharedPost?.createdAt;

  return (
    <div className="flex flex-col gap-2 w-full mt-2">
      {/* Card */}
      <div className="self-stretch p-4 bg-white rounded-3xl shadow-[0px_2px_4px_0px_rgba(99,102,241,0.05)] outline outline-1 outline-offset-[-1px] outline-indigo-50 flex flex-col gap-4">
        {/* Author row */}
        <div className="inline-flex items-center gap-2">
          <div className="size-10 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0 font-['Poppins'] select-none">
            {sharedAvatar && sharedAvatar !== '/assets/pngegg.png' ? (
              <img
                className="w-full h-full object-cover"
                src={sharedAvatar}
                alt={sharedName || 'avatar'}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <span>{(sharedName || 'U').charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-black text-base font-normal font-['Poppins'] leading-6">
              {sharedName || 'Unknown User'}
            </span>
            {sharedRole && (
              <span className="text-gray-500 text-[10px] font-['Poppins'] leading-4">
                {sharedRole}
              </span>
            )}
            <div className="inline-flex items-center gap-2">
              {sharedLocation && (
                <>
                  <span className="text-gray-500 text-[10px] font-['Poppins'] leading-4">
                    {sharedLocation}
                  </span>
                  <div className="size-1.5 bg-gray-500 rounded-full" />
                </>
              )}
              {sharedTime && (
                <span className="text-gray-500 text-[10px] font-['Poppins'] leading-4">
                  {sharedTime}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Content */}
        <p className="text-black text-xs font-normal font-['Poppins'] leading-4 line-clamp-6">
          {sharedPost?.content || sharedPost?.description || sharedPost?.text}
        </p>

        {/* Optional Media in new card design if you want to keep them */}
        {sharedPost?.images && sharedPost.images.length > 0 && (
          <div className="rounded-lg overflow-hidden bg-black/5 relative flex justify-center items-center mt-2">
            <img src={sharedPost.images[0]} className="w-full max-h-[400px] object-contain rounded-lg" alt="Shared Media" />
            {sharedPost.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                +{sharedPost.images.length - 1}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Eye + Delete icons */}
      <div className="inline-flex justify-end items-center gap-3 pr-1">
        <button type="button" className="p-1 text-[#000000]">
          <Icon icon="fluent:eye-off-24-regular" className="w-6 h-6" />
        </button>
        <button type="button" className="p-1 text-[#FF6B6B] hover:text-red-600 transition-colors">
          <Icon icon="fluent:delete-16-regular" className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default SharedPreview;
