import HashtagPage from '@/components/hashtag/HashtagPage';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  return {
    title: `#${tag} - Cocpit Discovery`,
    description: `Explore posts tagged with #${tag} on Cocpit.`,
  };
}

export default async function Page() {
  return <HashtagPage />;
}
