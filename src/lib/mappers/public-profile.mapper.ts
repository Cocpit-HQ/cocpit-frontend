import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Post } from "@/types/entities";
import { PublicPost } from "@/services/api/public-profile";

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

export const mapPublicPostToPost = (publicPost: PublicPost): Post => {
  // Date formatting
  const now = dayjs();
  const created = dayjs(publicPost.created_at);
  const diffMinutes = now.diff(created, "minute");
  const diffHours = now.diff(created, "hour");
  const diffDays = now.diff(created, "day");

  let timeAgo = "";
  if (diffMinutes <= 0) {
    timeAgo = "Just now";
  } else if (diffMinutes < 60) {
    timeAgo = `${diffMinutes}m`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours}h`;
  } else {
    timeAgo = `${diffDays}d`;
  }

  // Media mapping
  const images: string[] = [];
  let videoSrc: string | undefined = undefined;

  if (Array.isArray(publicPost.media)) {
    publicPost.media.forEach((item) => {
      if (item.media_type === "image") {
        images.push(item.url);
      } else if (item.media_type === "video") {
        videoSrc = item.url;
      }
    });
  }

  // Poll mapping
  const poll = publicPost.poll ? {
    poll_id: publicPost.poll.poll_id,
    total_votes: publicPost.poll.total_votes,
    duration: publicPost.poll.duration,
    is_active: publicPost.poll.is_active ?? false,
    user_vote: publicPost.poll.user_vote,
    options: publicPost.poll.options.map(opt => ({
      option_id: opt.option_id,
      option_text: opt.option_text,
      vote_count: opt.vote_count
    }))
  } : undefined;

  const { content, articleBody } = splitArticleContent(publicPost.content);

  // Category mapping
  // Post entity expects specific string literals. We map what we can.
  let category: 'Personal' | 'Professional' | 'Achievement' | undefined = undefined;
  if (publicPost.category_name === 'Personal') category = 'Personal';
  else if (publicPost.category_name === 'Professional') category = 'Professional';
  else if (publicPost.category_name === 'Achievement') category = 'Achievement';

  return {
    id: publicPost.post_id,
    authorId: publicPost.author_id,
    author: publicPost.author_name,
    authorAvatar: publicPost.author_avatar || undefined,
    // Backend doesn't return title/headline anymore in the new query structure provided
    title: publicPost.title || publicPost.category_name || "",
    timeAgo: timeAgo,
    content: content,
    imageSrc: images.length > 0 ? images[0] : undefined,
    images: images.length > 0 ? images : undefined,
    videoSrc: videoSrc,
    likes: publicPost.like_count,
    isLiked: publicPost.is_liked,
    is_commented: publicPost.is_commented,
    is_saved: publicPost.is_saved,
    comments: publicPost.comment_count.toString(),
    shares: "0", // Backend doesn't return share count
    commentData: [],
    visibility: publicPost.visibility as 'public' | 'private', // Assuming backend visibility matches
    poll: poll,
    category: category,
    articleBody: articleBody || undefined,
    shared_post: (() => {
      const sp = publicPost.shared_post;
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
          is_commented: sp.is_commented,
          is_saved: sp.is_saved,
          comments: (sp.comment_count || 0).toString(),
          shares: "0",
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
    location: publicPost.location || undefined,
    tags: publicPost.tags || [],
    sampleLikerUsername: publicPost.sample_liker_username || undefined,
    authorHeadline: publicPost.author_headline || undefined,
  };
};
