import Link from 'next/link';
import { Post } from '@/types/entities';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const imageSrc = post.imageSrc || (post.images && post.images.length > 0 ? post.images[0] : null);

  return (
    <Link href={`/profile/posts#post-${post.id}`} className="block group">
      <div className="aspect-square bg-card border border-border rounded-xl overflow-hidden relative">
        {imageSrc ? (
          <img src={imageSrc} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <p className="text-xs text-muted-foreground p-4 text-center">{post.content}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-3">
          <p className="text-white font-medium text-sm line-clamp-2 leading-tight">{post.content}</p>
        </div>
      </div>
    </Link>
  );
}
