import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Post } from "@/types/entities";
import { BackendPost } from "@/services/api/feed";

dayjs.extend(relativeTime);

export const mapBackendPostToFrontend = (backendPost: BackendPost): Post => {
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
    shortTimeAgo = `${diffMinutes}m`;
  } else if (diffHours < 24) {
    shortTimeAgo = `${diffHours}h`;
  } else {
    shortTimeAgo = `${diffDays}d`;
  }

  // Handle poll mapping
  const poll = backendPost.poll ? {
    poll_id: backendPost.poll.poll_id,
    total_votes: backendPost.poll.total_votes,
    options: backendPost.poll.options.map(opt => ({
      option_id: opt.option_id,
      option_text: opt.option_text,
      vote_count: opt.vote_count
    }))
  } : null;

  return {
    id: backendPost.post_id,
    author: backendPost.author_name,
    authorAvatar: backendPost.author_avatar || undefined,
    // Use category or empty string for title (headline) since backend doesn't provide it
    title: backendPost.category_name || "",
    timeAgo: shortTimeAgo,
    content: backendPost.content,
    imageSrc: images.length > 0 ? images[0] : undefined,
    images: images.length > 0 ? images : undefined,
    videoSrc: videoSrc,
    // Backend doesn't return likes/comments/shares counts in the list view provided
    likes: backendPost.like_count,
    isLiked: backendPost.is_liked,
    comments: "0",
    shares: "0",
    commentData: [], // Backend doesn't provide comments in feed list
    category: (backendPost.category_name as any) || undefined,
    visibility: backendPost.visibility,
    poll: poll,
  };
};
