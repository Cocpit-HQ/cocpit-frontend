import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { usePostUpload } from '@/context/PostUploadContext';
import { useFeed } from '@/hooks/use-feed';
import { toast } from 'sonner';
import { PostType, CategoryType, CreatePostModalProps, MediaItem } from '../types';
import { usePostMedia } from './use-post-media';
import { usePostPoll } from './use-post-poll';
import { postApi } from '../api/post.api';
import { sanitizeContent } from '@/lib/contentSanitizer';
import { Post, PostVisibility } from '@/types/entities';
import { LocationSuggestion, StructuredLocation } from '@/services/api/location';
import { useUIStore } from '@/store/ui.store';

const USER_CATEGORIES: CategoryType[] = ['Personal', 'Professional', 'Achievement'];
const COMPANY_CATEGORIES: CategoryType[] = ['Update', 'Hiring', 'Milestone', 'Insight'];
const INSTITUTION_CATEGORIES: CategoryType[] = ['Announcement', 'Academic', 'Admission', 'Campus Life', 'Research', 'Club Activity', 'General'];

export const useCreatePostForm = (props: CreatePostModalProps & { isMobile: boolean }) => {
  const {
    isOpen,
    onClose,
    initialPostType = 'text',
    editPostId,
    onUpdate,
    sharedPostId,
    sharedJobId,
    companyId: propCompanyId,
    onPostCreated,
    initialSharedPost
  } = props;

  const { data: session } = useSession();
  const currentUser = session?.user;
  const { activeProfile, userCompanies } = useActiveProfile();
  const { startUpload } = usePostUpload();
  const { addPost } = useFeed();

  // --- Form State ---
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [postCategory, setPostCategory] = useState<CategoryType>('Professional');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | StructuredLocation | null>(null);
  const [articleData, setArticleData] = useState<any>(null);

  // --- Sub-hooks ---
  const media = usePostMedia([], [], (type) => setPostType(prev => prev === 'article' ? 'article' : type));
  const poll = usePostPoll();
  const [description, setDescription] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [notifyEmployees, setNotifyEmployees] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [postAsCompanyId, setPostAsCompanyId] = useState<string | null>(propCompanyId || (activeProfile?.type === 'COMPANY' ? activeProfile.id : null));

  // Edit Mode state
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalPost, setOriginalPost] = useState<Post | null>(null);
  const [sharedPost, setSharedPost] = useState<any>(initialSharedPost || null);

  // Context Switch Warning state
  const [showContextWarning, setShowContextWarning] = useState(false);
  const [pendingContextId, setPendingContextId] = useState<string | null>(null);

  const isCompanyPost = !!postAsCompanyId;
  const currentPoster = isCompanyPost
    ? userCompanies.find(c => c.company_id === postAsCompanyId || c.org_id === postAsCompanyId)
    : currentUser;

  const getAllowedCategories = useCallback((): CategoryType[] => {
    if (!isCompanyPost) return USER_CATEGORIES;
    if ((currentPoster as any)?.entity_type === 'INSTITUTION') return INSTITUTION_CATEGORIES;
    return COMPANY_CATEGORIES;
  }, [isCompanyPost, currentPoster]);

  const getDefaultCategory = useCallback((): CategoryType => {
    return getAllowedCategories()[0] || 'Professional';
  }, [getAllowedCategories]);

  // Sync with active profile
  useEffect(() => {
    if (!propCompanyId && isOpen) {
      setPostAsCompanyId(activeProfile?.type === 'COMPANY' ? activeProfile.id : null);
    }
  }, [isOpen, activeProfile, propCompanyId]);

  // Sync with global article draft
  useEffect(() => {
    if (isOpen) {
      const { articleDraft } = useUIStore.getState();
      if (articleDraft) {
        setArticleTitle(articleDraft.title);
        setArticleContent(articleDraft.content);
        if (articleDraft.coverImage) {
          media.setUploadedImages([articleDraft.coverImage]);
        } else {
          media.clearMedia();
        }
        setDescription(articleDraft.description);
        setArticleData(articleDraft.articleData);
        setPostType('article');
      }
    }
  }, [isOpen]);

  // Clean form state on modal close
  useEffect(() => {
    if (!isOpen) {
      const hasPendingDraft = !!useUIStore.getState().articleDraft;
      resetForm(!hasPendingDraft);
    }
  }, [isOpen]);

  // Clear article data if user switches post type
  useEffect(() => {
    if (postType !== 'text' && postType !== 'article') {
      setArticleData(null);
    }
  }, [postType]);

  // Handle Category Persistence
  useEffect(() => {
    if (!isOpen) return;
    const storageKey = isCompanyPost ? `lastCategory_Company_${postAsCompanyId}` : `lastCategory_User_${currentUser?.id}`;
    const savedCategory = localStorage.getItem(storageKey) as CategoryType | null;
    const allowedCategories = getAllowedCategories();

    if (savedCategory && allowedCategories.includes(savedCategory)) {
      setPostCategory(savedCategory);
    } else {
      const fallbackCategory = getDefaultCategory();
      setPostCategory(fallbackCategory);
      if (savedCategory) localStorage.setItem(storageKey, fallbackCategory);
    }
  }, [isCompanyPost, postAsCompanyId, currentUser?.id, isOpen, getAllowedCategories, getDefaultCategory]);

  const handleSetPostCategory = (category: CategoryType) => {
    const safeCategory = getAllowedCategories().includes(category) ? category : getDefaultCategory();
    setPostCategory(safeCategory);
    const storageKey = isCompanyPost ? `lastCategory_Company_${postAsCompanyId}` : `lastCategory_User_${currentUser?.id}`;
    localStorage.setItem(storageKey, safeCategory);
  };

  // Hydrate Edit Mode
  useEffect(() => {
    if (isOpen && editPostId) {
      setIsLoadingPost(true);
      postApi.getById(editPostId)
        .then((post) => {
          setOriginalPost(post);
          // Determine type
          let type: PostType = 'text';
          if (post.images && post.images.length > 0) type = 'photo';
          if (post.videoSrc) type = 'video';
          if (post.poll) type = 'poll';
          if (post.title && !post.images?.length && !post.videoSrc && !post.poll) type = 'article';

          setPostType(type);
          setPostCategory(post.category as any || (isCompanyPost ? 'Update' : 'Professional'));
          setVisibility(post.visibility || 'public');

          if (type === 'text' || type === 'photo' || type === 'video') setDescription(post.content);
          if (type === 'article') {
            setArticleTitle(post.title || '');
            setArticleContent(post.content);
          }

          setSelectedLocation(post.location ? { id: 0, name: post.location, latitude: '', longitude: '' } : null);

          if (post.images) {
            media.setUploadedImages(post.images.map((url, i) => ({
              id: `existing-${i}`,
              url,
              type: 'image',
              crop: { x: 0, y: 0 },
              zoom: 1,
              isExisting: true
            })));
          }
          if (post.videoSrc) {
            media.setUploadedVideos([{
              id: 'existing-video',
              url: post.videoSrc,
              type: 'video',
              crop: { x: 0, y: 0 },
              zoom: 1,
              isExisting: true
            }]);
          }
          if (post.poll && post.poll.options) {
            poll.setPollQuestion(post.content);
            poll.setPollOptions(post.poll.options.map(o => ({
              id: o.option_id,
              text: o.option_text
            })));
          }
        })
        .finally(() => setIsLoadingPost(false));
    } else if (isOpen && sharedPostId) {
      postApi.getById(sharedPostId).then(post => {
        setSharedPost(post);
        setPostCategory(post.category as any || (isCompanyPost ? 'Update' : 'Professional'));
        setVisibility(post.visibility || 'public');
      });
    }
  }, [isOpen, editPostId, sharedPostId]);

  const handlePost = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // --- Frontend Media Validations ---
      // 1. Mutually Exclusive Images and Videos
      if (media.uploadedImages.length > 0 && media.uploadedVideos.length > 0) {
        toast.error("Cannot upload video and images together");
        setIsSubmitting(false);
        return;
      }

      // 2. Video Count Enforcement
      if (media.uploadedVideos.length > 1) {
        toast.error("Only one video file is allowed");
        setIsSubmitting(false);
        return;
      }

      // 3. Image Count Enforcement
      if (media.uploadedImages.length > 10) {
        toast.error("Maximum 10 images allowed");
        setIsSubmitting(false);
        return;
      }

      // 4. File Size Limit (100MB per file)
      const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
      const oversizedImage = media.uploadedImages.find(img => img.file && img.file.size > MAX_FILE_SIZE);
      if (oversizedImage) {
        toast.error(`Image "${oversizedImage.file?.name || 'file'}" exceeds the 100MB size limit.`);
        setIsSubmitting(false);
        return;
      }

      const oversizedVideo = media.uploadedVideos.find(v => v.file && v.file.size > MAX_FILE_SIZE);
      if (oversizedVideo) {
        toast.error(`Video "${oversizedVideo.file?.name || 'file'}" exceeds the 100MB size limit.`);
        setIsSubmitting(false);
        return;
      }

      let finalContent = "";
      if (postType === 'article') {
        finalContent = `${description.trim()}<!-- article_divider -->${articleContent}`;
      } else if (articleData) {
        finalContent = `${description.trim()}<!-- article_divider -->${articleData.content}`;
      } else {
        finalContent = sanitizeContent(postType === 'poll' ? poll.pollQuestion : description);
      }

      const allowedCategories = getAllowedCategories();
      const safeCategory = allowedCategories.includes(postCategory) ? postCategory : getDefaultCategory();

      const payload: any = {
        title: postType === 'article' ? articleTitle.trim() : (articleData ? articleData.title : ''),
        content: finalContent,
        category: safeCategory,
        visibility: visibility,
        post_type: postType === 'photo' ? 'image' : ((postType === 'article' || articleData) ? 'article' : postType),
        companyId: isCompanyPost ? postAsCompanyId || undefined : undefined,
        ...(isCompanyPost && isBroadcast ? { is_broadcast: true } : {}),
        shared_post_id: sharedPostId,
        shared_job_id: sharedJobId,
        location: selectedLocation ? ("formattedAddress" in selectedLocation ? selectedLocation.formattedAddress : selectedLocation.name) : null
      };

      if (articleData) {
        payload.article_cover_image = articleData.coverImage;
        payload.article_title = articleData.title;
        payload.article_subtitle = articleData.subtitle;
      }

      if (postType === 'poll') {
        if (!poll.isPollValid()) {
          setIsSubmitting(false);
          return;
        }
        payload.poll_options = poll.pollOptions.filter(o => o.text.trim()).map(o => sanitizeContent(o.text));
        payload.poll_duration = poll.pollDuration;
      }

      const filesToUpload = await media.prepareFilesToUpload(articleData ? 'article' : postType, media.aspectRatio);

      if (editPostId) {
        try {
          const updatePayload: any = { content: finalContent, category: postCategory, visibility };
          if (postType === 'article') updatePayload.title = articleTitle;
          await postApi.update(editPostId, updatePayload);
          if (onUpdate) onUpdate({ ...originalPost, ...updatePayload } as any);
          toast.success("Post updated");
          onClose();
        } catch (e) {
          toast.error("Failed to update post");
          setIsSubmitting(false);
        }
        return;
      }

      if (isCompanyPost) {
        const { mappedPost } = await postApi.create(payload, filesToUpload);
        addPost(mappedPost);
        if (notifyEmployees) {
          await postApi.notifyEmployees(postAsCompanyId!, mappedPost.id);
          toast.success("Post created and employees notified!");
        } else toast.success("Post published!");
        if (onPostCreated) onPostCreated();
        resetForm();
        onClose();
      } else {
        await startUpload(payload, filesToUpload);
        if (onPostCreated) onPostCreated();
        resetForm();
        onClose();
      }
    } catch (err) {
      toast.error("Failed to process post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = (clearDraft: boolean = true) => {
    setPostType('text');
    setDescription('');
    setArticleTitle('');
    setArticleContent('');
    setSelectedLocation(null);
    media.clearMedia();
    poll.clearPoll();
    setNotifyEmployees(false);
    setIsBroadcast(false);
    setArticleData(null);
    if (clearDraft) {
      useUIStore.getState().setArticleDraft(null);
    }
  };

  const requestContextSwitch = (newCompanyId: string | null) => {
    const hasContent = description.trim() || media.uploadedImages.length > 0 || media.uploadedVideos.length > 0 || poll.pollQuestion.trim();
    if (hasContent) {
      setPendingContextId(newCompanyId);
      setShowContextWarning(true);
    } else {
      setPostAsCompanyId(newCompanyId);
    }
  };

  return {
    state: {
      postType, setPostType,
      postCategory, setPostCategory, handleSetPostCategory,
      visibility, setVisibility,
      description, setDescription,
      articleTitle, setArticleTitle,
      articleContent, setArticleContent,
      articleData, setArticleData,
      selectedLocation, setSelectedLocation,
      notifyEmployees, setNotifyEmployees,
      isBroadcast, setIsBroadcast,
      postAsCompanyId, setPostAsCompanyId,
      isLoadingPost, isSubmitting,
      originalPost, sharedPost,
      showContextWarning, setShowContextWarning,
      isCompanyPost, currentPoster, currentUser,
      userCompanies
    },
    media,
    poll,
    actions: {
      handlePost,
      resetForm,
      requestContextSwitch,
      confirmContextSwitch: () => {
        setPostAsCompanyId(pendingContextId);
        setShowContextWarning(false);
        setPendingContextId(null);
      }
    }
  };
};
