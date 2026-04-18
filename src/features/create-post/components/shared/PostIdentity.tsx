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
    
  const avatar = isCompanyPost 
    ? (currentPoster?.logo_url || currentPoster?.avatar_url || '/assets/pngegg.png') 
    : (currentUser?.image || '/assets/pngegg.png');

  return (
    <div className={`px-6 py-6 border-b border-border/50 ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden shrink-0 shadow-md">
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover"
          />
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
