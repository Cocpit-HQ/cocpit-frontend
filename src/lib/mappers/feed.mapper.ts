import { ApiPost, ApiPoll } from '@/types/api/feed';
import { Post, Poll } from '@/types/entities';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export const mapApiPollToPoll = (apiPoll: ApiPoll): Poll => {
    const totalVotes = apiPoll.total_votes || 0;

    return {
        id: apiPoll.poll_id,
        totalVotes,
        options: apiPoll.options.map(option => ({
            id: option.option_id,
            text: option.option_text,
            votes: option.vote_count,
            percentage: totalVotes > 0 ? Math.round((option.vote_count / totalVotes) * 100) : 0
        }))
    };
};

export const mapApiPostToPost = (apiPost: ApiPost): Post => {
    // Media handling
    const images = apiPost.media
        .filter(m => m.media_type === 'image')
        .map(m => m.url);

    const videos = apiPost.media
        .filter(m => m.media_type === 'video')
        .map(m => m.url);

    // Determine primary media
    const imageSrc = images.length > 0 ? images[0] : undefined;
    const videoSrc = videos.length > 0 ? videos[0] : undefined;

    // Determine aspect ratio from first media item if available
    const firstMedia = apiPost.media.length > 0 ? apiPost.media[0] : null;
    const aspectRatio = firstMedia?.aspect_ratio ? firstMedia.aspect_ratio : undefined;

    return {
        id: apiPost.post_id,
        author: apiPost.author_name,
        authorAvatar: apiPost.author_avatar || undefined, // Post entity uses this? Wait, FeedPost uses 'author' string and gets avatar from logic or 'imgSrc'.
        // FeedPost looks for 'imageSrc' for content image. Avatar is usually handled differently.
        // Looking at FeedPost.tsx:
        // <img src={imgSrc} ... /> for content.
        // For avatar: <img src={imgSrc} ... /> wait, FeedPost logic for avatar is:
        // const imgSrc = imageSrc || (images && images.length > 0 ? images[0] : null) || '/assets/pngegg.png' -> THIS IS CONTENT IMAGE.
        // Author avatar is: <div className="... rounded-full ..."><img src={imgSrc} ... />
        // Wait, FeedPost uses the SAME logic for author avatar as content image? That seems like a bug in existing FeedPost or my reading.
        // Let's re-read FeedPost.tsx carefully.

        /*
           const imgSrc = imageSrc || (images && images.length > 0 ? images[0] : null) || '/assets/pngegg.png'
           ...
           // Avatar area:
           <div className="w-10 h-10 ...">
              <img src={imgSrc} alt={author} className="w-full h-full object-cover" />
           </div>
        */
        // YES! The current FeedPost uses the content image as the avatar if no avatar prop is passed? No, FeedPost doesn't even HAVE an avatar prop.
        // It takes `imageSrc` from props.
        // And uses `imgSrc` (derived from `imageSrc` or `images[0]`) for BOTH the avatar and the main content image if `hasMultipleImages` or `videoSrc` is false-ish?
        // Actually, for the main content:
        // {(hasMultipleImages || imageSrc || videoSrc) && ( ... <img src={imgSrc} ... /> ... )}

        // This suggests the existing mock data had avatars in `imageSrc`?
        // Let's check FeedContext.tsx mock data.
        // id: 1, author: 'Sarah Chen', ..., imageSrc: '/assets/pngegg.png'
        // So yes, the existing code reuses `imageSrc` for avatar. That's ... not ideal for a real app where author avatar and post image are different.
        // The User's `Post` type in `entities.ts` has `authorAvatar?: string` which I just added? No, I added it.
        // The original `Post` type did NOT have `authorAvatar`.
        // I should probably map the author's avatar to `imageSrc` if it's the only way to show it?
        // BUT `imageSrc` is also used for the post content image.

        // If I want to fix this, I should update FeedPost to accept `authorAvatar`.
        // I added `authorAvatar` to `Post` interface. I should update `FeedPost` to use it.

        title: apiPost.title || '',
        timeAgo: dayjs(apiPost.created_at).fromNow(true), // e.g. "2h" or "2 hours" - "true" removes "ago"
        content: apiPost.content,
        imageSrc: imageSrc, // Post content image
        images: images,
        videoSrc: videoSrc,
        aspectRatio: aspectRatio,
        likes: '0', // API doesn't return likes count yet
        comments: '0', // API doesn't return comments count yet
        shares: '0', // API doesn't return shares count yet
        commentData: [],
        category: apiPost.category_name as 'Personal' | 'Professional' | 'Achievement', // Cast or map if needed
        visibility: apiPost.visibility,
        poll: apiPost.poll ? mapApiPollToPoll(apiPost.poll) : undefined,
        type: apiPost.post_type
    };
};
