/* DEPRECATED
DEPRECATED\n// 'use client';

import React, { useRef } from 'react';
import ArticleFlow from '@/features/create-post/components/flows/ArticleFlow';
import { useCreatePostForm } from '@/features/create-post/hooks/use-create-post-form';
import { useUIStore } from '@/store/ui.store';
import { Loader2 } from 'lucide-react';

interface InlineArticleEditorProps {
  editPostId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function InlineArticleEditor({ editPostId, onClose, onSuccess }: InlineArticleEditorProps) {
  const { setArticleMode } = useUIStore();
  const isSavingRef = useRef(false);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const isEdit = !!editPostId;

  const handleClose = () => {
    if (isSavingRef.current) return; // Prevent double navigation when handlePost calls onClose

    if (onClose) {
      onClose();
    } else {
      const { setArticleMode, setActiveModal, setArticleDraft } = useUIStore.getState();
      setArticleDraft(null);
      setArticleMode(false);
      setActiveModal('create-post');
    }
  };

  const { state, media, actions } = useCreatePostForm({
    isOpen: true,
    onClose: handleClose,
    initialPostType: 'article',
    isMobile,
    editPostId,
  });

  if (isEdit && state.isLoadingPost) {
    return (
      <div className="w-full bg-white dark:bg-[#1a1a2e] rounded-2xl min-h-[800px] flex items-center justify-center relative z-10 lg:col-span-12 xl:col-span-12 max-w-none">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#1a1a2e] rounded-2xl h-[calc(100vh-80px)] max-h-[850px] flex flex-col relative z-10 lg:col-span-12 xl:col-span-12 max-w-none overflow-hidden">
      <ArticleFlow
        title={state.articleTitle}
        onTitleChange={state.setArticleTitle}
        content={state.articleContent}
        onContentChange={state.setArticleContent}
        coverImage={media.uploadedImages[0] || null}
        onCoverChange={(url) => {
          if (url) {
            media.setUploadedImages([{ id: `cover-${Date.now()}`, url, type: 'image', crop: { x: 0, y: 0 }, zoom: 1, isExisting: true }]);
          } else {
            media.clearMedia();
          }
        }}
        onRemoveCover={() => media.clearMedia()}
        isEdit={isEdit}
        caption={state.description}
        onCaptionChange={state.setDescription}
        onPost={async (inlineFiles) => {
            isSavingRef.current = true;
            try {
              await actions.handlePost(inlineFiles);
              if (onSuccess) {
                onSuccess();
              } else {
                setArticleMode(false);
              }
            } finally {
              isSavingRef.current = false;
            }
        }}
        isSubmitting={state.isSubmitting}
        onClose={handleClose}
        currentUser={state.currentUser}
        currentPoster={state.currentPoster}
        isCompanyPost={state.isCompanyPost}
        onArticleComplete={(data) => {
          if (onSuccess) {
             onSuccess();
          } else {
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
          }
        }}
        inlineFiles={state.inlineFiles}
        setInlineFiles={state.setInlineFiles}
      />
    </div>
  );
}

*/
export {};
