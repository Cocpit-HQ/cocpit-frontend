
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Post, Comment } from "@/types/entities";
import { BackendPost } from "@/services/api/feed";

export interface BackendComment {
  comment_id: string | number;
  content: string;
  created_at: string;
  updated_at?: string | null;
  updatedAt?: string | null;
  is_edited?: boolean;
  isEdited?: boolean;
  user_id?: string;
  author_id?: string;
  full_name: string;
  avatar_url: string | null;
  author_slug?: string;
  is_organization_comment?: boolean;
  parent_id?: string | number | null;
  like_count?: number;
  is_liked?: boolean;
  is_pinned?: boolean;
  pinned_at?: string | null;
  headline?: string;
  reply_count?: number;
}

dayjs.extend(relativeTime);

export const mapBackendPostToFrontend = (backendPost: BackendPost): Post => {
  // Extract images and video
  const images: string[] = [];
  const imageDimensions: Array<{ width: number; height: number } | null> = [];
  let videoSrc: string | undefined = undefined;
  //const primaryMediaAspectRatio = backendPost.media?.[0]?.aspect_ratio || undefined;

  // Ensure media is an array before iterating
  const mediaList = Array.isArray(backendPost.media) ? backendPost.media : [];

  let mediaWidth: number | undefined;
  let mediaHeight: number | undefined;

  mediaList.forEach((item) => {
    // Robust video/image detection fallback
    const isActuallyVideo = item.url?.toLowerCase()?.match(/\.(mp4|webm|mov)(\?|#|$)/);
    const mediaType = isActuallyVideo ? "video" : item.media_type;

    if (mediaType === "image") {
      images.push(item.url);
      imageDimensions.push(
        (item.width && item.height) ? { width: item.width, height: item.height } : null
      );
      if (!mediaWidth && item.width) mediaWidth = item.width;
      if (!mediaHeight && item.height) mediaHeight = item.height;
    } else if (mediaType === "video") {
      videoSrc = item.url;
      if (!mediaWidth && item.width) mediaWidth = item.width;
      if (!mediaHeight && item.height) mediaHeight = item.height;
    }
  });

  // Inject achievement image if available
  if (backendPost.achievement_image_url && images.length === 0) {
    images.push(backendPost.achievement_image_url);
  }

  // Calculate timeAgo
  const timeAgo = dayjs(backendPost.created_at).fromNow(true); // "true" removes "ago" suffix if desired, but UI usually has "ago" appended or not.
  // FeedPost says "{timeAgo} ago", so we need just "2h" or "5m".
  // dayjs .fromNow(true) gives "2 hours", "a few seconds".
  // Let's create a custom formatter or just use .fromNow() and strip suffix?
  // Existing mock has "2h", "5h", "1d".
  // Let's approximate.

  const now = dayjs();
  const created = dayjs(backendPost.created_at);
  const diffMinutes = now.diff(created, "minute");
  const diffHours = now.diff(created, "hour");
  const diffDays = now.diff(created, "day");

  let shortTimeAgo = "";
  if (diffMinutes <= 0) {
    shortTimeAgo = "Just now";
  } else if (diffMinutes < 60) {
    shortTimeAgo = `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    shortTimeAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    shortTimeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    const diffWeeks = Math.floor(diffDays / 7);
    shortTimeAgo = `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  // Handle poll mapping
  const poll = backendPost.poll ? {
    poll_id: backendPost.poll.poll_id,
    total_votes: backendPost.poll.total_votes,
    duration: backendPost.poll.duration,
    is_active: backendPost.poll.is_active,
    user_vote: backendPost.poll.user_vote,
    options: Array.isArray(backendPost.poll.options) ? backendPost.poll.options.map(opt => ({
      option_id: opt.option_id,
      option_text: opt.option_text,
      vote_count: opt.vote_count
    })) : []
  } : ((backendPost as any).options && Array.isArray((backendPost as any).options) && (backendPost as any).options.length > 0) ? {
    poll_id: (backendPost as any).poll_id || '',
    total_votes: (backendPost as any).votes || 0,
    duration: (backendPost as any).duration || '1 week',
    is_active: (backendPost as any).isPollActive ?? true,
    user_vote: null,
    options: (backendPost as any).options.map((opt: any) => ({
      option_id: opt.option_id || opt.id || '',
      option_text: opt.option_text || opt.text || (typeof opt === 'string' ? opt : ''),
      vote_count: opt.vote_count || 0
    }))
  } : null;

  // Handle shared post mapping
  let sharedPost: Post | null = null;
  if (backendPost.shared_post) {
    const sp = backendPost.shared_post;

    if (sp.is_accessible === false) {
      let content = "This content is unavailable.";
      if (sp.reason === "deleted") {
        content = "This post has been deleted by the original author.";
      } else if (sp.reason === "private" || sp.reason === "personal_connection") {
        content = "This content is unavailable because it's private or restricted.";
      } else if (sp.reason) {
        content = `This content is unavailable: ${sp.reason}`;
      }

      sharedPost = {
        id: "unavailable",
        authorId: sp.author?.user_id || "",
        author: sp.author?.full_name || "Unknown",
        authorAvatar: sp.author?.avatar_url || null,
        timeAgo: "",
        content: content,
        likes: 0,
        comments: "0",
        shares: "0",
        isAvailable: false,
        unavailableReason: sp.reason // Map the specific reason
      } as Post & { isAvailable?: boolean; unavailableReason?: string };
    } else if (sp.shared_entity_type === 'job' || sp.job_id) {
      sharedPost = {
        id: sp.job_id || `job-${Date.now()}`,
        authorId: "",
        author: "",
        timeAgo: "",
        content: "",
        likes: 0,
        comments: "0",
        shares: "0",
        isAvailable: true,
        // Job-specific fields mapped to the extended Post type
        isJob: true,
        jobId: sp.job_id,
        jobTitle: sp.title,
        jobLocation: sp.location,
        jobCompany: sp.company_name,
        jobLogo: sp.company_logo,
        jobType: sp.job_type,
        jobWorkMode: sp.work_mode,
        jobSalaryMin: sp.salary_min,
        jobSalaryMax: sp.salary_max,
        jobIsActive: sp.is_active,
      } as Post & { isAvailable?: boolean; isJob?: boolean };
    } else if (sp.author && sp.post_id) { // Ensure required fields exist
      const spImages: string[] = [];
      let spVideoSrc: string | undefined = undefined;

      // Process shared post media
      const spImageDimensions: Array<{ width: number; height: number } | null> = [];
      let spMediaWidth: number | undefined;
      let spMediaHeight: number | undefined;

      if (Array.isArray(sp.media)) {
        sp.media.forEach((item) => {
          const isActuallyVideo = item.url?.toLowerCase()?.match(/\.(mp4|webm|mov)(\?|#|$)/);
          const mediaType = isActuallyVideo ? "video" : item.media_type;

          if (mediaType === "image") {
            spImages.push(item.url);
            spImageDimensions.push(
              (item.width && item.height) ? { width: item.width, height: item.height } : null
            );
            if (!spMediaWidth && item.width) spMediaWidth = item.width;
            if (!spMediaHeight && item.height) spMediaHeight = item.height;
          } else if (mediaType === "video") {
            spVideoSrc = item.url;
            if (!spMediaWidth && item.width) spMediaWidth = item.width;
            if (!spMediaHeight && item.height) spMediaHeight = item.height;
          }
        });
      }

      // Inject achievement image if available
      if (sp.achievement_image_url && spImages.length === 0) {
        spImages.push(sp.achievement_image_url);
      }

      // Process shared post time
      const spCreated = dayjs(sp.created_at);
      const spDiffMinutes = now.diff(spCreated, "minute");
      const spDiffHours = now.diff(spCreated, "hour");
      const spDiffDays = now.diff(spCreated, "day");

      let spShortTimeAgo = "";
      if (spDiffMinutes <= 0) spShortTimeAgo = "Just now";
      else if (spDiffMinutes < 60) spShortTimeAgo = `${spDiffMinutes} ${spDiffMinutes === 1 ? 'minute' : 'minutes'} ago`;
      else if (spDiffHours < 24) spShortTimeAgo = `${spDiffHours} ${spDiffHours === 1 ? 'hour' : 'hours'} ago`;
      else if (spDiffDays < 7) spShortTimeAgo = `${spDiffDays} ${spDiffDays === 1 ? 'day' : 'days'} ago`;
      else {
        const spDiffWeeks = Math.floor(spDiffDays / 7);
        spShortTimeAgo = `${spDiffWeeks} ${spDiffWeeks === 1 ? 'week' : 'weeks'} ago`;
      }

      // Handle shared post poll
      const spPoll = sp.poll ? {
        poll_id: sp.poll.poll_id,
        total_votes: sp.poll.total_votes,
        duration: sp.poll.duration,
        is_active: sp.poll.is_active,
        user_vote: sp.poll.user_vote,
        options: sp.poll.options.map(opt => ({
          option_id: opt.option_id,
          option_text: opt.option_text,
          vote_count: opt.vote_count
        }))
      } : null;

      let spContent = sp.content || "";
      let spArticleBody = "";
      if (spContent.includes("<!-- article_divider -->")) {
        const parts = spContent.split("<!-- article_divider -->");
        spContent = parts[0];
        spArticleBody = parts[1];
      } else if (sp.post_type === 'article') {
        const match = spContent.match(/<(div|p|h[1-6]|ul|ol|img|figure|video|blockquote)/i);
        if (match && match.index !== undefined && match.index > 0) {
          spArticleBody = spContent.substring(match.index);
          spContent = spContent.substring(0, match.index);
        } else if (match && match.index === 0) {
          spArticleBody = spContent;
          spContent = "";
        }
      }

      sharedPost = {
        id: sp.post_id,
        authorId: sp.author.user_id,
        author_org_id: sp.author.author_org_id,
        createdByUserId: sp.author.created_by_user_id,
        author: sp.author.full_name,
        authorAvatar: (sp.author.avatar_url && sp.author.avatar_url !== '/images/companyonboarding/companyprofileDefault.jpg') ? sp.author.avatar_url : undefined,
        timeAgo: spShortTimeAgo,
        content: spContent,
        articleBody: spArticleBody,
        imageSrc: spImages.length > 0 ? spImages[0] : undefined,
        images: spImages.length > 0 ? spImages : undefined,
        imageDimensions: spImageDimensions.length > 0 ? spImageDimensions : undefined,
        mediaWidth: spMediaWidth,
        mediaHeight: spMediaHeight,
        videoSrc: spVideoSrc,
        //aspectRatio: sp.media?.[0]?.aspect_ratio || undefined,
        likes: sp.like_count || 0,
        isLiked: (sp as any).is_liked, // New field from backend
        isReposted: (sp as any).is_reposted,
        isRepostedWithThoughts: (sp as any).is_reposted_with_thoughts,
        is_commented: (sp as any).is_commented,
        is_saved: (sp as any).is_saved,
        is_reported: (sp as any).is_reported,
        isReported: (sp as any).is_reported,
        likedUsers: (sp as any).liked_users || [],
        sampleLikerUsername: (sp as any).sample_liker_username || (((sp as any).liked_users && (sp as any).liked_users.length > 0) ? (sp as any).liked_users[0].username : null),
        comments: (sp.comment_count || 0).toString(),
        shares: ((sp as any).rePostCount || 0).toString(),
        externalShares: (sp as any).sharePostCount || 0,
        poll: spPoll,
        authorSlug: sp.author.author_slug,
        isCompanyPost: sp.author.is_organization_post,
        location: sp.location || undefined,
        title: sp.title || "",
        authorHeadline: sp.author.author_headline || undefined,
        isAvailable: true,
        shared_post: (sp as any).shared_post || ((() => {
          if (!(sp as any).shared_post_data) return undefined;
          const spData = (sp as any).shared_post_data;
          
          let dataContent = spData.content || "";
          let dataArticleBody = "";
          if (dataContent.includes("<!-- article_divider -->")) {
            const parts = dataContent.split("<!-- article_divider -->");
            dataContent = parts[0];
            dataArticleBody = parts[1];
          } else if (spData.post_type === 'article') {
            const match = dataContent.match(/<(div|p|h[1-6]|ul|ol|img|figure|video|blockquote)/i);
            if (match && match.index !== undefined && match.index > 0) {
              dataArticleBody = dataContent.substring(match.index);
              dataContent = dataContent.substring(0, match.index);
            } else if (match && match.index === 0) {
              dataArticleBody = dataContent;
              dataContent = "";
            }
          }

          return {
            id: spData.post_id || spData.job_id,
            author: spData.author?.full_name || spData.company_name,
            authorId: spData.author?.user_id,
            authorAvatar: spData.author?.avatar_url || spData.company_logo || undefined,
            isCompanyPost: spData.author?.is_organization_post || false,
            authorSlug: spData.author?.author_slug,
            content: dataContent,
            articleBody: dataArticleBody,
            title: spData.title || "",
            imageSrc: spData.media?.[0]?.url || spData.imageSrc,
            images: spData.media ? spData.media.map((m: any) => m.url).filter(Boolean) : spData.images,
            videoSrc: spData.media?.find((m: any) => m.media_type === 'video' || m.url?.includes('.mp4'))?.url || spData.videoSrc,
            isJob: !!spData.job_id,
            jobTitle: spData.title,
            jobCompany: spData.company_name,
            jobLocation: spData.location,
            jobLogo: spData.company_logo
          } as any;
        })())
      } as Post & { isAvailable?: boolean };
    }
  }

  let content = backendPost.content || "";
  let articleBody = "";
  if (content.includes("<!-- article_divider -->")) {
    const parts = content.split("<!-- article_divider -->");
    content = parts[0];
    articleBody = parts[1];
  } else if (backendPost.post_type === 'article') {
    const match = content.match(/<(div|p|h[1-6]|ul|ol|img|figure|video|blockquote)/i);
    if (match && match.index !== undefined && match.index > 0) {
      articleBody = content.substring(match.index);
      content = content.substring(0, match.index);
    } else if (match && match.index === 0) {
      articleBody = content;
      content = "";
    }
  }

  return {
    id: backendPost.post_id,
    authorId: (backendPost.is_organization_post || backendPost.author_org_id)
      ? (backendPost.author_org_id || backendPost.author_id)
      : backendPost.author_id,
    author: backendPost.author_name,
    authorAvatar: (backendPost.author_avatar && backendPost.author_avatar !== '/images/companyonboarding/companyprofileDefault.jpg') ? backendPost.author_avatar : undefined,
    title: backendPost.title || "",
    timeAgo: shortTimeAgo,
    content: content,
    articleBody: articleBody,
    imageSrc: images.length > 0 ? images[0] : undefined,
    images: images.length > 0 ? images : undefined,
    imageDimensions: imageDimensions.length > 0 ? imageDimensions : undefined,
    mediaWidth: mediaWidth,
    mediaHeight: mediaHeight,
    videoSrc: videoSrc,
    //aspectRatio: primaryMediaAspectRatio,
    // Backend doesn't return likes/comments/shares counts in the list view provided
    likes: backendPost.like_count,
    isLiked: backendPost.is_liked,
    isReposted: backendPost.is_reposted,
    isRepostedWithThoughts: backendPost.is_reposted_with_thoughts,
    repostId: backendPost.repost_id,
    is_commented: backendPost.is_commented,
    is_saved: backendPost.is_saved,
    is_reported: backendPost.is_reported,
    isReported: backendPost.is_reported,
    likedUsers: backendPost.liked_users || [],
    comments: (backendPost.comment_count || 0).toString(),
    shares: ((backendPost as any).rePostCount || 0).toString(),
    externalShares: (backendPost as any).sharePostCount || 0,
    commentData: [], // Backend doesn't provide comments in feed list
    category: (backendPost.category_name as any) || undefined,
    visibility: backendPost.visibility,
    is_unlisted: backendPost.is_unlisted,
    appealStatus: backendPost.appeal_status,
    poll: poll,
    authorSlug: backendPost.author_slug,
    isCompanyPost: backendPost.is_organization_post,
    shared_post: sharedPost,
    location: backendPost.location || undefined,
    tags: backendPost.tags || [],
    sampleLikerUsername: backendPost.sample_liker_username || (((backendPost as any).liked_users && (backendPost as any).liked_users.length > 0) ? (backendPost as any).liked_users[0].username : undefined),
    authorHeadline: backendPost.author_headline || undefined,
    rankingScore: backendPost._rankingMeta?.score,
    slotType: backendPost._rankingMeta?.slot_type,
    position: backendPost._rankingMeta?.position,
    post_type: backendPost.post_type,
    achievementImageId: backendPost.achievement_image_id || undefined,
    achievementImageUrl: backendPost.achievement_image_url || undefined,
    achievementImageKey: backendPost.achievement_image_key || undefined,
    achievementImageTitle: backendPost.achievement_image_title || (backendPost.category_name === 'Achievement' ? 'Achievement' : undefined),
    is_community_article: backendPost.is_community_article,
    author_org_id: backendPost.author_org_id,
    createdByUserId: backendPost.created_by_user_id || (backendPost.author_org_id && backendPost.author_id === backendPost.author_org_id ? undefined : backendPost.author_id),
    communityId: backendPost.community_id,
    mentioned_users: backendPost.mentioned_users,
  };
};

export const mapBackendCommentToFrontend = (backendComment: BackendComment): Comment => {
  const now = dayjs();
  const created = dayjs(backendComment.created_at);
  const diffMinutes = now.diff(created, "minute");
  const diffHours = now.diff(created, "hour");
  const diffDays = now.diff(created, "day");

  let shortTimeAgo = "";
  if (diffMinutes <= 0) {
    shortTimeAgo = "Just now";
  } else if (diffMinutes < 60) {
    shortTimeAgo = `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    shortTimeAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 7) {
    shortTimeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else {
    const diffWeeks = Math.floor(diffDays / 7);
    shortTimeAgo = `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }

  return {
    id: backendComment.comment_id,
    authorId: backendComment.user_id || backendComment.author_id || (backendComment as any).authorId || (backendComment as any).userId,
    author: {
      name: backendComment.full_name,
      avatar: backendComment.avatar_url || undefined,
      authorSlug: backendComment.author_slug,
      isCompanyPost: Boolean(
        backendComment.is_organization_comment ??
        (backendComment as any).is_organization_post ??
        (backendComment as any).author_org_id ??
        (backendComment as any).isCompanyPost
      ),
      headline: backendComment.headline,
    },
    text: backendComment.content,
    timeAgo: shortTimeAgo,
    created_at: backendComment.created_at,
    like_count: backendComment.like_count || 0,
    is_liked: backendComment.is_liked || false,
    parent_id: backendComment.parent_id,
    is_pinned: backendComment.is_pinned,
    pinned_at: backendComment.pinned_at,
    reply_count: backendComment.reply_count || 0,
    is_edited: Boolean(
      backendComment.is_edited ??
      backendComment.isEdited ??
      (backendComment.updated_at &&
        new Date(backendComment.updated_at).getTime() - new Date(backendComment.created_at).getTime() > 2000)
    ),
    mentioned_users: (backendComment as any).mentioned_users,
  };
};
