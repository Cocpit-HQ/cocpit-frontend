/* DEPRECATED
DEPRECATED\n// import React from 'react';
import { Send, Zap, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface CreatePostFooterProps {
  onPost: () => void;
  isSubmitting: boolean;
  isMobile: boolean;
  isEdit: boolean;
  isCompanyPost: boolean;
  notifyEmployees: boolean;
  onNotifyEmployeesToggle: (checked: boolean) => void;
  isBroadcast: boolean;
  onBroadcastToggle: (checked: boolean) => void;
  postType: string;
}

const CreatePostFooter = ({
  onPost,
  isSubmitting,
  isMobile,
  isEdit,
  isCompanyPost,
  notifyEmployees,
  onNotifyEmployeesToggle,
  isBroadcast,
  onBroadcastToggle,
  postType
}: CreatePostFooterProps) => {

  const getButtonText = () => {
    if (isSubmitting) return isEdit ? 'Saving...' : 'Publishing...';
    if (isEdit) return 'Save';
    return isBroadcast ? 'Broadcast Now' : 'Publish Post';
  };

  return (
    <div className={`flex flex-col gap-4 px-6 py-4 border-t border-border shrink-0 ${isMobile ? 'bg-background' : 'bg-card'}`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          {isCompanyPost && !isEdit && (
            <div className="flex items-center space-x-2 group">
              <Checkbox
                id="notifyEmployees"
                checked={notifyEmployees}
                onCheckedChange={(checked) => onNotifyEmployeesToggle(!!checked)}
                className="w-5 h-5 border-2 border-border/50 data-[state=checked]:bg-primary transition-all duration-300"
              />
              <Label
                htmlFor="notifyEmployees"
                className="text-sm font-medium leading-none cursor-pointer group-hover:text-primary transition-colors select-none"
              >
                Notify Employees
              </Label>
            </div>
          )}

          {isCompanyPost && !isEdit && (
            <div className="flex items-center space-x-2 group">
              <Checkbox
                id="isBroadcast"
                checked={isBroadcast}
                onCheckedChange={(checked) => onBroadcastToggle(!!checked)}
                className="w-5 h-5 border-2 border-border/50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 transition-all duration-300"
              />
              <Label
                htmlFor="isBroadcast"
                className="text-sm font-medium leading-none cursor-pointer group-hover:text-amber-500 transition-colors flex items-center gap-1.5 select-none"
              >
                <Zap className={`w-3.5 h-3.5 ${isBroadcast ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground'}`} />
                Broadcast Mode
              </Label>
            </div>
          )}
        </div>

        <button
          onClick={onPost}
          disabled={isSubmitting}
          className={`
            flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-all duration-300 transform active:scale-95
            ${isBroadcast 
              ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-amber-500/20' 
              : 'bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20'}
            ${isSubmitting ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.02]'}
            ${isMobile ? 'w-full' : 'sm:w-auto min-w-[140px]'}
          `}
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            isBroadcast ? <Zap className="w-4 h-4 fill-white" /> : <Send className="w-4 h-4" />
          )}
          {getButtonText()}
        </button>
      </div>

      
      {isBroadcast && !isEdit && (
        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider text-center sm:text-right animate-pulse">
           Broadcast post will be featured across all connected organization feeds
        </p>
      )}
    </div>
  );
};

export default CreatePostFooter;

*/
export {};
