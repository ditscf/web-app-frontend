import type { Metadata } from 'next';
import { MemberDirectory } from '@/components/members/member-directory';

export const metadata: Metadata = {
  title: 'Members | DITSCF',
};

export default function MembersPage() {
  return <MemberDirectory />;
}
