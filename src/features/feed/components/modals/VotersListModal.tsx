'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { CloseCrossIcon } from '@/components/icons';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { getPollAnalytics } from '@/services/api/posts';
import { PollOptionItem } from '../parts/PostPoll';

interface VoterItem {
  id?: string;
  user_id?: string | number;
  org_id?: string;
  is_company?: boolean;
  full_name?: string;
  account_name?: string;
  avatar_url?: string;
  profile_image?: string;
  avatar?: string;
  logo_url?: string;
  image?: string;
  company_logo?: string;
  headline?: string;
  option_id?: string;
  option_text?: string;
}

interface VotersListModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | number;
  options?: PollOptionItem[];
}

const VoterAvatar: React.FC<{ avatarUrl?: string; name: string }> = ({ avatarUrl, name }) => {
  const [imgError, setImgError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const hasValidAvatar = !!avatarUrl && avatarUrl !== '/assets/pngegg.png' && !imgError;

  return (
    <div className="relative w-[20px] h-[20px] rounded-[100px] overflow-hidden bg-ds-surface-1 flex items-center justify-center text-ds-text-primary text-[10px] font-medium shrink-0 flex-none select-none">
      {hasValidAvatar ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover rounded-[100px]"
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
};

export const VotersListModal: React.FC<VotersListModalProps> = ({
  isOpen,
  onClose,
  postId,
  options = [],
}) => {
  const [voters, setVoters] = useState<VoterItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !postId) return;

    let isMounted = true;
    const fetchVoters = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getPollAnalytics(postId.toString());
        if (isMounted) {
          setVoters(data?.voters || []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load voters list');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVoters();

    return () => {
      isMounted = false;
    };
  }, [isOpen, postId]);

  // Helper to resolve option label (Option A, Option B, etc.)
  const getOptionLabel = (voter: VoterItem): string => {
    if (voter.option_text) return voter.option_text;
    if (voter.option_id && options.length > 0) {
      const idx = options.findIndex((opt) => opt.option_id === voter.option_id);
      if (idx !== -1) {
        return `Option ${String.fromCharCode(65 + idx)}`;
      }
    }
    return 'Option A';
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-[101] w-full max-w-[420px] translate-x-[-50%] translate-y-[-50%] rounded-[20px] border border-ds-border bg-ds-surface-2 p-[12px] pb-[12px] shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 outline-none font-dmsans flex flex-col gap-[12px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col gap-[12px]">
            {/* Close row — right-aligned */}
            <div className="flex flex-row justify-end items-center h-[20px]">
              <DialogPrimitive.Close
                onClick={onClose}
                className="text-ds-text-secondary hover:text-ds-text-primary transition-colors outline-none focus:outline-none cursor-pointer"
                aria-label="Close"
              >
                <CloseCrossIcon className="w-5 h-5" />
              </DialogPrimitive.Close>
            </div>
            {/* Title — centered */}
            <DialogPrimitive.Title className="font-dmsans text-[16px] font-medium leading-[24px] text-ds-text-primary text-center">
              Voters list
            </DialogPrimitive.Title>
          </div>

          {/* Body with hidden scrollbar */}
          <div className="max-h-[360px] overflow-y-auto flex flex-col gap-[8px] pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-ds-text-muted gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--ds-accent)]" />
                <span className="font-dmsans text-[13px] font-medium">Loading voters...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-ds-text-muted text-sm font-dmsans">
                {error}
              </div>
            ) : voters.length === 0 ? (
              <div className="text-center py-10 text-ds-text-muted text-sm font-dmsans">
                No votes recorded yet.
              </div>
            ) : (
              voters.map((voter, index) => {
                const name = voter.full_name || voter.account_name || 'Anonymous';
                const isCompany = !!voter.is_company || !!voter.org_id;
                const profileSlug = voter.account_name || voter.org_id || voter.user_id;
                const profileHref = isCompany
                  ? `/organization/${profileSlug}`
                  : `/profile/${profileSlug}`;
                const optionLabel = getOptionLabel(voter);
                const avatarUrl =
                  voter.avatar_url ||
                  voter.profile_image ||
                  voter.avatar ||
                  voter.logo_url ||
                  voter.image ||
                  voter.company_logo;

                return (
                  <div
                    key={voter.id || `${voter.user_id || voter.org_id}-${index}`}
                    className="flex flex-row justify-between items-center gap-[8px] h-[36px] w-full self-stretch"
                  >
                    {/* User / Company Info (Avatar + Name) */}
                    <Link
                      href={profileHref}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="flex flex-row items-center gap-[8px] h-[20px] min-w-0 group hover:opacity-90 transition-opacity"
                    >
                      <VoterAvatar avatarUrl={avatarUrl} name={name} />

                      {/* Name */}
                      <span className="font-dmsans text-[14px] font-normal leading-[20px] text-ds-text-primary group-hover:text-ds-text-secondary truncate">
                        {name}
                      </span>
                    </Link>

                    {/* Voted Option Label on Right */}
                    <span className="font-dmsans text-[14px] font-normal leading-[20px] text-ds-text-primary shrink-0 select-none">
                      {optionLabel}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

export default VotersListModal;
