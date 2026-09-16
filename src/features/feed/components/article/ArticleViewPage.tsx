'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, MoreHorizontal } from 'lucide-react';

import { Post } from '@/types/entities';
import { FeedPostProps } from '../../types';
import { getPostById, deletePost } from '@/services/api/posts';
import { mapBackendPostToFrontend } from '@/lib/mappers/feed.mapper';
import { sanitizeArticleHtmlForDisplay } from '@/lib/sanitizeArticleHtml';
import { constrainImageToBox } from '@/features/feed/utils/constrainArticleImage';
import { getPostMenuAccess } from '../../utils/postMenuAccess';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { useSocial } from '@/context/SocialContext';
import { companyProfileService } from '@/features/companyprofile/services/companyprofile.service';
import { usePostInteractions } from '../../hooks/use-post-interactions';
import { PostActions } from '../parts/PostActions';
import { LikeBar } from '../parts/LikeBar';
import { PostOptionsMenu } from '../parts/PostOptionsMenu';
import { submitPostFeedback } from '@/services/api/feed';
import { useFeed } from '@/hooks/use-feed';
import { useUIStore } from '@/store/ui.store';
import CommentSection from '../comments/CommentSection';
import api from '@/lib/axios';

const DeleteConfirmationModal = dynamic(
  () => import('@/components/shared/DeleteConfirmationModal').then((m) => m.DeleteConfirmationModal),
  { ssr: false }
);
const SavePostModal = dynamic(
  () => import('@/shared/commonComponents/SavePostModal').then((m) => m.SavePostModal),
  { ssr: false }
);
const LikesModal = dynamic(
  () => import('@/shared/commonComponents/LikesModal').then((m) => m.LikesModal),
  { ssr: false }
);
const CocpitShareModel = dynamic(
  () => import('@/shared/commonComponents/cocpitsharemodel'),
  { ssr: false }
);
const ReportModal = dynamic(
  () => import('@/components/shared/ReportModal').then(m => m.ReportModal),
  { ssr: false }
);

interface ArticleContentProps {
  post: Post;
  id: string;
}

