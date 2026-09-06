'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Loader2 } from 'lucide-react';
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
    <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[#2D2E36] flex items-center justify-center text-white text-sm font-semibold shrink-0 border border-zinc-700/50 select-none">
      {hasValidAvatar ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
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
          className="fixed left-[50%] top-[50%] z-[101] w-full max-w-[420px] translate-x-[-50%] translate-y-[-50%] rounded-[20px] border border-zinc-800 bg-[#212127] p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-center pb-5 mb-2 border-b border-zinc-800/60">
            <DialogPrimitive.Title className="text-[17px] font-semibold text-white tracking-wide">
              Voters list
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              onClick={onClose}
              className="absolute right-0 top-0 p-1 text-zinc-400 hover:text-white rounded-full transition-colors outline-none focus:outline-none cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Body with hidden scrollbar */}
          <div className="max-h-[360px] overflow-y-auto flex flex-col gap-3.5 pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-2.5">
                <Loader2 className="w-6 h-6 animate-spin text-[#F95B14]" />
                <span className="text-[13px] font-medium">Loading voters...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-zinc-400 text-sm">
                {error}
              </div>
            ) : voters.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-sm">
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

                return (
                  <div
                    key={voter.id || `${voter.user_id || voter.org_id}-${index}`}
                    className="flex items-center justify-between gap-3 py-0.5"
                  >
                    {/* User / Company Info (Avatar + Name) */}
                    <Link
                      href={profileHref}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                      className="flex items-center gap-3 min-w-0 group hover:opacity-90 transition-opacity"
                    >
                      <VoterAvatar avatarUrl={voter.avatar_url} name={name} />

                      {/* Name */}
                      <span className="text-[14px] font-medium text-white group-hover:text-zinc-200 truncate">
                        {name}
                      </span>
                    </Link>

                    {/* Voted Option Label on Right */}
                    <span className="text-[14px] font-medium text-zinc-300 shrink-0 select-none">
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
