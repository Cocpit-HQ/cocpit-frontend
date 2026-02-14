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
    duration: backendPost.poll.duration,
    is_active: backendPost.poll.is_active,
    user_vote: backendPost.poll.user_vote,
    options: backendPost.poll.options.map(opt => ({
      option_id: opt.option_id,
      option_text: opt.option_text,
      vote_count: opt.vote_count
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
    } else if (sp.author && sp.post_id) { // Ensure required fields exist
      const spImages: string[] = [];
      let spVideoSrc: string | undefined = undefined;

      // Process shared post media
      if (Array.isArray(sp.media)) {
        sp.media.forEach((item) => {
          if (item.media_type === "image") {
            spImages.push(item.url);
          } else if (item.media_type === "video") {
            spVideoSrc = item.url;
          }
        });
      }

      // Process shared post time
      const spCreated = dayjs(sp.created_at);
      const spDiffMinutes = now.diff(spCreated, "minute");
      const spDiffHours = now.diff(spCreated, "hour");
      const spDiffDays = now.diff(spCreated, "day");

      let spShortTimeAgo = "";
      if (spDiffMinutes <= 0) spShortTimeAgo = "Just now";
      else if (spDiffMinutes < 60) spShortTimeAgo = `${spDiffMinutes}m`;
      else if (spDiffHours < 24) spShortTimeAgo = `${spDiffHours}h`;
      else spShortTimeAgo = `${spDiffDays}d`;

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

      sharedPost = {
        id: sp.post_id,
        authorId: sp.author.user_id,
        author: sp.author.full_name,
        authorAvatar: sp.author.avatar_url || undefined,
        timeAgo: spShortTimeAgo,
        content: sp.content || "",
        imageSrc: spImages.length > 0 ? spImages[0] : undefined,
        images: spImages.length > 0 ? spImages : undefined,
        videoSrc: spVideoSrc,
        likes: sp.like_count || 0,
        isLiked: (sp as any).is_liked, // New field from backend
        is_commented: (sp as any).is_commented,
        is_saved: (sp as any).is_saved,
        comments: (sp.comment_count || 0).toString(),
        shares: "0",
        poll: spPoll,
        authorSlug: sp.author.author_slug,
        isCompanyPost: sp.author.is_company_post,
        isAvailable: true
      } as Post & { isAvailable?: boolean };
    }
  }

  return {
    id: backendPost.post_id,
    authorId: backendPost.author_id,
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
    is_commented: backendPost.is_commented,
    is_saved: backendPost.is_saved,
    comments: (backendPost.comment_count || 0).toString(),
    shares: "0",
    commentData: [], // Backend doesn't provide comments in feed list
    category: (backendPost.category_name as any) || undefined,
    visibility: backendPost.visibility,
    poll: poll,
    authorSlug: backendPost.author_slug,
    isCompanyPost: backendPost.is_company_post,
    shared_post: sharedPost,
  };
};
