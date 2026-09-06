/* DEPRECATED
DEPRECATED\n// import React from 'react';
import { X, ChevronDown, Check, Zap } from 'lucide-react';
import VisibilityToggle from './shared/VisibilityToggle';
import { PostVisibility } from '@/types/entities';

interface CreatePostHeaderProps {
  onClose: () => void;
  isCompanyPost: boolean;
  currentPosterName: string;
  currentPosterLogo: string;
  visibility: PostVisibility;
  onVisibilityToggle: () => void;
  userCompanies: any[];
  onContextSwitch: (id: string | null) => void;
  currentUser: any;
  isMobile: boolean;
  isEdit: boolean;
  activeCompanyId: string | null;
}

const CreatePostHeader = ({
  onClose,
  isCompanyPost,
  currentPosterName,
  currentPosterLogo,
  visibility,
  onVisibilityToggle,
  userCompanies,
  onContextSwitch,
  currentUser,
  isMobile,
  isEdit,
  activeCompanyId
}: CreatePostHeaderProps) => {

  const [showAccountSelector, setShowAccountSelector] = React.useState(false);

  if (isMobile) {
    return (
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center flex-grow">
          <button 
            onClick={() => !isEdit && setShowAccountSelector(!showAccountSelector)}
            className="flex items-center gap-1.5"
            disabled={isEdit}
          >
            <span className="text-sm font-bold truncate max-w-[120px]">{currentPosterName}</span>
            {!isEdit && <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAccountSelector ? 'rotate-180' : ''}`} />}
          </button>
          <VisibilityToggle visibility={visibility} onToggle={onVisibilityToggle} isMobile={true} />
        </div>
        <div className="w-10" /> {/* Spacer * /}

        {showAccountSelector && !isEdit && (
          <AccountSelectorOverlay 
             userCompanies={userCompanies} 
             onSelect={onContextSwitch} 
             currentUser={currentUser} 
             onClose={() => setShowAccountSelector(false)} 
             activeCompanyId={activeCompanyId}
             isCompanyPost={isCompanyPost}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => !isEdit && setShowAccountSelector(!showAccountSelector)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-colors border border-border/50 group"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden border border-border shadow-sm bg-white text-[#6366F1] flex items-center justify-center font-semibold text-xs relative">
              {currentPosterLogo ? (
                <>
                  <img src={currentPosterLogo} alt={currentPosterName} className="w-full h-full object-cover relative z-10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <span className="absolute inset-0 flex items-center justify-center z-0">
                    {(currentPosterName || 'O').charAt(0).toUpperCase()}
                  </span>
                </>
              ) : (
                <span>{(currentPosterName || 'O').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="text-xs font-semibold max-w-[100px] truncate">{currentPosterName}</span>
            {!isEdit && <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showAccountSelector ? 'rotate-180' : ''}`} />}
          </button>

          {showAccountSelector && !isEdit && (
             <div className="absolute top-full left-0 mt-2 w-64 bg-popover border rounded-xl shadow-2xl z-[100] animate-in fade-in-0 zoom-in-95 backdrop-blur-sm overflow-hidden">
                <div className="p-2 max-h-[300px] overflow-y-auto">
                   <button
                     onClick={() => { onContextSwitch(null); setShowAccountSelector(false); }}
                     className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                   >
                     <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-xs border overflow-hidden shrink-0 font-['Poppins'] select-none">
                       {currentUser?.image && currentUser.image !== '/assets/pngegg.png' ? (
                         <img src={currentUser.image} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                       ) : (
                         <span>{(currentUser?.name || 'U').charAt(0).toUpperCase()}</span>
                       )}
                     </div>
                     <div className="flex-grow flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">{currentUser?.name}</span>
                        <span className="text-[10px] text-muted-foreground">Personal Account</span>
                     </div>
                     {!isCompanyPost && <Check className="w-4 h-4 text-primary shrink-0" />}
                   </button>
                   <div className="h-px bg-border my-2" />
                   {userCompanies.map(c => {
                     const cid = c.company_id || c.org_id;
                     return (
                       <button
                         key={cid}
                         onClick={() => { onContextSwitch(cid); setShowAccountSelector(false); }}
                         className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left"
                       >
                          <div className="w-8 h-8 rounded-full bg-white text-[#6366F1] flex items-center justify-center font-semibold text-xs border overflow-hidden shrink-0 font-['Poppins'] select-none">
                            {(c.logo_url || c.avatar_url) && (c.logo_url || c.avatar_url) !== '/assets/pngegg.png' ? (
                              <img src={c.logo_url || c.avatar_url} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            ) : (
                              <span>{(c.name || 'O').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-grow flex flex-col min-w-0">
                             <span className="text-xs font-bold truncate">{c.name}</span>
                             <span className="text-[10px] text-muted-foreground">Organization</span>
                          </div>
                          {isCompanyPost && cid === activeCompanyId && <Check className="w-4 h-4 text-primary shrink-0" />}
                       </button>
                     );
                   })}
                </div>
             </div>
          )}
        </div>
        <VisibilityToggle visibility={visibility} onToggle={onVisibilityToggle} />
      </div>

      <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

const AccountSelectorOverlay = ({ userCompanies, onSelect, currentUser, onClose, activeCompanyId, isCompanyPost }: any) => (
  <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="w-full max-w-sm bg-background border rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-10">
      <div className="p-4 border-b flex justify-between items-center bg-muted/20">
        <span className="font-bold">Post as...</span>
        <button onClick={onClose}><X className="w-5 h-5" /></button>
      </div>
      <div className="p-2 space-y-1">
        <button
          onClick={() => { onSelect(null); onClose(); }}
          className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-semibold text-base border shadow-sm overflow-hidden shrink-0 font-['Poppins'] select-none">
            {currentUser?.image && currentUser.image !== '/assets/pngegg.png' ? (
              <img src={currentUser.image} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span>{(currentUser?.name || 'U').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col text-left flex-grow">
            <span className="font-bold">{currentUser?.name}</span>
            <span className="text-xs text-muted-foreground">Your personal profile</span>
          </div>
          {!isCompanyPost && <Check className="w-5 h-5 text-primary" />}
        </button>
        {userCompanies.map((c: any) => {
          const cid = c.company_id || c.org_id;
          return (
            <button
              key={cid}
              onClick={() => { onSelect(cid); onClose(); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted border border-transparent hover:border-border transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-white text-[#6366F1] flex items-center justify-center font-semibold text-base border shadow-sm overflow-hidden shrink-0 font-['Poppins'] select-none">
                {(c.logo_url || c.avatar_url) && (c.logo_url || c.avatar_url) !== '/assets/pngegg.png' ? (
                  <img src={c.logo_url || c.avatar_url} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span>{(c.name || 'O').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex flex-col text-left flex-grow">
                <span className="font-bold">{c.name}</span>
                <span className="text-xs text-muted-foreground">Organization</span>
              </div>
              {isCompanyPost && cid === activeCompanyId && <Check className="w-5 h-5 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  </div>
);

export default CreatePostHeader;

*/
export {};
