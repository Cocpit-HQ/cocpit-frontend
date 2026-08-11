"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { removeActivity } from "@/features/settings/api/activity";
import toast from "react-hot-toast";

interface TaggedPeoplePopoverProps {
  tags: any[];
  postId?: string;
}

export function TaggedPeoplePopover({ tags: initialTags, postId }: TaggedPeoplePopoverProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [localTags, setLocalTags] = useState(initialTags);
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    setLocalTags(initialTags);
  }, [initialTags]);

  if (!localTags || localTags.length === 0) return null;

  const handleRemoveTag = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!postId || !currentUser?.id) return;
    
    try {
      setIsRemoving(true);
      await removeActivity("tag", postId);
      toast.success("You have removed yourself from this post's tags");
      const updatedTags = localTags.filter(t => (t.id || t.user_id) !== currentUser.id);
      setLocalTags(updatedTags);
      if (updatedTags.length === 0) {
        setIsOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove tag");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-1 hover:bg-secondary rounded-full transition-colors outline-none text-[#000000] dark:text-white data-[state=open]:text-primary">
          <Icon icon="la:user-tag" className="w-[24px] h-[24px]" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px] w-[90%] max-h-[80vh] p-6 rounded-[24px] bg-white dark:bg-card flex flex-col gap-0 overflow-hidden shadow-xl border-none">
        <DialogHeader className="p-0 pb-4 flex flex-col items-center justify-center border-b border-slate-100 dark:border-border">
          <DialogTitle className="text-center text-lg font-medium font-['Poppins'] leading-6 text-black dark:text-foreground">
            Tags
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-1 [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="flex flex-col gap-2">
            {localTags.map((tag: any, idx: number) => {
              const isCurrentUser = currentUser && (tag.id === currentUser.id || tag.user_id === currentUser.id);
              
              return (
                <div 
                  key={idx} 
                  className="self-stretch h-12 flex justify-between items-center gap-4 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-muted transition-colors w-full cursor-pointer group"
                  onClick={(e) => {
                    e.stopPropagation();
                    const isCompany = tag.type === 'company' || tag.type === 'COMPANY' || tag.entity_type === 'COMPANY';
                    const slug = tag.account_name || tag.slug || tag.id || tag.user_id;
                    if (slug) {
                      if (isCompany) {
                        router.push(`/organization/${slug}`);
                      } else {
                        router.push(`/profile/${slug}`);
                      }
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-8 h-8 relative overflow-hidden flex-shrink-0">
                      {tag.avatar_url || tag.avatar || tag.logo_url ? (
                        <img src={tag.avatar_url || tag.avatar || tag.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full border-[1.5px] border-indigo-500 bg-indigo-50/5 flex items-center justify-center text-indigo-500">
                          <Icon icon={(tag.type === 'company' || tag.type === 'COMPANY') ? "lucide:building-2" : "ph:user-light"} className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
                      <div className="text-left text-slate-800 dark:text-foreground text-base font-normal font-['Poppins'] leading-6 truncate w-full">
                        {tag.full_name || tag.name}
                      </div>
                    </div>
                  </div>
                  
                  {isCurrentUser && (
                    <button 
                      onClick={handleRemoveTag}
                      disabled={isRemoving}
                      className="flex items-center gap-2 p-1.5 font-normal text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <span className="text-[14px]">Remove tag</span>
                      <Icon icon="ph:trash-light" className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
