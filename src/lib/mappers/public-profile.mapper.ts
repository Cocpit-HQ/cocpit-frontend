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
    options: publicPost.poll.options.map(opt => ({
      option_id: opt.option_id,
      option_text: opt.option_text,
      vote_count: opt.vote_count
    }))
  } : null;

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
    title: "",
    timeAgo: timeAgo,
    content: publicPost.content,
    imageSrc: images.length > 0 ? images[0] : undefined,
    images: images.length > 0 ? images : undefined,
    videoSrc: videoSrc,
    likes: publicPost.like_count,
    comments: publicPost.comment_count.toString(),
    shares: "0", // Backend doesn't return share count
    commentData: [],
    visibility: publicPost.visibility as 'public' | 'private', // Assuming backend visibility matches
    poll: poll,
    category: category,
  };
};
