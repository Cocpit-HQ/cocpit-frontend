import { CommentActivityItem } from './activity.types';

export function cleanActivityText(text?: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    // Replace markdown mentions @[Name](UUID) with @Name
    .replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1')
    // Remove HTML comments like <!-- article_divider -->
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove HTML tags like <p>, </p>, <br>, etc.
    .replace(/<[^>]+>/g, ' ')
    // Replace common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    // Collapse multiple whitespace/newlines
    .replace(/\s+/g, ' ')
    .trim();
}

export function parsePossibleArray(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && (val.trim().startsWith('[') || val.trim().startsWith('{'))) {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Unified, optimized media and type extractor.
 * Avoids repeated large array allocations on every render item.
 */
export function extractPostMedia(item: any) {
  let metadata = item.metadata || {};
  if (typeof metadata === 'string') {
    try { metadata = JSON.parse(metadata); } catch { metadata = {}; }
  }
  let post = item.post || item.target_post || item.entity || metadata.post || metadata.target_post || {};
  if (typeof post === 'string') {
    try { post = JSON.parse(post); } catch { post = {}; }
  }

  // 1. Direct image properties in prioritized order
  let thumbnailUrl: string | undefined =
    item.mediaUrl ||
    post.mediaUrl ||
    item.imageUrl ||
    post.imageUrl ||
    item.imageSrc ||
    post.imageSrc ||
    item.image_url ||
    post.image_url ||
    item.image ||
    post.image ||
    item.post_image ||
    post.post_image ||
    item.thumbnail ||
    post.thumbnail ||
    item.thumbnail_url ||
    post.thumbnail_url ||
    item.cover_image ||
    post.cover_image ||
    item.coverImage ||
    post.coverImage ||
    metadata.image ||
    metadata.imageUrl ||
    metadata.thumbnail ||
    metadata.thumbnail_url ||
    undefined;

  if (!thumbnailUrl) {
    const rawImages = post.images || item.images || metadata.images || post.media_urls || item.media_urls || post.post_images || item.post_images;
    const arr = parsePossibleArray(rawImages);
    if (arr.length > 0) {
      const first = arr[0];
      thumbnailUrl = typeof first === 'string' ? first : first?.url;
    }
  }

  // 2. Direct video properties
  let videoUrl: string | undefined =
    post.videoSrc ||
    item.videoSrc ||
    post.video_url ||
    item.video_url ||
    post.videoUrl ||
    item.videoUrl ||
    post.video ||
    item.video ||
    metadata.video ||
    metadata.video_url ||
    metadata.videoUrl ||
    undefined;

  if (!thumbnailUrl) {
    thumbnailUrl =
      post.videoThumbnail ||
      item.videoThumbnail ||
      post.video_thumbnail ||
      item.video_thumbnail ||
      post.poster ||
      item.poster ||
      metadata.videoThumbnail ||
      metadata.poster ||
      undefined;
  }

  // 3. Inspect media array if media still missing
  const rawMedia = post.media || item.media || metadata.media || post.post_media || item.post_media;
  if (rawMedia && (!thumbnailUrl || !videoUrl)) {
    const arr = parsePossibleArray(rawMedia);
    for (const m of arr) {
      if (typeof m === 'string' && m.trim() !== '') {
        if (m.match(/\.(mp4|webm|mov)(\?|#|$)/i)) {
          if (!videoUrl) videoUrl = m;
        } else if (!thumbnailUrl) {
          thumbnailUrl = m;
        }
      } else if (m && typeof m === 'object') {
        if (!thumbnailUrl) thumbnailUrl = m.thumbnail_url || m.thumbnail || m.poster;
        if (m.url) {
          if (m.media_type === 'video' || m.type === 'video' || m.url.match(/\.(mp4|webm|mov)(\?|#|$)/i)) {
            if (!videoUrl) videoUrl = m.url;
          } else if (!thumbnailUrl) {
            thumbnailUrl = m.url;
          }
        }
      }
    }
  }

  // 4. Type classification
  const allTypeStrings = [
    post.post_type,
    post.postType,
    post.type,
    post.category,
    post.category_name,
    item.post_type,
    item.postType,
    item.type,
    item.category,
    item.category_name,
    metadata.post_type,
    metadata.postType,
    metadata.type,
    metadata.category,
    metadata.category_name,
    item.entity_type,
    item.target_type,
    item.activity_type,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const hasPoll = Boolean(
    post.poll ||
    item.poll ||
    metadata.poll ||
    post.poll_id ||
    item.poll_id ||
    allTypeStrings.some((t) => t.includes('poll'))
  );

  const pollQuestion = item.poll?.question || post.poll?.question || item.pollQuestion || (hasPoll ? (item.content || item.text) : undefined);
  const pollMeta = hasPoll ? `${item.poll?.total_votes ?? post.poll?.total_votes ?? 0} votes • Poll closed` : undefined;

  const isArticle = Boolean(
    allTypeStrings.some((t) => t.includes('article')) ||
    post.is_article ||
    item.is_article ||
    metadata.is_article ||
    post.isArticle ||
    item.isArticle ||
    post.is_community_article ||
    item.is_community_article ||
    post.article_id ||
    item.article_id ||
    post.articleId ||
    item.articleId ||
    post.article ||
    item.article ||
    post.articleBody ||
    post.article_body ||
    item.articleBody ||
    item.article_body ||
    (Boolean(item.postTitle || item.post_title || post.title) && !hasPoll) ||
    String(item.comment || item.commentText || '').toLowerCase().includes('article')
  );

  let mediaType: 'image' | 'video' | 'poll' | 'article' | 'text' = 'text';
  if (hasPoll) {
    mediaType = 'poll';
  } else if (isArticle) {
    mediaType = 'article';
  } else if (thumbnailUrl) {
    mediaType = videoUrl || allTypeStrings.some((t) => t.includes('video')) ? 'video' : 'image';
  } else if (videoUrl || allTypeStrings.some((t) => t.includes('video'))) {
    mediaType = 'video';
  } else if (allTypeStrings.some((t) => t.includes('image') || t.includes('photo'))) {
    mediaType = 'image';
  }

  // 5. Post ID resolution
  const postId =
    item.target_id ||
    item.targetId ||
    item.target_post_id ||
    item.targetPostId ||
    item.reference_id ||
    item.referenceId ||
    item.post_id ||
    item.postId ||
    post.id ||
    post.post_id ||
    post.postId ||
    post._id ||
    item.comment?.post_id ||
    item.comment?.postId ||
    item.comment?.target_id ||
    item.comment?.targetId ||
    metadata.target_id ||
    metadata.targetId ||
    metadata.target_post_id ||
    metadata.targetPostId ||
    metadata.post_id ||
    metadata.postId ||
    metadata.reference_id ||
    (item.entity_type === 'post' || item.type === 'post' ? item.entity_id : undefined) ||
    item.id;

  return {
    post,
    metadata,
    thumbnailUrl,
    videoUrl,
    hasPoll,
    pollQuestion,
    pollMeta,
    isArticle,
    mediaType,
    postId,
  };
}

export function resolveCommentPostData(item: any, index: number = 0): CommentActivityItem {
  const media = extractPostMedia(item);
  const post = media.post;
  const metadata = media.metadata;

  const uniqueCommentId =
    item.activity_id ||
    item.comment_id ||
    item.commentId ||
    item.comment?.id ||
    item.comment?.comment_id ||
    item.id ||
    `comment-${index}`;

  const postAuthor =
    item.postAuthor ||
    post.author?.name ||
    post.author?.fullName ||
    post.authorName ||
    post.author_name ||
    post.author ||
    item.post_author_name ||
    item.post_author ||
    item.author?.name ||
    item.author ||
    item.user ||
    'Author';

  const postTitle =
    item.postTitle ||
    post.title ||
    post.content ||
    post.text ||
    item.post_title ||
    item.post_content ||
    item.title ||
    '';

  const authorAvatarUrl =
    item.postAuthorAvatar ||
    post.author?.avatarUrl ||
    post.author?.avatar_url ||
    post.author?.avatar ||
    post.authorAvatar ||
    post.author_avatar ||
    item.post_author_avatar ||
    item.authorAvatarUrl ||
    item.avatarUrl ||
    '';

  const commenter =
    item.commenter ||
    item.comment?.author?.name ||
    item.comment?.author?.fullName ||
    item.user?.name ||
    item.user?.fullName ||
    item.user ||
    item.full_name ||
    'User';

  const commenterAvatarUrl =
    item.commenterAvatar ||
    item.commenterAvatarUrl ||
    item.comment?.author?.avatarUrl ||
    item.comment?.author?.avatar ||
    item.user?.avatarUrl ||
    item.user?.avatar ||
    item.avatar_url ||
    item.avatarUrl ||
    '';

  const commentText =
    item.comment ||
    item.commentText ||
    item.comment?.text ||
    item.comment?.content ||
    item.content ||
    item.text ||
    metadata.comment_text ||
    metadata.content ||
    '';

  return {
    id: uniqueCommentId,
    postId: media.postId,
    uniqueKey: `comment-${uniqueCommentId}-${index}`,
    postAuthor,
    postTitle: cleanActivityText(postTitle),
    authorAvatarUrl,
    commenter,
    commenterAvatarUrl,
    commentText: cleanActivityText(commentText),
    likesCount: item.likes ?? item.likesCount ?? item.like_count ?? 0,
    repliesCount: item.replies ?? item.repliesCount ?? item.reply_count ?? 0,
    mediaType: media.mediaType,
    imageUrl: media.thumbnailUrl,
    videoUrl: media.videoUrl,
  };
}
