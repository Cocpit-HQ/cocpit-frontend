import Link from 'next/link';
import { Post } from '@/types/entities';
import { PostOptionsMenu } from '@/components/home/PostOptionsMenu';

interface PostCardProps {
  post: Post;
  href?: string;
  onDelete?: (id: string) => void;
  isOwnPost?: boolean;
}

export default function PostCard({ post, href, onDelete, isOwnPost }: PostCardProps) {
  const mainPostImage = post.imageSrc || (post.images && post.images.length > 0 ? post.images[0] : null);
  const sharedPostImage = post.shared_post?.imageSrc || (post.shared_post?.images && post.shared_post.images.length > 0 ? post.shared_post.images[0] : null);
  const displayImage = mainPostImage || sharedPostImage;

  const noImageContent = post.content || post.shared_post?.content || "No content";

  return (
    <div className="relative group">
      <Link href={href || `/profile/posts#post-${post.id}`} className="block w-full h-full">
        <div className="aspect-square bg-card border border-border rounded-xl overflow-hidden relative">
          {displayImage ? (
            <img src={displayImage} alt={post.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <p className="text-xs text-muted-foreground p-4 text-center">
                {noImageContent}
              </p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 p-3 w-full">
            <p className="text-white font-medium text-sm line-clamp-2 leading-tight">{post.content}</p>
          </div>
        </div>
      </Link>

      {isOwnPost && (
        <div className="absolute top-2 right-2 z-10">
          <PostOptionsMenu
            postId={post.id}
            isOwnPost={isOwnPost}
            onDelete={onDelete}
            className="bg-black/20 backdrop-blur-sm rounded-full"
            postType={post.poll ? 'poll' : 'image'} // Approximation, but if poll exists it's a poll
            visibility={post.visibility}
          />
        </div>
      )}
    </div>
  );
}
