import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Post } from "@/types/entities";
import { ProfilePost } from "@/services/api/profile";

dayjs.extend(relativeTime);

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
    shortTimeAgo = `${diffMinutes}m`;
  } else if (diffHours < 24) {
    shortTimeAgo = `${diffHours}h`;
  } else {
    shortTimeAgo = `${diffDays}d`;
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

  return {
    id: backendPost.post_id,
    authorId: backendPost.author_id,
    author: backendPost.author_name,
    authorAvatar: backendPost.author_avatar || undefined,
    title: backendPost.category_name || "",
    timeAgo: shortTimeAgo,
    content: backendPost.content,
    imageSrc: images.length > 0 ? images[0] : undefined,
    images: images.length > 0 ? images : undefined,
    videoSrc: videoSrc,
    likes: parseInt(backendPost.like_count) || 0,
    isLiked: backendPost.is_liked,
    comments: backendPost.comment_count || "0",
    shares: "0", // Backend does not provide shares yet
    commentData: [],
    category: (backendPost.category_name as any) || undefined,
    visibility: backendPost.visibility,
    poll: poll,
  };
};
