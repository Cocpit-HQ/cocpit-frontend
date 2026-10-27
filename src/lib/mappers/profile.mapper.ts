import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Post } from "@/types/entities";
import { ProfilePost } from "@/services/api/profile";

dayjs.extend(relativeTime);

const splitArticleContent = (content?: string | null, postType?: string) => {
  let rawContent = content || "";
  let articleBody = "";
  if (rawContent.includes("<!-- article_divider -->")) {
    const parts = rawContent.split("<!-- article_divider -->");
    rawContent = parts[0] || "";
    articleBody = parts[1] || "";
  } else if (postType === 'article') {
    const match = rawContent.match(/<(div|p|h[1-6]|ul|ol|img|figure|video|blockquote)/i);
    if (match && match.index !== undefined && match.index > 0) {
      articleBody = rawContent.substring(match.index);
      rawContent = rawContent.substring(0, match.index);
    } else if (match && match.index === 0) {
      articleBody = rawContent;
      rawContent = "";
    }
  }

  return {
    content: rawContent,
    articleBody: articleBody,
  };
};

export const mapProfilePostToPost = (backendPost: ProfilePost): Post => {
  // Extract images and video
  const images: string[] = [];
  const imageDimensions: Array<{ width: number; height: number } | null> = [];
  let videoSrc: string | undefined = undefined;
  let mediaWidth: number | undefined;
  let mediaHeight: number | undefined;

  // Ensure media is an array before iterating
  const mediaList = Array.isArray(backendPost.media) ? backendPost.media : [];

  mediaList.forEach((item: any) => {
    const isActuallyVideo =
      item.media_type === "video" ||
      item.type === "video" ||
      item.url?.toLowerCase()?.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/);

    if (isActuallyVideo) {
      videoSrc = item.url;
      if (!mediaWidth && item.width) mediaWidth = item.width;
      if (!mediaHeight && item.height) mediaHeight = item.height;
    } else if (
      item.media_type === "image" ||
      item.type === "image" ||
      item.url?.toLowerCase()?.match(/\.(jpg|jpeg|png|webp|gif|svg|avif)(\?|#|$)/)
    ) {
      images.push(item.url);
      imageDimensions.push(
        item.width && item.height ? { width: item.width, height: item.height } : null
      );
      if (!mediaWidth && item.width) mediaWidth = item.width;
      if (!mediaHeight && item.height) mediaHeight = item.height;
    }
  });

  // Fallback for direct video_url or videoSrc
  if ((backendPost as any).video_url && !videoSrc) {
    videoSrc = (backendPost as any).video_url;
  }
  if ((backendPost as any).videoSrc && !videoSrc) {
    videoSrc = (backendPost as any).videoSrc;
  }

  // Inject achievement image if available
  if (backendPost.achievement_image_url && images.length === 0) {
    images.push(backendPost.achievement_image_url);
  }

  // Fallback for direct image_url or images array
  if ((backendPost as any).image_url && images.length === 0) {
    images.push((backendPost as any).image_url);
  }
  if ((backendPost as any).images && Array.isArray((backendPost as any).images)) {
    (backendPost as any).images.forEach((img: any) => {
      const url = typeof img === 'string' ? img : img?.url;
      if (url && !images.includes(url)) {
        images.push(url);
      }
    });
  }

  // Calculate timeAgo
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

  // Handle poll mapping (snake_case required for Poll)
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
  } : undefined;

  const { content, articleBody } = splitArticleContent(backendPost.content, backendPost.post_type);

  return {
    id: backendPost.post_id,
    authorId: ((backendPost as any).is_company_post || (backendPost as any).author_org_id || (backendPost as any).is_organization_post || (backendPost as any).isCompanyPost)
      ? ((backendPost as any).author_org_id || (backendPost as any).authorOrgId || backendPost.author_id)
      : backendPost.author_id,
    author: backendPost.author_name,
    authorAvatar:
      backendPost.author_avatar &&
      backendPost.author_avatar !== "/images/companyonboarding/companyprofileDefault.jpg"
        ? backendPost.author_avatar
        : undefined,
    title: backendPost.title || "",
    timeAgo: shortTimeAgo,
    content: content,
    imageSrc: images.length > 0 ? images[0] : undefined,
    images: images.length > 0 ? images : undefined,
    imageDimensions: imageDimensions.length > 0 ? imageDimensions : undefined,
    mediaWidth,
    mediaHeight,
    videoSrc: videoSrc,
    likes: backendPost.like_count || 0,
    isLiked: backendPost.is_liked,
    isReposted: backendPost.is_reposted,
    repostId: backendPost.repost_id,
    is_commented: backendPost.is_commented,
    is_saved: backendPost.is_saved,
    likedUsers: backendPost.liked_users || [],
    comments: (backendPost.comment_count || 0).toString(),
    shares: ((backendPost as any).rePostCount || 0).toString(),
    externalShares: (backendPost as any).sharePostCount || 0,
    commentData: [],
    category: backendPost.category_name as Post["category"],
    visibility: backendPost.visibility,
    poll: poll,
    articleBody: articleBody || undefined,
    shared_post: (() => {
      const sp = backendPost.shared_post;
      if (!sp) return undefined;

      if (!sp.is_accessible) {
        let content = "This content is unavailable.";
        if (sp.reason === "deleted") {
          content = "This post has been deleted by the original author.";
        } else if (sp.reason === "private" || sp.reason === "personal_connection") {
          content = "This content is unavailable because it's private or restricted.";
        }

        return {
          id: "unavailable",
          authorId: sp.author?.user_id || "",
          author: sp.author?.full_name || "Unknown",
          authorAvatar:
            sp.author?.avatar_url &&
            sp.author.avatar_url !== "/images/companyonboarding/companyprofileDefault.jpg"
              ? sp.author.avatar_url
              : null,
          timeAgo: "",
          content: content,
          likes: 0,
          comments: "0",
          shares: "0",
          isAvailable: false,
          unavailableReason: sp.reason
        } as Post & { isAvailable?: boolean; unavailableReason?: string };
      }

      if (sp.author && sp.post_id) {
        const { content: sharedContent, articleBody: sharedArticleBody } = splitArticleContent(sp.content, (sp as any).post_type);
        return {
          id: sp.post_id,
          authorId: sp.author.user_id,
          author: sp.author.full_name,
          authorAvatar:
            sp.author.avatar_url &&
            sp.author.avatar_url !== "/images/companyonboarding/companyprofileDefault.jpg"
              ? sp.author.avatar_url
              : undefined,
          timeAgo: sp.created_at ? dayjs(sp.created_at).fromNow() : "",
          title: sp.title || "",
          content: sharedContent,
          articleBody: sharedArticleBody || undefined,
          imageSrc: sp.media?.find(m => m.media_type === 'image')?.url,
          likes: sp.like_count || 0,
          isLiked: sp.is_liked,
          isReposted: (sp as any).is_reposted,
          repostId: (sp as any).repost_id,
          comments: (sp.comment_count || 0).toString(),
          shares: ((sp as any).rePostCount || 0).toString(),
          externalShares: (sp as any).sharePostCount || 0,
          is_commented: (sp as any).is_commented,
          is_saved: (sp as any).is_saved,
          likedUsers: (sp as any).liked_users || [],
          images: sp.media?.filter(m => m.media_type === 'image' || (m as any).type === 'image').map(m => m.url),
          imageDimensions: sp.media
            ?.filter(m => m.media_type === 'image' || (m as any).type === 'image')
            .map(m => ((m as any).width && (m as any).height ? { width: (m as any).width, height: (m as any).height } : null)),
          videoSrc: sp.media?.find(m => m.media_type === 'video' || (m as any).type === 'video')?.url,
          isAvailable: true,
          poll: sp.poll ? {
            poll_id: sp.poll.poll_id,
            total_votes: sp.poll.total_votes || 0,
            duration: sp.poll.duration || "1 day",
            is_active: sp.poll.is_active || false,
            user_vote: sp.poll.user_vote,
            options: sp.poll.options?.map(o => ({
              option_id: o.option_id,
              option_text: o.option_text,
              vote_count: o.vote_count || 0
            })) || []
          } : undefined,
          mentioned_users: (sp as any).mentioned_users,
          authorHeadline: (sp.author as any)?.headline || (sp as any).authorHeadline || (sp as any).author_headline || undefined,
          authorSlug: (sp.author as any)?.slug || (sp as any).authorSlug || (sp as any).author_slug || undefined,
          author_org_id: (sp as any).author_org_id || (sp.author as any)?.org_id || undefined,
          isCompanyPost: Boolean((sp as any).isCompanyPost ?? (sp.author as any)?.is_company ?? (sp as any).author_org_id),
          post_type: (sp as any).post_type || undefined,
        } as Post & { isAvailable?: boolean };
      }

      return undefined;
    })(),
    location: backendPost.location || undefined,
    tags: backendPost.tags || [],
    sampleLikerUsername: backendPost.sample_liker_username || undefined,
    authorHeadline: backendPost.author_headline || undefined,
    post_type: backendPost.post_type,
    votes: (backendPost as any).votes,
    isPollActive: (backendPost as any).isPollActive,
    achievementImageId: backendPost.achievement_image_id || undefined,
    achievementImageUrl: backendPost.achievement_image_url || undefined,
    achievementImageTitle: backendPost.achievement_image_title || (backendPost.achievement_image_id ? 'Achievement' : undefined),
    achievementImageKey: backendPost.achievement_image_key || undefined,
    media: backendPost.media,
    mentioned_users: backendPost.mentioned_users,
    authorSlug: (backendPost as any).author_slug || (backendPost as any).authorSlug || undefined,
    createdByUserId: (backendPost as any).created_by_user_id || (backendPost as any).createdByUserId || undefined,
    author_org_id: (backendPost as any).author_org_id || (backendPost as any).authorOrgId || undefined,
    isCompanyPost: (backendPost as any).is_company_post ?? (backendPost as any).isCompanyPost ?? !!((backendPost as any).author_org_id || (backendPost as any).authorOrgId || (backendPost as any).is_organization_post || (backendPost as any).is_institution_post),
  };
};
