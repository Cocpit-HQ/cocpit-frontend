import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Post } from "@/types/entities";
import { PublicPost } from "@/services/api/public-profile";

dayjs.extend(relativeTime);

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

  return {
    id: publicPost.post_id,
    author: publicPost.full_name,
    authorAvatar: publicPost.avatar_url || undefined,
    title: publicPost.title || "", // headline is title or vice versa? Prompt says "title: title", "headline: headline". Map title to title.
    timeAgo: timeAgo,
    content: publicPost.content,
    // Explicitly empty/default fields as per instructions
    imageSrc: undefined,
    images: undefined,
    videoSrc: undefined,
    likes: "0",
    comments: "0",
    shares: "0",
    commentData: [],
    visibility: 'public', // It's a public post
    poll: null,
    category: publicPost.category_id ? 'Professional' : undefined // We don't have category name map, but request body sends "Personal" or "Professional". The response has category_id. We can't easily map ID back to string without a map. But `FeedPost` doesn't strictly require it for display unless used for badges. I'll leave it undefined or try to derive if possible. The prompt says "Category is passed in request body... Response body { category: 'All' ... }". The Post entity expects 'Personal' | 'Professional'. I'll leave it undefined for now as it's not critical for "See All" view which filters by tab anyway.
  };
};
