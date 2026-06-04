import { useRouter } from 'next/navigation';

interface Post {
  id?: string;
  post_id?: string;
  type?: string;
  postType?: string;
}

export const useEditNavigation = (post: Post | null | undefined) => {
  const router = useRouter();

  const handlePencilClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation(); // CRITICAL: stops bubble to feed-card-shell

    const isArticle =
      post?.type === 'ARTICLE' ||
      post?.type === 'article' ||
      post?.postType === 'article';

    if (isArticle) {
      router.push(`/create-article/${post?.id ?? post?.post_id}`);
    }
  };

  return { handlePencilClick };
};
