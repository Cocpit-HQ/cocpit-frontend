import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useActiveProfile } from '@/context/ActiveProfileContext';
import { usePostUpload } from '@/context/PostUploadContext';
import { useFeed } from '@/hooks/use-feed';
import { showToast as toast } from '@/shared/commonComponents/GlobalToast';
import { PostType, CategoryType, CreatePostModalProps, MediaItem } from '../types';
import { usePostMedia } from './use-post-media';
import { usePostPoll } from './use-post-poll';
import { postApi } from '../api/post.api';
import { sanitizeContent } from '@/lib/contentSanitizer';
import { Post, PostVisibility } from '@/types/entities';
import { LocationSuggestion, StructuredLocation } from '@/services/api/location';
import { useUIStore } from '@/store/ui.store';

import { formatMentionsForBackend, parseMentionsForFrontend } from "@/lib/mentions";
import { uploadMedia } from '@/services/api/upload';
import { useQueryClient } from '@tanstack/react-query';
const USER_CATEGORIES: CategoryType[] = ['Professional', 'Achievement'];
const COMPANY_CATEGORIES: CategoryType[] = ['Professional', 'Update', 'Hiring', 'Milestone', 'Insight'];
const INSTITUTION_CATEGORIES: CategoryType[] = ['Professional', 'Announcement', 'Academic', 'Admission', 'Campus Life', 'Research', 'Club Activity', 'General'];

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
  const queryClient = useQueryClient();

  // --- Form State ---
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [postCategory, setPostCategory] = useState<CategoryType>('Professional');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | StructuredLocation | null>(null);
  const [articleData, setArticleData] = useState<any>(null);
  const [achievementImageId, setAchievementImageId] = useState<number | undefined>(undefined);
  const [achievementTitle, setAchievementTitle] = useState<string | undefined>(undefined);

  // --- Sub-hooks ---
  const media = usePostMedia([], [], (type) => setPostType(prev => prev === 'article' ? 'article' : type));
  const poll = usePostPoll();
  const [description, setDescription] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [notifyEmployees, setNotifyEmployees] = useState(false);
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [postAsCompanyId, setPostAsCompanyId] = useState<string | null>(propCompanyId || (activeProfile?.type === 'COMPANY' ? activeProfile.id : null));
  const [inlineFiles, setInlineFiles] = useState<{ id: string; file: File }[]>([]);
  const [inlineMentions, setInlineMentions] = useState<any[]>([]);

  // Edit Mode state
  const [isLoadingPost, setIsLoadingPost] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditingMedia, setIsEditingMedia] = useState(false);
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

  // Sync initial shared post when modal opens
  useEffect(() => {
    if (isOpen && initialSharedPost) {
      setSharedPost(initialSharedPost);
    } else if (isOpen && !initialSharedPost && !sharedPostId) {
      // Don't clear it if we are just opening and already have a shared post
    }
  }, [isOpen, initialSharedPost]);

  // Sync with global article draft or sessionStorage
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
        if (articleDraft.localFiles) {
          setInlineFiles(articleDraft.localFiles);
        }
        setPostType('article');
      } else if (!editPostId && typeof window !== 'undefined') {
        try {
          const raw = sessionStorage.getItem('cocpit_article_draft');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.title) setArticleTitle(parsed.title);
            if (parsed.content) setArticleContent(parsed.content);
            if (parsed.coverImage) {
              media.setUploadedImages([parsed.coverImage]);
            }
            if (parsed.description) setDescription(parsed.description);
            setPostType('article');
          }
        } catch (e) {
          console.error("Failed to restore draft from sessionStorage", e);
        }
      }
    }
  }, [isOpen, editPostId]);

  // Save article draft to sessionStorage as user types (only in create mode)
  useEffect(() => {
    if (!editPostId && postType === 'article' && typeof window !== 'undefined') {
      const hasContent = articleTitle.trim() || articleContent.trim() || media.uploadedImages.length > 0;
      if (hasContent) {
        try {
          sessionStorage.setItem('cocpit_article_draft', JSON.stringify({
            title: articleTitle,
            content: articleContent,
            coverImage: media.uploadedImages[0] || null,
            description,
          }));
        } catch (e) {}
      }
    }
  }, [articleTitle, articleContent, media.uploadedImages, description, editPostId, postType]);

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
          const isArticlePost =
            post.category === 'Article' ||
            Boolean(post.articleBody) ||
            post.post_type === 'article' ||
            post.type === 'ARTICLE' ||
            post.type === 'article' ||
            (Boolean(post.title) && !post.poll);

          if (isArticlePost) {
            type = 'article';
            setPostType('article');
            setArticleData({
              id: post.id,
              title: post.title || '',
              content: post.articleBody || post.content || '',
              subtitle: post.content || '',
              coverImage: post.images?.[0]
                ? { url: post.images[0], file: null }
                : null,
            });
            setArticleTitle(post.title || '');
            setArticleContent(post.articleBody || post.content || '');
            setDescription(post.content || '');
          } else if (post.images && post.images.length > 0) {
            type = 'photo';
            setPostType('photo');
          } else if (post.videoSrc) {
            type = 'video';
            setPostType('video');
          } else if (post.poll) {
            type = 'poll';
            setPostType('poll');
          } else {
            setPostType('text');
          }

          setPostCategory(post.category as any || 'Professional');
          setVisibility(post.visibility || 'public');

          if (!isArticlePost && (type === 'text' || type === 'photo' || type === 'video')) {
            const { content: parsedContent, inlineMentions: parsedMentions } = parseMentionsForFrontend(post.content || '');
            setDescription(parsedContent);
            setInlineMentions(parsedMentions);
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
            poll.setPollQuestion(post.title || post.content);
            if (post.title) {
              setDescription(post.content);
            }
            poll.setPollOptions(post.poll.options.map(o => ({
              id: o.option_id,
              text: o.option_text
            })));
          }
          if (post.shared_post) setSharedPost(post.shared_post);
        })
        .catch((error) => {
          console.error("Failed to load post for editing:", error);
          toast.error("Failed to load post. It may have been deleted.");
        })
        .finally(() => setIsLoadingPost(false));
    } else if (isOpen && sharedPostId) {
      postApi.getById(sharedPostId).then(post => {
        setSharedPost(post);
        setPostCategory(post.category as any || 'Professional');
        setVisibility(post.visibility || 'public');
      }).catch((error) => {
        console.error("Failed to load shared post:", error);
        toast.error("Failed to load shared post. It may have been deleted.");
      });
    }
  }, [isOpen, editPostId, sharedPostId]);

  const handlePost = async (
    inlineFilesOrTagUserIds?: File[] | string[],
    tagUserIdsOrOverrideContent?: string[] | string,
    inlineMentionsParam?: any[],
    explicitOverrideContent?: string
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let inlineFilesParam: File[] = [];
    let activeTagUserIds: string[] | undefined = undefined;
    let overrideContent: string | undefined = explicitOverrideContent;

    if (typeof tagUserIdsOrOverrideContent === 'string') {
      overrideContent = tagUserIdsOrOverrideContent;
    } else if (Array.isArray(tagUserIdsOrOverrideContent)) {
      activeTagUserIds = tagUserIdsOrOverrideContent;
    }

    if (inlineFilesOrTagUserIds && inlineFilesOrTagUserIds.length > 0) {
      if (inlineFilesOrTagUserIds[0] instanceof File) {
        inlineFilesParam = inlineFilesOrTagUserIds as File[];
      } else {
        activeTagUserIds = inlineFilesOrTagUserIds as string[];
      }
    }

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

      // 4. File Size Limits & Validations:
      // - Per image limit: 10MB maximum (reject any individual image > 10MB).
      // - Total post upload limit: 100MB maximum (reject cumulative image size > 100MB).
      // - Video limit: 100MB maximum.
      const MAX_SINGLE_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB limit per single image
      const MAX_TOTAL_IMAGE_SIZE = 100 * 1024 * 1024; // 100 MB total post images limit
      const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB video size limit

      // Check per-image limit (10MB max per file)
      const oversizedImage = media.uploadedImages.find(img => img.file && img.file.size > MAX_SINGLE_IMAGE_SIZE);
      if (oversizedImage) {
        toast.error(`Image "${oversizedImage.file?.name || 'file'}" exceeds the 10MB limit.`);
        setIsSubmitting(false);
        return;
      }

      // Check total post upload limit (100MB max across all images combined)
      const totalImageSize = media.uploadedImages.reduce((sum, img) => sum + (img.file?.size || 0), 0);
      if (totalImageSize > MAX_TOTAL_IMAGE_SIZE) {
        toast.error("Total image upload size cannot exceed 100MB.");
        setIsSubmitting(false);
        return;
      }

      // Check video size limit (100MB max)
      const oversizedVideo = media.uploadedVideos.find(v => v.file && v.file.size > MAX_VIDEO_SIZE);
      if (oversizedVideo) {
        toast.error(`Video "${oversizedVideo.file?.name || 'file'}" exceeds the 100MB limit.`);
        setIsSubmitting(false);
        return;
      }

      let finalContent = "";
      if (postType === 'article') {
        const bodyContent = overrideContent !== undefined 
          ? overrideContent 
          : (articleContent || (articleData ? articleData.content : ''));
        finalContent = `${description.trim()}<!-- article_divider -->${bodyContent}`;
      } else {
        finalContent = sanitizeContent(description);
      }

      // Convert clean full names back to structured mentions for the backend
      const activeMentions = (inlineMentionsParam && inlineMentionsParam.length > 0) ? inlineMentionsParam : inlineMentions;
      finalContent = formatMentionsForBackend(finalContent, activeMentions);

      let actualInlineFiles: File[] = [];
      if (postType === 'article' || articleData) {
        const blobUrls = Array.from(finalContent.matchAll(/src="(blob:[^"]+)"/g)).map(m => m[1]);
        blobUrls.forEach(url => {
          const match = inlineFiles.find(f => f.id === url);
          if (match) actualInlineFiles.push(match.file);
        });
      }

      const allowedCategories = getAllowedCategories();
      const safeCategory = allowedCategories.includes(postCategory) ? postCategory : getDefaultCategory();

      const payload: any = {
        title: postType === 'poll' ? poll.pollQuestion : (postType === 'article' ? articleTitle.trim() : (articleData ? articleData.title : (safeCategory === 'Achievement' && achievementTitle ? achievementTitle : ''))),
        content: finalContent,
        category: safeCategory,
        visibility: visibility,
        post_type: postType === 'photo' ? 'image' : ((postType === 'article' || articleData) ? 'article' : postType),
        companyId: isCompanyPost ? postAsCompanyId || undefined : undefined,
        ...(isCompanyPost && isBroadcast ? { is_broadcast: true } : {}),
        shared_post_id: sharedPostId,
        shared_job_id: sharedJobId,
        location: selectedLocation ? ("formattedAddress" in selectedLocation ? selectedLocation.formattedAddress : selectedLocation.name) : null,
        achievement_image_id: achievementImageId
      };

      if (articleData) {
        payload.article_cover_image = articleData.coverImage;
        payload.article_title = articleData.title;
        payload.article_subtitle = articleData.subtitle;
      }

      if (postType === 'article') {
        const coverImage = media.uploadedImages[0];
        if (coverImage && coverImage.url) {
          payload.media_urls = [coverImage.url];
        }
      }

      if (postType === 'poll') {
        if (!poll.isPollValid()) {
          setIsSubmitting(false);
          return;
        }
        payload.poll_options = poll.pollOptions.filter(o => o.text.trim()).map(o => sanitizeContent(o.text));
        payload.poll_duration = poll.pollDuration || '1 week';
      }

      const filesToUpload = await media.prepareFilesToUpload(articleData ? 'article' : postType, media.aspectRatio);

      // Combine cover/post files and inline article files without duplicate files
      const rawInlineFiles = [...(inlineFilesParam || []), ...actualInlineFiles];
      const seenInlineNames = new Set<string>();
      const combinedInlineFiles: File[] = [];
      for (const f of rawInlineFiles) {
        if (!seenInlineNames.has(f.name)) {
          seenInlineNames.add(f.name);
          combinedInlineFiles.push(f);
        }
      }
      const allFilesToUpload = [...filesToUpload, ...combinedInlineFiles];

      if (editPostId) {
        try {
          // 1. Identify new files that need to be uploaded to Cloudinary
          const newImageFiles = media.uploadedImages.filter(img => img.file).map(img => img.file as File);
          const newVideoFiles = media.uploadedVideos.filter(v => v.file).map(v => v.file as File);

          // 2. Upload any new files
          let uploadedImageUrls: string[] = [];
          if (newImageFiles.length > 0) {
            uploadedImageUrls = await uploadMedia(newImageFiles);
          }
          let uploadedVideoUrls: string[] = [];
          if (newVideoFiles.length > 0) {
            uploadedVideoUrls = await uploadMedia(newVideoFiles);
          }

          // 3. Re-assemble final media URL list keeping the correct order
          let media_urls: string[] | undefined = undefined;
          if (postType === 'photo') {
            let uploadedIdx = 0;
            media_urls = media.uploadedImages.map(img => {
              if (img.file) {
                const item = uploadedImageUrls[uploadedIdx++];
                return typeof item === 'object' && item !== null ? (item as any).url : item;
              }
              return img.url;
            });
          } else if (postType === 'video') {
            media_urls = media.uploadedVideos.map(v => {
              if (v.file) {
                const item = uploadedVideoUrls[0];
                return typeof item === 'object' && item !== null ? (item as any).url : item;
              }
              return v.url;
            });
          } else if (postType === 'article') {
            if (media.uploadedImages.length > 0) {
              const coverImg = media.uploadedImages[0];
              if (coverImg.file) {
                const item = uploadedImageUrls[0];
                const resolvedUrl = typeof item === 'object' && item !== null ? (item as any).url : item;
                if (resolvedUrl) media_urls = [resolvedUrl];
              } else if (coverImg.url) {
                media_urls = [coverImg.url];
              }
            } else {
              media_urls = [];
            }
          }


          const updatePayload: any = {
            content: finalContent,
            category: postCategory,
            visibility,
            location: selectedLocation ? ("formattedAddress" in selectedLocation ? selectedLocation.formattedAddress : selectedLocation.name) : null,
            post_type: postType === 'photo' ? 'image' : ((postType === 'article' || articleData) ? 'article' : postType)
          };
          if (postType === 'article') updatePayload.title = articleTitle.trim();
          if (postType === 'poll') updatePayload.title = poll.pollQuestion;
          if (media_urls !== undefined) {
            updatePayload.media_urls = media_urls;
            if (media.uploadedImages && media.uploadedImages.length > 0) {
              updatePayload.media_metadata = media.uploadedImages.map((img: any) => ({
                width: img.naturalWidth || img.width || 800,
                height: img.naturalHeight || img.height || 600
              }));
            } else if (media.uploadedVideos && media.uploadedVideos.length > 0) {
              updatePayload.media_metadata = media.uploadedVideos.map((vid: any) => ({
                width: vid.naturalWidth || vid.width || undefined,
                height: vid.naturalHeight || vid.height || undefined
              })).filter((meta: any) => meta.width && meta.height);
            }
          }

          await postApi.update(editPostId, updatePayload, combinedInlineFiles);

          if (onUpdate) {
            // Map the frontend fields for the feed optimistic/immediate update
            const updatedPost: any = {
              ...originalPost,
              ...updatePayload,
              category: postCategory,
            };
            if (postType === 'article') {
              updatedPost.articleBody = overrideContent !== undefined ? overrideContent : articleContent;
              updatedPost.title = articleTitle.trim();
            }
            if (media_urls !== undefined) {
              const images = media_urls.filter(url => !url.match(/\.(mp4|webm|mov)(\?|#|$)/i));
              const video = media_urls.find(url => url.match(/\.(mp4|webm|mov)(\?|#|$)/i));
              updatedPost.images = images.length > 0 ? images : undefined;
              updatedPost.imageSrc = images.length > 0 ? images[0] : undefined;
              updatedPost.videoSrc = video || undefined;
            }
            onUpdate(updatedPost);
          }

          toast.success("Post updated");
          onClose();
        } catch (e) {
          console.error("Failed to update post:", e);
          toast.error("Failed to update post");
          setIsSubmitting(false);
        }
        return;
      }

      const uploadPromise = startUpload(payload, allFilesToUpload, activeTagUserIds);
      
      uploadPromise.then((mappedPost) => {
        if (isCompanyPost && notifyEmployees && mappedPost) {
          postApi.notifyEmployees(postAsCompanyId!, mappedPost.id).then(() => {
            toast.success("Employees notified!");
          }).catch(console.error);
        }
      }).catch(console.error);

      if (sharedPostId || initialSharedPost) {
        toast.success("Post reposted successfully!");
      }
      if (onPostCreated) onPostCreated();
      
      // Scroll to the top of the feed to see the newly created post
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      resetForm();
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to process post";
      console.error("Post creation failed:", errorMessage, err.response?.data);
      toast.error(errorMessage);
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
    setIsEditingMedia(false);
    setArticleData(null);
    setAchievementImageId(undefined);
    setInlineFiles([]);
    setInlineMentions([]);
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
      isEditingMedia, setIsEditingMedia,
      originalPost, sharedPost, setSharedPost,
      showContextWarning, setShowContextWarning,
      isCompanyPost, currentPoster, currentUser,
      userCompanies,
      achievementImageId, setAchievementImageId,
      achievementTitle, setAchievementTitle,
      getDefaultCategory,
      inlineFiles, setInlineFiles,
      inlineMentions, setInlineMentions
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


