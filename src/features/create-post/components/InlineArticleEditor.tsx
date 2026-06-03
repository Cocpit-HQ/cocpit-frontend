'use client';

import React, { useRef } from 'react';
import ArticleFlow from '@/features/create-post/components/flows/ArticleFlow';
import { useCreatePostForm } from '@/features/create-post/hooks/use-create-post-form';
import { useUIStore } from '@/store/ui.store';

export default function InlineArticleEditor() {
  const { setArticleMode } = useUIStore();
  const articleCoverInputRef = useRef<HTMLInputElement>(null);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const { state, media, actions } = useCreatePostForm({
    isOpen: true,
    onClose: () => setArticleMode(false),
    initialPostType: 'article',
    isMobile,
  });

  return (
    <div className="w-full bg-white dark:bg-[#1a1a2e] rounded-2xl min-h-[800px] flex flex-col relative z-10 lg:col-span-12 xl:col-span-12 max-w-none">
      <ArticleFlow
        title={state.articleTitle}
        onTitleChange={state.setArticleTitle}
        content={state.articleContent}
        onContentChange={state.setArticleContent}
        coverImage={media.uploadedImages[0] || null}
        onCoverUpload={(e) => media.handlePhotoUpload(e, false)}
        onRemoveCover={() => media.clearMedia()}
        isEdit={false}
        coverInputRef={articleCoverInputRef}
        caption={state.description}
        onCaptionChange={state.setDescription}
        onPost={async () => {
            await actions.handlePost();
            setArticleMode(false);
        }}
        isSubmitting={state.isSubmitting}
        onClose={() => {
          const { setArticleMode, setActiveModal, setArticleDraft } = useUIStore.getState();
          setArticleDraft(null);
          setArticleMode(false);
          setActiveModal('create-post');
        }}
        currentUser={state.currentUser}
        currentPoster={state.currentPoster}
        isCompanyPost={state.isCompanyPost}
        onArticleComplete={(data) => {
          const { setArticleMode, setActiveModal, setArticleDraft } = useUIStore.getState();
          setArticleDraft({
            title: state.articleTitle,
            content: state.articleContent,
            coverImage: media.uploadedImages[0] || null,
            description: state.description,
            articleData: data
          });
          setArticleMode(false);
          setActiveModal('create-post');
        }}
      />
    </div>
  );
}
