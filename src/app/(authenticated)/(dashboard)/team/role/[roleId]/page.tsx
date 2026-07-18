'use client';

import { useParams } from 'next/navigation';
import { RoleDetailsPage } from '@/features/manage-team';

export default function RoleDetailRoute() {
  const params = useParams();
  const roleId = params?.roleId as string;

  return <RoleDetailsPage roleId={roleId} />;
}
