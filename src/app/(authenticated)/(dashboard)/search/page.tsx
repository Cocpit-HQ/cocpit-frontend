import { redirect } from 'next/navigation';
// import SearchPage from '@/components/search/SearchPage';
// import { Metadata } from 'next';

// interface Props {
//   searchParams: Promise<{ q: string }>;
// }

// export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
//   const { q } = await searchParams;
//   return {
//     title: `Search: ${q || ''} - Cocpit`,
//     description: `Search results for ${q || ''} on Cocpit.`,
//   };
// }

export default async function Page() {
  // Outdated search page hidden; redirect to feed
  redirect('/feed');
  // return <SearchPage />;
}


