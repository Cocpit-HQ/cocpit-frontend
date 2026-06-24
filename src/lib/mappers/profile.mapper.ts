import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Post } from "@/types/entities";
import { ProfilePost } from "@/services/api/profile";

dayjs.extend(relativeTime);

const splitArticleContent = (content?: string | null) => {
  const rawContent = content || "";
  if (!rawContent.includes("<!-- article_divider -->")) {
    return { content: rawContent, articleBody: "" };
  }

  const parts = rawContent.split("<!-- article_divider -->");
  return {
    content: parts[0] || "",
    articleBody: parts[1] || "",
  };
};

export const mapProfilePostToPost = (backendPost: ProfilePost): Post => {
  // Extract images and video
  const images: string[] = [];
  let videoSrc: string | undefined = undefined;

  // Ensure media is an array before iterating
  const mediaList = Array.isArray(backendPost.media) ? backendPost.media : [];

  mediaList.forEach((item) => {
    if (item.media_type === "image") {
      images.push(item.url);
    } else if (item.media_type === "video") {
      videoSrc = item.url;
    }
  });

  // Inject achievement image if available
  if (backendPost.achievement_image_url && images.length === 0) {
    images.push(backendPost.achievement_image_url);
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
    shortTimeAgo = `${diffMinutes}Min ago`;
  } else if (diffHours < 24) {
    shortTimeAgo = `${diffHours}Hr ago`;
  } else {
    shortTimeAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }

  // Handle poll mapping (snake_case required for Poll)
  const poll = backendPost.poll ? {
    poll_id: backendPost.poll.poll_id,
    total_votes: backendPost.poll.total_votes,
    duration: backendPost.poll.duration,
    is_active: backendPost.poll.is_active,
    user_vote: backendPost.poll.user_vote,
    options: backendPost.poll.options.map(opt => ({
      option_id: opt.option_id,
      option_text: opt.option_text,
      vote_count: opt.vote_count
    }))
  } : undefined; // Post expects undefined or null, but let's be safe with undefined if null causes issues, or keep null if interface allows

  const { content, articleBody } = splitArticleContent(backendPost.content);

  return {
    id: backendPost.post_id,
    authorId: backendPost.author_id,
    author: backendPost.author_name,
    authorAvatar: backendPost.author_avatar || undefined,
    title: backendPost.title || "",
    timeAgo: shortTimeAgo,
    content: content,
    imageSrc: images.length > 0 ? images[0] : undefined,
    images: images.length > 0 ? images : undefined,
    videoSrc: videoSrc,
    likes: backendPost.like_count || 0,
    isLiked: backendPost.is_liked,
    is_commented: backendPost.is_commented,
    is_saved: backendPost.is_saved,
    comments: (backendPost.comment_count || 0).toString(),
    shares: (backendPost.share_count || 0).toString(),
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
          authorAvatar: sp.author?.avatar_url || null,
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
        const { content: sharedContent, articleBody: sharedArticleBody } = splitArticleContent(sp.content);
        return {
          id: sp.post_id,
          authorId: sp.author.user_id,
          author: sp.author.full_name,
          authorAvatar: sp.author.avatar_url,
          timeAgo: sp.created_at ? dayjs(sp.created_at).fromNow() : "",
          title: sp.title || "",
          content: sharedContent,
          articleBody: sharedArticleBody || undefined,
          imageSrc: sp.media?.find(m => m.media_type === 'image')?.url,
          likes: sp.like_count || 0,
          isLiked: sp.is_liked,
          comments: (sp.comment_count || 0).toString(),
          shares: (sp.share_count || 0).toString(),
          images: sp.media?.filter(m => m.media_type === 'image').map(m => m.url),
          videoSrc: sp.media?.find(m => m.media_type === 'video')?.url,
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
          } : undefined
        } as Post & { isAvailable?: boolean };
      }

      return undefined;
    })(),
    location: backendPost.location || undefined,
    tags: backendPost.tags || [],
    sampleLikerUsername: backendPost.sample_liker_username || undefined,
    authorHeadline: backendPost.author_headline || undefined,
    post_type: backendPost.post_type,
    achievementImageId: backendPost.achievement_image_id || undefined,
    achievementImageUrl: backendPost.achievement_image_url || undefined,
    achievementImageTitle: backendPost.achievement_image_title || (backendPost.achievement_image_id ? 'Achievement' : undefined),
    achievementImageKey: backendPost.achievement_image_key || undefined,
  };
};
