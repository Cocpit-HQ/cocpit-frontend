'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import ArticleFlow from '@/features/feed/components/create-post/post-types/ArticleFlow';
import { MediaItem } from '@/features/feed/types';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useMyChannel } from '../hooks/useMyChannel';
import { useChannelArticle } from '../hooks/useChannelArticles';
import { useCreateArticle, useUpdateArticle } from '../hooks/useSaveArticle';
import { ArticleInput } from '../services/channel.service';

interface ChannelArticleEditorProps {
  articleId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const plainText = (html: string) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

export default function ChannelArticleEditor({ articleId, onClose, onSuccess }: ChannelArticleEditorProps) {
  const { activeProfile } = useActiveProfile();
  const { channel, isLoading: isChannelLoading } = useMyChannel();
  const { article: existingArticle, isLoading: isArticleLoading } = useChannelArticle(articleId);
  const createArticle = useCreateArticle();
  const updateArticle = useUpdateArticle();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [coverImage, setCoverImage] = useState<MediaItem | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (existingArticle && !hydrated) {
      setTitle(existingArticle.title);
      setContent(existingArticle.content);
      setCaption(existingArticle.excerpt);
      setCoverImage(
        existingArticle.coverImage
          ? { id: 'existing-cover', url: existingArticle.coverImage, type: 'image', crop: { x: 0, y: 0 }, zoom: 1 }
          : null
      );
      setHydrated(true);
    }
  }, [existingArticle, hydrated]);

  const isSubmitting = createArticle.isPending || updateArticle.isPending;
  // Already-published articles save straight through (no re-publish flow); anything else
  // (new articles, in-progress drafts) walks the full write -> preview -> Post flow.
  const isEditingPublished = existingArticle?.status === 'published';


  const buildInput = (status: 'published' | 'draft'): ArticleInput => ({
    title: title.trim() || 'Untitled article',
    content,
    coverImage: coverImage?.url || null,
    excerpt: caption.trim() || plainText(content).slice(0, 140),
    status,
  });

  const persist = async (status: 'published' | 'draft', inlineFiles: File[] = []) => {
    if (!channel) return;
    if (existingArticle) {
      await updateArticle.mutateAsync({ id: existingArticle.id, channelId: channel.orgId, input: buildInput(status), files: inlineFiles });
    } else {
      await createArticle.mutateAsync({ channelId: channel.orgId, input: buildInput(status), files: inlineFiles });
    }
  };

  const handlePost = async (inlineFiles?: File[]) => {
    await persist('published', inlineFiles || []);
    onSuccess();
  };

  const handleClose = async (inlineFiles?: File[]) => {
    const hasContent = title.trim().length > 0 || plainText(content).length > 0;
    if (hasContent && !isEditingPublished) {
      await persist('draft', inlineFiles || []);
    }
    onClose();
  };

  if (isChannelLoading || (articleId && isArticleLoading)) {
    return (
      <div className="w-full bg-white dark:bg-[#0F1115] rounded-2xl min-h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A73E8]" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#0F1115] rounded-2xl h-full max-h-full flex flex-col relative z-10 overflow-hidden">
      <ArticleFlow
        title={title}
        onTitleChange={setTitle}
        content={content}
        onContentChange={setContent}
        coverImage={coverImage}
        onCoverChange={(url) => {
          if (url) {
            setCoverImage({ id: `cover-${Date.now()}`, url, type: 'image', crop: { x: 0, y: 0 }, zoom: 1, isExisting: true });
          } else {
            setCoverImage(null);
          }
        }}
        onRemoveCover={() => setCoverImage(null)}
        isEdit={isEditingPublished}
        caption={caption}
        onCaptionChange={setCaption}
        onPost={handlePost}
        isSubmitting={isSubmitting}
        onClose={handleClose}
        currentUser={{ name: activeProfile?.name, image: activeProfile?.avatar_url }}
        currentPoster={{ 
          name: channel?.name || activeProfile?.name, 
          company_name: activeProfile?.name,
          org_slug: activeProfile?.slug, 
          logo_url: channel?.logoUrl || activeProfile?.avatar_url 
        }}
        isCompanyPost={true}
        skipNextStep={true}
      />
    </div>
  );
}