function ArticleViewContent({ post, id }: ArticleContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const { userCompanies, activeProfile, isCompany } = useActiveProfile();
  const currentUserId = (session?.user as any)?.id;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);

  // Menu and Reporting states
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  const { reportedPostIds, addReportedPostId, addNotInterestedPostId, addInterestedPostId } = useUIStore();
  const isBackendReported = !!(post as any)?.is_reported || !!(post as any)?.isReported;
  const isReportedInStore = reportedPostIds.includes(id);
  const [isReported, setIsReported] = useState(isReportedInStore || isBackendReported);

  useEffect(() => {
    if (isBackendReported || isReportedInStore) {
      setIsReported(true);
    }
  }, [isBackendReported, isReportedInStore]);

  const { removePostFromFeed } = useFeed(false);

  // Author identity checks
  const isCompanyPost = post.isCompanyPost || false;
  const authorUserId = isCompanyPost
    ? (post.author_org_id || (post as any).companyId)?.toString()
    : (post.authorId || (post as any).author_id)?.toString();

  const isMe = activeProfile?.type === 'COMPANY'
    ? !!(isCompanyPost && activeProfile?.id?.toString() === authorUserId)
    : (currentUserId === authorUserId);

  const menuAccess = getPostMenuAccess({
    isCompanyPost: post.isCompanyPost,
    companyId: post.author_org_id,
    createdByUserId: post.createdByUserId,
    currentUserId: session?.user?.id,
    userCompanies,
    activeProfile,
  });

  const canManage = menuAccess === 'owner';

  // Follow / Unfollow logic
  const { followUser, unfollowUser, isFollowing, isFollowLoading, syncFollowStatus } = useSocial();
  const isAuthorFollowing = authorUserId ? isFollowing(authorUserId) : false;

  const followCompanyMutation = useMutation({
    mutationFn: ({ orgId, sourcePostId }: { orgId: string; sourcePostId?: string }) =>
      companyProfileService.followOrganization(orgId, sourcePostId),
    onSuccess: (_, { orgId }) => {
      syncFollowStatus(orgId, true);
      queryClient.invalidateQueries({ queryKey: ['company_relationship', orgId] });
      queryClient.invalidateQueries({ queryKey: ['company_followers', orgId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const unfollowCompanyMutation = useMutation({
    mutationFn: (orgId: string) => companyProfileService.unfollowOrganization(orgId),
    onSuccess: (_, orgId) => {
      syncFollowStatus(orgId, false);
      queryClient.invalidateQueries({ queryKey: ['company_relationship', orgId] });
      queryClient.invalidateQueries({ queryKey: ['company_followers', orgId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });

  const isFollowActionLoading =
    (authorUserId ? isFollowLoading(authorUserId) : false) ||
    followCompanyMutation.isPending ||
    unfollowCompanyMutation.isPending;

  const handleToggleFollow = () => {
    if (!authorUserId || isFollowActionLoading) return;
    if (isCompanyPost) {
      if (isAuthorFollowing) unfollowCompanyMutation.mutate(authorUserId);
      else followCompanyMutation.mutate({ orgId: authorUserId, sourcePostId: id });
    } else {
      if (isAuthorFollowing) unfollowUser(authorUserId);
      else followUser(authorUserId, id);
    }
  };

  // Interactions (likes, comments count, reposts, bookmarks)
  const interactionsProps = post as unknown as FeedPostProps;
  const {
    isLiked,
    likeCount,
    isCommented,
    isSaved,
    isReposted,
    commentCount,
    shareCount,
    externalShareCount,
    handleLike,
    setIsSaved,
    handleRepostToggle,
    isRepostedWithThoughts,
    incrementCommentCount,
    decrementCommentCount,
  } = usePostInteractions(interactionsProps, true);

  const handleIncrementCommentCount = () => {
    incrementCommentCount();
  };

  const handleDecrementCommentCount = () => {
    decrementCommentCount();
  };

  const handleDirectRepost = async () => {
    try {
      const result = await handleRepostToggle(isCompany, activeProfile?.id);
      if (result && result.post_id) {
        toast.success('Article reposted');
      } else if (result && result.reposted === false) {
        toast.success('Repost removed');
      }
    } catch (err) {
      console.error('Repost error:', err);
    }
  };

  // Navigation handlers
  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };

  const handleEdit = () => {
    router.push(`/article/edit/${id}`);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePost(id, post.isCompanyPost ? post.author_org_id : undefined);
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'] });
      toast.success('Article deleted successfully');
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/feed');
      }
    } catch (err) {
      console.error('Failed to delete article:', err);
      toast.error('Failed to delete article');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Profile link
  const authorProfileHref = isCompanyPost
    ? `/organization/${post.authorSlug || authorUserId}`
    : `/profile/${authorUserId || post.authorSlug}`;

  // Cover image and sanitized body
  const coverImage = post.imageSrc || (post.images && post.images[0]) || null;
  const rawHtml = post.articleBody && post.articleBody.trim() !== '' ? post.articleBody : post.content || '';
  const sanitizedHtml = useMemo(() => sanitizeArticleHtmlForDisplay(rawHtml), [rawHtml]);

  const contentRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const images = Array.from(contentRef.current.querySelectorAll('img'));
    images.forEach((img) => {
      const applyConstraint = (nw: number, nh: number) => {
        if (nw <= 0 || nh <= 0) return;
        const { width, height } = constrainImageToBox(nw, nh);
        img.style.setProperty('width', `${width}px`, 'important');
        img.style.setProperty('height', `${height}px`, 'important');
        img.style.setProperty('max-width', '100%', 'important');
        img.style.setProperty('border-radius', '24px', 'important');
        img.style.setProperty('display', 'block', 'important');

        const wrapper = img.closest('[contenteditable="false"]') as HTMLElement | null;
        if (wrapper) {
          wrapper.style.setProperty('width', `${width}px`, 'important');
          wrapper.style.setProperty('max-width', '100%', 'important');
          wrapper.style.setProperty('border-radius', '24px', 'important');
          wrapper.style.setProperty('overflow', 'hidden', 'important');
          wrapper.style.setProperty('display', 'block', 'important');
        }
      };

      // DOMPurify strips inline `style` attributes, so we cannot rely on the
      // saved inline width/height styles being present on the view page.
      // Instead, read the stored data-natural-w / data-natural-h attributes
      // (which DOMPurify keeps) and apply the constraint immediately.
      const attrNatW = parseInt(img.getAttribute('data-natural-w') || '0', 10);
      const attrNatH = parseInt(img.getAttribute('data-natural-h') || '0', 10);

      if (attrNatW > 0 && attrNatH > 0) {
        // We have stored natural dimensions — apply immediately (no async needed)
        applyConstraint(attrNatW, attrNatH);
      } else if (img.complete && img.naturalWidth > 0) {
        // Fallback: image already decoded by browser
        applyConstraint(img.naturalWidth, img.naturalHeight);
      } else {
        // Fallback: wait for load event (legacy images without data attributes)
        const onLoad = () => {
          img.removeEventListener('load', onLoad);
          applyConstraint(img.naturalWidth, img.naturalHeight);
        };
        img.addEventListener('load', onLoad);
      }
    });
  }, [sanitizedHtml]);



  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 8,
      right: window.innerWidth - rect.right,
    });
    setIsMenuOpen(true);
  };

  const handleReport = () => {
    addReportedPostId(id);
    setIsReportModalOpen(false);
    toast.success('Report submitted successfully');
    router.back();

    // Auto-remove the post from the feed entirely after 15 seconds
    setTimeout(() => {
      removePostFromFeed(id);
    }, 5000);
  };

  const handleReportSuccess = () => {
    setIsReported(true);
    addReportedPostId(id);
    router.back();

    // Auto-remove the post from the feed entirely after 15 seconds
    setTimeout(() => {
      removePostFromFeed(id);
    }, 5000);
  };

  const handleInterested = () => {
    addInterestedPostId(id);
    
    // Fire API in background
    submitPostFeedback({
      item_id: id,
      type: 'INTERESTED',
      session_id: 'default',
      position: 0,
    }).catch(error => {
      console.error("Failed to submit feedback", error);
    });

    router.back();
  };

  const handleNotInterested = () => {
    addNotInterestedPostId(id);

    // Fire API in background using submitPostFeedback
    submitPostFeedback({
      item_id: id,
      type: 'NOT_INTERESTED',
      session_id: 'default',
      position: 0,
    }).catch(error => {
      console.error("Failed to hide post", error);
    });

    router.back();

    // Auto-remove the post from the feed entirely after 5 seconds
    setTimeout(() => {
      removePostFromFeed(id);
    }, 5000);
  };

  return (
    <main className="relative min-h-screen w-full bg-[var(--ds-bg)] text-[var(--ds-text-primary)] overflow-y-auto lg:overflow-hidden font-['DM_Sans']">
      {/* Top Close Button */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed lg:absolute top-4 right-4 md:top-8 md:right-8 z-30 flex h-[20px] w-[20px] items-center justify-center text-[var(--ds-text-primary)] hover:opacity-80 transition-opacity bg-transparent border-none p-0 outline-none cursor-pointer"
        aria-label="Close"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3.75 3.75L16.25 16.25M16.25 3.75L3.75 16.25"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Main Two-Column Centered Layout */}
      <div className="w-full max-w-[935px] mx-auto h-[100dvh] flex flex-col lg:flex-row items-center lg:items-start justify-center gap-[20px] px-4 pt-[max(env(safe-area-inset-top),64px)] pb-[max(env(safe-area-inset-bottom),24px)] lg:pt-[max(env(safe-area-inset-top),80px)] overflow-hidden">
        {/* LEFT COLUMN: Article Content */}
        <article className="no-scrollbar flex w-full max-w-[583px] shrink-0 flex-col items-start gap-[12px] h-full lg:h-full lg:max-h-[766px] lg:overflow-y-auto">
          <div className="flex w-full flex-col items-start gap-[20px] pr-0 lg:pr-2 pb-[120px] lg:pb-0">
            {/* Cover Image */}
            {coverImage && (
              <div className="h-[220px] sm:h-[300px] md:h-[338px] w-full shrink-0 overflow-hidden rounded-[16px] bg-[var(--ds-surface-1)] border border-[var(--ds-border)]">
                <img
                  src={coverImage}
                  alt={post.title || 'Article cover'}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {/* Article Title */}
            <h1 className="m-0 w-full font-['DM_Sans'] text-[28px] sm:text-[34px] md:text-[40px] font-bold leading-[1.2] text-[var(--ds-text-primary)]">
              {post.title || 'Untitled Article'}
            </h1>

            {/* Bulletproof link styling to override any prose defaults */}
            <style dangerouslySetInnerHTML={{
              __html: `
              .article-content a,
              [data-theme="dark"] .article-content a,
              [data-theme="navy"] .article-content a {
                color: var(--ds-accent) !important;
                transition: opacity 0.2s;
              }
              .article-content a:hover,
              [data-theme="dark"] .article-content a:hover,
              [data-theme="navy"] .article-content a:hover {
                opacity: 0.8 !important;
              }
            `}} />

            {/* Article Rich Text Body */}
            <div
              ref={contentRef}
              className="article-content prose prose-invert max-w-none w-full text-[var(--ds-text-primary)]"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
        </article>

        {/* RIGHT COLUMN: Sidebar / Comments Panel */}
        <aside className="box-border flex h-full lg:h-full lg:max-h-[766px] w-full max-w-[583px] lg:w-[300px] shrink-0 flex-col items-start gap-[12px] overflow-hidden rounded-[8px] border border-[var(--ds-border)] bg-[var(--ds-bg)] p-[12px]">
          {/* Author Header */}
          <div className="flex h-[36px] w-full shrink-0 items-center justify-between gap-[8px]">
            <Link
              href={authorProfileHref}
              className="flex h-[36px] items-center gap-[8px] min-w-0 flex-1 hover:opacity-90 transition-opacity"
            >
              {post.authorAvatar ? (
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="h-[32px] w-[32px] rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="h-[32px] w-[32px] rounded-full bg-[var(--ds-surface-2)] text-[var(--ds-text-primary)] flex items-center justify-center font-bold text-xs shrink-0">
                  {(post.author || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex flex-col items-start min-w-0 flex-1">
                <span className="font-['DM_Sans'] text-[16px] font-semibold leading-[24px] text-[var(--ds-text-primary)] truncate max-w-full">
                  {post.author}
                </span>
                <span className="font-['DM_Sans'] text-[10px] font-normal leading-[12px] text-[var(--ds-text-secondary)] truncate max-w-full">
                  {post.authorHeadline || 'Author'}
                </span>
              </div>
            </Link>

            {/* Follow / Following Button */}
            {!isMe && authorUserId && (
              <button
                type="button"
                onClick={handleToggleFollow}
                disabled={isFollowActionLoading}
                className="font-['DM_Sans'] text-[14px] font-medium leading-[20px] text-[var(--ds-accent)] hover:opacity-80 transition-opacity shrink-0 px-1 disabled:opacity-50"
              >
                {isAuthorFollowing ? 'Following' : 'Follow'}
              </button>
            )}

            <div className="flex items-center shrink-0">
              <button
                type="button"
                onClick={handleMenuClick}
                className="flex h-[24px] w-[24px] items-center justify-center rounded hover:bg-[var(--ds-surface-2)] text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)] transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal className="w-[16px] h-[16px]" />
              </button>
            </div>
          </div>

          {/* Comments Section (Scrollable list + input) */}
          <div className="w-full flex-1 min-h-0 flex flex-col">
            <CommentSection
              postId={id}
              isPostOwner={isMe}
              incrementCommentCount={handleIncrementCommentCount}
              decrementCommentCount={handleDecrementCommentCount}
              isSidebar={true}
            />
          </div>

          {/* Bottom Actions Bar */}
          <div className="w-full shrink-0 border-t border-[var(--ds-border)] pt-2 flex flex-col gap-[8px]">
            <LikeBar
              likeCount={likeCount}
              isLiked={isLiked}
              sampleLikerUsername={post.sampleLikerUsername || undefined}
              likedUsers={post.likedUsers || []}
              viewerUsername={session?.user?.name || undefined}
              onShowLikes={() => setIsLikesModalOpen(true)}
              variant="inline"
            />
            <PostActions
              id={id}
              isLiked={isLiked}
              likeCount={likeCount}
              handleLike={() => handleLike(isCompany, activeProfile?.id)}
              isCommentSectionOpen={true}
              isCommented={isCommented}
              commentsCount={commentCount}
              handleToggleCommentSection={() => { }}
              shares={shareCount}
              externalShares={externalShareCount}
              handleShare={() => setIsShareModalOpen(true)}
              handleRepostWithThoughts={() => {
                const { setSharedPostData, setActiveModal } = useUIStore.getState();
                setSharedPostData(post);
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                  setActiveModal('create-post');
                } else {
                  router.push('/feed');
                }
              }}
              handleDirectRepost={handleDirectRepost}
              isReposted={isReposted}
              isRepostedWithThoughts={isRepostedWithThoughts}
              isSaved={!!isSaved}
              setIsSaved={setIsSaved}
              handleSaveToggle={() => setIsSaveModalOpen(true)}
              onShowLikes={() => setIsLikesModalOpen(true)}
              isSharedPost={false}
              hideRepostWithThoughts={false}
            />
          </div>
        </aside>
      </div>

      {/* Modals */}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete article?"
          description="This article will be permanently deleted"
          isDeleting={isDeleting}
        />
      )}

      {isSaveModalOpen && (
        <SavePostModal
          postId={id}
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSaved={() => setIsSaved(true)}
        />
      )}

      {isLikesModalOpen && (
        <LikesModal
          postId={id}
          isOpen={isLikesModalOpen}
          onClose={() => setIsLikesModalOpen(false)}
        />
      )}

      {isShareModalOpen && (
        <CocpitShareModel
          postId={id}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          entityType="article"
        />
      )}

      <PostOptionsMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        position={menuPosition}
        isMe={canManage}
        onEdit={handleEdit}
        onDelete={() => setIsDeleteModalOpen(true)}
        onReport={() => setIsReportModalOpen(true)}
        onInterested={handleInterested}
        onNotInterested={handleNotInterested}
        isReported={isReported}
        isPollPost={false}
      />

      {isReportModalOpen && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSuccess={handleReportSuccess}
          targetId={id}
          targetType="POST"
        />
      )}
    </main>
  );
}

export default function ArticleViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchArticle = async () => {
      try {
        const backendPost = await getPostById(id);
        const mappedPost = mapBackendPostToFrontend(backendPost);

        // Guard: redirect community articles to channel view
        if (mappedPost.is_community_article && mappedPost.communityId) {
          router.replace(`/channels/${mappedPost.communityId}/article/${mappedPost.id}`);
          return;
        }

        // Guard: if post is not an article, redirect to standard post view
        const isArticle = mappedPost.post_type === 'article' || mappedPost.category === 'Article';
        if (!isArticle) {
          router.replace(`/post/${mappedPost.id}`);
          return;
        }

        setPost(mappedPost);
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          console.error('Failed to load article:', err);
        }
        setError('Failed to load article. It may have been deleted.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchArticle();
    }
  }, [id, router]);

  // Track post impression on mount
  useEffect(() => {
    if (!post || !id) return;
    api.post(`/dashboard/post/${id}/impression`).catch(() => { });
  }, [id, post]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[var(--ds-bg)] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--ds-accent)] mb-4" />
        <p className="text-[var(--ds-text-secondary)] font-['DM_Sans'] text-[15px]">
          Loading article...
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen w-full bg-[var(--ds-bg)] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 rounded-2xl border border-[var(--ds-border)] bg-[var(--ds-surface-1)]">
          <p className="text-[var(--ds-error)] font-medium font-['DM_Sans'] mb-4">
            {error || 'Article not found'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[var(--ds-accent)] text-white rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </button>
        </div>
      </div>
    );
  }

  return <ArticleViewContent post={post} id={id} />;
}
