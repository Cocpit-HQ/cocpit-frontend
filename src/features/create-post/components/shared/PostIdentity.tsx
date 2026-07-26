import React from 'react';

interface PostIdentityProps {
  isCompanyPost: boolean;
  currentPoster: any;
  currentUser: any;
  children?: React.ReactNode;
  className?: string;
}

const PostIdentity = ({
  isCompanyPost,
  currentPoster,
  currentUser,
  children,
  className = ""
}: PostIdentityProps) => {
  const name = isCompanyPost 
    ? (currentPoster?.name || 'Company') 
    : (currentUser?.name || 'User');
    
  const rawAvatar = isCompanyPost 
    ? (currentPoster?.logo_url || currentPoster?.avatar_url) 
    : (currentUser?.image || currentUser?.avatar);
  const avatar = rawAvatar && rawAvatar !== '/assets/pngegg.png' ? rawAvatar : null;

  return (
    <div className={`px-6 py-6 border-b border-border/50 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-base overflow-hidden shrink-0 shadow-md font-['Poppins'] select-none">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : null}
          <span>{(name || 'U').charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex flex-col">
          <h3 className="text-foreground font-bold text-base">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground font-medium">
              {isCompanyPost ? 'Organization Post' : 'Post to Anyone'}
            </p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostIdentity;
