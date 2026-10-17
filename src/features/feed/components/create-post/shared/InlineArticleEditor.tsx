'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ArticleFlow from '../post-types/ArticleFlow';
import { useCreatePostForm } from '@/features/feed/hooks/use-create-post-form';
import { useUIStore } from '@/store/ui.store';
import { Loader2, X } from 'lucide-react';

interface InlineArticleEditorProps {
  editPostId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function InlineArticleEditor({ editPostId, onClose, onSuccess }: InlineArticleEditorProps) {
  const router = useRouter();
  const { setArticleMode } = useUIStore();
  const isSavingRef = useRef(false);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const isEdit = !!editPostId;

  useEffect(() => {
    setArticleMode(true);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('cocpit_is_article_mode', 'true');
      }
    } catch (e) {}
  }, [setArticleMode]);

  const formActionsRef = useRef<{ resetForm: (clearDraft?: boolean) => void; clearMedia: () => void } | null>(null);

  const handleClose = () => {
    if (isSavingRef.current) return; // Prevent double navigation when handlePost calls onClose

    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('cocpit_article_draft');
        sessionStorage.removeItem('cocpit_is_article_mode');
      }
    } catch (e) {}

    const { setArticleMode, setActiveModal, setArticleDraft } = useUIStore.getState();
    setArticleDraft(null);
    setArticleMode(false);
    setActiveModal(null);
    formActionsRef.current?.resetForm(true);
    formActionsRef.current?.clearMedia();

    if (onClose) {
      onClose();
    } else {
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back();
      } else {
        const savedPath = typeof window !== 'undefined' ? sessionStorage.getItem('cocpit_scroll_path') : null;
        router.push(savedPath || '/feed');
      }
    }
  };

  const { state, media, actions } = useCreatePostForm({
    isOpen: true,
    onClose: handleClose,
    initialPostType: 'article',
    isMobile,
    editPostId,
  });

  formActionsRef.current = { resetForm: actions.resetForm, clearMedia: media.clearMedia };

  if (isEdit && state.isLoadingPost) {
    return (
      <main className="min-h-screen w-full bg-ds-bg flex items-center justify-center relative z-10 font-dm-sans">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="relative h-screen w-full bg-ds-bg text-ds-text-primary font-dm-sans select-none overflow-hidden flex flex-col">
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
        onPost={async (inlineFiles, cleanContent) => {
            isSavingRef.current = true;
            try {
              await actions.handlePost(inlineFiles, cleanContent);
              try {
                if (typeof window !== 'undefined') {
                  sessionStorage.removeItem('cocpit_article_draft');
                  sessionStorage.removeItem('cocpit_is_article_mode');
                  sessionStorage.removeItem('scroll-/feed');
                }
              } catch (e) {}
              if (onSuccess) {
                onSuccess();
              } else {
                setArticleMode(false);
                router.push('/feed');
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
            setActiveModal(null);
          }
        }}
        inlineFiles={state.inlineFiles}
        setInlineFiles={state.setInlineFiles}
      />
    </main>
  );
}
