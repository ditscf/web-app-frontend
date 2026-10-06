import type { Metadata } from 'next';
import { MinistryMembers } from '@/components/ministries/ministry-members';

export const metadata: Metadata = {
  title: 'Ministry members | DITSCF',
};

export default async function MinistryMembersPage(props: PageProps<'/dashboard/ministries/[ministryId]'>) {
  const { ministryId } = await props.params;
  return <MinistryMembers ministryId={ministryId} />;
}
