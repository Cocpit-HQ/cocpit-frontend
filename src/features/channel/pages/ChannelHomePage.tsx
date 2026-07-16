'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Channel, ChannelArticle } from '../types/channel.types';
import { useChannelArticles } from '../hooks/useChannelArticles';
import { useSubscriberGrowth } from '../hooks/useSubscriberGrowth';
import { useUpdateChannel } from '../hooks/useUpdateChannel';
import { useDeleteArticle } from '../hooks/useDeleteArticle';
import ChannelHeader from '../components/ChannelHeader';
import SubscriberGrowthChart from '../components/SubscriberGrowthChart';
import ChannelArticlesTabs from '../components/ChannelArticlesTabs';
import CreateChannelModal, { ChannelFormValues } from '../components/CreateChannelModal';
import InviteChannelModal from '../components/InviteChannelModal';
import { CocpitConfirmBox } from '@/shared/commonComponents/CocpitConfirmBox';

interface ChannelHomePageProps {
  channel: Channel;
}

export default function ChannelHomePage({ channel }: ChannelHomePageProps) {
  const router = useRouter();
  const { articles: publishedArticles } = useChannelArticles(channel.id, 'published');
  const { articles: draftArticles } = useChannelArticles(channel.id, 'draft');
  const articles = [...publishedArticles, ...draftArticles];
  const { growth } = useSubscriberGrowth();
  const updateChannel = useUpdateChannel();
  const deleteArticle = useDeleteArticle();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChannelArticle | null>(null);

  const handleUpdate = (values: ChannelFormValues) => {
    updateChannel.mutate(
      { id: channel.id, input: values },
      { onSuccess: () => setIsEditOpen(false) }
    );
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <ChannelHeader channel={channel} onEdit={() => setIsEditOpen(true)} onInvite={() => setIsInviteOpen(true)} />

      <SubscriberGrowthChart data={growth} totalSubscribers={channel.subscriberCount} />

      <ChannelArticlesTabs
        articles={articles}
        onSelectPublished={(article) => router.push(`/channel/article/${article.id}`)}
        onEditDraft={(article) => router.push(`/channel/write?id=${article.id}`)}
        onDeleteDraft={(article) => setDeleteTarget(article)}
      />

      <CreateChannelModal
        isOpen={isEditOpen}
        mode="edit"
        initialValues={{ name: channel.name, description: channel.description || '', bannerUrl: channel.bannerUrl || '' }}
        isSubmitting={updateChannel.isPending}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
      />

      <InviteChannelModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

      <CocpitConfirmBox
        isOpen={!!deleteTarget}
        title="Are you sure you want to delete your article?"
        message="This cannot be undone"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (deleteTarget) {
            deleteArticle.mutate({ id: deleteTarget.id, orgId: channel.orgId });
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
