'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useMyChannel } from '../hooks/useMyChannel';
import { useCreateChannel } from '../hooks/useCreateChannel';
import ChannelEmptyState from '../components/ChannelEmptyState';
import CreateChannelModal, { ChannelFormValues } from '../components/CreateChannelModal';
import ChannelHomePage from './ChannelHomePage';

export default function ChannelPage() {
  const { activeProfile } = useActiveProfile();
  const { channel, isLoading } = useMyChannel();
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
