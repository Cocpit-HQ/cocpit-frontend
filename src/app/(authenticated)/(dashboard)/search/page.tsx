import React, { Suspense } from 'react';
import { Metadata } from 'next';
import SearchClient from '@/features/search/SearchClient';
import { SearchSkeleton } from '@/features/search/components/SearchSkeleton';

interface Props {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q, type } = await searchParams;
  const categorySuffix = type && type !== 'all' ? ` in ${type}` : '';
  const title = q ? `Search: ${q}${categorySuffix} - Cocpit` : 'Search - Cocpit';
  return {
    title,
    description: `Search results for ${q || ''} on Cocpit.`,
  };
}

export default function Page() {
  return (
    <Suspense fallback={<SearchSkeleton />}>
      <SearchClient />
    </Suspense>
  );
}
