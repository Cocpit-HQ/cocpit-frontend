import React from 'react';
import { UserIcon } from '@/components/icons';

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
    ? (currentPoster?.logo_url || currentPoster?.avatar_url || currentPoster?.logo || currentPoster?.image || currentPoster?.company_logo) 
    : (currentUser?.image || currentUser?.avatar || currentUser?.avatar_url);
  const avatar = rawAvatar && rawAvatar !== '/assets/pngegg.png' ? rawAvatar : null;

  return (
    <div className={`px-6 py-6 border-b border-ds-border ${className} font-dmsans`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-ds-surface-2 text-ds-text-primary flex items-center justify-center font-semibold text-base overflow-hidden shrink-0 shadow-sm font-dmsans select-none relative p-2">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover z-10"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <UserIcon className="w-full h-full text-ds-text-primary" />
          )}
        </div>
        <div className="flex flex-col">
          <h3 className="ds-text-body-2 text-ds-text-primary">
            {name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="ds-text-small text-ds-text-secondary">
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
