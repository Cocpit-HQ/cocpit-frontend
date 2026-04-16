import React from 'react';
import { Video } from 'lucide-react';

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
  return (
    <div className="mt-4 border border-border/50 rounded-xl overflow-hidden bg-muted/10 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full overflow-hidden border">
          <img src={sharedPost.authorImg || sharedPost.image || '/assets/pngegg.png'} className="w-full h-full object-cover" />
        </div>
        <span className="text-xs font-bold text-foreground truncate">{sharedPost.authorName || sharedPost.name}</span>
        <span className="text-[10px] text-muted-foreground">• {sharedPost.createdAt || 'Shared post'}</span>
      </div>
      
      <p className="text-sm text-foreground/90 line-clamp-3 mb-3 leading-relaxed">
        {sharedPost.content}
      </p>

      {sharedPost.images && sharedPost.images.length > 0 && (
        <div className="rounded-lg overflow-hidden bg-black/5 relative flex justify-center items-center">
          <img src={sharedPost.images[0]} className="w-full max-h-[400px] object-contain rounded-lg" alt="Shared Media" />
          {sharedPost.images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{sharedPost.images.length - 1}
            </div>
          )}
        </div>
      )}
      
      {sharedPost.videoSrc && (!sharedPost.images || sharedPost.images.length === 0) && (
        <div className="rounded-lg overflow-hidden h-40 bg-black relative flex items-center justify-center">
          <video src={sharedPost.videoSrc} className="h-full max-w-full object-contain" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-full">
              <Video className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedPreview;
