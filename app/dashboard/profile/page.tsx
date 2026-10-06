import type { Metadata } from 'next';
import { MyProfile } from '@/components/profile/my-profile';

export const metadata: Metadata = {
  title: 'My profile | DITSCF',
};

export default function ProfilePage() {
  return <MyProfile />;
}
