"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { BusinessBuildingIcon } from "@/components/icons";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { PeopleListModal } from "@/shared/commonComponents/PeopleListModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { removeActivity } from "@/features/settings/api/activity";
import { ActionConfirmModal } from "@/shared/commonComponents/ActionConfirmModal";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface TaggedPeoplePopoverProps {
  tags: any[];
  postId?: string;
}

export function TaggedPeoplePopover({ tags: initialTags, postId }: TaggedPeoplePopoverProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [localTags, setLocalTags] = useState(initialTags);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    setLocalTags(initialTags);
  }, [initialTags]);

  if (!localTags || localTags.length === 0) return null;

  const handleOpenConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmOpen(true);
  };

  const handleConfirmRemoveTag = async () => {
    const activeActorId = api.defaults.headers.common["x-actor-id"] || currentUser?.id;
    if (!postId || !activeActorId) return;

    try {
      setIsRemoving(true);
      await removeActivity("tag", postId);
      toast.success("You have removed yourself from this post's tags");
      const updatedTags = localTags.filter((t) => (t.id || t.user_id) !== activeActorId);
      setLocalTags(updatedTags);
      setIsConfirmOpen(false);
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
    <>
      {/* Trigger button — needs its own Dialog context */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <button className="p-1 hover:bg-secondary rounded-full transition-colors outline-none text-[#000000] dark:text-white data-[state=open]:text-primary">
            <Icon icon="la:user-tag" className="w-[24px] h-[24px]" />
          </button>
        </DialogTrigger>
      </Dialog>

      {/* Modal shell */}
      <PeopleListModal
        title="Tagged"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        {localTags.map((tag: any, idx: number) => {
          const activeActorId = api.defaults.headers.common["x-actor-id"] || currentUser?.id;
          const isCurrentActor =
            activeActorId && (tag.id === activeActorId || tag.user_id === activeActorId);

          const isCompany = String(tag.type || tag.entity_type || '').toLowerCase() === "company";
          const roundedClass = isCompany ? "rounded-[8px]" : "rounded-full";

          return (
            <div
              key={idx}
              className="self-stretch h-12 flex justify-between items-center gap-4 px-2 rounded-xl transition-colors w-full"
            >
              <div
                className="flex items-center gap-4 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
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
                <div className={`w-8 h-8 relative overflow-hidden flex-shrink-0 ${roundedClass}`}>
                  {tag.avatar_url || tag.avatar || tag.logo_url ? (
                    <img
                      src={tag.avatar_url || tag.avatar || tag.logo_url}
                      alt=""
                      className={`w-full h-full object-cover ${roundedClass}`}
                    />
                  ) : (
                    <div className={`w-8 h-8 ${roundedClass} border border-ds-border bg-ds-surface-1 flex items-center justify-center text-ds-text-secondary`}>
                      {isCompany ? (
                        <BusinessBuildingIcon className="w-5 h-5 text-ds-text-primary" />
                      ) : (
                        <Icon
                          icon="ph:user-light"
                          className="w-5 h-5"
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center items-start">
                  <div className="text-left text-slate-800 dark:text-foreground text-base font-normal font-['Poppins'] leading-6 truncate w-full hover:underline">
                    {tag.full_name || tag.name}
                  </div>
                </div>
              </div>

              {isCurrentActor && (
                <button
                  onClick={handleOpenConfirm}
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
      </PeopleListModal>

      <ActionConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmRemoveTag}
        type="remove_tag"
        isLoading={isRemoving}
      />
    </>
  );
}
