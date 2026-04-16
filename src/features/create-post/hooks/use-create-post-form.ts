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

  // --- Sub-hooks ---
  const media = usePostMedia();
  const poll = usePostPoll();

  // --- Form State ---
  const [postType, setPostType] = useState<PostType>(initialPostType);
  const [postCategory, setPostCategory] = useState<CategoryType>('Professional');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
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

  // Sync with active profile
  useEffect(() => {
    if (!propCompanyId && isOpen) {
      setPostAsCompanyId(activeProfile?.type === 'COMPANY' ? activeProfile.id : null);
    }
  }, [isOpen, activeProfile, propCompanyId]);

  // Handle Category Persistence
  useEffect(() => {
    if (!isOpen) return;
    const storageKey = isCompanyPost ? `lastCategory_Company_${postAsCompanyId}` : `lastCategory_User_${currentUser?.id}`;
    const savedCategory = localStorage.getItem(storageKey) as CategoryType | null;
    if (savedCategory) setPostCategory(savedCategory);
    else setPostCategory(isCompanyPost ? 'Update' : 'Professional');
  }, [isCompanyPost, postAsCompanyId, currentUser?.id, isOpen]);

  const handleSetPostCategory = (category: CategoryType) => {
    setPostCategory(category);
    const storageKey = isCompanyPost ? `lastCategory_Company_${postAsCompanyId}` : `lastCategory_User_${currentUser?.id}`;
    localStorage.setItem(storageKey, category);
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
          
          if (post.images) {
            media.setUploadedImages(post.images.map((url, i) => ({
              id: `existing-${i}`,
              url,
              type: 'image',
              crop: { x: 0, y: 0 },
              zoom: 1,
              isExisting: true,
              fitMode: 'cover'
            })));
          }
          if (post.videoSrc) {
            media.setUploadedVideos([{
              id: 'existing-video',
              url: post.videoSrc,
              type: 'video',
              crop: { x: 0, y: 0 },
              zoom: 1,
              isExisting: true,
              fitMode: 'cover'
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
      const finalContent = sanitizeContent(postType === 'article' ? articleContent : (postType === 'poll' ? poll.pollQuestion : description));
      
      const payload: any = {
        title: postType === 'article' ? sanitizeContent(articleTitle) : '',
        content: finalContent,
        category: postCategory,
        visibility: visibility,
        post_type: postType === 'photo' ? 'image' : (postType === 'article' ? 'article' : postType),
        companyId: isCompanyPost ? postAsCompanyId || undefined : undefined,
        ...(isCompanyPost && isBroadcast ? { is_broadcast: true } : {}),
        shared_post_id: sharedPostId,
        shared_job_id: sharedJobId
      };

      if (postType === 'poll') {
        if (!poll.isPollValid()) {
          setIsSubmitting(false);
          return;
        }
        payload.poll_options = poll.pollOptions.filter(o => o.text.trim()).map(o => sanitizeContent(o.text));
        payload.poll_duration = poll.pollDuration;
      }

      const filesToUpload = await media.prepareFilesToUpload(postType, media.aspectRatio);

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

  const resetForm = () => {
    setPostType('text');
    setDescription('');
    setArticleTitle('');
    setArticleContent('');
    media.clearMedia();
    poll.clearPoll();
    setNotifyEmployees(false);
    setIsBroadcast(false);
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

  const currentPoster = isCompanyPost
    ? userCompanies.find(c => c.company_id === postAsCompanyId || c.org_id === postAsCompanyId)
    : currentUser;

  return {
    state: {
       postType, setPostType,
       postCategory, setPostCategory, handleSetPostCategory,
       visibility, setVisibility,
       description, setDescription,
       articleTitle, setArticleTitle,
       articleContent, setArticleContent,
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
