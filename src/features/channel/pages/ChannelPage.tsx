'use client';

import React, { useState } from 'react';
import { Loader2, ShieldOff } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useMyChannel } from '../hooks/useMyChannel';
import { useCreateChannel } from '../hooks/useCreateChannel';
import ChannelEmptyState from '../components/ChannelEmptyState';
import CreateChannelModal, { ChannelFormValues } from '../components/CreateChannelModal';
import ChannelHomePage from './ChannelHomePage';

export default function ChannelPage() {
  const { activeProfile } = useActiveProfile();
  const { channel, isLoading, error } = useMyChannel();
  const createChannel = useCreateChannel();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleCreate = (values: ChannelFormValues) => {
    createChannel.mutate(
      { ...values, orgId: activeProfile?.id },
      { onSuccess: () => setIsCreateOpen(false) }
    );
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#1A73E8]" />
      </div>
    );
  }

  // Show unauthorized state when API returns 403
  const is403 = (error as any)?.response?.status === 403;
  if (is403) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-24 gap-4 text-center">
        <ShieldOff className="w-12 h-12 text-red-400" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Access Restricted</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          You don&apos;t have permission to view this channel. Contact your administrator to update your role.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1128px] mx-auto min-h-screen bg-white dark:bg-[#0F1115] pt-4 md:pt-6 pb-8 px-4 xl:px-0">
      <div className="w-full max-w-[998px] mx-auto">
        {channel ? (
          <ChannelHomePage channel={channel} />
        ) : (
          <ChannelEmptyState onCreateChannel={() => setIsCreateOpen(true)} />
        )}

        <CreateChannelModal
          isOpen={isCreateOpen}
          mode="create"
          isSubmitting={createChannel.isPending}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
        />
      </div>
    </div>
  );
}
